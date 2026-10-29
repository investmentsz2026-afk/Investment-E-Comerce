/**
 * Suite Integral de Pruebas E2E — Fase 4:
 * Carrito Inteligente, Precios por Volumen y Cotizaciones B2B
 *
 * Ejecuta en navegador real Microsoft Edge (playwright-core) + Neon PostgreSQL.
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
const customerEmail = `fase4.b2c.${ts}@investments.pe`;
const companyAEmail = `fase4.b2ba.${ts}@investments.pe`;
const companyBEmail = `fase4.b2bb.${ts}@investments.pe`;
const pendingCompanyEmail = `fase4.pending.${ts}@investments.pe`;
const adminEmail = `fase4.admin.${ts}@investments.pe`;
const sharedPass = `Cl4veFase4_${randomBytes(5).toString("hex")}*`;

let customerId = null;
let companyAUserId = null;
let companyBUserId = null;
let pendingUserId = null;
let adminUserId = null;
let quoteAId = null;
let quoteANumber = null;

async function setupFixtures() {
  const passHash = hashPasswordSync(sharedPass);

  // 1. Cliente B2C
  const [cRow] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified_at)
    VALUES (${customerEmail}, ${passHash}, 'Lucía', 'Mendoza', 'customer', true, NOW())
    RETURNING id
  `;
  customerId = cRow.id;

  // 2. Empresa A aprobada (business_approved)
  const [b2bARow] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${companyAEmail}, ${passHash}, 'Carlos', 'Guzmán', '987654321', 'business_approved', true, NOW())
    RETURNING id
  `;
  companyAUserId = b2bARow.id;
  await sql`
    INSERT INTO business_applications (
      user_id, legal_name, trade_name, tax_id, contact_name, contact_email, contact_phone,
      business_type, address_line, department, province, district, estimated_volume, status
    ) VALUES (
      ${companyAUserId}, 'Consorcio Textil Andino A S.A.C.', 'Andino A', ${"20" + String(ts).slice(-9)},
      'Carlos Guzmán', ${companyAEmail}, '987654321', 'Distribuidor mayorista textil',
      'Av. Industrial 450', 'Lima', 'Lima', 'Ate', 'S/ 30,000 a S/ 80,000 mensuales', 'approved'
    )
  `;

  // 3. Empresa B aprobada (para aislamiento entre empresas)
  const [b2bBRow] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${companyBEmail}, ${passHash}, 'Elena', 'Ríos', '912345678', 'business_approved', true, NOW())
    RETURNING id
  `;
  companyBUserId = b2bBRow.id;
  await sql`
    INSERT INTO business_applications (
      user_id, legal_name, trade_name, tax_id, contact_name, contact_email, contact_phone,
      business_type, address_line, department, province, district, estimated_volume, status
    ) VALUES (
      ${companyBUserId}, 'Moda del Norte B S.A.C.', 'Moda Norte', ${"20" + String(ts + 1).slice(-9)},
      'Elena Ríos', ${companyBEmail}, '912345678', 'Boutique o tienda de moda retail',
      'Av. España 120', 'La Libertad', 'Trujillo', 'Trujillo', 'S/ 10,000 a S/ 30,000 mensuales', 'approved'
    )
  `;

  // 4. Empresa Pendiente (business_pending)
  const [pendRow] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified_at)
    VALUES (${pendingCompanyEmail}, ${passHash}, 'Marco', 'Soto', 'business_pending', true, NOW())
    RETURNING id
  `;
  pendingUserId = pendRow.id;

  // 5. Administrador efímero
  const [admRow] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified_at)
    VALUES (${adminEmail}, ${passHash}, 'Admin', 'Fase4', 'admin', true, NOW())
    RETURNING id
  `;
  adminUserId = admRow.id;
}

async function cleanupFixtures() {
  const ids = [customerId, companyAUserId, companyBUserId, pendingUserId, adminUserId].filter(Boolean);
  if (ids.length > 0) {
    await sql`DELETE FROM audit_logs WHERE actor_id = ANY(${ids})`;
    await sql`DELETE FROM wholesale_quotes WHERE user_id = ANY(${ids})`;
    await sql`DELETE FROM carts WHERE user_id = ANY(${ids})`;
    await sql`DELETE FROM business_applications WHERE user_id = ANY(${ids})`;
    await sql`DELETE FROM sessions WHERE user_id = ANY(${ids})`;
    await sql`DELETE FROM users WHERE id = ANY(${ids})`;
  }
}

async function run() {
  console.log(`\n=== INICIANDO SUITE E2E FASE 4 EN ${BASE} ===\n`);
  await setupFixtures();

  const browser = await chromium.launch({ channel: "msedge", headless: true });

  try {
    // ────────────────────────────────────────────────────────────────────────
    // 1. CARRITO DE VISITANTE + FUSIÓN AL INICIAR SESIÓN (B2C)
    // ────────────────────────────────────────────────────────────────────────
    const ctxB2C = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageB2C = await ctxB2C.newPage();

    await check("1. Carrito Visitante: agregar variante (talla y color), ver panel lateral y persistencia", async () => {
      await pageB2C.goto(`${BASE}/producto/polo-esencial-algodon`, { waitUntil: "networkidle" });
      // Seleccionar talla M
      await pageB2C.click('button[role="radio"]:has-text("M")');
      await pageB2C.click('button:has-text("Agregar a la bolsa")');

      // Debe abrirse el drawer del carrito con 1 prenda
      await pageB2C.waitForSelector('#cart-drawer-title', { timeout: 10000 });
      const drawerText = await pageB2C.innerText('div[role="dialog"]');
      assert(/Polo esencial de algodón/i.test(drawerText), "No aparece el producto en el cajón del carrito");
      assert(/SKU:\s*POLO-ESS-BL-M/i.test(drawerText), "No muestra el SKU exacto POLO-ESS-BL-M");
      assert(/Precio Minorista/i.test(drawerText), "Visitante debe recibir Precio Minorista");
      return "Variante POLO-ESS-BL-M añadida como visitante con cookie HttpOnly";
    });

    await check("2. Página /carrito: cambiar cantidades, validar límite de stock y recalcular subtotal en servidor", async () => {
      await pageB2C.goto(`${BASE}/carrito`, { waitUntil: "networkidle" });
      await pageB2C.waitForSelector('[data-testid="cart-line-increase-btn"]', { timeout: 10000 });
      const bodyText = await pageB2C.innerText("main");
      assert(/POLO-ESS-BL-M/i.test(bodyText), "La variante no persistió en /carrito");

      // Incrementar cantidad a 2
      await pageB2C.click('[data-testid="cart-line-increase-btn"]');
      await pageB2C.waitForTimeout(1200);
      const totalEl = await pageB2C.innerText('[data-testid="cart-estimated-total"]');
      // 2 * S/ 79.00 = S/ 158.00
      assert(/158/.test(totalEl), `Total estimado inesperado tras incrementar a 2: ${totalEl}`);

      // Intentar poner una cantidad superior al stock de la variante (stock de POLO-ESS-BL-M es 45)
      const qtyInput = await pageB2C.$('[data-testid="cart-line-qty-input"]');
      await qtyInput.fill("99");
      await qtyInput.press("Enter");
      await pageB2C.waitForTimeout(1200);
      const alertText = await pageB2C.innerText("main");
      assert(/Stock insuficiente/i.test(alertText), "El servidor no rechazó una cantidad mayor al stock disponible");
      return "Subtotal S/ 158.00 y bloqueo de sobre-stock verificados";
    });

    await check("3. Fusión de carrito visitante al iniciar sesión como cliente B2C + bloqueo de ruta mayorista", async () => {
      await pageB2C.goto(`${BASE}/iniciar-sesion?next=/carrito`, { waitUntil: "networkidle" });
      await pageB2C.fill('input[name="email"]', customerEmail);
      await pageB2C.fill('input[name="password"]', sharedPass);
      await pageB2C.click('button[type="submit"]');
      await pageB2C.waitForURL((u) => u.pathname.includes("/carrito"), { timeout: 15000 });

      const mergedText = await pageB2C.innerText("main");
      assert(/POLO-ESS-BL-M/i.test(mergedText), "El carrito de visitante no se fusionó con la cuenta B2C");

      // Verificar en BD que el carrito ahora pertenece a customerId
      const userCarts = await sql`SELECT id FROM carts WHERE user_id = ${customerId} AND status = 'active'`;
      assert(userCarts.length === 1, "No se vinculó el carrito en PostgreSQL al userId del cliente");

      // Verificar que cliente B2C NO puede usar /mayorista/cotizaciones
      await pageB2C.goto(`${BASE}/mayorista/cotizaciones`, { waitUntil: "networkidle" });
      const b2cBlockText = await pageB2C.innerText("main");
      assert(/Habilita tu cuenta comercial B2B|Acceso Exclusivo para Empresas Aprobadas/i.test(b2cBlockText), "Cliente B2C no fue bloqueado del constructor de cotizaciones");
      return "Carrito fusionado en PostgreSQL y acceso B2B restringido para B2C";
    });

    // ────────────────────────────────────────────────────────────────────────
    // 2. EMPRESA PENDIENTE: NO RECIBE PRECIOS MAYORISTAS NI COTIZACIONES
    // ────────────────────────────────────────────────────────────────────────
    const ctxPending = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pagePending = await ctxPending.newPage();

    await check("4. Empresa Pendiente (business_pending): recibe precios minoristas y no puede cotizar", async () => {
      await pagePending.goto(`${BASE}/iniciar-sesion?next=/producto/conjunto-sastre-negro`, { waitUntil: "networkidle" });
      await pagePending.fill('input[name="email"]', pendingCompanyEmail);
      await pagePending.fill('input[name="password"]', sharedPass);
      await pagePending.click('button[type="submit"]');
      await pagePending.waitForURL((u) => u.pathname.includes("/producto/conjunto-sastre-negro"), { timeout: 15000 });

      await pagePending.click('button[role="radio"]:has-text("S")');
      await pagePending.click('button:has-text("Agregar a la bolsa")');
      await pagePending.waitForSelector('#cart-drawer-title', { timeout: 10000 });
      const drawerPending = await pagePending.innerText('div[role="dialog"]');
      assert(/Precio Minorista/i.test(drawerPending), "Empresa pendiente no debe recibir tarifa mayorista");

      await pagePending.goto(`${BASE}/mayorista/cotizaciones`, { waitUntil: "networkidle" });
      const pendQuoteText = await pagePending.innerText("main");
      assert(/Solicitud Empresarial en Evaluación/i.test(pendQuoteText), "Empresa pendiente pudo acceder al formulario de cotizaciones");
      return "Empresa pendiente restringida correctamente en servidor";
    });

    // ────────────────────────────────────────────────────────────────────────
    // 3. EMPRESA APROBADA (B2B): PRECIOS POR VOLUMEN MULTI-TALLA Y COTIZACIÓN
    // ────────────────────────────────────────────────────────────────────────
    const ctxB2BA = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageB2BA = await ctxB2BA.newPage();

    await check("5. Empresa Aprobada (B2B): precios escalonados por volumen combinando distintas tallas", async () => {
      await pageB2BA.goto(`${BASE}/iniciar-sesion?next=/producto/conjunto-sastre-negro`, { waitUntil: "networkidle" });
      await pageB2BA.fill('input[name="email"]', companyAEmail);
      await pageB2BA.fill('input[name="password"]', sharedPass);
      await pageB2BA.click('button[type="submit"]');
      await pageB2BA.waitForURL((u) => u.pathname.includes("/producto/conjunto-sastre-negro"), { timeout: 15000 });

      // El Blazer sastre entallado tiene precio retail S/ 349.00 y mayorista S/ 279.00 desde 12 uds.
      // Agregamos 7 unidades en talla S (stock 15) -> aún < 12, debe cobrar S/ 349.00
      await pageB2BA.click('button[role="radio"]:has-text("S")');
      await pageB2BA.fill('#product-quantity-input', "7");
      await pageB2BA.click('button:has-text("Agregar a la bolsa")');
      await pageB2BA.waitForSelector('#cart-drawer-title', { timeout: 10000 });

      // Cerramos el drawer y agregamos 5 unidades en talla M (stock 12) -> 7 + 5 = 12 unidades del modelo!
      await pageB2BA.keyboard.press("Escape");
      await pageB2BA.waitForTimeout(400);
      await pageB2BA.click('button[role="radio"]:has-text("M")');
      await pageB2BA.fill('#product-quantity-input', "5");
      await pageB2BA.click('button:has-text("Agregar a la bolsa")');
      await pageB2BA.waitForTimeout(800);

      await pageB2BA.goto(`${BASE}/carrito`, { waitUntil: "networkidle" });
      const cartB2BText = await pageB2BA.innerText("main");
      assert(/Tarifa mayorista B2B \(escala ≥ 12 uds\.\)/i.test(cartB2BText), "No se activó la escala mayorista al sumar 12 uds. entre tallas S y M");
      assert(/Descuento por volumen B2B/i.test(cartB2BText), "No muestra el descuento por volumen B2B en el resumen");
      // 12 uds * S/ 279.00 = S/ 3,348.00 (Ahorro: 12 * 70 = S/ 840.00)
      const totalB2B = await pageB2BA.innerText('[data-testid="cart-estimated-total"]');
      assert(/3,348|3348/.test(totalB2B), `Total mayorista inesperado: ${totalB2B}`);
      return "12 uds. (7 talla S + 5 talla M) activaron S/ 279.00/ud. → Total S/ 3,348.00";
    });

    await check("6. Solicitud de Cotización B2B: convertir bolsa en cotización y enviar al servidor", async () => {
      await pageB2BA.goto(`${BASE}/mayorista/cotizaciones?from=cart`, { waitUntil: "networkidle" });
      const builderText = await pageB2BA.innerText("main");
      assert(/BLZ-SASTRE-NEG-S/i.test(builderText) && /BLZ-SASTRE-NEG-M/i.test(builderText), "No se precargaron las variantes del carrito en el constructor de cotización");

      await pageB2BA.fill('textarea[name="commercialNeeds"]', "Solicitamos tarifa especial corporativa para lote de 12 blazers y entregas en nuestra sede de Ate.");
      await pageB2BA.fill('input[name="customerNotes"]', "Recepción de lunes a viernes de 9am a 5pm.");
      await pageB2BA.click('button[type="submit"]:has-text("Enviar solicitud de cotización B2B")');

      await pageB2BA.waitForSelector('text=Solicitud de Cotización Registrada', { timeout: 15000 });
      const confirmText = await pageB2BA.innerText("main");
      const match = confirmText.match(/COT-\d{4}-\d{6}/);
      assert(match, "No se generó el código único COT-YYYY-NNNNNN");
      quoteANumber = match[0];

      const [qRow] = await sql`SELECT id, status, requested_subtotal_amount FROM wholesale_quotes WHERE quote_number = ${quoteANumber}`;
      assert(qRow, "La cotización no se guardó en PostgreSQL");
      assert(qRow.status === "submitted", `Estado inicial incorrecto: ${qRow.status}`);
      quoteAId = qRow.id;
      return `Expediente ${quoteANumber} (ID #${quoteAId}) creado en estado submitted`;
    });

    // ────────────────────────────────────────────────────────────────────────
    // 4. AISLAMIENTO ENTRE EMPRESAS (IDOR B2B) Y PROTECCIÓN ADMIN
    // ────────────────────────────────────────────────────────────────────────
    const ctxB2BB = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageB2BB = await ctxB2BB.newPage();

    await check("7. Aislamiento B2B (IDOR) y RBAC: Empresa B no puede ver cotización de Empresa A ni entrar a /admin/cotizaciones", async () => {
      await pageB2BB.goto(`${BASE}/iniciar-sesion?next=/mayorista/cotizaciones`, { waitUntil: "networkidle" });
      await pageB2BB.fill('input[name="email"]', companyBEmail);
      await pageB2BB.fill('input[name="password"]', sharedPass);
      await pageB2BB.click('button[type="submit"]');
      await pageB2BB.waitForURL((u) => u.pathname.includes("/mayorista/cotizaciones"), { timeout: 15000 });

      const listBText = await pageB2BB.innerText("main");
      assert(!listBText.includes(quoteANumber), "Fuga de datos: Empresa B vio la cotización de Empresa A en su listado");

      // Intentar abrir directamente /mayorista/cotizaciones/[quoteAId]
      const resp = await pageB2BB.goto(`${BASE}/mayorista/cotizaciones/${quoteAId}`, { waitUntil: "networkidle" });
      const bodyIdor = await pageB2BB.innerText("body");
      assert(resp.status() === 404 || /404|no encontrada|no pudimos encontrar/i.test(bodyIdor), "Empresa B pudo acceder al detalle de cotización de Empresa A");

      // Intentar entrar a /admin/cotizaciones siendo Empresa B
      await pageB2BB.goto(`${BASE}/admin/cotizaciones`, { waitUntil: "networkidle" });
      assert(pageB2BB.url().includes("/cuenta"), `Empresa B no fue redirigida fuera de /admin/cotizaciones: ${pageB2BB.url()}`);
      return "Aislamiento total entre empresas y bloqueo de /admin/cotizaciones verificado";
    });

    // ────────────────────────────────────────────────────────────────────────
    // 5. GESTIÓN ADMINISTRATIVA DE COTIZACIÓN + INMUTABILIDAD + ACEPTACIÓN / VENCIMIENTO
    // ────────────────────────────────────────────────────────────────────────
    const ctxAdmin = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageAdmin = await ctxAdmin.newPage();

    await check("8. Panel Admin (/admin/cotizaciones): evaluar solicitud, fijar precios unitarios especiales, vigencia y auditar", async () => {
      await pageAdmin.goto(`${BASE}/iniciar-sesion?next=/admin/cotizaciones`, { waitUntil: "networkidle" });
      await pageAdmin.fill('input[name="email"]', adminEmail);
      await pageAdmin.fill('input[name="password"]', sharedPass);
      await pageAdmin.click('button[type="submit"]');
      await pageAdmin.waitForURL((u) => u.pathname.includes("/admin/cotizaciones"), { timeout: 15000 });

      const adminListText = await pageAdmin.innerText("main");
      assert(adminListText.includes(quoteANumber), "El administrador no ve la cotización enviada por Empresa A");

      await pageAdmin.goto(`${BASE}/admin/cotizaciones/${quoteAId}`, { waitUntil: "networkidle" });

      // Fijar precio unitario especial de S/ 255.00 para ambas líneas (7 + 5 = 12 uds * 255 = S/ 3,060.00)
      const priceInputs = await pageAdmin.$$('input[aria-label^="Precio unitario propuesto para"]');
      assert(priceInputs.length === 2, `Se esperaban 2 inputs de precio unitario, hay ${priceInputs.length}`);
      for (const inp of priceInputs) {
        await inp.fill("255.00");
      }

      await pageAdmin.selectOption('select[name="nextStatus"]', "quoted");
      await pageAdmin.fill('textarea[name="adminProposalNotes"]', "Aprobamos tarifa preferencial de S/ 255.00 por unidad para las 12 prendas solicitadas.");
      await pageAdmin.fill('textarea[name="internalNotes"]', "Cliente corporativo categoría A. Margen verificado.");
      await pageAdmin.click('button[type="submit"]');

      await pageAdmin.waitForSelector('text=actualizada correctamente', { timeout: 15000 });
      await pageAdmin.waitForTimeout(1000);

      const [updatedQ] = await sql`SELECT status, quoted_total_amount FROM wholesale_quotes WHERE id = ${quoteAId}`;
      assert(updatedQ.status === "quoted", `Estado en BD debería ser quoted, es ${updatedQ.status}`);
      assert(updatedQ.quoted_total_amount === 306000, `Total cotizado en BD debería ser 306000 céntimos, es ${updatedQ.quoted_total_amount}`);

      const auditRows = await sql`SELECT action, details FROM audit_logs WHERE target_type = 'wholesale_quote' AND target_id = ${quoteAId} AND action = 'quote_status_change'`;
      assert(auditRows.length > 0, "No se registró quote_status_change en audit_logs");
      return "Propuesta emitida por S/ 3,060.00 (S/ 255.00/ud.) con auditoría registrada";
    });

    await check("9. Caducidad y Aceptación de Cotización: bloqueo de cotización vencida y aceptación de cotización vigente", async () => {
      // 9.1 Simular que la cotización venció ayer en la BD e intentar abrirla con Empresa A
      await sql`UPDATE wholesale_quotes SET valid_until = NOW() - INTERVAL '1 day' WHERE id = ${quoteAId}`;

      await pageB2BA.goto(`${BASE}/mayorista/cotizaciones/${quoteAId}`, { waitUntil: "networkidle" });
      const expiredText = await pageB2BA.innerText("main");
      assert(/Propuesta Económica Vencida|Vencida/i.test(expiredText), "La cotización con fecha pasada no se marcó como Vencida");

      // Verificar que no aparece el botón de aceptar cuando está vencida
      const acceptBtnWhenExpired = await pageB2BA.$('button:has-text("Aceptar propuesta económica")');
      assert(!acceptBtnWhenExpired, "No debe permitir aceptar una cotización vencida");

      // 9.2 Restaurar vigencia futura (+7 días) y estado 'quoted' para probar la aceptación por Empresa A
      await sql`UPDATE wholesale_quotes SET status = 'quoted', valid_until = NOW() + INTERVAL '7 days' WHERE id = ${quoteAId}`;
      await pageB2BA.goto(`${BASE}/mayorista/cotizaciones/${quoteAId}`, { waitUntil: "networkidle" });

      const officialTotal = await pageB2BA.innerText('[data-testid="quote-official-total"]');
      assert(/3,060|3060/.test(officialTotal), `Empresa A no ve el total oficial cotizado S/ 3,060.00: ${officialTotal}`);

      await pageB2BA.fill('#decision-notes', "Aceptamos las condiciones y precios de S/ 255.00 por unidad.");
      await pageB2BA.click('button:has-text("Aceptar propuesta económica")');
      await pageB2BA.waitForTimeout(1500);

      const acceptedText = await pageB2BA.innerText("main");
      assert(/Propuesta Económica Aceptada por tu Empresa/i.test(acceptedText), "No se confirmó la aceptación de la cotización");

      const [finalQ] = await sql`SELECT status, decided_at FROM wholesale_quotes WHERE id = ${quoteAId}`;
      assert(finalQ.status === "accepted", `El estado final en BD debe ser accepted, es ${finalQ.status}`);
      assert(finalQ.decided_at !== null, "No se registró decided_at en la BD");

      // 9.3 Verificar que NO se filtró internalNotes al cliente Empresa A
      assert(!acceptedText.includes("Cliente corporativo categoría A"), "Fuga de nota interna confidencial en vista de cliente");

      // 9.4 Verificar que la aceptación NO descontó el stock real de las variantes (Fase 5)
      const [sVar] = await sql`SELECT stock FROM product_variants WHERE sku = 'BLZ-SASTRE-NEG-S'`;
      assert(sVar && sVar.stock === 15, `El stock de BLZ-SASTRE-NEG-S no debió descontarse en Fase 4 (esperado 15, actual ${sVar?.stock})`);

      // 9.5 Verificar inmutabilidad de la cotización aceptada en el panel administrativo
      await pageAdmin.goto(`${BASE}/admin/cotizaciones/${quoteAId}`, { waitUntil: "networkidle" });
      const adminAcceptedText = await pageAdmin.innerText("main");
      assert(/inmutables como respaldo de auditoría/i.test(adminAcceptedText), "El panel admin no muestra aviso de inmutabilidad en cotización aceptada");
      const isSubmitDisabled = await pageAdmin.$eval('form button[type="submit"]', (el) => el.disabled);
      assert(isSubmitDisabled, "El botón de envío admin debe estar deshabilitado para cotizaciones aceptadas inmutables");

      return "Vencimiento bloqueado, aceptación registrada, inmutabilidad activa, notas internas ocultas y stock intacto";
    });

    await check("10. Eliminar productos del carrito y estado vacío elegante", async () => {
      await pageB2C.goto(`${BASE}/carrito`, { waitUntil: "networkidle" });
      await pageB2C.waitForSelector('[data-testid="cart-line-remove-btn"]', { timeout: 10000 });
      await pageB2C.click('[data-testid="cart-line-remove-btn"]');
      await pageB2C.waitForTimeout(1200);
      const emptyText = await pageB2C.innerText("main");
      assert(/Tu bolsa está vacía/i.test(emptyText), "No mostró el estado vacío tras eliminar el producto");
      return "Eliminación de línea y estado vacío verificados";
    });

    await ctxB2C.close();
    await ctxPending.close();
    await ctxB2BA.close();
    await ctxB2BB.close();
    await ctxAdmin.close();
  } finally {
    await cleanupFixtures();
    await browser.close();
  }

  console.log("\n=== RESUMEN SUITE E2E FASE 4 ===");
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`Total: ${results.length} | Aprobadas: ${passed} | Fallidas: ${failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(async (err) => {
  await cleanupFixtures().catch(() => {});
  console.error("Error fatal en suite E2E Fase 4:", err);
  process.exit(1);
});

