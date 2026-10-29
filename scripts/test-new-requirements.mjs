import { chromium } from "playwright-core";
import { neon } from "@neondatabase/serverless";
import { scryptSync, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.argv[2] || "http://localhost:3000";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(/^DATABASE_URL=(.+)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("DATABASE_URL no encontrada");
}

async function hashPassword(password) {
  const salt = randomBytes(32);
  const derivedKey = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

async function run() {
  console.log(`\n=== VERIFICANDO NUEVOS REQUERIMIENTOS EN ${BASE_URL} ===\n`);
  const sql = neon(loadDatabaseUrl());
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const tsAdmin = Date.now();
  const ephemeralAdminEmail = `audit.ui.${tsAdmin}@investments.pe`;
  const ephemeralAdminPass = `UiAdm!${randomBytes(8).toString("hex")}9A`;
  const adminHash = await hashPassword(ephemeralAdminPass);

  await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified_at)
    VALUES (${ephemeralAdminEmail}, ${adminHash}, 'Admin', 'UI Test', 'admin', true, NOW())
  `;

  try {
    // 1. Probar pantalla de login: Standalone, sin header ni footer de la tienda
    console.log("TEST 1: Pantalla /iniciar-sesion sin header ni footer...");
    await page.goto(`${BASE_URL}/iniciar-sesion`, { waitUntil: "networkidle" });

    const storeNav = await page.$('nav[aria-label="Principal"]');
    if (storeNav) throw new Error("Fallo: Se encontró el header de la tienda en /iniciar-sesion");

    const storeFooter = await page.$('footer[aria-labelledby="footer-title"]');
    if (storeFooter) throw new Error("Fallo: Se encontró el footer de la tienda en /iniciar-sesion");

    const authCard = await page.$("h1:has-text('Iniciar sesión')");
    if (!authCard) throw new Error("Fallo: No se encontró la tarjeta de login");
    console.log("PASS  /iniciar-sesion es standalone sin header ni footer comercial.");

    // 2. Probar /mayorista/registro para invitado: Formulario directo
    console.log("\nTEST 2: Pantalla /mayorista/registro para invitado (formulario directo)...");
    await page.goto(`${BASE_URL}/mayorista/registro`, { waitUntil: "networkidle" });

    // Verificar que NO está el bloqueo de 'Inicia sesión para presentar tu solicitud'
    const blockingCard = await page.$("text=Inicia sesión para presentar tu solicitud");
    if (blockingCard) throw new Error("Fallo: Sigue apareciendo la tarjeta que bloquea a invitados.");

    // Verificar campos del formulario directo
    const legalNameInput = await page.$("input[name='legalName']");
    const taxIdInput = await page.$("input[name='taxId']");
    const passwordInput = await page.$("input[name='password']");
    const confirmPasswordInput = await page.$("input[name='confirmPassword']");

    if (!legalNameInput || !taxIdInput || !passwordInput || !confirmPasswordInput) {
      throw new Error("Fallo: Faltan campos en el formulario directo de registro de empresa para invitados.");
    }
    console.log("PASS  /mayorista/registro muestra el formulario directo de empresa y credenciales.");

    // 3. Registrar una nueva empresa como invitado
    console.log("\nTEST 3: Envío de formulario directo de empresa B2B...");
    const ts = Date.now();
    const testRuc = "20" + String(ts).slice(-9);
    const testEmail = `empresa.${ts}@andina-textil.pe`;

    await page.fill("input[name='legalName']", `Corporación Textil del Centro ${ts} S.A.C.`);
    await page.fill("input[name='tradeName']", "Textiles Centro");
    await page.fill("input[name='taxId']", testRuc);
    await page.selectOption("select[name='businessType']", "Distribuidor mayorista textil");

    await page.fill("input[name='contactName']", "Raúl Alvarado Medina");
    await page.fill("input[name='contactEmail']", testEmail);
    await page.fill("input[name='contactPhone']", "987654321");
    await page.fill("input[name='password']", "MayoristaPeru2026*");
    await page.fill("input[name='confirmPassword']", "MayoristaPeru2026*");

    await page.fill("input[name='department']", "Lima");
    await page.fill("input[name='province']", "Lima");
    await page.fill("input[name='district']", "La Victoria");
    await page.fill("input[name='addressLine']", "Av. Gamarra 1240, Piso 3");
    await page.selectOption("select[name='estimatedVolume']", "S/ 30,000 a S/ 80,000 mensuales (distribuidor regional)");
    await page.check("input[name='termsAccepted']");

    await Promise.all([
      page.waitForURL((url) => url.pathname.includes("/mayorista/solicitud"), { timeout: 15000 }),
      page.click("button[type='submit']"),
    ]);
    console.log("PASS  Empresa registrada directamente y redirigida a su seguimiento de solicitud.");

    // 4. Panel de Administrador: Header moderno con 3 puntitos
    console.log("\nTEST 4: Panel de Administrador (/admin/solicitudes) con menú de 3 puntitos...");
    // Usar un contexto limpio para el admin
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${BASE_URL}/iniciar-sesion`, { waitUntil: "networkidle" });
    await adminPage.fill("input[name='email']", ephemeralAdminEmail);
    await adminPage.fill("input[name='password']", ephemeralAdminPass);
    await Promise.all([
      adminPage.waitForURL((url) => url.pathname.includes("/cuenta") || url.pathname.includes("/admin"), { timeout: 15000 }),
      adminPage.click("button[type='submit']"),
    ]);

    await adminPage.goto(`${BASE_URL}/admin/solicitudes`, { waitUntil: "networkidle" });

    // Verificar que el header comercial NO está presente
    const adminStoreNav = await adminPage.$('nav[aria-label="Principal"]');
    if (adminStoreNav) throw new Error("Fallo: Se encontró el header de la tienda en /admin/solicitudes");

    // Verificar barra moderna de administración
    const adminLogo = await adminPage.$("text=ADMIN");
    if (!adminLogo) throw new Error("Fallo: No se encontró la etiqueta ADMIN en la cabecera del panel");

    // Verificar botón de 3 puntitos
    const threeDotsBtn = await adminPage.$("button[aria-label='Menú de opciones de administrador']");
    if (!threeDotsBtn) throw new Error("Fallo: No se encontró el botón con los 3 puntitos en el panel");

    // Hacer clic en los 3 puntitos para abrir el menú
    await threeDotsBtn.click();
    await adminPage.waitForTimeout(300);

    // Verificar opciones del menú
    const perfilOption = await adminPage.$("text=Ver mi perfil / cuenta");
    const tiendaOption = await adminPage.$("text=Ver catálogo / tienda pública");
    const logoutOption = await adminPage.$("text=Cerrar sesión");

    if (!perfilOption || !tiendaOption || !logoutOption) {
      throw new Error("Fallo: Faltan opciones en el menú desplegable de los 3 puntitos");
    }
    console.log("PASS  Menú de 3 puntitos abre correctamente con opciones de perfil, tienda y cerrar sesión.");

    // Probar cerrar sesión desde el menú de 3 puntitos
    await logoutOption.click();
    await adminPage.waitForURL((url) => url.pathname.includes("/iniciar-sesion"), { timeout: 10000 });
    console.log("PASS  Cerrar sesión desde el menú de 3 puntitos funciona y redirige a login.");

    console.log("\n=== TODOS LOS REQUERIMIENTOS FUERON VERIFICADOS CON ÉXITO ===\n");
  } finally {
    await sql`DELETE FROM users WHERE email = ${ephemeralAdminEmail}`;
    await browser.close();
  }
}

run().catch((err) => {
  console.error("\n❌ ERROR:", err.message);
  process.exit(1);
});
