import { asc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { shippingZones, auditLogs } from "@/server/db/schema";

export interface ShippingZoneRecord {
  id: number;
  code: string;
  name: string;
  department: string;
  province: string | null;
  district: string | null;
  rateAmount: number;
  freeShippingMinSubtotal: number | null;
  estimatedDaysLabel: string;
  isAvailable: boolean;
  unavailableReason: string | null;
  sortOrder: number;
}

export interface ShippingCalculationResult {
  isAvailable: boolean;
  zoneCode: string;
  zoneName: string;
  shippingAmount: number;
  baseRateAmount: number;
  freeShippingMinSubtotal: number | null;
  isFreeShippingApplied: boolean;
  estimatedDaysLabel: string;
  unavailableReason: string | null;
}

/**
 * Zonas de envío peruanas iniciales configurables desde el panel administrativo.
 * Se inicializan en la base de datos si la tabla `shipping_zones` está vacía.
 */
export const DEFAULT_SHIPPING_ZONES: Array<{
  code: string;
  name: string;
  department: string;
  province: string | null;
  district: string | null;
  rateAmount: number;
  freeShippingMinSubtotal: number | null;
  estimatedDaysLabel: string;
  isAvailable: boolean;
  unavailableReason: string | null;
  sortOrder: number;
}> = [
  {
    code: "LIMA_METRO",
    name: "Lima Metropolitana y Callao",
    department: "Lima",
    province: "Lima",
    district: "*",
    rateAmount: 1500, // S/ 15.00
    freeShippingMinSubtotal: 29900, // Envío gratuito desde S/ 299.00
    estimatedDaysLabel: "24 a 48 horas hábiles",
    isAvailable: true,
    unavailableReason: null,
    sortOrder: 10,
  },
  {
    code: "CALLAO_METRO",
    name: "Provincia Constitucional del Callao",
    department: "Callao",
    province: "*",
    district: "*",
    rateAmount: 1500, // S/ 15.00
    freeShippingMinSubtotal: 29900,
    estimatedDaysLabel: "24 a 48 horas hábiles",
    isAvailable: true,
    unavailableReason: null,
    sortOrder: 15,
  },
  {
    code: "LIMA_PROVINCIAS",
    name: "Lima Provincias (Cañete, Huaura, Huaral, Barranca)",
    department: "Lima",
    province: "*",
    district: "*",
    rateAmount: 2200, // S/ 22.00
    freeShippingMinSubtotal: 45000, // Envío gratuito desde S/ 450.00
    estimatedDaysLabel: "2 a 4 días hábiles",
    isAvailable: true,
    unavailableReason: null,
    sortOrder: 20,
  },
  {
    code: "COSTA_SUR_NORTE",
    name: "Principales Ciudades Costa y Sierra (Arequipa, La Libertad, Piura, Cusco, Ica, Junín, Lambayeque)",
    department: "Arequipa",
    province: "*",
    district: "*",
    rateAmount: 2500, // S/ 25.00
    freeShippingMinSubtotal: 50000, // Envío gratuito desde S/ 500.00
    estimatedDaysLabel: "3 a 5 días hábiles",
    isAvailable: true,
    unavailableReason: null,
    sortOrder: 30,
  },
  {
    code: "ZONA_NO_DISPONIBLE_ISLAS",
    name: "Zona Insular / Frontera Fluvial Sin Cobertura Directa",
    department: "Loreto",
    province: "Putumayo",
    district: "*",
    rateAmount: 0,
    freeShippingMinSubtotal: null,
    estimatedDaysLabel: "Sin cobertura directa",
    isAvailable: false,
    unavailableReason:
      "Actualmente no contamos con despacho logístico directo hacia la provincia de Putumayo (Loreto). Por favor coordina una agencia de carga en Iquitos o Lima.",
    sortOrder: 5,
  },
  {
    code: "PERU_NACIONAL_GENERAL",
    name: "Resto del Perú (Despacho Nacional Terrestre / Aéreo)",
    department: "*",
    province: "*",
    district: "*",
    rateAmount: 2800, // S/ 28.00
    freeShippingMinSubtotal: 60000, // Envío gratuito desde S/ 600.00
    estimatedDaysLabel: "3 a 6 días hábiles",
    isAvailable: true,
    unavailableReason: null,
    sortOrder: 100,
  },
];

function normalizeGeo(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Evalúa la tarifa de envío aplicable en base a una lista de zonas configuradas,
 * departamento, provincia, distrito y subtotal de productos luego de descuentos.
 * Función pura exportada también para pruebas unitarias deterministas.
 */
export function resolveShippingFromZones(
  zones: ShippingZoneRecord[],
  location: {
    department: string;
    province?: string | null;
    district?: string | null;
  },
  subtotalAfterDiscountCents: number,
): ShippingCalculationResult {
  const deptNorm = normalizeGeo(location.department);
  const provNorm = normalizeGeo(location.province);
  const distNorm = normalizeGeo(location.district);

  if (!deptNorm) {
    return {
      isAvailable: false,
      zoneCode: "UNSPECIFIED",
      zoneName: "Ubicación incompleta",
      shippingAmount: 0,
      baseRateAmount: 0,
      freeShippingMinSubtotal: null,
      isFreeShippingApplied: false,
      estimatedDaysLabel: "Pendiente",
      unavailableReason: "Selecciona un departamento, provincia y distrito válidos en el Perú.",
    };
  }

  // Puntaje de especificidad: distrito exacto (3) > provincia exacta (2) > departamento exacto (1) > comodín nacional '*' (0)
  let bestMatch: { zone: ShippingZoneRecord; score: number } | null = null;

  for (const z of zones) {
    const zDept = normalizeGeo(z.department);
    const zProv = normalizeGeo(z.province);
    const zDist = normalizeGeo(z.district);

    const deptMatches = zDept === "*" || zDept === deptNorm;
    if (!deptMatches) continue;

    const provMatches = !zProv || zProv === "*" || zProv === provNorm;
    if (!provMatches) continue;

    const distMatches = !zDist || zDist === "*" || zDist === distNorm;
    if (!distMatches) continue;

    let score = 0;
    if (zDept !== "*") score += 10;
    if (zProv && zProv !== "*") score += 20;
    if (zDist && zDist !== "*") score += 40;

    if (!bestMatch || score > bestMatch.score || (score === bestMatch.score && z.sortOrder < bestMatch.zone.sortOrder)) {
      bestMatch = { zone: z, score };
    }
  }

  if (!bestMatch) {
    return {
      isAvailable: false,
      zoneCode: "OUT_OF_COVERAGE",
      zoneName: `${location.department} - ${location.province ?? ""}`,
      shippingAmount: 0,
      baseRateAmount: 0,
      freeShippingMinSubtotal: null,
      isFreeShippingApplied: false,
      estimatedDaysLabel: "Sin cobertura",
      unavailableReason: `No encontramos cobertura logística configurada para ${location.district ?? ""}, ${location.province ?? ""} (${location.department}).`,
    };
  }

  const matched = bestMatch.zone;

  if (!matched.isAvailable) {
    return {
      isAvailable: false,
      zoneCode: matched.code,
      zoneName: matched.name,
      shippingAmount: 0,
      baseRateAmount: matched.rateAmount,
      freeShippingMinSubtotal: matched.freeShippingMinSubtotal,
      isFreeShippingApplied: false,
      estimatedDaysLabel: matched.estimatedDaysLabel,
      unavailableReason:
        matched.unavailableReason ??
        `Actualmente no contamos con despacho habilitado para la zona ${matched.name}.`,
    };
  }

  const isFreeShippingApplied =
    matched.freeShippingMinSubtotal !== null &&
    matched.freeShippingMinSubtotal > 0 &&
    subtotalAfterDiscountCents >= matched.freeShippingMinSubtotal;

  const shippingAmount = isFreeShippingApplied ? 0 : matched.rateAmount;

  return {
    isAvailable: true,
    zoneCode: matched.code,
    zoneName: matched.name,
    shippingAmount,
    baseRateAmount: matched.rateAmount,
    freeShippingMinSubtotal: matched.freeShippingMinSubtotal,
    isFreeShippingApplied,
    estimatedDaysLabel: matched.estimatedDaysLabel,
    unavailableReason: null,
  };
}

/**
 * Obtiene todas las zonas de envío desde PostgreSQL. Si aún no existen registros,
 * inserta las tarifas iniciales configurables.
 */
export async function getOrSeedShippingZones(): Promise<ShippingZoneRecord[]> {
  const db = getDb();
  const existing = await db
    .select()
    .from(shippingZones)
    .orderBy(asc(shippingZones.sortOrder), asc(shippingZones.id));

  if (existing.length > 0) {
    return existing;
  }

  for (const def of DEFAULT_SHIPPING_ZONES) {
    await db
      .insert(shippingZones)
      .values(def)
      .onConflictDoNothing();
  }

  return db
    .select()
    .from(shippingZones)
    .orderBy(asc(shippingZones.sortOrder), asc(shippingZones.id));
}

/**
 * Calcula en el servidor el costo de envío para una dirección peruana y un subtotal dado.
 */
export async function calculateServerShipping(
  location: {
    department: string;
    province?: string | null;
    district?: string | null;
  },
  subtotalAfterDiscountCents: number,
): Promise<ShippingCalculationResult> {
  const zones = await getOrSeedShippingZones();
  return resolveShippingFromZones(zones, location, subtotalAfterDiscountCents);
}

/**
 * Permite a un administrador actualizar una tarifa o condición de envío en PostgreSQL con auditoría.
 */
export async function updateShippingZoneConfig(
  adminId: number,
  zoneId: number,
  input: {
    rateAmount: number;
    freeShippingMinSubtotal: number | null;
    estimatedDaysLabel: string;
    isAvailable: boolean;
    unavailableReason?: string | null;
  },
): Promise<void> {
  const db = getDb();
  await db
    .update(shippingZones)
    .set({
      rateAmount: Math.max(0, Math.trunc(input.rateAmount)),
      freeShippingMinSubtotal:
        input.freeShippingMinSubtotal !== null && input.freeShippingMinSubtotal > 0
          ? Math.trunc(input.freeShippingMinSubtotal)
          : null,
      estimatedDaysLabel: input.estimatedDaysLabel.trim().slice(0, 120),
      isAvailable: input.isAvailable,
      unavailableReason: input.unavailableReason?.trim()
        ? input.unavailableReason.trim().slice(0, 255)
        : null,
      updatedBy: adminId,
      updatedAt: new Date(),
    })
    .where(eq(shippingZones.id, zoneId));

  await db.insert(auditLogs).values({
    actorId: adminId,
    action: "shipping_rate_updated",
    targetType: "shipping_zone",
    targetId: zoneId,
    details: `Tarifa de envío #${zoneId} actualizada: costo=${input.rateAmount} céntimos, gratis_desde=${input.freeShippingMinSubtotal ?? "N/A"}, disponible=${input.isAvailable}`,
  });
}
