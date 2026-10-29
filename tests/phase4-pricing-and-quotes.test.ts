import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateLinePricing,
  isUserAuthorizedForWholesale,
  validateRequestedQuantity,
  type PriceTierInput,
} from "../src/server/pricing/engine";

const SAMPLE_PRICES: PriceTierInput[] = [
  { type: "retail", amount: 7900, compareAtAmount: null, minQuantity: 1 },
  { type: "wholesale", amount: 5400, minQuantity: 24, maxQuantity: 49 },
  { type: "wholesale", amount: 4800, minQuantity: 50, maxQuantity: null },
];

test("validateRequestedQuantity: acepta enteros válidos y rechaza negativos, cero, decimales y excesivos", () => {
  assert.equal(validateRequestedQuantity(1).valid, true);
  assert.equal(validateRequestedQuantity(1).quantity, 1);
  assert.equal(validateRequestedQuantity("24").valid, true);
  assert.equal(validateRequestedQuantity("24").quantity, 24);

  // Rechaza cero y negativos
  assert.equal(validateRequestedQuantity(0).valid, false);
  assert.equal(validateRequestedQuantity(-5).valid, false);

  // Rechaza fracciones / decimales
  assert.equal(validateRequestedQuantity(2.5).valid, false);
  assert.equal(validateRequestedQuantity("3.14").valid, false);

  // Rechaza NaN / texto inválido
  assert.equal(validateRequestedQuantity("abc").valid, false);
  assert.equal(validateRequestedQuantity(null).valid, false);

  // Rechaza cantidades superiores al límite permitido
  assert.equal(validateRequestedQuantity(999999, 5000).valid, false);
});

test("isUserAuthorizedForWholesale: solo autoriza business_approved activos y admin", () => {
  assert.equal(isUserAuthorizedForWholesale(null), false);
  assert.equal(isUserAuthorizedForWholesale(undefined), false);
  assert.equal(isUserAuthorizedForWholesale({ role: "customer", isActive: true }), false);
  assert.equal(isUserAuthorizedForWholesale({ role: "business_pending", isActive: true }), false);
  assert.equal(isUserAuthorizedForWholesale({ role: "business_approved", isActive: false }), false);
  assert.equal(isUserAuthorizedForWholesale({ role: "business_approved", isActive: true }), true);
  assert.equal(isUserAuthorizedForWholesale({ role: "admin", isActive: true }), true);
});

test("calculateLinePricing: cliente minorista (B2C) siempre recibe precio retail incluso en grandes volúmenes", () => {
  const res = calculateLinePricing({
    prices: SAMPLE_PRICES,
    quantity: 100,
    isProductWholesaleEnabled: true,
    user: { role: "customer", isActive: true },
  });

  assert.equal(res.appliedMode, "retail");
  assert.equal(res.effectiveUnitAmount, 7900);
  assert.equal(res.lineSubtotalAmount, 7900 * 100);
  assert.equal(res.lineSavingsAmount, 0);
  assert.equal(res.isWholesaleAuthorized, false);
});

test("calculateLinePricing: empresa pendiente o suspendida NO recibe tarifa mayorista", () => {
  const pendingRes = calculateLinePricing({
    prices: SAMPLE_PRICES,
    quantity: 30,
    isProductWholesaleEnabled: true,
    user: { role: "business_pending", isActive: true },
  });
  assert.equal(pendingRes.appliedMode, "retail");
  assert.equal(pendingRes.effectiveUnitAmount, 7900);

  const inactiveRes = calculateLinePricing({
    prices: SAMPLE_PRICES,
    quantity: 30,
    isProductWholesaleEnabled: true,
    user: { role: "business_approved", isActive: false },
  });
  assert.equal(inactiveRes.appliedMode, "retail");
  assert.equal(inactiveRes.effectiveUnitAmount, 7900);
});

test("calculateLinePricing: empresa aprobada recibe precios escalonados según volumen y calcula ahorros exactos en céntimos", () => {
  const approvedUser = { role: "business_approved", isActive: true };

  // 1. Debajo del umbral mínimo (ej: 10 unidades < 24) -> precio minorista, informa próxima escala
  const tier0 = calculateLinePricing({
    prices: SAMPLE_PRICES,
    quantity: 10,
    isProductWholesaleEnabled: true,
    user: approvedUser,
  });
  assert.equal(tier0.appliedMode, "retail");
  assert.equal(tier0.effectiveUnitAmount, 7900);
  assert.equal(tier0.lineSubtotalAmount, 79000);
  assert.equal(tier0.lineSavingsAmount, 0);
  assert.ok(tier0.nextWholesaleTier);
  assert.equal(tier0.nextWholesaleTier?.minQuantity, 24);
  assert.equal(tier0.nextWholesaleTier?.missingUnits, 14);
  assert.equal(tier0.nextWholesaleTier?.unitAmount, 5400);

  // 2. Primer tramo mayorista (ej: 24 unidades -> S/ 54.00)
  const tier1 = calculateLinePricing({
    prices: SAMPLE_PRICES,
    quantity: 24,
    isProductWholesaleEnabled: true,
    user: approvedUser,
  });
  assert.equal(tier1.appliedMode, "wholesale");
  assert.equal(tier1.effectiveUnitAmount, 5400);
  assert.equal(tier1.lineSubtotalAmount, 5400 * 24);
  assert.equal(tier1.retailSubtotalAmount, 7900 * 24);
  assert.equal(tier1.lineSavingsAmount, (7900 - 5400) * 24);
  assert.equal(tier1.nextWholesaleTier?.minQuantity, 50);
  assert.equal(tier1.nextWholesaleTier?.missingUnits, 26);

  // 3. Segundo tramo mayorista (ej: 60 unidades -> S/ 48.00)
  const tier2 = calculateLinePricing({
    prices: SAMPLE_PRICES,
    quantity: 60,
    isProductWholesaleEnabled: true,
    user: approvedUser,
  });
  assert.equal(tier2.appliedMode, "wholesale");
  assert.equal(tier2.effectiveUnitAmount, 4800);
  assert.equal(tier2.lineSubtotalAmount, 4800 * 60);
  assert.equal(tier2.lineSavingsAmount, (7900 - 4800) * 60);
  assert.equal(tier2.nextWholesaleTier, null);
});

test("calculateLinePricing: acumula múltiples tallas/colores del mismo modelo (productGroupQuantity) para desbloquear escala mayorista", () => {
  const approvedUser = { role: "business_approved", isActive: true };

  // Una variante tiene 8 uds., pero en total del mismo modelo hay 24 uds. en la bolsa
  const res = calculateLinePricing({
    prices: SAMPLE_PRICES,
    quantity: 8,
    productGroupQuantity: 24,
    isProductWholesaleEnabled: true,
    user: approvedUser,
  });

  assert.equal(res.appliedMode, "wholesale");
  assert.equal(res.effectiveUnitAmount, 5400);
  assert.equal(res.lineSubtotalAmount, 5400 * 8);
});

test("calculateLinePricing: no inventa precios si el producto no tiene tarifa configurada", () => {
  const unconfigured = calculateLinePricing({
    prices: [],
    quantity: 5,
    isProductWholesaleEnabled: true,
    user: { role: "business_approved", isActive: true },
  });

  assert.equal(unconfigured.appliedMode, "unconfigured");
  assert.equal(unconfigured.retailUnitAmount, null);
  assert.equal(unconfigured.effectiveUnitAmount, 0);
  assert.ok(unconfigured.configurationWarning);
});

