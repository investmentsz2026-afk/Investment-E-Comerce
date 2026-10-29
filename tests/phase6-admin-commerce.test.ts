import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateLinePricing,
  isUserAuthorizedForWholesale,
  type PriceTierInput,
  type PromotionInput,
} from "../src/server/pricing/engine";
import {
  normalizeCommercialSlug,
  validateCategoryPayload,
  validateProductCommercialPayload,
  validatePromotionPayload,
} from "../src/server/pricing/admin-validators";
import { validateAdminInventoryAdjustmentInput } from "../src/server/inventory/service";

const SAMPLE_PRICES: PriceTierInput[] = [
  { type: "retail", amount: 20000, compareAtAmount: 24000, minQuantity: 1 },
  { type: "wholesale", amount: 16000, minQuantity: 6, maxQuantity: 11 },
  { type: "wholesale", amount: 14000, minQuantity: 12, maxQuantity: null },
];

test("Fase 6.2 — Validación comercial de producto: rechaza precios inválidos, SKUs duplicados o escalas mayoristas incoherentes", () => {
  const validResult = validateProductCommercialPayload({
    name: "Blazer Cruzado Alpaca Premium",
    slug: "Blazer Cruzado Alpaca Premium",
    categoryId: 1,
    audience: "mujer",
    status: "active",
    retailPricePen: "320.00",
    compareAtPricePen: "390.00",
    isWholesale: true,
    wholesaleTiers: [
      { minQuantity: 6, maxQuantity: 11, pricePen: "260.00" },
      { minQuantity: 12, maxQuantity: null, pricePen: "235.00" },
    ],
    variants: [
      { sku: "INV-BLZ-ALP-S", size: "S", colorName: "Arena", stock: 12 },
      { sku: "INV-BLZ-ALP-M", size: "M", colorName: "Arena", stock: 8 },
    ],
  });

  assert.equal(validResult.valid, true);
  assert.equal(validResult.normalizedSlug, "blazer-cruzado-alpaca-premium");
  assert.equal(validResult.retailAmountCents, 32000);
  assert.equal(validResult.compareAtAmountCents, 39000);
  assert.equal(validResult.validatedTiers?.length, 2);

  // Rechaza escala mayorista mayor o igual al precio minorista
  const badTier = validateProductCommercialPayload({
    name: "Prenda Test",
    slug: "prenda-test",
    categoryId: 1,
    audience: "unisex",
    status: "active",
    retailPricePen: "100.00",
    isWholesale: true,
    wholesaleTiers: [{ minQuantity: 6, pricePen: "110.00" }],
    variants: [{ sku: "SKU-001", stock: 5 }],
  });
  assert.equal(badTier.valid, false);
  assert.match(badTier.error ?? "", /menor que el precio minorista/i);

  // Rechaza SKUs repetidos dentro del mismo producto
  const dupSku = validateProductCommercialPayload({
    name: "Prenda Test",
    slug: "prenda-test",
    categoryId: 1,
    audience: "unisex",
    status: "active",
    retailPricePen: "100.00",
    isWholesale: false,
    variants: [
      { sku: "SKU-DUP-01", stock: 5 },
      { sku: "sku-dup-01", stock: 3 },
    ],
  });
  assert.equal(dupSku.valid, false);
  assert.match(dupSku.error ?? "", /repetido/i);
});

test("Fase 6.3 — Validación de categorías: normaliza slugs e impide referencias circulares directas", () => {
  assert.equal(
    normalizeCommercialSlug("Sastrería Contemporánea & Lino 2026!"),
    "sastreria-contemporanea-lino-2026",
  );

  const selfParent = validateCategoryPayload({
    id: 5,
    name: "Sastrería",
    slug: "sastreria",
    parentId: 5,
  });
  assert.equal(selfParent.valid, false);
  assert.match(selfParent.error ?? "", /subcategoría de sí misma/i);

  const validCat = validateCategoryPayload({
    id: 5,
    name: "Sastrería",
    slug: "sastreria",
    parentId: 2,
  });
  assert.equal(validCat.valid, true);
});

test("Fase 6.4 — Validación de promociones y resolución de conflictos B2C vs B2B en el servidor", () => {
  // Rechaza promoción con fecha fin anterior a fecha inicio
  const invalidDates = validatePromotionPayload({
    code: "PROMO2026",
    name: "Campaña Invierno",
    discountPercent: 20,
    startsAt: "2026-11-10T00:00:00Z",
    endsAt: "2026-11-01T00:00:00Z",
  });
  assert.equal(invalidDates.valid, false);

  const now = new Date("2026-10-29T12:00:00Z");
  const activePromo: PromotionInput = {
    code: "SASTRERIA15",
    name: "Campaña Sastrería",
    discountPercent: 15, // 15% sobre S/ 200.00 = S/ 170.00 (17000 céntimos)
    channelTarget: "retail",
    startsAt: new Date("2026-10-20T00:00:00Z"),
    endsAt: new Date("2026-11-15T00:00:00Z"),
    isActive: true,
  };

  // 1) Cliente minorista (B2C) recibe el descuento promocional vigente (S/ 170.00 en lugar de S/ 200.00)
  const b2cPricing = calculateLinePricing({
    prices: SAMPLE_PRICES,
    quantity: 2,
    isProductWholesaleEnabled: true,
    user: { role: "customer", isActive: true },
    promotions: [activePromo],
    now,
  });
  assert.equal(b2cPricing.appliedMode, "retail");
  assert.equal(b2cPricing.effectiveUnitAmount, 17000);
  assert.equal(b2cPricing.appliedPromotion?.code, "SASTRERIA15");

  // 2) Empresa mayorista aprobada (B2B) comprando 6 uds. recibe su tramo mayorista (S/ 160.00)
  // sin acumular indebidamente el -15% B2C encima de los S/ 160.00
  const b2bPricing = calculateLinePricing({
    prices: SAMPLE_PRICES,
    quantity: 6,
    isProductWholesaleEnabled: true,
    user: { role: "business_approved", isActive: true },
    promotions: [activePromo],
    now,
  });
  assert.equal(b2bPricing.appliedMode, "wholesale");
  assert.equal(b2bPricing.effectiveUnitAmount, 16000);
  assert.equal(b2bPricing.appliedPromotion, null);
});

test("Fase 6.5 — Servicio de inventario administrativo: bloquea stock negativo, exige motivo y calcula deltas exactos", () => {
  // Rechaza merma que dejaría el stock en negativo
  const negativeAttempt = validateAdminInventoryAdjustmentInput({
    operationKind: "shrinkage",
    quantity: 12,
    reason: "Merma en almacén central",
    currentStock: 8,
  });
  assert.equal(negativeAttempt.valid, false);
  assert.match(negativeAttempt.error ?? "", /stock negativo/i);

  // Rechaza ajuste sin motivo válido
  const noReason = validateAdminInventoryAdjustmentInput({
    operationKind: "entry",
    quantity: 10,
    reason: "ok",
    currentStock: 8,
  });
  assert.equal(noReason.valid, false);

  // Acepta entrada de lote válida
  const validEntry = validateAdminInventoryAdjustmentInput({
    operationKind: "entry",
    quantity: 25,
    reason: "Ingreso Lote Textil #2026-10",
    currentStock: 8,
  });
  assert.equal(validEntry.valid, true);
  assert.equal(validEntry.quantityDelta, 25);

  // Acepta baja por merma cuando hay stock suficiente
  const validShrinkage = validateAdminInventoryAdjustmentInput({
    operationKind: "shrinkage",
    quantity: 3,
    reason: "Prendas observadas en control de calidad",
    currentStock: 8,
  });
  assert.equal(validShrinkage.valid, true);
  assert.equal(validShrinkage.quantityDelta, -3);
});

test("Fase 6.6 y 6.9 — Control de permisos mayoristas y administrativos en servidor", () => {
  assert.equal(isUserAuthorizedForWholesale(null), false);
  assert.equal(isUserAuthorizedForWholesale({ role: "customer", isActive: true }), false);
  assert.equal(isUserAuthorizedForWholesale({ role: "business_pending", isActive: true }), false);
  assert.equal(
    isUserAuthorizedForWholesale({ role: "business_approved", isActive: false }),
    false,
  );
  assert.equal(
    isUserAuthorizedForWholesale({ role: "business_approved", isActive: true }),
    true,
  );
  assert.equal(isUserAuthorizedForWholesale({ role: "admin", isActive: true }), true);
});

