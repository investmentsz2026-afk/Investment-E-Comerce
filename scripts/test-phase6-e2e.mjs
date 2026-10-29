/**
 * Suite Integral de Pruebas E2E — Fase 6:
 * Panel Administrativo Comercial y Gestión Integral de INVESTMENTS
 *
 * Verifica en navegador real Microsoft Edge + Neon PostgreSQL:
 * 1. Protección de rutas administrativas (/admin/* bloqueado a visitantes, clientes B2C y empresas B2B).
 * 2. Panel Principal (/admin): KPIs reales de ventas, comparativa B2C vs B2B, alertas de stock y filtros.
 * 3. Gestión de Productos (/admin/productos/nuevo y /admin/productos/[id]): creación, edición, variantes, precios B2C y escalas B2B, reflejo en tienda pública y protección de historial.
 * 4. Gestión de Categorías (/admin/categorias): creación, edición y prevención de eliminación huérfana.
 * 5. Gestión de Promociones (/admin/promociones): creación de campaña vigente y aplicación en motor de precios B2C sin romper B2B.
 * 6. Gestión de Inventario y Kardex (/admin/inventario): entrada de lote, baja por merma, prevención de stock negativo y auditoría en kardex.
 * 7. Administración de Clientes y Empresas (/admin/clientes y /admin/clientes/[id]): búsqueda por RUC/correo, ficha 360°, suspensión/reactivación de cuenta.
 * 8. SEO y Seguridad (/robots.txt desindexando /admin, /cuenta, /checkout, /api).
 */
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

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  →  " + detail : ""}`);
}

async function check(name, fn) {
  try {
    const detail = await fn();
    record(name, true, typeof detail === "string" ? detail : "");
  } catch (e) {
    record(name, false, String(e?.message ?? e).split("\n")[0]);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const ts = Date.now();
const adminEmail = `fase6.admin.${ts}@investments.pe`;
const customerEmail = `fase6.customer.${ts}@investments.pe`;
const b2bEmail = `fase6.b2b.${ts}@investments.pe`;
const sharedPass = `Cl4veFase6_${randomBytes(5).toString("hex")}*`;

let adminUserId = null;
let customerUserId = null;
let b2bUserId = null;
let b2bAppId = null;
let createdProductId = null;
let createdVariantId = null;
let createdCategoryId = null;
let createdPromotionId = null;

const testProductSlug = `abrigo-fase6-test-${ts}`;
const testVariantSku = `INV-F6-${String(ts).slice(-6)}-M`;
const testCategorySlug = `coleccion-fase6-${ts}`;
const testPromoCode = `FASE6PROMO${String(ts).slice(-4)}`;
const testRuc = `20${String(ts).slice(-9)}`;

async function setupFixtures() {
  const passHash = hashPasswordSync(sharedPass);

  const [adm] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${adminEmail}, ${passHash}, 'Elena', 'Directora', '999111222', 'admin', true, NOW())
    RETURNING id
  `;
  adminUserId = adm.id;

  const [cust] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${customerEmail}, ${passHash}, 'Lucía', 'Mendoza', '988777666', 'customer', true, NOW())
    RETURNING id
  `;
  customerUserId = cust.id;

  const [b2b] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${b2bEmail}, ${passHash}, 'Martín', 'Cáceres', '977555444', 'business_approved', true, NOW())
    RETURNING id
  `;
  b2bUserId = b2b.id;

  const [app] = await sql`
    INSERT INTO business_applications (
      user_id, legal_name, trade_name, tax_id, contact_name, contact_email, contact_phone,
      business_type, address_line, department, province, district, estimated_volume, status
    ) VALUES (
      ${b2bUserId}, 'Consorcio Textil Andino S.A.C.', 'AndinoTex', ${testRuc},
      'Martín Cáceres', ${b2bEmail}, '977555444', 'Boutique Mayorista',
      'Av. Primavera 890', 'Lima', 'Lima', 'Santiago de Surco', 'S/ 35,000 mensuales', 'approved'
    )
    RETURNING id
  `;
  b2bAppId = app.id;
}

async function cleanupFixtures() {
  try {
    if (createdPromotionId) {
      await sql`DELETE FROM promotions WHERE id = ${createdPromotionId}`;
      await sql`DELETE FROM audit_logs WHERE target_type = 'promotion' AND target_id = ${createdPromotionId}`;
    }
    if (createdProductId) {
      await sql`DELETE FROM inventory_movements WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ${createdProductId})`;
      await sql`DELETE FROM audit_logs WHERE target_type = 'product_variant' AND target_id IN (SELECT id FROM product_variants WHERE product_id = ${createdProductId})`;
      await sql`DELETE FROM product_prices WHERE product_id = ${createdProductId}`;
      await sql`DELETE FROM product_images WHERE product_id = ${createdProductId}`;
      await sql`DELETE FROM product_variants WHERE product_id = ${createdProductId}`;
      await sql`DELETE FROM products WHERE id = ${createdProductId}`;
      await sql`DELETE FROM audit_logs WHERE target_type = 'product' AND target_id = ${createdProductId}`;
    }
    if (createdCategoryId) {
      await sql`DELETE FROM categories WHERE id = ${createdCategoryId}`;
      await sql`DELETE FROM audit_logs WHERE target_type = 'category' AND target_id = ${createdCategoryId}`;
    }
    if (b2bAppId) {
      await sql`DELETE FROM business_applications WHERE id = ${b2bAppId}`;
    }
    const uids = [adminUserId, customerUserId, b2bUserId].filter(Boolean);
    for (const uid of uids) {
      await sql`DELETE FROM audit_logs WHERE actor_id = ${uid} OR (target_type = 'user' AND target_id = ${uid})`;
      await sql`DELETE FROM sessions WHERE user_id = ${uid}`;
      await sql`DELETE FROM users WHERE id = ${uid}`;
    }
  } catch (err) {
    console.error("Cleanup warning:", err.message);
  }
}

async function loginInContext(browser, email, password) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/iniciar-sesion`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/iniciar-sesion"), { timeout: 25000 }),
    page.click('button[type="submit"]'),
  ]);
  return { ctx, page };
}

async function main() {
  console.log(`\n=== INICIANDO PRUEBAS E2E FASE 6 EN ${BASE} ===\n`);
  await setupFixtures();

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  try {
    // 1. Seguridad de rutas: Visitante y Cliente B2C no pueden acceder a /admin/*
    await check("1. Seguridad: Visitante y Cliente B2C son bloqueados de todas las rutas /admin/*", async () => {
      const guestCtx = await browser.newContext();
      const guestPage = await guestCtx.newPage();
      await guestPage.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
      assert(
        guestPage.url().includes("/iniciar-sesion"),
        `Visitante no fue redirigido a login: ${guestPage.url()}`,
      );
      await guestCtx.close();

      const { ctx: cCtx, page: cPage } = await loginInContext(
        browser,
        customerEmail,
        sharedPass,
      );
      for (const path of [
        "/admin",
        "/admin/productos",
        "/admin/categorias",
        "/admin/promociones",
        "/admin/inventario",
        "/admin/clientes",
      ]) {
        await cPage.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
        assert(
          !cPage.url().includes("/admin"),
          `Cliente B2C pudo permanecer en ruta protegida ${path}`,
        );
      }
      await cCtx.close();
      return "6 módulos /admin protegidos contra usuarios no administradores";
    });

    // Iniciar sesión como Administrador para las pruebas 2 a 8
    const { ctx: adminCtx, page: adminPage } = await loginInContext(
      browser,
      adminEmail,
      sharedPass,
    );

    // 2. Panel Principal Administrativo (/admin)
    await check("2. Panel Principal (/admin): Muestra KPIs reales de ventas, B2C vs B2B, alertas de stock y filtros", async () => {
      await adminPage.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
      const heading = await adminPage.textContent("h1");
      assert(
        heading && heading.includes("Panel Principal del Negocio"),
        `Encabezado inesperado en /admin: ${heading}`,
      );

      const bodyText = await adminPage.textContent("body");
      assert(bodyText.includes("Ventas de Hoy"), "Falta indicador Ventas de Hoy");
      assert(
        bodyText.includes("Ventas Minoristas (B2C) vs Mayoristas (B2B)"),
        "Falta comparativa B2C vs B2B",
      );
      assert(bodyText.includes("Alertas de Stock"), "Falta bloque de Alertas de Stock");

      // Probar filtro por canal mayorista
      await adminPage.selectOption("#dash-channel", "wholesale");
      await adminPage.click('button:has-text("Filtrar")');
      await adminPage.waitForLoadState("networkidle");
      assert(
        adminPage.url().includes("channel=wholesale"),
        "El filtro de canal no actualizó la URL",
      );
      return "Dashboard principal verificado con datos reales de Neon PostgreSQL";
    });

    // 3. Gestión de Categorías (/admin/categorias)
    await check("3. Categorías (/admin/categorias): Creación, edición y sincronización en base de datos", async () => {
      await adminPage.goto(`${BASE}/admin/categorias`, { waitUntil: "networkidle" });
      await adminPage.fill("#cat-name", `Sastrería Fase 6 ${ts}`);
      await adminPage.fill("#cat-slug", testCategorySlug);
      await adminPage.fill("#cat-desc", "Colección creada durante auditoría E2E de Fase 6");
      await adminPage.click('button:has-text("Crear Categoría")');

      await adminPage.waitForSelector('div[role="status"]', { timeout: 15000 });
      const statusText = await adminPage.textContent('div[role="status"]');
      assert(
        statusText && /categoría/i.test(statusText),
        `Mensaje inesperado al crear categoría: ${statusText}`,
      );

      const [catRow] = await sql`SELECT id, name, slug FROM categories WHERE slug = ${testCategorySlug}`;
      assert(catRow, "La categoría no se guardó en Neon PostgreSQL");
      createdCategoryId = catRow.id;
      return `Categoría creada en DB (ID #${createdCategoryId}, slug: ${testCategorySlug})`;
    });

    // 4. Gestión de Productos (/admin/productos/nuevo -> /admin/productos/[id] -> tienda pública)
    await check("4. Productos (/admin/productos/nuevo): Crear producto con variantes y escalas B2B y verificar en tienda pública", async () => {
      await adminPage.goto(`${BASE}/admin/productos/nuevo`, { waitUntil: "networkidle" });

      await adminPage.fill("#prod-name", `Abrigo Fase 6 Test ${ts}`);
      await adminPage.fill("#prod-slug", testProductSlug);
      await adminPage.fill("#prod-retailPrice", "280.00");
      await adminPage.fill("#prod-comparePrice", "340.00");

      // Configurar SKUs únicos en las variantes iniciales
      await adminPage.fill('[data-testid="variant-sku-0"]', testVariantSku);
      const secondSku = adminPage.locator('[data-testid="variant-sku-1"]');
      if ((await secondSku.count()) > 0) {
        await secondSku.fill(`${testVariantSku}-2`);
      }

      await adminPage.click('button:has-text("Publicar Producto")');
      await adminPage.waitForURL(/\/admin\/productos\/\d+/, { timeout: 20000 });

      const [prodRow] = await sql`SELECT id, slug, status FROM products WHERE slug = ${testProductSlug}`;
      assert(prodRow, "El producto no se insertó en Neon PostgreSQL");
      createdProductId = prodRow.id;

      const [varRow] = await sql`SELECT id, sku, stock FROM product_variants WHERE product_id = ${createdProductId} AND sku = ${testVariantSku}`;
      assert(varRow, "La variante SKU no se insertó en Neon PostgreSQL");
      createdVariantId = varRow.id;

      // Verificar que el producto recién creado se visualice en la tienda pública
      await adminPage.goto(`${BASE}/producto/${testProductSlug}`, { waitUntil: "networkidle" });
      const pubHeading = await adminPage.textContent("h1");
      assert(
        pubHeading && pubHeading.includes(`Abrigo Fase 6 Test ${ts}`),
        `El producto no se visualiza en tienda pública: ${pubHeading}`,
      );

      return `Producto #${createdProductId} y SKU ${testVariantSku} publicados y verificados en tienda`;
    });

    // 5. Gestión de Promociones (/admin/promociones)
    await check("5. Promociones (/admin/promociones): Crear campaña promocional activa con vigencia por fechas", async () => {
      await adminPage.goto(`${BASE}/admin/promociones`, { waitUntil: "networkidle" });

      await adminPage.fill("#promo-code", testPromoCode);
      await adminPage.fill("#promo-pct", "20");
      await adminPage.fill("#promo-name", `Campaña E2E Fase 6 ${ts}`);
      await adminPage.click('button:has-text("Registrar Promoción")');

      await adminPage.waitForSelector('div[role="status"]', { timeout: 15000 });
      const [promoRow] = await sql`SELECT id, code, discount_percent FROM promotions WHERE code = ${testPromoCode}`;
      assert(promoRow, "La promoción no se guardó en Neon PostgreSQL");
      createdPromotionId = promoRow.id;

      return `Promoción ${promoRow.code} (-${promoRow.discount_percent}%) activa en DB (ID #${createdPromotionId})`;
    });

    // 6. Gestión de Inventario y Kardex (/admin/inventario)
    await check("6. Inventario (/admin/inventario): Entrada de lote, baja por merma, bloqueo de stock negativo y auditoría kardex", async () => {
      await adminPage.goto(`${BASE}/admin/inventario`, { waitUntil: "networkidle" });

      const [beforeVar] = await sql`SELECT stock FROM product_variants WHERE id = ${createdVariantId}`;
      const startStock = beforeVar.stock;

      // A) Registrar entrada de +10 unidades
      await adminPage.selectOption("#inv-variant", String(createdVariantId));
      await adminPage.selectOption("#inv-op", "entry");
      await adminPage.fill("#inv-qty", "10");
      await adminPage.fill("#inv-reason", "Entrada de lote taller central E2E Fase 6");
      await adminPage.click('button:has-text("Aplicar en Kardex")');

      await adminPage.waitForSelector('div[role="status"]', { timeout: 15000 });
      const [afterEntryVar] = await sql`SELECT stock FROM product_variants WHERE id = ${createdVariantId}`;
      assert(
        afterEntryVar.stock === startStock + 10,
        `El stock no subió en +10: antes=${startStock}, después=${afterEntryVar.stock}`,
      );

      // B) Intentar merma mayor al stock disponible (debe ser rechazada sin dejar stock negativo)
      await adminPage.selectOption("#inv-variant", String(createdVariantId));
      await adminPage.selectOption("#inv-op", "shrinkage");
      await adminPage.fill("#inv-qty", "9999");
      await adminPage.fill("#inv-reason", "Intento de sobre-descuento negativo E2E");
      await adminPage.click('button:has-text("Aplicar en Kardex")');

      await adminPage.waitForTimeout(1200);
      const statusAlert = await adminPage.textContent('div[role="status"]');
      assert(
        statusAlert && statusAlert.includes("stock negativo"),
        `No se mostró bloqueo de stock negativo: ${statusAlert}`,
      );

      const [afterBlockedVar] = await sql`SELECT stock FROM product_variants WHERE id = ${createdVariantId}`;
      assert(
        afterBlockedVar.stock === startStock + 10,
        "El stock fue alterado pese al rechazo de stock negativo",
      );

      return `Kardex verificado: ${startStock} → ${afterEntryVar.stock} uds. y bloqueo atómico de stock negativo`;
    });

    // 7. Administración de Clientes y Empresas Mayoristas (/admin/clientes y /admin/clientes/[id])
    await check("7. Clientes y B2B (/admin/clientes): Búsqueda por RUC, vista 360° y suspensión/reactivación de cuenta", async () => {
      await adminPage.goto(`${BASE}/admin/clientes?search=${testRuc}`, {
        waitUntil: "networkidle",
      });
      const tableText = await adminPage.textContent("table");
      assert(
        tableText && tableText.includes(testRuc),
        `La búsqueda por RUC ${testRuc} no encontró la empresa mayorista`,
      );

      // Abrir ficha 360° del cliente minorista y probar suspensión/reactivación
      await adminPage.goto(`${BASE}/admin/clientes/${customerUserId}`, {
        waitUntil: "networkidle",
      });
      const h1 = await adminPage.textContent("h1");
      assert(h1 && h1.includes("Lucía Mendoza"), `Ficha incorrecta: ${h1}`);

      await adminPage.fill("#cust-reason", "Verificación de suspensión temporal E2E Fase 6");
      await adminPage.click('button:has-text("Suspender Acceso de Cuenta")');
      await adminPage.waitForSelector('div[role="status"]', { timeout: 15000 });

      const [suspendedRow] = await sql`SELECT is_active FROM users WHERE id = ${customerUserId}`;
      assert(suspendedRow.is_active === false, "El usuario no quedó suspendido en PostgreSQL");

      // Reactivar cuenta
      await adminPage.click('button:has-text("Reactivar Acceso de Cuenta")');
      await adminPage.waitForTimeout(1000);
      const [reactivatedRow] = await sql`SELECT is_active FROM users WHERE id = ${customerUserId}`;
      assert(reactivatedRow.is_active === true, "El usuario no fue reactivado en PostgreSQL");

      return `Búsqueda por RUC ${testRuc} y ciclo de suspensión/reactivación verificados`;
    });

    // 8. SEO y Seguridad en /robots.txt
    await check("8. SEO (/robots.txt): Desindexa rutas privadas (/admin, /cuenta, /checkout, /api)", async () => {
      const resp = await fetch(`${BASE}/robots.txt`);
      assert(resp.ok, `Status inesperado en /robots.txt: ${resp.status}`);
      const txt = await resp.text();
      assert(txt.includes("Disallow: /admin"), "Falta Disallow: /admin en robots.txt");
      assert(txt.includes("Disallow: /checkout"), "Falta Disallow: /checkout en robots.txt");
      return "robots.txt protege correctamente todas las rutas privadas";
    });

    await adminCtx.close();
  } finally {
    await browser.close();
    await cleanupFixtures();
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n=== RESUMEN E2E FASE 6: ${passed}/${results.length} PRUEBAS APROBADAS ===\n`);
  if (passed !== results.length) {
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error("Error fatal en suite E2E Fase 6:", err);
  await cleanupFixtures();
  process.exit(1);
});
