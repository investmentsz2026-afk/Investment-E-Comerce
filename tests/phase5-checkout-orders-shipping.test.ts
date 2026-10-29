import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  DEFAULT_SHIPPING_ZONES,
  resolveShippingFromZones,
  type ShippingZoneRecord,
} from "../src/server/shipping/service";
import {
  calculatePeruIgvBreakdown,
  validateBillingInput,
  mapSunatCatalog06DocType,
  buildNubefactComprobantePayload,
  buildNubefactStatusQueryPayload,
  getSunatProviderConfig,
} from "../src/server/tax/sunat-service";
import {
  computeWebhookHmacSignature,
  verifyWebhookSignature,
  verifyMercadoPagoWebhookSignature,
  buildMercadoPagoPaymentPayload,
  buildMercadoPagoCheckoutPreferencePayload,
  validateMercadoPagoPaymentAgainstOrder,
  validateMercadoPagoEnvironmentConsistency,
} from "../src/server/payments/gateway";

const SAMPLE_ZONES: ShippingZoneRecord[] = DEFAULT_SHIPPING_ZONES.map((z, idx) => ({
  id: idx + 1,
  ...z,
}));

test("resolveShippingFromZones: calcula tarifa de Lima Metropolitana y aplica envío gratuito sobre el umbral", () => {
  // Compra de S/ 158.00 (< S/ 299.00) en Miraflores, Lima -> cobra S/ 15.00 (1500 céntimos)
  const regular = resolveShippingFromZones(
    SAMPLE_ZONES,
    { department: "Lima", province: "Lima", district: "Miraflores" },
    15800,
  );
  assert.equal(regular.isAvailable, true);
  assert.equal(regular.zoneCode, "LIMA_METRO");
  assert.equal(regular.shippingAmount, 1500);
  assert.equal(regular.isFreeShippingApplied, false);

  // Compra de S/ 350.00 (>= S/ 299.00) en San Isidro, Lima -> envío gratis (0 céntimos)
  const free = resolveShippingFromZones(
    SAMPLE_ZONES,
    { department: "Lima", province: "Lima", district: "San Isidro" },
    35000,
  );
  assert.equal(free.isAvailable, true);
  assert.equal(free.zoneCode, "LIMA_METRO");
  assert.equal(free.shippingAmount, 0);
  assert.equal(free.isFreeShippingApplied, true);
});

test("resolveShippingFromZones: distingue Lima Provincias, ciudades principales y bloquea zonas sin cobertura", () => {
  // Cañete, Lima -> LIMA_PROVINCIAS (S/ 22.00)
  const limaProv = resolveShippingFromZones(
    SAMPLE_ZONES,
    { department: "Lima", province: "Cañete", district: "San Vicente" },
    10000,
  );
  assert.equal(limaProv.isAvailable, true);
  assert.equal(limaProv.zoneCode, "LIMA_PROVINCIAS");
  assert.equal(limaProv.shippingAmount, 2200);

  // Putumayo, Loreto -> Zona explícitamente marcada como no disponible (isAvailable = false)
  const blocked = resolveShippingFromZones(
    SAMPLE_ZONES,
    { department: "Loreto", province: "Putumayo", district: "Putumayo" },
    20000,
  );
  assert.equal(blocked.isAvailable, false);
  assert.equal(blocked.zoneCode, "ZONA_NO_DISPONIBLE_ISLAS");
  assert.ok(blocked.unavailableReason && blocked.unavailableReason.includes("Putumayo"));
});

test("calculatePeruIgvBreakdown: desglosa base imponible e IGV (18%) sin pérdida de céntimos", () => {
  // S/ 118.00 -> Base S/ 100.00 (10000) + IGV S/ 18.00 (1800) = 11800
  const b1 = calculatePeruIgvBreakdown(11800);
  assert.equal(b1.taxableBaseAmount, 10000);
  assert.equal(b1.igvAmount, 1800);
  assert.equal(b1.taxableBaseAmount + b1.igvAmount, b1.totalAmount);

  // Importe con redondeo: S/ 173.00 (17300 céntimos)
  const b2 = calculatePeruIgvBreakdown(17300);
  assert.equal(b2.taxableBaseAmount + b2.igvAmount, 17300);
});

test("validateBillingInput: valida estrictamente Boleta (DNI/CE) y Factura Electrónica (RUC 11 dígitos + domicilio fiscal)", () => {
  // Boleta válida con DNI de 8 dígitos
  assert.equal(
    validateBillingInput({
      documentType: "boleta",
      customerDocType: "DNI",
      customerDocNumber: "71234567",
      customerLegalName: "Lucía Mendoza",
    }).valid,
    true,
  );

  // Boleta inválida con DNI de 6 dígitos
  assert.equal(
    validateBillingInput({
      documentType: "boleta",
      customerDocType: "DNI",
      customerDocNumber: "123456",
      customerLegalName: "Lucía Mendoza",
    }).valid,
    false,
  );

  // Factura válida con RUC 20..., razón social y domicilio fiscal
  assert.equal(
    validateBillingInput({
      documentType: "factura",
      customerDocType: "RUC",
      customerDocNumber: "20556677889",
      customerLegalName: "Consorcio Textil Andino S.A.C.",
      customerFiscalAddress: "Av. Industrial 450, Ate, Lima",
    }).valid,
    true,
  );

  // Factura rechazada si intenta usar DNI o si falta domicilio fiscal
  assert.equal(
    validateBillingInput({
      documentType: "factura",
      customerDocType: "DNI",
      customerDocNumber: "71234567",
      customerLegalName: "Consorcio Textil Andino S.A.C.",
      customerFiscalAddress: "Av. Industrial 450",
    }).valid,
    false,
  );
  assert.equal(
    validateBillingInput({
      documentType: "factura",
      customerDocType: "RUC",
      customerDocNumber: "20556677889",
      customerLegalName: "Consorcio Textil Andino S.A.C.",
      customerFiscalAddress: "",
    }).valid,
    false,
  );
});

test("verifyWebhookSignature: verifica firmas HMAC-SHA256 legítimas y rechaza firmas falsas o alteradas", () => {
  const secret = "test_secret_key_for_hmac_verification";
  const payload = JSON.stringify({
    eventId: "evt_001",
    eventType: "charge.succeeded",
    orderId: 99,
  });

  const validSig = computeWebhookHmacSignature(payload, secret);

  assert.equal(verifyWebhookSignature(payload, validSig, secret), true);
  assert.equal(verifyWebhookSignature(payload, `sha256=${validSig}`, secret), true);

  // Firma falsa o cuerpo adulterado
  assert.equal(verifyWebhookSignature(payload, "firma_falsa_invalida", secret), false);
  const tamperedPayload = JSON.stringify({
    eventId: "evt_001",
    eventType: "charge.succeeded",
    orderId: 100,
  });
  assert.equal(verifyWebhookSignature(tamperedPayload, validSig, secret), false);
});

test("Mercado Pago: construye payload oficial en PEN, valida consistencia monto/moneda/referencia y verifica firma x-signature (ts=...,v1=...)", () => {
  // 1. Construcción de payload directo v1/payments en PEN
  const mpPayment = buildMercadoPagoPaymentPayload({
    orderId: 42,
    orderNumber: "ORD-2026-420001",
    totalAmountCents: 17300,
    customerEmail: "cliente@investments.pe",
    customerFirstName: "Valeria",
    customerLastName: "Salazar",
    billingDocType: "DNI",
    billingDocNumber: "72345678",
    cardToken: "tok_mp_123",
    paymentMethodId: "visa",
    notificationUrl: "https://investments.pe/api/webhooks/payments",
  });

  assert.equal(mpPayment.transaction_amount, 173);
  assert.equal(mpPayment.external_reference, "42");
  assert.equal(mpPayment.payer.identification.type, "DNI");
  assert.equal(mpPayment.payer.identification.number, "72345678");
  assert.equal(mpPayment.metadata.currency, "PEN");

  // 2. Construcción de preferencia Checkout Pro con moneda PEN y back_urls informativas
  const mpPref = buildMercadoPagoCheckoutPreferencePayload({
    orderId: 42,
    orderNumber: "ORD-2026-420001",
    totalAmountCents: 17300,
    customerEmail: "cliente@investments.pe",
    customerFirstName: "Valeria",
    customerLastName: "Salazar",
    billingDocType: "DNI",
    billingDocNumber: "72345678",
    baseUrl: "https://investments.pe",
  });
  assert.equal(mpPref.items[0].currency_id, "PEN");
  assert.equal(mpPref.items[0].unit_price, 173);
  assert.equal(mpPref.external_reference, "42");

  // 3. Validación estricta de monto, moneda y referencia externa contra adulteración
  assert.equal(
    validateMercadoPagoPaymentAgainstOrder({
      orderId: 42,
      orderNumber: "ORD-2026-420001",
      orderTotalCents: 17300,
      mpCurrencyId: "PEN",
      mpTransactionAmount: 173.0,
      mpExternalReference: "42",
    }).valid,
    true,
  );
  // Moneda distinta a PEN rechazada
  assert.equal(
    validateMercadoPagoPaymentAgainstOrder({
      orderId: 42,
      orderNumber: "ORD-2026-420001",
      orderTotalCents: 17300,
      mpCurrencyId: "USD",
      mpTransactionAmount: 173.0,
      mpExternalReference: "42",
    }).valid,
    false,
  );
  // Monto adulterado rechazado
  assert.equal(
    validateMercadoPagoPaymentAgainstOrder({
      orderId: 42,
      orderNumber: "ORD-2026-420001",
      orderTotalCents: 17300,
      mpCurrencyId: "PEN",
      mpTransactionAmount: 10.0,
      mpExternalReference: "42",
    }).valid,
    false,
  );
  // Referencia de otro pedido rechazada
  assert.equal(
    validateMercadoPagoPaymentAgainstOrder({
      orderId: 42,
      orderNumber: "ORD-2026-420001",
      orderTotalCents: 17300,
      mpCurrencyId: "PEN",
      mpTransactionAmount: 173.0,
      mpExternalReference: "999",
    }).valid,
    false,
  );

  // 4. Verificación criptográfica del header oficial x-signature de Mercado Pago
  const mpSecret = "mp_webhook_secret_oficial_2026";
  const dataId = "8899112233";
  const requestId = "req-uuid-001";
  const ts = "1730000000";
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", mpSecret).update(manifest, "utf8").digest("hex");

  assert.equal(
    verifyMercadoPagoWebhookSignature({
      xSignatureHeader: `ts=${ts},v1=${v1}`,
      xRequestIdHeader: requestId,
      dataId,
      secret: mpSecret,
    }),
    true,
  );

  // Si se altera el data.id o la firma v1, debe fallar
  assert.equal(
    verifyMercadoPagoWebhookSignature({
      xSignatureHeader: `ts=${ts},v1=${v1}`,
      xRequestIdHeader: requestId,
      dataId: "9999999999",
      secret: mpSecret,
    }),
    false,
  );

  // 5. Separación de entorno sandbox vs production en Mercado Pago
  assert.equal(
    validateMercadoPagoEnvironmentConsistency({
      environment: "production",
      accessToken: "TEST-1234567890-token-de-prueba",
    }).valid,
    false,
  );
  assert.equal(
    validateMercadoPagoEnvironmentConsistency({
      environment: "production",
      accessToken: "APP_USR-9988776655-prod",
      publicKey: "APP_USR-11223344-pub",
    }).valid,
    true,
  );
  assert.equal(
    validateMercadoPagoEnvironmentConsistency({
      environment: "sandbox",
      accessToken: "",
    }).valid,
    false,
  );
});

test("SUNAT PSE/OSE (Nubefact): construye payload oficial de Boleta y Factura con ítems, IGV 18% y bloquea emisión sin credenciales", () => {
  assert.equal(mapSunatCatalog06DocType("DNI"), "1");
  assert.equal(mapSunatCatalog06DocType("CE"), "4");
  assert.equal(mapSunatCatalog06DocType("RUC"), "6");

  // Factura Electrónica B2B (S/ 1,000.00 incluido IGV -> Base 847.46 + IGV 152.54)
  const taxB2B = calculatePeruIgvBreakdown(100000);
  const facturaPayload = buildNubefactComprobantePayload({
    orderNumber: "ORD-2026-880011",
    documentType: "factura",
    serie: "FFF1",
    correlativeNumber: 15,
    customerDocType: "RUC",
    customerDocNumber: "20556677889",
    customerLegalName: "Textiles Corporativos Lima S.A.C.",
    customerFiscalAddress: "Av. Argentina 1250, Lima",
    customerEmail: "compras@texcorp.pe",
    taxableAmountCents: taxB2B.taxableBaseAmount,
    igvAmountCents: taxB2B.igvAmount,
    totalAmountCents: taxB2B.totalAmount,
    shippingAmountCents: 0,
    items: [
      {
        sku: "BLZ-SASTRE-NEG-S",
        description: "Blazer Sastre Negro Talla S",
        quantity: 4,
        unitPriceCents: 25000,
        lineSubtotalCents: 100000,
      },
    ],
    issueDate: new Date("2026-10-28T12:00:00Z"),
  });

  assert.equal(facturaPayload.operacion, "generar_comprobante");
  assert.equal(facturaPayload.tipo_de_comprobante, 1); // 1 = Factura
  assert.equal(facturaPayload.serie, "FFF1");
  assert.equal(facturaPayload.numero, 15);
  assert.equal(facturaPayload.cliente_tipo_de_documento, "6"); // 6 = RUC
  assert.equal(facturaPayload.moneda, 1); // 1 = PEN
  assert.equal(facturaPayload.porcentaje_de_igv, 18.0);
  assert.equal(facturaPayload.total, 1000);
  assert.equal(facturaPayload.items.length, 1);
  assert.equal(facturaPayload.items[0].unidad_de_medida, "NIU");
  assert.equal(facturaPayload.items[0].cantidad, 4);
  assert.equal(facturaPayload.items[0].precio_unitario, 250);
  assert.equal(facturaPayload.items[0].total, 1000);

  // Boleta de Venta con costo de envío incluido (agrega ítem logístico ZZ)
  const taxB2C = calculatePeruIgvBreakdown(17300);
  const boletaPayload = buildNubefactComprobantePayload({
    orderNumber: "ORD-2026-880012",
    documentType: "boleta",
    serie: "BBB1",
    customerDocType: "DNI",
    customerDocNumber: "72345678",
    customerLegalName: "Valeria Salazar",
    taxableAmountCents: taxB2C.taxableBaseAmount,
    igvAmountCents: taxB2C.igvAmount,
    totalAmountCents: taxB2C.totalAmount,
    shippingAmountCents: 1500,
    items: [
      {
        sku: "POLO-ESS-BL-M",
        description: "Polo Esencial Algodón Blanco Talla M",
        quantity: 2,
        unitPriceCents: 7900,
        lineSubtotalCents: 15800,
      },
    ],
  });

  assert.equal(boletaPayload.tipo_de_comprobante, 2); // 2 = Boleta
  assert.equal(boletaPayload.cliente_tipo_de_documento, "1"); // 1 = DNI
  assert.equal(boletaPayload.items.length, 2); // Prenda + Servicio de despacho ZZ
  assert.equal(boletaPayload.items[1].unidad_de_medida, "ZZ");
  assert.equal(boletaPayload.items[1].total, 15);

  // Payload de consulta de estado
  const statusQuery = buildNubefactStatusQueryPayload({
    documentType: "factura",
    serie: "FFF1",
    correlativeNumber: "15",
  });
  assert.equal(statusQuery.operacion, "consultar_comprobante");
  assert.equal(statusQuery.tipo_de_comprobante, 1);
  assert.equal(statusQuery.serie, "FFF1");
  assert.equal(statusQuery.numero, 15);

  // Sin variables configuradas en el entorno de pruebas, readyToIssue debe ser false
  const currentConfig = getSunatProviderConfig();
  if (!process.env.SUNAT_PSE_API_TOKEN) {
    assert.equal(currentConfig.readyToIssue, false);
    assert.ok(currentConfig.missingVariables.length > 0);
  }
});
