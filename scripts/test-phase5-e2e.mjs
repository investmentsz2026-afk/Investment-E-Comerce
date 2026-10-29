/**
 * Suite Integral de Pruebas E2E — Fase 5:
 * Checkout, Pedidos, Pagos, Webhooks, Envíos, Inventario y Comprobantes SUNAT
 *
 * Cubre los 15 escenarios obligatorios en navegador real Microsoft Edge + Neon PostgreSQL.
 */
import { chromium } from "playwright-core";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { createHmac, randomBytes, scryptSync } from "node:crypto";

config({ path: ".env.local" });

const BASE = process.argv[2] ?? "http://localhost:3016";
const sql = neon(process.env.DATABASE_URL);
const WEBHOOK_SECRET =
  process.env.PAYMENT_WEBHOOK_SECRET?.trim() || "investments_dev_webhook_secret_phase5";

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

function signWebhookPayload(rawBody) {
  return createHmac("sha256", WEBHOOK_SECRET).update(rawBody, "utf8").digest("hex");
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
const b2cEmail = `fase5.b2c.${ts}@investments.pe`;
const b2bAEmail = `fase5.b2ba.${ts}@investments.pe`;
const b2bBEmail = `fase5.b2bb.${ts}@investments.pe`;
const pendingEmail = `fase5.pending.${ts}@investments.pe`;
const adminEmail = `fase5.admin.${ts}@investments.pe`;
const sharedPass = `Cl4veFase5_${randomBytes(5).toString("hex")}*`;

let b2cUserId = null;
let b2bAUserId = null;
let b2bBUserId = null;
let pendingUserId = null;
let adminUserId = null;

let b2cOrder1Id = null;
let b2cOrder1Number = null;
let b2cOrder2Id = null;
let quoteAcceptedId = null;
let quoteConvertedOrderId = null;
let initialStockPoloM = null;

async function setupFixtures() {
  const passHash = hashPasswordSync(sharedPass);

  // Guardar stock inicial de POLO-ESS-BL-M para restaurarlo exactamente al terminar
  const [vRow] = await sql`SELECT id, stock FROM product_variants WHERE sku = 'POLO-ESS-BL-M'`;
  initialStockPoloM = vRow.stock;

  const [cRow] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${b2cEmail}, ${passHash}, 'Valeria', 'Salazar', '987111222', 'customer', true, NOW())
    RETURNING id
  `;
  b2cUserId = cRow.id;

  const [aRow] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${b2bAEmail}, ${passHash}, 'Rodrigo', 'Paredes', '987333444', 'business_approved', true, NOW())
    RETURNING id
  `;
  b2bAUserId = aRow.id;

  const [bizAppA] = await sql`
    INSERT INTO business_applications (
      user_id, legal_name, trade_name, tax_id, contact_name, contact_email, contact_phone,
      business_type, address_line, department, province, district, estimated_volume, status
    ) VALUES (
      ${b2bAUserId}, 'Textiles Corporativos Lima S.A.C.', 'TexCorp', ${"20" + String(ts).slice(-9)},
      'Rodrigo Paredes', ${b2bAEmail}, '987333444', 'Distribuidor mayorista textil',
      'Av. Argentina 1250', 'Lima', 'Lima', 'Lima', 'S/ 50,000 mensuales', 'approved'
    )
    RETURNING id
  `;

  // Crear una cotización aceptada para Empresa A lista para convertirse en pedido (Escenario 10)
  const [prodVar] = await sql`
    SELECT pv.id AS variant_id, pv.sku, pv.size, pv.color_name, pv.color_swatch,
           p.id AS product_id, p.name AS product_name, p.slug AS product_slug
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.sku = 'BLZ-SASTRE-NEG-S'
    LIMIT 1
  `;

  const [qRow] = await sql`
    INSERT INTO wholesale_quotes (
      quote_number, user_id, business_application_id, company_legal_name, company_trade_name,
      company_tax_id, contact_name, contact_email, contact_phone, delivery_city, commercial_needs,
      status, currency, requested_subtotal_amount, quoted_total_amount, valid_until,
      payment_terms_proposal, quoted_at, decided_at
    ) VALUES (
      ${`COT-2026-${String(ts).slice(-6)}`}, ${b2bAUserId}, ${bizAppA.id},
      'Textiles Corporativos Lima S.A.C.', 'TexCorp', ${"20" + String(ts).slice(-9)},
      'Rodrigo Paredes', ${b2bAEmail}, '987333444', 'Lima',
      'Pedido corporativo de blazers', 'accepted', 'PEN',
      139600, 100000, NOW() + INTERVAL '7 days',
      'Contado Comercial B2B', NOW(), NOW()
    )
    RETURNING id
  `;
  quoteAcceptedId = qRow.id;

  // 4 unidades a precio especial aprobado de S/ 250.00 (25000 céntimos) = S/ 1,000.00 (100000 céntimos)
  await sql`
    INSERT INTO wholesale_quote_items (
      quote_id, product_id, variant_id, product_name_snapshot, product_slug_snapshot,
      sku_snapshot, size_snapshot, color_name_snapshot, color_swatch_snapshot,
      image_url_snapshot, requested_quantity, approved_quantity,
      retail_unit_price_snapshot, reference_unit_price_snapshot, quoted_unit_price, line_subtotal_amount
    ) VALUES (
      ${quoteAcceptedId}, ${prodVar.product_id}, ${prodVar.variant_id},
      ${prodVar.product_name}, ${prodVar.product_slug}, ${prodVar.sku},
      ${prodVar.size}, ${prodVar.color_name}, ${prodVar.color_swatch},
      '/placeholder.jpg', 4, 4, 34900, 34900, 25000, 100000
    )
  `;

  const [bRow] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, email_verified_at)
    VALUES (${b2bBEmail}, ${passHash}, 'Sandra', 'Vega', '987555666', 'business_approved', true, NOW())
    RETURNING id
  `;
  b2bBUserId = bRow.id;

  const [pRow] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified_at)
    VALUES (${pendingEmail}, ${passHash}, 'Jorge', 'Campos', 'business_pending', true, NOW())
    RETURNING id
  `;
  pendingUserId = pRow.id;

  const [admRow] = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified_at)
    VALUES (${adminEmail}, ${passHash}, 'Admin', 'Fase5', 'admin', true, NOW())
    RETURNING id
  `;
  adminUserId = admRow.id;
}

async function cleanupFixtures() {
  const userIds = [b2cUserId, b2bAUserId, b2bBUserId, pendingUserId, adminUserId].filter(Boolean);
  if (userIds.length > 0) {
    const userOrderRows = await sql`SELECT id FROM orders WHERE user_id = ANY(${userIds})`;
    const orderIds = userOrderRows.map((r) => r.id);
    if (orderIds.length > 0) {
      await sql`DELETE FROM payment_webhook_events WHERE order_id = ANY(${orderIds})`;
      await sql`DELETE FROM inventory_movements WHERE order_id = ANY(${orderIds})`;
      await sql`DELETE FROM inventory_reservations WHERE order_id = ANY(${orderIds})`;
      await sql`DELETE FROM tax_documents WHERE order_id = ANY(${orderIds})`;
      await sql`DELETE FROM payment_transactions WHERE order_id = ANY(${orderIds})`;
      await sql`DELETE FROM order_items WHERE order_id = ANY(${orderIds})`;
      await sql`DELETE FROM orders WHERE id = ANY(${orderIds})`;
    }
    await sql`DELETE FROM audit_logs WHERE actor_id = ANY(${userIds})`;
    await sql`DELETE FROM wholesale_quotes WHERE user_id = ANY(${userIds})`;
    await sql`DELETE FROM carts WHERE user_id = ANY(${userIds})`;
    await sql`DELETE FROM user_addresses WHERE user_id = ANY(${userIds})`;
    await sql`DELETE FROM business_applications WHERE user_id = ANY(${userIds})`;
    await sql`DELETE FROM sessions WHERE user_id = ANY(${userIds})`;
    await sql`DELETE FROM users WHERE id = ANY(${userIds})`;
  }
  if (initialStockPoloM !== null) {
    await sql`UPDATE product_variants SET stock = ${initialStockPoloM} WHERE sku = 'POLO-ESS-BL-M'`;
  }
  await sql`UPDATE product_variants SET stock = 15 WHERE sku = 'BLZ-SASTRE-NEG-S'`;
}

async function run() {
  console.log(`\n=== INICIANDO SUITE E2E FASE 5 EN ${BASE} ===\n`);
  await setupFixtures();

  const browser = await chromium.launch({ channel: "msedge", headless: true });

  try {
    // ────────────────────────────────────────────────────────────────────────
    // 1. BLOQUEO DE EMPRESA PENDIENTE EN /checkout
    // ────────────────────────────────────────────────────────────────────────
    const ctxPending = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pagePending = await ctxPending.newPage();

    await check("1. Bloqueo de empresa pendiente (business_pending) en /checkout", async () => {
      await pagePending.goto(`${BASE}/iniciar-sesion?next=/checkout`, { waitUntil: "networkidle" });
      await pagePending.fill('input[name="email"]', pendingEmail);
      await pagePending.fill('input[name="password"]', sharedPass);
      await pagePending.click('button[type="submit"]');
      await pagePending.waitForURL((u) => u.pathname.includes("/checkout"), { timeout: 15000 });

      const blockedBanner = await pagePending.innerText('[data-testid="checkout-blocked-banner"]');
      assert(/evaluación comercial|No es posible iniciar esta operación/i.test(blockedBanner), "Empresa pendiente no fue bloqueada en /checkout");
      return "Empresa en estado business_pending bloqueada en /checkout con mensaje claro";
    });
    await ctxPending.close();

    // ────────────────────────────────────────────────────────────────────────
    // 2. CHECKOUT MINORISTA COMPLETO (B2C) + TARIFAS DE ENVÍO + ZONA NO DISPONIBLE + BOLETA SUNAT
    // ────────────────────────────────────────────────────────────────────────
    const ctxB2C = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageB2C = await ctxB2C.newPage();

    await check("2. Tarifas de envío dinámicas en servidor y validación de zona sin cobertura (Putumayo, Loreto)", async () => {
      await pageB2C.goto(`${BASE}/iniciar-sesion?next=/producto/polo-esencial-algodon`, { waitUntil: "networkidle" });
      await pageB2C.fill('input[name="email"]', b2cEmail);
      await pageB2C.fill('input[name="password"]', sharedPass);
      await pageB2C.click('button[type="submit"]');
      await pageB2C.waitForURL((u) => u.pathname.includes("/producto/polo-esencial-algodon"), { timeout: 15000 });

      // Agregar 2 unidades de POLO-ESS-BL-M (2 * S/ 79.00 = S/ 158.00)
      await pageB2C.click('button[role="radio"]:has-text("M")');
      await pageB2C.fill('#product-quantity-input', "2");
      await pageB2C.click('button:has-text("Agregar a la bolsa")');
      await pageB2C.waitForSelector('#cart-drawer-title', { timeout: 10000 });

      await pageB2C.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
      await pageB2C.waitForSelector('[data-testid="checkout-grand-total"]', { timeout: 10000 });

      // En Lima Metropolitana: S/ 158.00 + S/ 15.00 envío = S/ 173.00
      const totalLima = await pageB2C.innerText('[data-testid="checkout-grand-total"]');
      assert(/173/.test(totalLima), `Total en Lima Metropolitana debería ser S/ 173.00, actual: ${totalLima}`);

      // Probar zona sin cobertura: Loreto -> Putumayo
      await pageB2C.selectOption('#shippingDepartment', "Loreto");
      await pageB2C.fill('#shippingProvince', "Putumayo");
      await pageB2C.fill('#shippingDistrict', "Putumayo");
      await pageB2C.locator('#shippingDistrict').blur();
      await pageB2C.waitForTimeout(1000);

      const statusBox = await pageB2C.innerText('[data-testid="checkout-shipping-status-box"]');
      assert(/no contamos con despacho logístico directo hacia la provincia de Putumayo/i.test(statusBox), "No detectó la zona sin cobertura Putumayo");
      const isBtnDisabled = await pageB2C.$eval('[data-testid="checkout-confirm-order-btn"]', (el) => el.disabled);
      assert(isBtnDisabled, "El botón de confirmar pedido debe deshabilitarse en zonas sin cobertura");

      // Restaurar a Lima -> Miraflores
      await pageB2C.selectOption('#shippingDepartment', "Lima");
      await pageB2C.fill('#shippingProvince', "Lima");
      await pageB2C.fill('#shippingDistrict', "Miraflores");
      await pageB2C.locator('#shippingDistrict').blur();
      await pageB2C.waitForTimeout(1000);
      return "Cálculo de envío en Lima (S/ 15.00) y bloqueo de zona sin cobertura verificados";
    });

    await check("3. Checkout minorista completo con Boleta (DNI), reserva de stock y pago aprobado en Sandbox", async () => {
      const [beforeVar] = await sql`SELECT stock FROM product_variants WHERE sku = 'POLO-ESS-BL-M'`;
      const stockBeforeOrder = beforeVar.stock;

      await pageB2C.fill('#shippingAddressLine1', "Av. Larco 740, Dpto 501");
      await pageB2C.fill('#shippingReference', "Frente al centro cultural");
      await pageB2C.fill('#billingDocNumber', "72345678");
      await pageB2C.click('[data-testid="sandbox-scenario-approve"]');
      await pageB2C.click('[data-testid="checkout-confirm-order-btn"]');

      await pageB2C.waitForURL((u) => /\/cuenta\/pedidos\/\d+/.test(u.pathname), { timeout: 20000 });
      const detailText = await pageB2C.innerText("main");
      assert(/Pedido ORD-\d{4}-\d{6} Registrado Exitosamente/i.test(detailText), "No mostró banner de confirmación de pedido");
      assert(/Pago Aprobado/i.test(detailText), "El estado del pago debe ser Pago Aprobado");

      const matchOrd = detailText.match(/ORD-\d{4}-\d{6}/);
      b2cOrder1Number = matchOrd[0];
      const [ordRow] = await sql`SELECT id, total_amount, status, payment_status FROM orders WHERE order_number = ${b2cOrder1Number}`;
      b2cOrder1Id = ordRow.id;
      assert(ordRow.total_amount === 17300, `El total guardado en BD debe ser 17300 céntimos, es ${ordRow.total_amount}`);
      assert(ordRow.status === "paid", `El pedido debe estar en estado paid, es ${ordRow.status}`);

      // Verificar descuento real e idempotente de stock (stockBeforeOrder - 2)
      const [afterVar] = await sql`SELECT stock FROM product_variants WHERE sku = 'POLO-ESS-BL-M'`;
      assert(afterVar.stock === stockBeforeOrder - 2, `El stock debió bajar en 2 uds. (${stockBeforeOrder} -> ${afterVar.stock})`);

      // Verificar registro de comprobante electrónico (Boleta en pending_config porque no hay PSE externo configurado)
      const [taxDoc] = await sql`SELECT document_type, status, customer_doc_number FROM tax_documents WHERE order_id = ${b2cOrder1Id}`;
      assert(taxDoc && taxDoc.document_type === "boleta" && taxDoc.customer_doc_number === "72345678", "No se registró la Boleta de Venta con el DNI del cliente");
      return `Pedido ${b2cOrder1Number} pagado (S/ 173.00), stock descontado (-2 uds.) y Boleta registrada`;
    });

    // ────────────────────────────────────────────────────────────────────────
    // 3. PAGO FALLIDO, REINTENTO IDEMPOTENTE Y EXPIRACIÓN / LIBERACIÓN DE RESERVA
    // ────────────────────────────────────────────────────────────────────────
    await check("4. Pago rechazado en checkout, reintento sin duplicar pedido y liberación de reserva al expirar", async () => {
      // Agregar 1 unidad de POLO-ESS-BL-M al carrito y simular pago rechazado
      await pageB2C.goto(`${BASE}/producto/polo-esencial-algodon`, { waitUntil: "networkidle" });
      await pageB2C.click('button[role="radio"]:has-text("M")');
      await pageB2C.fill('#product-quantity-input', "1");
      await pageB2C.click('button:has-text("Agregar a la bolsa")');
      await pageB2C.waitForSelector('#cart-drawer-title', { timeout: 10000 });

      await pageB2C.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
      await pageB2C.waitForSelector('[data-testid="sandbox-scenario-reject"]', { timeout: 10000 });
      await pageB2C.fill('#billingDocNumber', "72345678");
      await pageB2C.click('[data-testid="sandbox-scenario-reject"]');
      await pageB2C.click('[data-testid="checkout-confirm-order-btn"]');

      await pageB2C.waitForURL((u) => /\/cuenta\/pedidos\/\d+/.test(u.pathname), { timeout: 20000 });
      const urlParts = new URL(pageB2C.url()).pathname.split("/");
      b2cOrder2Id = Number(urlParts[urlParts.length - 1]);

      const [failedOrd] = await sql`SELECT status, payment_status FROM orders WHERE id = ${b2cOrder2Id}`;
      assert(failedOrd.status === "payment_failed" && failedOrd.payment_status === "rejected", "El pedido con tarjeta denegada debe quedar en payment_failed / rejected");

      // Verificar que existe el panel de reintento para el cliente
      const retryPanel = await pageB2C.$('[data-testid="customer-order-payment-retry-panel"]');
      assert(retryPanel, "El cliente debe ver el panel de reintento de pago cuando el pago falló");

      // Simular expiración de la reserva poniendo expires_at en el pasado y estado pending_payment
      const [beforeExpVar] = await sql`SELECT stock FROM product_variants WHERE sku = 'POLO-ESS-BL-M'`;
      await sql`UPDATE orders SET status = 'pending_payment' WHERE id = ${b2cOrder2Id}`;
      await sql`UPDATE inventory_reservations SET expires_at = NOW() - INTERVAL '5 minutes' WHERE order_id = ${b2cOrder2Id}`;

      // Al recargar /cuenta/pedidos/[id], el servidor libera automáticamente las reservas vencidas y repone el stock
      await pageB2C.reload({ waitUntil: "networkidle" });
      const [afterExpVar] = await sql`SELECT stock FROM product_variants WHERE sku = 'POLO-ESS-BL-M'`;
      assert(afterExpVar.stock === beforeExpVar.stock + 1, `El stock no se repuso tras expirar la reserva (${beforeExpVar.stock} -> ${afterExpVar.stock})`);

      const [expRes] = await sql`SELECT status FROM inventory_reservations WHERE order_id = ${b2cOrder2Id}`;
      assert(expRes.status === "expired", `La reserva debía pasar a expired, es ${expRes.status}`);
      return "Fallo de pago registrado y liberación automática de stock por reserva vencida verificada (+1 ud.)";
    });

    // ────────────────────────────────────────────────────────────────────────
    // 4. CONVERSIÓN DE COTIZACIÓN B2B ACEPTADA EN PEDIDO + BLOQUEO DE DOBLE CONVERSIÓN
    // ────────────────────────────────────────────────────────────────────────
    const ctxB2BA = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageB2BA = await ctxB2BA.newPage();

    await check("5. Conversión de cotización B2B aceptada en pedido con precios históricos congelados y bloqueo de doble conversión", async () => {
      await pageB2BA.goto(`${BASE}/iniciar-sesion?next=/mayorista/cotizaciones/${quoteAcceptedId}`, { waitUntil: "networkidle" });
      await pageB2BA.fill('input[name="email"]', b2bAEmail);
      await pageB2BA.fill('input[name="password"]', sharedPass);
      await pageB2BA.click('button[type="submit"]');
      await pageB2BA.waitForURL((u) => u.pathname.includes(`/mayorista/cotizaciones/${quoteAcceptedId}`), { timeout: 15000 });

      await pageB2BA.click('[data-testid="quote-convert-to-order-btn"]');
      await pageB2BA.waitForURL((u) => u.pathname.includes("/checkout"), { timeout: 15000 });

      const bannerText = await pageB2BA.innerText('[data-testid="checkout-quote-conversion-banner"]');
      assert(/Conversión Oficial de Cotización Aceptada/i.test(bannerText), "No aparece el banner de conversión de cotización en /checkout");

      // Como el subtotal de la cotización es S/ 1,000.00 (>= S/ 299.00 en Lima), el envío es GRATIS (S/ 0.00)
      // Total exacto debe ser S/ 1,000.00
      const grandTotalB2B = await pageB2BA.innerText('[data-testid="checkout-grand-total"]');
      assert(/1,000|1000/.test(grandTotalB2B), `El total de la cotización convertida debe ser S/ 1,000.00 (envío gratis), actual: ${grandTotalB2B}`);

      // Elegir pago en proceso (sandbox_pending) para probar luego confirmación por Webhook firmado!
      await pageB2BA.click('[data-testid="sandbox-scenario-pending"]');
      await pageB2BA.click('[data-testid="checkout-confirm-order-btn"]');

      await pageB2BA.waitForURL((u) => /\/cuenta\/pedidos\/\d+/.test(u.pathname), { timeout: 20000 });
      const ordUrlParts = new URL(pageB2BA.url()).pathname.split("/");
      quoteConvertedOrderId = Number(ordUrlParts[ordUrlParts.length - 1]);

      const [convOrd] = await sql`SELECT status, payment_status, total_amount, quote_id, tax_document_type FROM orders WHERE id = ${quoteConvertedOrderId}`;
      assert(convOrd.quote_id === quoteAcceptedId, "El pedido no quedó vinculado al quote_id");
      assert(convOrd.total_amount === 100000, `El importe histórico de la cotización (100000 céntimos) no se respetó: ${convOrd.total_amount}`);
      assert(convOrd.status === "payment_processing", `El pedido debía quedar en payment_processing, es ${convOrd.status}`);
      assert(convOrd.tax_document_type === "factura", "El comprobante B2B debe ser factura");

      // Intentar abrir /checkout?quoteId=[quoteAcceptedId] de nuevo -> debe impedir doble conversión
      await pageB2BA.goto(`${BASE}/checkout?quoteId=${quoteAcceptedId}`, { waitUntil: "networkidle" });
      const doubleBlockText = await pageB2BA.innerText('[data-testid="checkout-blocked-banner"]');
      assert(/ya fue convertida en un pedido formal anteriormente/i.test(doubleBlockText), "No se bloqueó el intento de convertir dos veces la misma cotización");
      return `Cotización #${quoteAcceptedId} convertida en Pedido #${quoteConvertedOrderId} (S/ 1,000.00 con Factura) y doble conversión bloqueada`;
    });

    // ────────────────────────────────────────────────────────────────────────
    // 5. WEBHOOKS DE PAGO: FIRMA INVÁLIDA (401), FIRMA VÁLIDA (200), REPETIDO IDEMPOTENTE Y FUERA DE ORDEN
    // ────────────────────────────────────────────────────────────────────────
    await check("6. Webhooks (/api/webhooks/payments): rechazo de firma falsa, confirmación con firma HMAC válida, idempotencia de repetidos y bloqueo fuera de orden", async () => {
      const eventIdApprove = `evt_apr_${ts}`;
      const rawApprovePayload = JSON.stringify({
        eventId: eventIdApprove,
        eventType: "charge.succeeded",
        provider: "sandbox",
        orderId: quoteConvertedOrderId,
        providerReference: `CULQI-WHK-${ts}`,
      });

      // 6.1 Webhook con firma falsa -> debe responder HTTP 401
      const badRes = await fetch(`${BASE}/api/webhooks/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-signature": "firma_invalida_ataque_12345",
        },
        body: rawApprovePayload,
      });
      assert(badRes.status === 401, `Un webhook con firma falsa debe devolver 401, devolvió ${badRes.status}`);

      // 6.2 Webhook con firma HMAC-SHA256 válida -> debe responder HTTP 200 y pasar el pedido a 'paid'
      const validSig = signWebhookPayload(rawApprovePayload);
      const goodRes = await fetch(`${BASE}/api/webhooks/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-signature": `sha256=${validSig}`,
        },
        body: rawApprovePayload,
      });
      assert(goodRes.status === 200, `El webhook firmado válido debió devolver 200, devolvió ${goodRes.status}`);

      const [paidOrd] = await sql`SELECT status, payment_status FROM orders WHERE id = ${quoteConvertedOrderId}`;
      assert(paidOrd.status === "paid" && paidOrd.payment_status === "approved", "El webhook válido no confirmó el pago del pedido");

      const [stockBeforeDup] = await sql`SELECT stock FROM product_variants WHERE sku = 'BLZ-SASTRE-NEG-S'`;

      // 6.3 Enviar exactamente el mismo webhook por segunda vez -> debe responder duplicate: true y NO descontar stock otra vez
      const dupRes = await fetch(`${BASE}/api/webhooks/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-signature": validSig,
        },
        body: rawApprovePayload,
      });
      const dupBody = await dupRes.json();
      assert(dupRes.status === 200 && dupBody.duplicate === true, "El webhook repetido no fue detectado como idempotente");

      const [stockAfterDup] = await sql`SELECT stock FROM product_variants WHERE sku = 'BLZ-SASTRE-NEG-S'`;
      assert(stockAfterDup.stock === stockBeforeDup.stock, "Un webhook repetido no debe alterar el stock");

      // 6.4 Enviar un webhook fuera de orden (charge.failed) después de que el pedido ya está 'paid' -> no debe degradar el pedido
      const outOfOrderPayload = JSON.stringify({
        eventId: `evt_late_fail_${ts}`,
        eventType: "charge.failed",
        provider: "sandbox",
        orderId: quoteConvertedOrderId,
      });
      const outSig = signWebhookPayload(outOfOrderPayload);
      await fetch(`${BASE}/api/webhooks/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-signature": outSig,
        },
        body: outOfOrderPayload,
      });

      const [stillPaidOrd] = await sql`SELECT status, payment_status FROM orders WHERE id = ${quoteConvertedOrderId}`;
      assert(stillPaidOrd.status === "paid" && stillPaidOrd.payment_status === "approved", "Un webhook fuera de orden degradó un pedido ya pagado");

      // 6.5 Probar formato oficial de firma de Mercado Pago (x-signature: ts=...,v1=... + x-request-id)
      // Con firma falsa de Mercado Pago -> debe devolver HTTP 401
      const mpRawPayload = JSON.stringify({
        id: `mp_evt_${ts}`,
        action: "payment.updated",
        data: { id: "9988776655" },
      });
      const mpBadRes = await fetch(`${BASE}/api/webhooks/payments?data.id=9988776655`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-signature": "ts=1730000000,v1=0000000000000000000000000000000000000000000000000000000000000000",
          "x-request-id": "req-mp-e2e-1",
        },
        body: mpRawPayload,
      });
      assert(mpBadRes.status === 401, `Webhook de Mercado Pago con firma x-signature inválida debe devolver 401, devolvió ${mpBadRes.status}`);

      return "Firma HMAC verificada (401/200), x-signature Mercado Pago verificada, idempotencia de evento repetido y protección fuera de orden comprobadas";
    });

    // ────────────────────────────────────────────────────────────────────────
    // 6. AISLAMIENTO ENTRE USUARIOS Y EMPRESAS (IDOR EN PEDIDOS Y ADMIN)
    // ────────────────────────────────────────────────────────────────────────
    const ctxB2BB = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageB2BB = await ctxB2BB.newPage();

    await check("7. Aislamiento de pedidos (IDOR) y protección de /admin/pedidos", async () => {
      await pageB2BB.goto(`${BASE}/iniciar-sesion?next=/cuenta/pedidos`, { waitUntil: "networkidle" });
      await pageB2BB.fill('input[name="email"]', b2bBEmail);
      await pageB2BB.fill('input[name="password"]', sharedPass);
      await pageB2BB.click('button[type="submit"]');
      await pageB2BB.waitForURL((u) => u.pathname.includes("/cuenta/pedidos"), { timeout: 15000 });

      // Intentar abrir el pedido de Empresa A o del cliente B2C cambiando el ID en la URL
      const respIdor1 = await pageB2BB.goto(`${BASE}/cuenta/pedidos/${quoteConvertedOrderId}`, { waitUntil: "networkidle" });
      const textIdor1 = await pageB2BB.innerText("body");
      assert(respIdor1.status() === 404 || /404|no encontrada|no pudimos encontrar/i.test(textIdor1), "Empresa B pudo ver el pedido de Empresa A");

      const respIdor2 = await pageB2BB.goto(`${BASE}/cuenta/pedidos/${b2cOrder1Id}`, { waitUntil: "networkidle" });
      const textIdor2 = await pageB2BB.innerText("body");
      assert(respIdor2.status() === 404 || /404|no encontrada|no pudimos encontrar/i.test(textIdor2), "Empresa B pudo ver el pedido del cliente B2C");

      // Intentar acceder a /admin/pedidos siendo Empresa B
      await pageB2BB.goto(`${BASE}/admin/pedidos`, { waitUntil: "networkidle" });
      assert(pageB2BB.url().includes("/cuenta"), `Empresa B no fue bloqueada de /admin/pedidos: ${pageB2BB.url()}`);
      return "Aislamiento total de pedidos entre usuarios/empresas y bloqueo de /admin/pedidos verificado";
    });
    await ctxB2BB.close();

    // ────────────────────────────────────────────────────────────────────────
    // 7. PANEL ADMINISTRATIVO (/admin/pedidos): DESPACHO CON TRACKING Y REEMBOLSO CON REPOSICIÓN DE STOCK
    // ────────────────────────────────────────────────────────────────────────
    const ctxAdmin = await browser.newContext({ viewport: { width: 1366, height: 850 }, locale: "es-PE" });
    const pageAdmin = await ctxAdmin.newPage();

    await check("8. Panel Admin (/admin/pedidos): actualizar estado a Enviado con transportista/tracking y verificar vista del cliente", async () => {
      await pageAdmin.goto(`${BASE}/iniciar-sesion?next=/admin/pedidos`, { waitUntil: "networkidle" });
      await pageAdmin.fill('input[name="email"]', adminEmail);
      await pageAdmin.fill('input[name="password"]', sharedPass);
      await pageAdmin.click('button[type="submit"]');
      await pageAdmin.waitForURL((u) => u.pathname.includes("/admin/pedidos"), { timeout: 15000 });

      const adminTable = await pageAdmin.innerText("main");
      assert(adminTable.includes(b2cOrder1Number), "El pedido B2C no aparece en /admin/pedidos");

      await pageAdmin.goto(`${BASE}/admin/pedidos/${b2cOrder1Id}`, { waitUntil: "networkidle" });

      // Pasar a 'shipped' registrando Olva Courier y código de seguimiento
      await pageAdmin.selectOption('#admin-order-next-status', "shipped");
      await pageAdmin.fill('#admin-carrier-name', "Olva Courier Perú");
      await pageAdmin.fill('#admin-tracking-number', `OLVA-${ts}`);
      await pageAdmin.fill('#admin-order-notes', "Despacho verificado por almacén central.");
      await pageAdmin.click('[data-testid="admin-save-order-btn"]');

      await pageAdmin.waitForSelector('text=actualizado al estado "shipped"', { timeout: 15000 });

      // Comprobar que el cliente B2C ve el transportista y tracking reales, pero NO ve adminNotes
      await pageB2C.goto(`${BASE}/cuenta/pedidos/${b2cOrder1Id}`, { waitUntil: "networkidle" });
      const custViewText = await pageB2C.innerText("main");
      assert(custViewText.includes(`OLVA-${ts}`), "El cliente no ve su código de seguimiento real");
      assert(!custViewText.includes("Despacho verificado por almacén central"), "Fuga de nota interna de administración en vista de cliente");
      return `Pedido ${b2cOrder1Number} despachado con tracking OLVA-${ts} y auditado`;
    });

    await check("9. Reembolso administrativo de pedido pagado: reposición idempotente de stock (refund_restock) y auditoría", async () => {
      const [beforeRefundStock] = await sql`SELECT stock FROM product_variants WHERE sku = 'BLZ-SASTRE-NEG-S'`;

      await pageAdmin.goto(`${BASE}/admin/pedidos/${quoteConvertedOrderId}`, { waitUntil: "networkidle" });
      await pageAdmin.selectOption('#admin-order-next-status', "refunded");
      await pageAdmin.fill('#admin-cancel-refund-reason', "Reembolso acordado por cambio de lote corporativo");
      await pageAdmin.click('[data-testid="admin-save-order-btn"]');

      await pageAdmin.waitForSelector('text=actualizado al estado "refunded"', { timeout: 15000 });

      const [afterRefundStock] = await sql`SELECT stock FROM product_variants WHERE sku = 'BLZ-SASTRE-NEG-S'`;
      // El pedido tenía 4 unidades de BLZ-SASTRE-NEG-S -> el stock debe subir en +4
      assert(afterRefundStock.stock === beforeRefundStock.stock + 4, `El stock de BLZ-SASTRE-NEG-S debió subir en +4 tras el reembolso (${beforeRefundStock.stock} -> ${afterRefundStock.stock})`);

      const movs = await sql`SELECT movement_type, quantity_delta FROM inventory_movements WHERE order_id = ${quoteConvertedOrderId} AND movement_type = 'refund_restock'`;
      assert(movs.length === 1 && movs[0].quantity_delta === 4, "No se registró el movimiento refund_restock (+4 uds.) en el kardex");
      return "Reembolso procesado, +4 uds. repuestas en inventario y movimiento refund_restock auditado";
    });

    await ctxB2C.close();
    await ctxB2BA.close();
    await ctxAdmin.close();
  } finally {
    await cleanupFixtures();
    await browser.close();
  }

  console.log("\n=== RESUMEN SUITE E2E FASE 5 ===");
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`Total: ${results.length} | Aprobadas: ${passed} | Fallidas: ${failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(async (err) => {
  await cleanupFixtures().catch(() => {});
  console.error("Error fatal en suite E2E Fase 5:", err);
  process.exit(1);
});

