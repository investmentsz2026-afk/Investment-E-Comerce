import test from "node:test";
import assert from "node:assert/strict";
import nextConfig from "../next.config";
import {
  calculateLinePricing,
  isUserAuthorizedForWholesale,
  type PriceTierInput,
} from "../src/server/pricing/engine";
import {
  validateRucFormat,
  validatePhone,
  validateEmail,
  validatePassword,
  validateName,
} from "../src/server/auth/validators";
import {
  computeWebhookHmacSignature,
  verifyWebhookSignature,
  validateMercadoPagoEnvironmentConsistency,
} from "../src/server/payments/gateway";
import {
  calculatePeruIgvBreakdown,
  validateBillingInput,
} from "../src/server/tax/sunat-service";
import { validateAdminInventoryAdjustmentInput } from "../src/server/inventory/service";
import { checkRateLimit, recordFailedAttempt } from "../src/server/auth/rate-limit";

test("Fase 7.1 — Cabeceras de seguridad y configuración de Next.js", async () => {
  assert.equal(nextConfig.poweredByHeader, false, "poweredByHeader debe estar desactivado para evitar fugas de tecnología");
  assert.equal(nextConfig.reactStrictMode, true, "reactStrictMode debe estar activo");

  // Headers de seguridad
  const headersFn = nextConfig.headers;
  assert.ok(typeof headersFn === "function", "headers() debe estar definido");
  const headerRules = await headersFn();
  assert.ok(Array.isArray(headerRules), "headers() debe retornar un arreglo de reglas");

  const globalRule = headerRules.find((r) => r.source === "/:path*");
  assert.ok(globalRule, "Debe existir una regla global para /:path*");

  const headerMap = new Map(globalRule.headers.map((h) => [h.key, h.value]));
  assert.equal(headerMap.get("X-Frame-Options"), "DENY", "X-Frame-Options debe ser DENY");
  assert.equal(headerMap.get("X-Content-Type-Options"), "nosniff", "X-Content-Type-Options debe ser nosniff");
  assert.equal(headerMap.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.ok(headerMap.has("Strict-Transport-Security"), "HSTS debe estar configurado");
  assert.ok(headerMap.has("Content-Security-Policy"), "CSP debe estar configurada en Fase 7");

  const csp = headerMap.get("Content-Security-Policy") || "";
  assert.ok(csp.includes("frame-ancestors 'none'"), "CSP debe bloquear framing (clickjacking)");
  assert.ok(csp.includes("default-src 'self'"), "CSP debe limitar default-src a self");

  // Remote patterns para imágenes
  const remotePatterns = nextConfig.images?.remotePatterns;
  assert.ok(Array.isArray(remotePatterns), "remotePatterns debe ser un arreglo");
  const hostnames = remotePatterns.map((p) => p.hostname);
  assert.ok(hostnames.includes("images.unsplash.com"), "Debe permitir images.unsplash.com");
  assert.ok(hostnames.includes("res.cloudinary.com"), "Debe permitir res.cloudinary.com");
});

test("Fase 7.2 — Autorización y roles: aislamiento estricto B2B vs B2C", () => {
  // Clientes minoristas no tienen acceso a precios ni flujos mayoristas
  assert.equal(isUserAuthorizedForWholesale(null), false);
  assert.equal(isUserAuthorizedForWholesale(undefined), false);

  const customerUser = {
    id: 1,
    role: "customer" as const,
    isActive: true,
  };
  assert.equal(isUserAuthorizedForWholesale(customerUser), false);

  // Empresas pendientes aún no tienen acceso comercial mayorista
  const pendingUser = {
    id: 2,
    role: "business_pending" as const,
    isActive: true,
  };
  assert.equal(isUserAuthorizedForWholesale(pendingUser), false);

  // Empresas suspendidas (isActive = false) quedan revocadas de inmediato
  const suspendedUser = {
    id: 3,
    role: "business_approved" as const,
    isActive: false,
  };
  assert.equal(isUserAuthorizedForWholesale(suspendedUser), false);

  // Empresas aprobadas y activas tienen acceso
  const approvedUser = {
    id: 4,
    role: "business_approved" as const,
    isActive: true,
  };
  assert.equal(isUserAuthorizedForWholesale(approvedUser), true);

  // Administrador activo tiene acceso
  const adminUser = {
    id: 5,
    role: "admin" as const,
    isActive: true,
  };
  assert.equal(isUserAuthorizedForWholesale(adminUser), true);
});

test("Fase 7.3 — Cálculo de precios en servidor: protección contra manipulación de precios mayoristas", () => {
  const tiers: PriceTierInput[] = [
    { type: "retail", amount: 15000, compareAtAmount: 18000, minQuantity: 1 },
    { type: "wholesale", amount: 11000, minQuantity: 6, maxQuantity: 11 },
    { type: "wholesale", amount: 9500, minQuantity: 12, maxQuantity: null },
  ];

  const customerUser = { id: 1, role: "customer" as const, isActive: true };
  const approvedWholesaleUser = { id: 2, role: "business_approved" as const, isActive: true };

  // Minorista pidiendo 12 unidades: NO accede a precio mayorista (recibe minorista)
  const retailCalculation = calculateLinePricing({
    prices: tiers,
    quantity: 12,
    productGroupQuantity: 12,
    isProductWholesaleEnabled: true,
    user: customerUser,
  });
  assert.equal(retailCalculation.appliedMode, "retail");
  assert.equal(retailCalculation.effectiveUnitAmount, 15000);
  assert.equal(retailCalculation.lineSubtotalAmount, 180000);

  // Mayorista aprobado pidiendo 12 unidades: accede a escala por volumen 12+ (95 soles)
  const wholesaleCalculation = calculateLinePricing({
    prices: tiers,
    quantity: 12,
    productGroupQuantity: 12,
    isProductWholesaleEnabled: true,
    user: approvedWholesaleUser,
  });
  assert.equal(wholesaleCalculation.appliedMode, "wholesale");
  assert.equal(wholesaleCalculation.effectiveUnitAmount, 9500);
  assert.equal(wholesaleCalculation.lineSubtotalAmount, 114000);
  assert.equal(wholesaleCalculation.lineSavingsAmount, 66000); // Ahorra 660 soles respecto a minorista

  // Producto sin venta mayorista habilitada: siempre aplica minorista incluso a usuario mayorista
  const nonWholesaleProd = calculateLinePricing({
    prices: tiers,
    quantity: 12,
    productGroupQuantity: 12,
    isProductWholesaleEnabled: false,
    user: approvedWholesaleUser,
  });
  assert.equal(nonWholesaleProd.appliedMode, "retail");
  assert.equal(nonWholesaleProd.effectiveUnitAmount, 15000);
});

test("Fase 7.4 — Webhook HMAC y seguridad contra falsificación de pagos", () => {
  const payload = JSON.stringify({
    eventId: "evt_test_sec_001",
    eventType: "payment.approved",
    orderId: 99,
    amount: 15000,
  });
  const secret = "super_secure_production_webhook_secret_phase7";

  const signature = computeWebhookHmacSignature(payload, secret);
  assert.ok(signature.length === 64, "La firma HMAC-SHA256 debe tener 64 caracteres hexadecimales");

  // Firma correcta es aceptada
  assert.equal(verifyWebhookSignature(payload, signature, secret), true);
  assert.equal(verifyWebhookSignature(payload, `sha256=${signature}`, secret), true);

  // Firma alterada o payload alterado es rechazada tajantemente
  assert.equal(verifyWebhookSignature(payload + "tampered", signature, secret), false);
  assert.equal(verifyWebhookSignature(payload, "0".repeat(64), secret), false);
  assert.equal(verifyWebhookSignature(payload, signature, "wrong_secret"), false);
  assert.equal(verifyWebhookSignature(payload, null, secret), false);
  assert.equal(verifyWebhookSignature(payload, "", secret), false);
});

test("Fase 7.5 — Consistencia de entorno Mercado Pago: rechaza credenciales TEST- en producción", () => {
  // En producción, token de prueba (TEST-...) debe ser rechazado
  const prodWithTestKey = validateMercadoPagoEnvironmentConsistency({
    environment: "production",
    accessToken: "TEST-1234567890123456-abcdef-1234567890",
    publicKey: "TEST-abcdef-1234",
  });
  assert.equal(prodWithTestKey.valid, false);
  assert.ok(prodWithTestKey.error?.includes("Seguridad de producción"));

  // En sandbox, token de prueba es válido
  const sandboxWithTestKey = validateMercadoPagoEnvironmentConsistency({
    environment: "sandbox",
    accessToken: "TEST-1234567890123456-abcdef-1234567890",
    publicKey: "TEST-abcdef-1234",
  });
  assert.equal(sandboxWithTestKey.valid, true);

  // Token ausente es rechazado
  const missingToken = validateMercadoPagoEnvironmentConsistency({
    environment: "sandbox",
    accessToken: "",
  });
  assert.equal(missingToken.valid, false);
});

test("Fase 7.6 — SUNAT e IGV peruano: desglose exacto y validación de comprobante tributario", () => {
  // Desglose de S/ 118.00 -> Base: S/ 100.00 (10000 céntimos), IGV: S/ 18.00 (1800 céntimos)
  const breakdown118 = calculatePeruIgvBreakdown(11800);
  assert.equal(breakdown118.totalAmount, 11800);
  assert.equal(breakdown118.taxableBaseAmount, 10000);
  assert.equal(breakdown118.igvAmount, 1800);
  assert.equal(breakdown118.taxableBaseAmount + breakdown118.igvAmount, breakdown118.totalAmount);

  // Validación de comprobante: Factura exige RUC válido de 11 dígitos y razón social
  const facturaValida = validateBillingInput({
    documentType: "factura",
    customerDocType: "RUC",
    customerDocNumber: "20601234567",
    customerLegalName: "CORPORACION TEXTIL LIMA S.A.C.",
    customerFiscalAddress: "Av. Gamarra 456, La Victoria, Lima",
  });
  assert.equal(facturaValida.valid, true);

  // Factura con DNI debe ser rechazada
  const facturaConDni = validateBillingInput({
    documentType: "factura",
    customerDocType: "DNI",
    customerDocNumber: "12345678",
    customerLegalName: "Juan Pérez",
  });
  assert.equal(facturaConDni.valid, false);
  assert.ok(facturaConDni.error?.includes("RUC"));

  // Boleta con DNI de 8 dígitos es válida
  const boletaValida = validateBillingInput({
    documentType: "boleta",
    customerDocType: "DNI",
    customerDocNumber: "45678901",
    customerLegalName: "María López",
  });
  assert.equal(boletaValida.valid, true);
});

test("Fase 7.7 — Validadores de entrada: RUC, teléfono, email, contraseñas y nombres", () => {
  // RUC peruano
  assert.equal(validateRucFormat("20601234567").valid, true);
  assert.equal(validateRucFormat("10456789012").valid, true);
  assert.equal(validateRucFormat("12345678").valid, false); // Muy corto
  assert.equal(validateRucFormat("30123456789").valid, false); // Prefijo inválido (no empieza en 10, 15, 17, 20)
  assert.equal(validateRucFormat("20abc456789").valid, false); // No numérico

  // Teléfono (debe tener entre 7 y 15 dígitos)
  assert.equal(validatePhone("987654321", true).valid, true);
  assert.equal(validatePhone("12345", true).valid, false); // Muy corto (< 7 dígitos)
  assert.equal(validatePhone("", true).valid, false); // Requerido

  // Correo
  assert.equal(validateEmail("contacto@investments.pe").valid, true);
  assert.equal(validateEmail("correo_invalido").valid, false);

  // Contraseña robusta (min 8 chars, mayúscula, minúscula, número)
  assert.equal(validatePassword("Password123!").valid, true);
  assert.equal(validatePassword("short1!").valid, false);
  assert.equal(validatePassword("alllowercase1!").valid, false);
  assert.equal(validatePassword("ALLUPPERCASE1!").valid, false);
  assert.equal(validatePassword("NoNumberOrSymbol").valid, false);

  // Nombre
  assert.equal(validateName("Carlos Mendoza", "nombre").valid, true);
  assert.equal(validateName("C", "nombre").valid, false); // Muy corto
});

test("Fase 7.8 — Inventario y Kardex: validación estricta de ajustes administrativos", () => {
  // Reducción (merma) mayor al stock disponible actual debe ser rechazada
  const badDeduction = validateAdminInventoryAdjustmentInput({
    operationKind: "shrinkage",
    currentStock: 5,
    quantity: 10,
    reason: "Ajuste por merma en almacén",
  });
  assert.equal(badDeduction.valid, false);
  assert.ok(badDeduction.error?.includes("negativo"));

  // Cantidad 0 debe ser rechazada
  const zeroQty = validateAdminInventoryAdjustmentInput({
    operationKind: "entry",
    currentStock: 5,
    quantity: 0,
    reason: "Ingreso de mercadería",
  });
  assert.equal(zeroQty.valid, false);

  // Motivo obligatorio
  const noReason = validateAdminInventoryAdjustmentInput({
    operationKind: "entry",
    currentStock: 5,
    quantity: 10,
    reason: "   ",
  });
  assert.equal(noReason.valid, false);

  // Entrada de mercadería válida
  const validEntry = validateAdminInventoryAdjustmentInput({
    operationKind: "entry",
    currentStock: 15,
    quantity: 20,
    reason: "Reposición de lote",
  });
  assert.equal(validEntry.valid, true);
  assert.equal(validEntry.quantityDelta, 20);

  // Merma válida
  const validShrinkage = validateAdminInventoryAdjustmentInput({
    operationKind: "shrinkage",
    currentStock: 15,
    quantity: 5,
    reason: "Prenda con falla de costura",
  });
  assert.equal(validShrinkage.valid, true);
  assert.equal(validShrinkage.quantityDelta, -5);
});

test("Fase 7.9 — Limitador de tasa (Rate Limiting) en memoria: umbrales y aislamiento", () => {
  const key = `test_rate_limit_phase7_${Date.now()}`;
  const max = 3;
  const windowMs = 5000;

  // Primeras 3 solicitudes deben permitirse
  assert.equal(checkRateLimit(key, max, windowMs).allowed, true);
  recordFailedAttempt(key, max, windowMs);

  assert.equal(checkRateLimit(key, max, windowMs).allowed, true);
  recordFailedAttempt(key, max, windowMs);

  assert.equal(checkRateLimit(key, max, windowMs).allowed, true);
  recordFailedAttempt(key, max, windowMs);

  // La cuarta solicitud debe ser bloqueada
  const blocked = checkRateLimit(key, max, windowMs);
  assert.equal(blocked.allowed, false);
  assert.ok((blocked.retryAfterSeconds ?? 0) > 0);
});
