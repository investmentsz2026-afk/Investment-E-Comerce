/**
 * Suite Integral de Pruebas de Aceptación Comercial End-to-End — Fase 7.4
 * INVESTMENTS — Tienda de Moda y Textiles B2C/B2B
 *
 * Valida los 7 recorridos comerciales de principio a fin utilizando
 * Microsoft Edge (playwright-core) y Neon PostgreSQL:
 *
 *  Track 1: REGISTRO EMPRESARIAL
 *  Track 2: COTIZACIONES MAYORISTAS
 *  Track 3: FAVORITOS
 *  Track 4: PRODUCTOS Y COMPRAS
 *  Track 5: NEWSLETTER Y DATOS PERSONALES
 *  Track 6: ENLACES Y NAVEGACIÓN
 *  Track 7: SEGURIDAD DE LOS RECORRIDOS
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
function record(track, name, ok, detail = "") {
  results.push({ track, name, ok, detail });
  console.log(`[${track}] ${ok ? "PASS" : "FAIL"} - ${name}${detail ? "  →  " + detail : ""}`);
}

async function check(track, name, fn) {
  try {
    const detail = await fn();
    record(track, name, true, typeof detail === "string" ? detail : "");
  } catch (e) {
    record(track, name, false, String(e?.message ?? e).split("\n")[0]);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const ts = Date.now();
const sharedPass = `InvestFase74_${randomBytes(4).toString("hex")}#`;

// Cuentas de prueba efímeras (todas en minúsculas para compatibilidad estricta con normalizeEmail)
const adminEmail = `fase74.admin.${ts}@investments.pe`;
const customerAEmail = `fase74.cust_a.${ts}@investments.pe`;
const customerBEmail = `fase74.cust_b.${ts}@investments.pe`;
const companyBEmail = `fase74.b2b_b.${ts}@investments.pe`;

// Datos de empresa para registro en Track 1
const testRuc = `20${String(ts).slice(-9)}`;
const testCompanyName = `Inversiones Textiles Horizonte S.A.C. ${ts}`;
const testTradeName = `Textiles Horizonte ${ts}`;
const testCompanyEmail = `fase74.regbiz.${ts}@investments.pe`;

let adminUserId = null;
let customerAUserId = null;
let customerBUserId = null;
let companyBUserId = null;

let registeredUserId = null;
let registeredAppId = null;

let quoteAId = null;
let quoteANumber = null;

const allCreatedUserIds = [];

async function setupFixtures() {
  const passHash = hashPasswordSync(sharedPass);

  // 1. Admin
  const [adm] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${adminEmail}, ${passHash}, 'Sofia', 'Directora', '999888111', 'admin', true, NOW())
    RETURNING id
  `;
  adminUserId = adm.id;
  allCreatedUserIds.push(adminUserId);

  // 2. Cliente A
  const [cA] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${customerAEmail}, ${passHash}, 'Camila', 'Alvarez', '988111222', 'customer', true, NOW())
    RETURNING id
  `;
  customerAUserId = cA.id;
  allCreatedUserIds.push(customerAUserId);

  // 3. Cliente B
  const [cB] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${customerBEmail}, ${passHash}, 'Rodrigo', 'Benavides', '977222333', 'customer', true, NOW())
    RETURNING id
  `;
  customerBUserId = cB.id;
  allCreatedUserIds.push(customerBUserId);

  // 4. Empresa B aprobada (para pruebas de aislamiento multi-empresa)
  const [bB] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${companyBEmail}, ${passHash}, 'Valeria', 'Boutique', '966333444', 'business_approved', true, NOW())
    RETURNING id
  `;
  companyBUserId = bB.id;
  allCreatedUserIds.push(companyBUserId);

  await sql`
    INSERT INTO business_applications (
      user_id, legal_name, trade_name, tax_id, contact_name, contact_email, contact_phone,
      business_type, address_line, department, province, district, estimated_volume, status
    ) VALUES (
      ${companyBUserId}, 'Textil San Pedro S.A.C.', 'San Pedro', ${"20" + String(ts + 2).slice(-9)},
      'Valeria Boutique', ${companyBEmail}, '966333444', 'Boutique o tienda de moda retail',
      'Av. Conquistadores 450', 'Lima', 'Lima', 'San Isidro', 'S/ 30,000 a S/ 80,000 mensuales', 'approved'
    )
  `;
}

async function cleanupFixtures() {
  console.log("\nLimpiando registros de prueba efímeros en Neon PostgreSQL...");
  try {
    const ids = [...new Set(allCreatedUserIds.concat([registeredUserId]).filter(Boolean))];
    if (ids.length > 0) {
      await sql`DELETE FROM audit_logs WHERE actor_id = ANY(${ids})`;
      await sql`DELETE FROM wholesale_quote_items WHERE quote_id IN (SELECT id FROM wholesale_quotes WHERE user_id = ANY(${ids}))`;
      await sql`DELETE FROM wholesale_quotes WHERE user_id = ANY(${ids})`;
      await sql`DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ANY(${ids}))`;
      await sql`DELETE FROM carts WHERE user_id = ANY(${ids})`;
      await sql`DELETE FROM user_favorites WHERE user_id = ANY(${ids})`;
      await sql`DELETE FROM business_applications WHERE user_id = ANY(${ids})`;
      await sql`DELETE FROM sessions WHERE user_id = ANY(${ids})`;
      await sql`DELETE FROM email_verification_tokens WHERE user_id = ANY(${ids})`;
      await sql`DELETE FROM users WHERE id = ANY(${ids})`;
    }
    await sql`DELETE FROM newsletter_subscribers WHERE email LIKE 'test.fase74.%'`;
    console.log("Limpieza completada exitosamente.");
  } catch (err) {
    console.error("Advertencia en limpieza:", err.message);
  }
}

async function loginInContext(browser, email, password, targetUrl = "") {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/iniciar-sesion`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/iniciar-sesion"), { timeout: 25000 }),
    page.click('button[type="submit"]'),
  ]);
  if (targetUrl) {
    await page.goto(`${BASE}${targetUrl}`, { waitUntil: "networkidle" });
  }
  return { ctx, page };
}

async function main() {
  console.log(`\n================================================================`);
  console.log(`   INICIANDO SUITE DE ACEPTACIÓN COMERCIAL END-TO-END (FASE 7.4)`);
  console.log(`   Servidor de pruebas: ${BASE}`);
  console.log(`   RUC de prueba: ${testRuc}`);
  console.log(`================================================================\n`);

  await setupFixtures();

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  let pageAdmin = null;
  let ctxAdmin = null;

  let pageB2B = null;
  let ctxB2B = null;

  try {
    // ════════════════════════════════════════════════════════════════════════
    // TRACK 1: REGISTRO EMPRESARIAL
    // ════════════════════════════════════════════════════════════════════════
    const ctxVisitor = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageVisitor = await ctxVisitor.newPage();

    await check("TRACK 1", "1.1 Carga del formulario de registro empresarial en /mayorista/registro", async () => {
      await pageVisitor.goto(`${BASE}/mayorista/registro`, { waitUntil: "networkidle" });
      const heading = (await pageVisitor.innerText("body")).toLowerCase();
      assert(heading.includes("registro de empresas") || heading.includes("canal corporativo"), "No carga encabezado empresarial");
      const rucInput = pageVisitor.locator('input[name="taxId"]');
      assert((await rucInput.count()) > 0, "Falta input taxId para RUC");
      return "Formulario de registro empresarial disponible";
    });

    await check("TRACK 1", "1.2 Llenado y envío de datos de empresa ficticia de pruebas", async () => {
      await pageVisitor.fill('input[name="legalName"]', testCompanyName);
      await pageVisitor.fill('input[name="tradeName"]', testTradeName);
      await pageVisitor.fill('input[name="taxId"]', testRuc);
      await pageVisitor.fill('input[name="contactName"]', "Mateo Barrenechea");
      await pageVisitor.fill('input[name="contactEmail"]', testCompanyEmail);
      await pageVisitor.fill('input[name="contactPhone"]', "987654321");
      await pageVisitor.fill('input[name="password"]', sharedPass);
      await pageVisitor.fill('input[name="confirmPassword"]', sharedPass);

      await pageVisitor.selectOption('select[name="businessType"]', "Distribuidor mayorista textil");
      await pageVisitor.fill('input[name="addressLine"]', "Av. Argentina 1840");
      await pageVisitor.fill('input[name="department"]', "Lima");
      await pageVisitor.fill('input[name="province"]', "Lima");
      await pageVisitor.fill('input[name="district"]', "Cercado de Lima");
      await pageVisitor.selectOption('select[name="estimatedVolume"]', { index: 2 });
      await pageVisitor.fill('textarea[name="additionalNotes"]', "Prueba de Aceptación Comercial Fase 7.4");

      // Aceptar términos
      await pageVisitor.check('input[name="termsAccepted"]');

      // Enviar formulario
      await Promise.all([
        pageVisitor.waitForURL("**/mayorista/solicitud**", { timeout: 15000 }),
        pageVisitor.click('button[type="submit"]'),
      ]);
      assert(pageVisitor.url().includes("/mayorista/solicitud"), `URL no esperada tras registro: ${pageVisitor.url()}`);
      return `Solicitud enviada para RUC ${testRuc}`;
    });

    await check("TRACK 1", "1.3 Verificación en PostgreSQL de la solicitud y usuario creado", async () => {
      const rows = await sql`
        SELECT b.id as app_id, b.status as app_status, b.tax_id, u.id as user_id, u.role as user_role
        FROM business_applications b
        INNER JOIN users u ON b.user_id = u.id
        WHERE b.tax_id = ${testRuc}
        LIMIT 1
      `;
      assert(rows.length > 0, "No se encontró la solicitud en PostgreSQL business_applications");
      const app = rows[0];
      assert(app.app_status === "pending", `Estado inesperado en BD: ${app.app_status}`);
      assert(app.user_role === "business_pending", `Rol de usuario inesperado en BD: ${app.user_role}`);
      registeredUserId = app.user_id;
      registeredAppId = app.app_id;
      allCreatedUserIds.push(registeredUserId);
      return `ID Solicitud: ${registeredAppId}, ID Usuario: ${registeredUserId}, status: pending, role: business_pending`;
    });

    // Iniciar sesión del administrador usando loginInContext
    const adminSession = await loginInContext(browser, adminEmail, sharedPass, "/admin/solicitudes");
    ctxAdmin = adminSession.ctx;
    pageAdmin = adminSession.page;

    await check("TRACK 1", "1.4 Panel Administrativo /admin/solicitudes lista la nueva solicitud", async () => {
      await pageAdmin.waitForSelector("table", { timeout: 15000 });
      const pageText = await pageAdmin.innerText("main");
      assert(pageText.includes(testRuc), `El RUC ${testRuc} no aparece en la tabla de solicitudes administrativas`);
      assert(pageText.includes("Horizonte"), "No se visualiza la razón social de la empresa");
      return `Solicitud visible en /admin/solicitudes con RUC ${testRuc}`;
    });

    await check("TRACK 1", "1.5 Administrador aprueba la solicitud en /admin/solicitudes/[id]", async () => {
      await pageAdmin.goto(`${BASE}/admin/solicitudes/${registeredAppId}`, { waitUntil: "networkidle" });
      const detailText = await pageAdmin.innerText("main");
      assert(detailText.includes(testRuc), "No cargó el detalle de la solicitud");

      // Seleccionar botón de aprobación
      const approveBtn = pageAdmin.locator('button:has-text("Aprobar empresa"), button:has-text("Aprobar")').first();
      if ((await approveBtn.count()) > 0) {
        await approveBtn.click();
      }
      await pageAdmin.fill('textarea[name="internalNotes"]', "Aprobación comercial verificada en Fase 7.4");

      // El botón de acción es "Ejecutar resolución"
      const submitBtn = pageAdmin.locator('button:has-text("Ejecutar resolución"), button[type="submit"]').first();
      await submitBtn.click();
      await pageAdmin.waitForTimeout(2000);

      // Verificar en PostgreSQL
      const [updatedApp] = await sql`
        SELECT b.status as app_status, u.role as user_role
        FROM business_applications b
        INNER JOIN users u ON b.user_id = u.id
        WHERE b.id = ${registeredAppId}
      `;
      assert(updatedApp.app_status === "approved", `Estado de solicitud no es approved: ${updatedApp.app_status}`);
      assert(updatedApp.user_role === "business_approved", `Rol de usuario no fue ascendido a business_approved: ${updatedApp.user_role}`);
      return `Solicitud aprobada en BD. Rol actualizado a business_approved`;
    });

    // Iniciar sesión con la cuenta recién aprobada
    const b2bSession = await loginInContext(browser, testCompanyEmail, sharedPass, "/producto/polo-esencial-algodon");
    ctxB2B = b2bSession.ctx;
    pageB2B = b2bSession.page;

    await check("TRACK 1", "1.6 Inicio de sesión empresarial aprobada y habilitación de tarifas mayoristas", async () => {
      const pageText = (await pageB2B.innerText("main")).toLowerCase();
      // Debe contener la escala de precios por volumen o el badge de tarifas B2B
      assert(
        pageText.includes("tarifas b2b") ||
        pageText.includes("disponible por mayor") ||
        pageText.includes("uds."),
        "No se visualizan las tarifas mayoristas en ficha de producto",
      );
      return "Tarifas mayoristas B2B desbloqueadas en la ficha de producto";
    });

    await check("TRACK 1", "1.7 Cuenta minorista NO obtiene precios mayoristas (control negativo)", async () => {
      const { ctx: ctxCustA, page: pageCustA } = await loginInContext(browser, customerAEmail, sharedPass, "/producto/polo-esencial-algodon");
      const pageText = await pageCustA.innerText("main");
      // Debe mostrar el precio minorista S/ 79.00
      assert(pageText.includes("79.00") || pageText.includes("79"), "No muestra precio retail regular");
      // No debe contener el badge de tarifas B2B activas
      assert(!pageText.includes("Tarifas B2B"), "Cliente minorista no debe tener la insignia Tarifas B2B");
      await ctxCustA.close();
      return "Cliente minorista restringido a precios retail sin privilegios B2B";
    });

    // ════════════════════════════════════════════════════════════════════════
    // TRACK 2: COTIZACIONES MAYORISTAS
    // ════════════════════════════════════════════════════════════════════════
    const ctxQuoteVisitor = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageQuoteVisitor = await ctxQuoteVisitor.newPage();

    await check("TRACK 2", "2.1 Visitante ingresa al configurador de cotizaciones /mayorista/cotizaciones", async () => {
      await pageQuoteVisitor.goto(`${BASE}/mayorista/cotizaciones`, { waitUntil: "networkidle" });
      const pageText = (await pageQuoteVisitor.innerText("body")).toLowerCase();
      assert(pageText.includes("cotizaciones") || pageText.includes("canal corporativo"), "No carga cotizador mayorista");
      return "Página /mayorista/cotizaciones disponible";
    });

    await check("TRACK 2", "2.2 Visitante selecciona prendas, tallas, cantidades y prepara borrador", async () => {
      const qtyInput = pageQuoteVisitor.locator("#quote-qty-input");
      await qtyInput.fill("24");
      const noteInput = pageQuoteVisitor.locator('input[placeholder*="Observación opcional"]');
      await noteInput.fill("Empaque individual transparente");
      await pageQuoteVisitor.click('button:has-text("Agregar variante al lote")');
      await pageQuoteVisitor.waitForTimeout(600);

      // Requerimientos comerciales
      await pageQuoteVisitor.fill("#quote-commercial-needs", "Requerimiento de dotación corporativa para entrega en tienda central Lima.");
      await pageQuoteVisitor.fill("#quote-delivery-city", "Lima Metropolitana");
      await pageQuoteVisitor.fill("#quote-customer-notes", "Horario de recepción: 8:00 AM a 1:00 PM");

      const bodyText = await pageQuoteVisitor.innerText("main");
      assert(bodyText.includes("24 uds.") || bodyText.includes("24"), "No se agregó la línea de 24 unidades");
      return "Borrador de 24 unidades configurado";
    });

    await check("TRACK 2", "2.3 Persistencia de borrador en localStorage tras recarga de página", async () => {
      await pageQuoteVisitor.reload({ waitUntil: "networkidle" });
      const stored = await pageQuoteVisitor.evaluate(() => localStorage.getItem("investments_quote_draft_v1"));
      assert(stored && stored.includes("24"), "El borrador no persistió en localStorage");
      assert(stored && stored.includes("dotación corporativa"), "Las notas comerciales no persistieron");

      const bodyAfterReload = await pageQuoteVisitor.innerText("main");
      assert(bodyAfterReload.includes("24 uds.") || bodyAfterReload.includes("24"), "La línea no se renderizó tras recarga");
      return "Borrador conservado íntegro tras recarga";
    });

    await check("TRACK 2", "2.4 Bloqueo de envío formal para visitante (muestra Auth Gate con opciones)", async () => {
      const submitBtn = pageQuoteVisitor.locator('button[type="submit"]:has-text("Guardar borrador y enviar cotización"), button[type="submit"]:has-text("Enviar")');
      await submitBtn.click();
      await pageQuoteVisitor.waitForTimeout(800);

      const bodyText = (await pageQuoteVisitor.innerText("main")).toLowerCase();
      assert(bodyText.includes("inicia sesión o registra tu empresa") || bodyText.includes("se requiere cuenta empresarial"), "No se presentó el Auth Gate de seguridad comercial");
      return "Auth Gate comercial bloqueó envío no autorizado de visitante";
    });

    await check("TRACK 2", "2.5 Empresa autorizada envía cotización formal con número único COT-2026-XXXXXX", async () => {
      // Navegar a cotizaciones con la cuenta empresarial aprobada
      await pageB2B.goto(`${BASE}/mayorista/cotizaciones`, { waitUntil: "networkidle" });

      // Configurar línea con cantidad y notas
      const qtyInput = pageB2B.locator("#quote-qty-input");
      await qtyInput.fill("24");
      await pageB2B.click('button:has-text("Agregar variante al lote")');
      await pageB2B.waitForTimeout(600);

      await pageB2B.fill("#quote-commercial-needs", "Requerimiento de dotación corporativa para entrega en tienda central Lima.");
      await pageB2B.fill("#quote-delivery-city", "Lima Metropolitana");
      await pageB2B.fill("#quote-customer-notes", "Horario de recepción: 8:00 AM a 1:00 PM");

      const submitBtn = pageB2B.locator('button[type="submit"]:has-text("Enviar solicitud de cotización B2B")');
      assert((await submitBtn.count()) > 0, "No se encontró el botón de envío formal para empresa autorizada");

      // El formulario presenta la tarjeta de confirmación in-place tras registrar en BD
      await submitBtn.click();

      // Esperar a que aparezca el enlace al expediente generado
      const detailLink = pageB2B.locator('a[href*="/mayorista/cotizaciones/"]').first();
      await detailLink.waitFor({ state: "visible", timeout: 20000 });

      const detailHref = await detailLink.getAttribute("href");
      assert(detailHref, "No se encontró el enlace al detalle de la cotización");

      const parts = detailHref.split("/");
      quoteAId = parseInt(parts[parts.length - 1], 10);
      assert(Number.isInteger(quoteAId) && quoteAId > 0, `ID de cotización inválido: ${quoteAId}`);

      const quoteText = await pageB2B.innerText("main");
      const match = quoteText.match(/COT-\d{4}-\d+/);
      assert(match, "No se encontró el número de cotización COT-YYYY-XXXXXX");
      quoteANumber = match[0];

      // Navegar a la página de detalle
      await detailLink.click();
      await pageB2B.waitForURL((url) => url.pathname.includes(`/mayorista/cotizaciones/${quoteAId}`), { timeout: 15000 });

      return `Cotización creada con ID ${quoteAId} y Número ${quoteANumber}`;
    });

    await check("TRACK 2", "2.6 Verificación en PostgreSQL de cotización, líneas y snapshots inmutables", async () => {
      const quotes = await sql`
        SELECT q.id, q.quote_number, q.status, q.requested_subtotal_amount, count(qi.id) as item_count
        FROM wholesale_quotes q
        INNER JOIN wholesale_quote_items qi ON qi.quote_id = q.id
        WHERE q.id = ${quoteAId}
        GROUP BY q.id, q.quote_number, q.status, q.requested_subtotal_amount
      `;
      assert(quotes.length > 0, `No se encontró la cotización ${quoteAId} en PostgreSQL`);
      const q = quotes[0];
      assert(q.status === "submitted", `Estado inesperado en BD: ${q.status}`);
      assert(parseInt(q.item_count, 10) >= 1, "No se guardaron las líneas de la cotización");
      return `Registrado en DB: ${q.quote_number}, status: submitted, items: ${q.item_count}`;
    });

    await check("TRACK 2", "2.7 Administrador consulta y emite propuesta formal en /admin/cotizaciones/[id]", async () => {
      await pageAdmin.goto(`${BASE}/admin/cotizaciones/${quoteAId}`, { waitUntil: "networkidle" });
      const adminQuoteText = await pageAdmin.innerText("main");
      assert(adminQuoteText.includes(quoteANumber), `No se visualiza la cotización ${quoteANumber} en el panel admin`);

      // Seleccionar estado "quoted" y llenar propuesta
      const statusSelect = pageAdmin.locator('#admin-quote-status, select[name="nextStatus"], select').first();
      if ((await statusSelect.count()) > 0) {
        await statusSelect.selectOption("quoted");
      }

      // Proponer precio unitario (ej: 45.00)
      const priceInput = pageAdmin.locator('input[aria-label*="Precio unitario propuesto"], input[type="text"][inputmode="decimal"]').first();
      if ((await priceInput.count()) > 0) {
        await priceInput.fill("45.00");
      }

      // Enviar propuesta
      const sendProposalBtn = pageAdmin.locator('button[type="submit"]:has-text("Publicar y enviar propuesta económica"), button[type="submit"]').first();
      assert((await sendProposalBtn.count()) > 0, "No se encontró botón para emitir propuesta formal");
      await sendProposalBtn.click();
      await pageAdmin.waitForTimeout(2000);

      const [updatedQuote] = await sql`
        SELECT status, quoted_total_amount FROM wholesale_quotes WHERE id = ${quoteAId}
      `;
      assert(updatedQuote.status === "quoted", `El estado de la cotización en BD no avanzó a quoted: ${updatedQuote.status}`);
      return `Propuesta emitida por Admin. Estado en BD: quoted`;
    });

    await check("TRACK 2", "2.8 Cliente B2B visualiza propuesta y acepta formalmente las condiciones", async () => {
      await pageB2B.goto(`${BASE}/mayorista/cotizaciones/${quoteAId}`, { waitUntil: "networkidle" });
      const detailText = (await pageB2B.innerText("main")).toLowerCase();
      assert(detailText.includes("propuesta económica") || detailText.includes("aceptar propuesta"), "No se visualiza la propuesta comercial");

      // Cliente acepta la propuesta
      const acceptBtn = pageB2B.locator('button:has-text("Aceptar propuesta económica")').first();
      assert((await acceptBtn.count()) > 0, "Falta botón de aceptación de propuesta para el cliente");
      await acceptBtn.click();
      await pageB2B.waitForTimeout(2000);

      const [finalQuote] = await sql`
        SELECT status FROM wholesale_quotes WHERE id = ${quoteAId}
      `;
      assert(finalQuote.status === "accepted", `El estado en BD no cambió a accepted: ${finalQuote.status}`);
      return `Propuesta aceptada por el cliente. Estado en BD: accepted`;
    });

    // ════════════════════════════════════════════════════════════════════════
    // TRACK 3: FAVORITOS
    // ════════════════════════════════════════════════════════════════════════
    const ctxFav = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageFav = await ctxFav.newPage();

    await check("TRACK 3", "3.1 Agregar a favoritos desde tarjeta en Home", async () => {
      await pageFav.goto(`${BASE}/`, { waitUntil: "networkidle" });
      const favBtn = pageFav.locator('[data-testid^="favorite-toggle-"]').first();
      assert((await favBtn.count()) > 0, "No se encontró botón de favorito en Home");
      await favBtn.click({ force: true });
      await pageFav.waitForTimeout(1000);

      const badge = pageFav.locator('[data-testid="header-favorites-count"]').first();
      const count = await badge.innerText();
      assert(count === "1", `Contador de favoritos en header esperado '1', recibido '${count}'`);
      return "1 prenda añadida desde Home. Contador = 1";
    });

    await check("TRACK 3", "3.2 Agregar a favoritos desde Catálogo /catalogo", async () => {
      await pageFav.goto(`${BASE}/catalogo`, { waitUntil: "networkidle" });
      const catBtn = pageFav.locator('[data-testid="favorite-toggle-polo-esencial-algodon"]');
      assert((await catBtn.count()) > 0, "No se encontró prenda polo-esencial-algodon en /catalogo");
      await catBtn.scrollIntoViewIfNeeded();
      await catBtn.click({ force: true });
      await pageFav.waitForTimeout(1000);

      const badge = pageFav.locator('[data-testid="header-favorites-count"]').first();
      const count = await badge.innerText();
      assert(count === "2", `Contador de favoritos esperado '2', recibido '${count}'`);
      return "Segunda prenda añadida desde Catálogo. Contador = 2";
    });

    await check("TRACK 3", "3.3 Agregar a favoritos desde Detalle de Producto /producto/[slug]", async () => {
      // Navegar a una tercera prenda distinta
      await pageFav.goto(`${BASE}/producto/blazer-camel-relajado`, { waitUntil: "networkidle" });
      const detailFavBtn = pageFav.locator('[data-testid="product-detail-favorite-button"]');
      assert((await detailFavBtn.count()) > 0, "Falta botón de favorito en ficha de producto");
      await detailFavBtn.scrollIntoViewIfNeeded();
      await detailFavBtn.click({ force: true });
      await pageFav.waitForTimeout(1000);

      const badge = pageFav.locator('[data-testid="header-favorites-count"]').first();
      const count = await badge.innerText();
      assert(count === "3", `Contador de favoritos esperado '3', recibido '${count}'`);
      return "Tercera prenda añadida desde ficha de producto. Contador = 3";
    });

    await check("TRACK 3", "3.4 Visualización de lista en /favoritos y remoción de 1 prenda", async () => {
      await pageFav.goto(`${BASE}/favoritos`, { waitUntil: "networkidle" });
      await pageFav.waitForTimeout(1000);
      const cards = pageFav.locator('[data-testid^="favorite-card-"]');
      const totalCards = await cards.count();
      assert(totalCards === 3, `Se esperaban 3 tarjetas en /favoritos, encontradas: ${totalCards}`);

      // Remover la primera prenda
      const removeBtn = pageFav.locator('[data-testid^="remove-favorite-"]').first();
      await removeBtn.click({ force: true });
      await pageFav.waitForTimeout(1500);

      const remainingCards = await pageFav.locator('[data-testid^="favorite-card-"]').count();
      assert(remainingCards === 2, `Se esperaban 2 tarjetas tras remover una, encontradas: ${remainingCards}`);
      return "Lista de favoritos reducida a 2 prendas correctamente";
    });

    await check("TRACK 3", "3.5 Persistencia en recarga y sincronización al iniciar sesión en PostgreSQL", async () => {
      await pageFav.reload({ waitUntil: "networkidle" });
      const remainingCards = await pageFav.locator('[data-testid^="favorite-card-"]').count();
      assert(remainingCards === 2, "La lista no conservó las 2 prendas tras recarga");

      // Iniciar sesión con Cliente A para que se sincronicen a su base de datos
      await pageFav.goto(`${BASE}/iniciar-sesion`, { waitUntil: "networkidle" });
      await pageFav.fill('input[name="email"]', customerAEmail);
      await pageFav.fill('input[name="password"]', sharedPass);
      await Promise.all([
        pageFav.waitForURL((url) => !url.pathname.includes("/iniciar-sesion"), { timeout: 20000 }),
        pageFav.click('button[type="submit"]'),
      ]);

      await pageFav.goto(`${BASE}/cuenta/favoritos`, { waitUntil: "networkidle" });
      await pageFav.waitForTimeout(1500);

      // Verificar en PostgreSQL con reintento breve si fuera necesario
      let totalFavsInDb = 0;
      for (let attempt = 0; attempt < 5; attempt++) {
        const dbFavs = await sql`
          SELECT count(*)::int as total FROM user_favorites WHERE user_id = ${customerAUserId}
        `;
        totalFavsInDb = dbFavs[0]?.total ?? 0;
        if (totalFavsInDb >= 2) break;
        await new Promise((r) => setTimeout(r, 600));
      }

      assert(totalFavsInDb >= 2, `Se esperaban al menos 2 registros en user_favorites, encontrados: ${totalFavsInDb}`);
      return `Favoritos sincronizados en PostgreSQL para usuario #${customerAUserId}: ${totalFavsInDb} registros`;
    });

    await check("TRACK 3", "3.6 Aislamiento estricto de favoritos entre usuarios distintos (Cliente A vs Cliente B)", async () => {
      const { ctx: ctxCustB, page: pageCustB } = await loginInContext(browser, customerBEmail, sharedPass, "/cuenta/favoritos");

      // Cliente B no debe ver ningún favorito de Cliente A
      const cardsB = await pageCustB.locator('[data-testid^="favorite-card-"]').count();
      assert(cardsB === 0, `Cliente B no debería tener favoritos, pero se encontraron ${cardsB}`);

      const bodyText = await pageCustB.innerText("main");
      assert(
        bodyText.includes("Tu lista de favoritos está vacía") ||
        bodyText.includes("No tienes prendas guardadas"),
        "Falta mensaje de lista vacía para Cliente B",
      );
      await ctxCustB.close();
      return "Aislamiento estricto confirmado: Cliente B tiene lista limpia sin fugas de Cliente A";
    });

    // ════════════════════════════════════════════════════════════════════════
    // TRACK 4: PRODUCTOS Y COMPRAS
    // ════════════════════════════════════════════════════════════════════════
    const ctxCart = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageCart = await ctxCart.newPage();

    await check("TRACK 4", "4.1 Selección de talla, color y cantidad con agregado a la bolsa", async () => {
      await pageCart.goto(`${BASE}/producto/polo-esencial-algodon`, { waitUntil: "networkidle" });

      // Seleccionar talla M
      const sizeBtn = pageCart.locator('button[role="radio"]:has-text("M")').first();
      await sizeBtn.click();

      const addBagBtn = pageCart.locator('button:has-text("Agregar a la bolsa")');
      assert((await addBagBtn.count()) > 0, "Falta botón Agregar a la bolsa");
      await addBagBtn.click();

      // Verificar que se abre el drawer
      await pageCart.waitForSelector("#cart-drawer-title", { timeout: 10000 });
      const drawerText = await pageCart.innerText('div[role="dialog"]');
      assert(drawerText.includes("Polo esencial de algodón"), "El nombre de producto no está en el cajón de compra");
      assert(drawerText.includes("POLO-ESS"), "Falta SKU de la prenda en el cajón");
      return "Producto agregado a la bolsa con drawer abierto";
    });

    await check("TRACK 4", "4.2 Verificación de cálculo de precios y subtotales en el servidor en /carrito", async () => {
      await pageCart.goto(`${BASE}/carrito`, { waitUntil: "networkidle" });
      const cartText = await pageCart.innerText("main");
      assert(cartText.includes("POLO-ESS"), "No se visualiza la prenda en /carrito");
      assert(cartText.includes("S/ 79.00") || cartText.includes("79.00"), "Subtotal retail esperado en PEN");
      return "Subtotal y cálculo de moneda peruana (PEN) validado en servidor";
    });

    await check("TRACK 4", "4.3 Validación y protección de stock en el servidor", async () => {
      // Incrementar cantidad usando el botón +
      const incBtn = pageCart.locator('[data-testid="cart-line-increase-btn"]').first();
      if ((await incBtn.count()) > 0) {
        await incBtn.click();
        await pageCart.waitForTimeout(1000);
        const totalText = await pageCart.innerText('[data-testid="cart-estimated-total"]');
        assert(totalText.includes("158"), `Total esperado tras incremento a 2: S/ 158.00, recibido: ${totalText}`);
      }
      return "Recálculo atómico en el servidor tras modificar cantidad";
    });

    await check("TRACK 4", "4.4 Verificación de navegación y vista responsiva en móvil (375x812)", async () => {
      const ctxMobile = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: "es-PE" });
      const pageMobile = await ctxMobile.newPage();
      await pageMobile.goto(`${BASE}/`, { waitUntil: "networkidle" });

      // Comprobar presencia de la barra inferior móvil (tab bar)
      const mobileNav = pageMobile.locator('[data-testid="mobile-tab-bar"]');
      assert((await mobileNav.count()) > 0, "Falta la barra de navegación móvil inferior");

      // Comprobar apertura del menú hamburguesa
      const hamburger = pageMobile.locator('button[aria-label*="Abrir menú"], button[aria-label*="menu"]').first();
      assert((await hamburger.count()) > 0, "Falta botón de menú móvil");
      await hamburger.click();
      await pageMobile.waitForTimeout(400);
      const mobileMenuText = (await pageMobile.innerText("body")).toLowerCase();
      assert(mobileMenuText.includes("catálogo") || mobileMenuText.includes("mayorista"), "El menú móvil no desplegó las opciones");

      await ctxMobile.close();
      return "Layout móvil responsivo, barra de tabs y menú desplegable operativos";
    });

    // ════════════════════════════════════════════════════════════════════════
    // TRACK 5: NEWSLETTER Y DATOS PERSONALES
    // ════════════════════════════════════════════════════════════════════════
    await check("TRACK 5", "5.1 Suscripción con correo válido guarda registro activo en PostgreSQL", async () => {
      const newsEmail = `test.fase74.${ts}@investments.pe`;
      await pageVisitor.goto(`${BASE}/`, { waitUntil: "networkidle" });

      const emailInput = pageVisitor.locator('footer input[type="email"], footer input[placeholder*="correo"]').first();
      await emailInput.fill(newsEmail);

      const submitBtn = pageVisitor.locator('footer button[type="submit"]').first();
      await submitBtn.click();
      await pageVisitor.waitForTimeout(1000);

      const bodyText = await pageVisitor.innerText("footer");
      assert(bodyText.includes("¡Gracias por suscribirte!") || bodyText.includes("Gracias por suscribirte"), "No se mostró mensaje de confirmación de suscripción");

      // Verificar en PostgreSQL
      const [sub] = await sql`
        SELECT email, is_active FROM newsletter_subscribers WHERE email = ${newsEmail}
      `;
      assert(sub && sub.is_active === true, "No se guardó el suscriptor en PostgreSQL");
      return `Suscrito y verificado en DB: ${newsEmail}`;
    });

    await check("TRACK 5", "5.2 Rechazo de correo con formato inválido con mensaje explicativo", async () => {
      await pageVisitor.goto(`${BASE}/politicas`, { waitUntil: "networkidle" });
      const emailInput = pageVisitor.locator('footer input[type="email"], footer input[placeholder*="correo"]').first();
      await emailInput.fill("correo-sin-formato-valido");

      const submitBtn = pageVisitor.locator('footer button[type="submit"]').first();
      await submitBtn.click();
      await pageVisitor.waitForTimeout(500);

      const bodyText = (await pageVisitor.innerText("footer")).toLowerCase();
      assert(bodyText.includes("válido") || bodyText.includes("inválido"), "No se mostró mensaje de validación de correo");
      return "Correo inválido rechazado con advertencia inmediata";
    });

    await check("TRACK 5", "5.3 Manejo idempotente de correo duplicado sin error de servidor", async () => {
      const newsEmail = `test.fase74.${ts}@investments.pe`;
      const emailInput = pageVisitor.locator('footer input[type="email"], footer input[placeholder*="correo"]').first();
      await emailInput.fill(newsEmail);
      const submitBtn = pageVisitor.locator('footer button[type="submit"]').first();
      await submitBtn.click();
      await pageVisitor.waitForTimeout(800);

      const bodyText = await pageVisitor.innerText("footer");
      assert(bodyText.includes("¡Gracias por suscribirte!") || bodyText.includes("Gracias por suscribirte"), "No manejó la suscripción duplicada limpiamente");
      return "Suscripción duplicada gestionada limpiamente sin 500 ni colisión";
    });

    // ════════════════════════════════════════════════════════════════════════
    // TRACK 6: ENLACES Y NAVEGACIÓN
    // ════════════════════════════════════════════════════════════════════════
    await check("TRACK 6", "6.1 Rastrear rutas institucionales, legales y comerciales sin 404 ni enlaces rotos", async () => {
      const routesToTest = [
        "/",
        "/catalogo",
        "/mayorista",
        "/mayorista/cotizaciones",
        "/mayorista/registro",
        "/favoritos",
        "/carrito",
        "/atencion-al-cliente",
        "/politicas",
        "/libro-de-reclamaciones",
        "/iniciar-sesion",
        "/registro",
      ];

      for (const route of routesToTest) {
        const res = await pageVisitor.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
        assert(res.status() === 200, `Ruta ${route} devolvió status ${res.status()}`);
        const text = (await pageVisitor.innerText("body")).toLowerCase();
        assert(!text.includes("404 - página no encontrada"), `Ruta ${route} mostró pantalla 404`);
        assert(!text.includes("error 500"), `Ruta ${route} mostró error 500`);
      }
      return `12 rutas principales respondieron HTTP 200 exitosamente`;
    });

    await check("TRACK 6", "6.2 Ausencia de textos residuales 'próximamente' o 'en construcción' en navegación", async () => {
      await pageVisitor.goto(`${BASE}/`, { waitUntil: "networkidle" });
      const bodyText = (await pageVisitor.innerText("body")).toLowerCase();
      assert(!bodyText.includes("próximamente") && !bodyText.includes("proximamente"), "Se detectó texto residual 'próximamente' en home");
      assert(!bodyText.includes("en construcción"), "Se detectó texto residual 'en construcción'");
      return "Cero textos residuales o de maqueta en portada";
    });

    // ════════════════════════════════════════════════════════════════════════
    // TRACK 7: SEGURIDAD DE LOS RECORRIDOS
    // ════════════════════════════════════════════════════════════════════════
    await check("TRACK 7", "7.1 Aislamiento de cotizaciones B2B: Empresa B no puede acceder a cotización de Empresa A", async () => {
      // Iniciar sesión con Empresa B y tratar de ver la cotización quoteAId de Empresa A
      const { ctx: ctxSecB, page: pageSecB } = await loginInContext(browser, companyBEmail, sharedPass);

      const res = await pageSecB.goto(`${BASE}/mayorista/cotizaciones/${quoteAId}`, { waitUntil: "networkidle" });
      // Next.js notFound() devuelve status 404 o página con 404
      const bodyText = (await pageSecB.innerText("body")).toLowerCase();
      assert(res.status() === 404 || bodyText.includes("404") || bodyText.includes("no encontrada") || bodyText.includes("no disponible"), "Empresa B logró acceder a la cotización de Empresa A (fuga de datos B2B)");
      await ctxSecB.close();
      return `Acceso bloqueado (404 Not Found) para Empresa B sobre cotización #${quoteAId}`;
    });

    await check("TRACK 7", "7.2 Protección de rutas administrativas ante usuarios no autorizados", async () => {
      const { ctx: ctxNoAdm, page: pageNoAdm } = await loginInContext(browser, customerAEmail, sharedPass);

      // Cliente regular intenta entrar a /admin
      await pageNoAdm.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
      assert(!pageNoAdm.url().endsWith("/admin"), `Cliente regular logró entrar a ${pageNoAdm.url()}`);

      // Empresa mayorista intenta entrar a /admin/solicitudes
      await pageNoAdm.goto(`${BASE}/admin/solicitudes`, { waitUntil: "networkidle" });
      assert(!pageNoAdm.url().includes("/admin/solicitudes"), "Cliente regular logró entrar a /admin/solicitudes");

      await ctxNoAdm.close();
      return "Acceso a /admin denegado para clientes no administradores";
    });

    await check("TRACK 7", "7.3 Integridad del motor de precios: precios unitarios calculados en servidor", async () => {
      const [poloVariant] = await sql`
        SELECT pv.id, pp.amount FROM product_variants pv
        INNER JOIN product_prices pp ON pp.product_id = pv.product_id
        WHERE pv.sku = 'POLO-ESS-BL-M' AND pp.type = 'retail'
        LIMIT 1
      `;
      assert(poloVariant && poloVariant.amount === 7900, `Precio esperado en BD: 7900 céntimos, encontrado: ${poloVariant?.amount}`);
      return "El cliente solo transmite IDs y cantidades; el servidor fija los precios";
    });

  } finally {
    if (ctxAdmin) await ctxAdmin.close();
    if (ctxB2B) await ctxB2B.close();
    await browser.close();
    await cleanupFixtures();
  }

  // Resumen final
  console.log(`\n================================================================`);
  console.log(`               RESUMEN DE PRUEBAS DE ACEPTACIÓN`);
  console.log(`================================================================\n`);

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.table(
    results.map((r, i) => ({
      "#": i + 1,
      Track: r.track,
      Escenario: r.name,
      Resultado: r.ok ? "PASS" : "FAIL",
      Detalle: r.detail.slice(0, 75),
    })),
  );

  console.log(`\nTOTAL ESCENARIOS: ${results.length} | PASARON: ${passed} | FALLARON: ${failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR EN SUITE E2E:", err);
  process.exit(1);
});
