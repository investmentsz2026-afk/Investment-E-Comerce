import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SHIPPING_ZONES,
  getProductShippingCoverage,
  resolveShippingFromZones,
  type ShippingZoneRecord,
} from "../src/server/shipping/service";

const baseZones: ShippingZoneRecord[] = DEFAULT_SHIPPING_ZONES.map((z, i) => ({
  ...z,
  id: i + 1,
}));

test("1. Lista en orden alfabético todos los distritos de Lima habilitados", () => {
  const coverage = getProductShippingCoverage(baseZones);
  assert.ok(coverage.enabledLimaDistricts.length > 30, "Debe tener más de 30 distritos");

  // Verificar que esté ordenado alfabéticamente en español
  for (let i = 0; i < coverage.enabledLimaDistricts.length - 1; i++) {
    const current = coverage.enabledLimaDistricts[i];
    const next = coverage.enabledLimaDistricts[i + 1];
    assert.ok(
      current.localeCompare(next, "es", { sensitivity: "base" }) <= 0,
      `Distritos no ordenados alfabéticamente: ${current} vs ${next}`,
    );
  }

  // Verificar presencia de distritos clave
  assert.ok(coverage.enabledLimaDistricts.includes("Miraflores"));
  assert.ok(coverage.enabledLimaDistricts.includes("San Isidro"));
  assert.ok(coverage.enabledLimaDistricts.includes("Pucusana"));
});

test("2. Si un distrito es deshabilitado por el administrador, desaparece de la ficha automáticamente", () => {
  // Simulamos que el admin deshabilita 'Pucusana'
  const modifiedZones: ShippingZoneRecord[] = [
    {
      id: 999,
      code: "LIMA_PUCUSANA_BLOCKED",
      name: "Pucusana Restringido",
      department: "Lima",
      province: "Lima",
      district: "Pucusana",
      rateAmount: 0,
      freeShippingMinSubtotal: null,
      estimatedDaysLabel: "Sin cobertura",
      isAvailable: false,
      unavailableReason: "Zona temporalmente sin reparto.",
      sortOrder: 1,
    },
    ...baseZones,
  ];

  const coverage = getProductShippingCoverage(modifiedZones);

  // Debe haber desaparecido de la lista en la ficha
  assert.ok(!coverage.enabledLimaDistricts.includes("Pucusana"), "Pucusana debe ser excluida");
  // Pero los demás distritos siguen presentes
  assert.ok(coverage.enabledLimaDistricts.includes("Miraflores"));
  assert.ok(coverage.enabledLimaDistricts.includes("San Isidro"));

  // Y el checkout también lo bloquea con la misma regla
  const checkoutResult = resolveShippingFromZones(
    modifiedZones,
    { department: "Lima", province: "Lima", district: "Pucusana" },
    14000,
  );
  assert.equal(checkoutResult.isAvailable, false);
  assert.ok(
    checkoutResult.unavailableReason?.includes("Zona temporalmente sin reparto"),
    "Razón de no disponibilidad esperada",
  );
});

test("3. Shalom se incluye únicamente si está habilitada en la configuración", () => {
  // Con baseZones donde AGENCIA_SHALOM isAvailable: true
  const coverageWithShalom = getProductShippingCoverage(baseZones);
  assert.equal(coverageWithShalom.isShalomEnabled, true);
  assert.ok(coverageWithShalom.activeAgencies.some((a) => a.code === "SHALOM" || a.name.includes("Shalom")));

  // Cuando el administrador deshabilita Shalom
  const zonesWithoutShalom = baseZones.map((z) =>
    z.code === "AGENCIA_SHALOM" ? { ...z, isAvailable: false } : z,
  );
  const coverageWithoutShalom = getProductShippingCoverage(zonesWithoutShalom);
  assert.equal(coverageWithoutShalom.isShalomEnabled, false);
  assert.ok(!coverageWithoutShalom.activeAgencies.some((a) => a.code === "SHALOM" || a.name.includes("Shalom")));
});

test("4. No se exponen tarifas ni calculadoras en la información de cobertura", () => {
  const coverage = getProductShippingCoverage(baseZones);
  // Verificar que los objetos de cobertura no contienen montos de tarifa
  for (const agency of coverage.activeAgencies) {
    assert.equal((agency as unknown as { rateAmount?: number }).rateAmount, undefined);
  }
  for (const dest of coverage.provinceDestinations) {
    assert.equal((dest as unknown as { rateAmount?: number }).rateAmount, undefined);
  }
});

test("5. El checkout sigue calculando precios y costos de envío según el destino seleccionado", () => {
  // Lima Metropolitana con compra menor al mínimo gratis
  const limaNormal = resolveShippingFromZones(
    baseZones,
    { department: "Lima", province: "Lima", district: "Miraflores" },
    10000, // S/ 100.00
  );
  assert.equal(limaNormal.isAvailable, true);
  assert.equal(limaNormal.shippingAmount, 1500); // S/ 15.00 (tarifa base LIMA_METRO)
  assert.equal(limaNormal.isFreeShippingApplied, false);

  // Lima Metropolitana con compra mayor al mínimo gratis (S/ 299.00 -> 29900)
  const limaFree = resolveShippingFromZones(
    baseZones,
    { department: "Lima", province: "Lima", district: "Miraflores" },
    30000, // S/ 300.00
  );
  assert.equal(limaFree.isAvailable, true);
  assert.equal(limaFree.shippingAmount, 0);
  assert.equal(limaFree.isFreeShippingApplied, true);

  // Provincias (Arequipa)
  const arequipa = resolveShippingFromZones(
    baseZones,
    { department: "Arequipa", province: "Arequipa", district: "Arequipa" },
    10000,
  );
  assert.equal(arequipa.isAvailable, true);
  assert.equal(arequipa.shippingAmount, 2500); // S/ 25.00
});
