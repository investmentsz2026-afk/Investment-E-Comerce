import { chromium } from "playwright-core";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync } from "node:crypto";

config({ path: ".env.local" });

const BASE = process.argv[2] ?? "http://localhost:3016";
const sql = neon(process.env.DATABASE_URL);

function hashPasswordSync(password) {
  const salt = randomBytes(32);
  const derivedKey = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

const ts = Date.now();
const sharedPass = "Invest75AuditPass!2026";
const adminEmail = `fase75.audit.admin.${ts}@investments.pe`;
const customerEmail = `fase75.audit.cust.${ts}@investments.pe`;
let adminUserId = null;
let customerUserId = null;

async function setup() {
  const passHash = hashPasswordSync(sharedPass);
  const [adm] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${adminEmail}, ${passHash}, 'Sofia', 'Directora', '999888111', 'admin', true, NOW())
    RETURNING id
  `;
  adminUserId = adm.id;

  const [cust] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${customerEmail}, ${passHash}, 'Camila', 'Alvarez', '988111222', 'customer', true, NOW())
    RETURNING id
  `;
  customerUserId = cust.id;
}

async function cleanup() {
  if (adminUserId || customerUserId) {
    const ids = [adminUserId, customerUserId].filter(Boolean);
    await sql`DELETE FROM sessions WHERE user_id = ANY(${ids})`;
    await sql`DELETE FROM users WHERE id = ANY(${ids})`;
  }
}

async function loginUser(browser, email, password, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, locale: "es-PE" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/iniciar-sesion`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/iniciar-sesion"), { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  return { ctx, page };
}

async function inspectPage(page, urlPath) {
  await page.goto(`${BASE}${urlPath}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const overflowReport = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const clientWidth = docEl.clientWidth;
    const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
    const hasHorizontalOverflow = scrollWidth > clientWidth;

    const overflowingElements = [];
    const all = document.querySelectorAll("body *");
    for (const el of all) {
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "NOSCRIPT") continue;
      const rect = el.getBoundingClientRect();
      // An element overflows if its visible right side exceeds clientWidth by > 1.5px
      if (rect.width > 0 && rect.height > 0 && rect.right > clientWidth + 1.5) {
        // Check if contained in a legitimate horizontal scrolling element
        let p = el.parentElement;
        let isContained = false;
        while (p && p !== body && p !== docEl) {
          const style = window.getComputedStyle(p);
          if (["auto", "scroll", "hidden", "clip"].includes(style.overflowX)) {
            isContained = true;
            break;
          }
          p = p.parentElement;
        }
        if (!isContained) {
          let selector = el.tagName.toLowerCase();
          if (el.id) selector += `#${el.id}`;
          else if (el.className && typeof el.className === "string") {
            const firstClass = el.className.trim().split(/\s+/)[0];
            if (firstClass) selector += `.${firstClass}`;
          }
          overflowingElements.push({
            selector,
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            clientWidth,
            textSnippet: (el.textContent || "").trim().slice(0, 30),
          });
        }
      }
    }

    return {
      clientWidth,
      scrollWidth,
      hasHorizontalOverflow,
      overflowingElements: overflowingElements.slice(0, 6),
    };
  });

  return overflowReport;
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`  AUDITORÍA RESPONSIVE MOBILE-FIRST (FASE 7.5)`);
  console.log(`  Target: ${BASE}`);
  console.log(`======================================================\n`);

  await setup();

  const browser = await chromium.launch({ channel: "msedge", headless: true });

  const publicRoutes = [
    "/",
    "/catalogo",
    "/catalogo/sastreria",
    "/producto/conjunto-sastre-negro",
    "/buscar?q=polo",
    "/carrito",
    "/checkout",
    "/favoritos",
    "/mayorista",
    "/mayorista/registro",
    "/mayorista/cotizaciones",
    "/atencion-al-cliente",
    "/politicas",
    "/libro-de-reclamaciones",
    "/iniciar-sesion",
    "/registro",
    "/recuperar-contrasena",
  ];

  const customerRoutes = [
    "/cuenta",
    "/cuenta/pedidos",
    "/cuenta/favoritos",
    "/cuenta/direcciones",
    "/cuenta/seguridad",
  ];

  const adminRoutes = [
    "/admin",
    "/admin/productos",
    "/admin/productos/nuevo",
    "/admin/categorias",
    "/admin/inventario",
    "/admin/pedidos",
    "/admin/solicitudes",
    "/admin/cotizaciones",
    "/admin/clientes",
    "/admin/promociones",
  ];

  const issues = [];

  // 1. Audit public routes across resolutions
  // We test 320, 360, 375, 414, 768, 1280 for the broad scan
  const auditViewports = [
    { name: "320px (Ultra Compact)", width: 320, height: 720 },
    { name: "340px (Compact Mobile)", width: 340, height: 740 },
    { name: "360px (Standard Mobile)", width: 360, height: 800 },
    { name: "375px (iPhone SE)", width: 375, height: 812 },
    { name: "390px (iPhone 12/13/14)", width: 390, height: 844 },
    { name: "414px (iPhone Plus)", width: 414, height: 896 },
    { name: "430px (iPhone Pro Max)", width: 430, height: 932 },
    { name: "480px (Large Mobile)", width: 480, height: 854 },
    { name: "768px (Tablet Portrait)", width: 768, height: 1024 },
    { name: "1024px (Tablet Landscape)", width: 1024, height: 768 },
    { name: "1280px (Desktop Full)", width: 1280, height: 800 },
  ];

  for (const vp of auditViewports) {
    console.log(`\n--- Evaluando resolución ${vp.name} (${vp.width}x${vp.height}) ---`);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: "es-PE" });
    const page = await ctx.newPage();

    for (const r of publicRoutes) {
      const rep = await inspectPage(page, r);
      if (rep.hasHorizontalOverflow || rep.overflowingElements.length > 0) {
        console.log(`❌ [${vp.name}] ${r} -> OVERFLOW: scrollWidth=${rep.scrollWidth} vs clientWidth=${rep.clientWidth}`);
        for (const el of rep.overflowingElements) {
          console.log(`    Protruding: <${el.selector}> right=${el.right}px (width=${el.width}px) snippet="${el.textSnippet}"`);
        }
        issues.push({ viewport: vp.name, width: vp.width, route: r, ...rep });
      } else {
        console.log(`✓ [${vp.name}] ${r} OK`);
      }
    }
    await ctx.close();
  }

  // 2. Audit customer routes
  console.log(`\n--- Evaluando rutas de cuenta /cuenta/* en 320px y 375px ---`);
  for (const vp of [auditViewports[0], auditViewports[2]]) {
    const { ctx, page } = await loginUser(browser, customerEmail, sharedPass, vp.width, vp.height);
    for (const r of customerRoutes) {
      const rep = await inspectPage(page, r);
      if (rep.hasHorizontalOverflow || rep.overflowingElements.length > 0) {
        console.log(`❌ [${vp.name}] ${r} -> OVERFLOW: scrollWidth=${rep.scrollWidth} vs clientWidth=${rep.clientWidth}`);
        for (const el of rep.overflowingElements) {
          console.log(`    Protruding: <${el.selector}> right=${el.right}px (width=${el.width}px) snippet="${el.textSnippet}"`);
        }
        issues.push({ viewport: vp.name, width: vp.width, route: r, ...rep });
      } else {
        console.log(`✓ [${vp.name}] ${r} OK`);
      }
    }
    await ctx.close();
  }

  // 3. Audit admin routes
  console.log(`\n--- Evaluando rutas de admin /admin/* en 320px y 375px ---`);
  for (const vp of [auditViewports[0], auditViewports[2]]) {
    const { ctx, page } = await loginUser(browser, adminEmail, sharedPass, vp.width, vp.height);
    for (const r of adminRoutes) {
      const rep = await inspectPage(page, r);
      if (rep.hasHorizontalOverflow || rep.overflowingElements.length > 0) {
        console.log(`❌ [${vp.name}] ${r} -> OVERFLOW: scrollWidth=${rep.scrollWidth} vs clientWidth=${rep.clientWidth}`);
        for (const el of rep.overflowingElements) {
          console.log(`    Protruding: <${el.selector}> right=${el.right}px (width=${el.width}px) snippet="${el.textSnippet}"`);
        }
        issues.push({ viewport: vp.name, width: vp.width, route: r, ...rep });
      } else {
        console.log(`✓ [${vp.name}] ${r} OK`);
      }
    }
    await ctx.close();
  }

  await browser.close();
  await cleanup();

  console.log(`\n======================================================`);
  console.log(`RESUMEN INICIAL DE AUDITORÍA:`);
  console.log(`Total incidencias de desbordamiento detectadas: ${issues.length}`);
  console.log(`======================================================\n`);
}

run().catch(async (err) => {
  console.error("Error en auditoría:", err);
  await cleanup().catch(() => {});
  process.exit(1);
});
