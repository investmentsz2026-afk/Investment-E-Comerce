import { asc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { shippingZones, physicalStores, auditLogs } from "@/server/db/schema";

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
    code: "AGENCIA_SHALOM",
    name: "Agencia Shalom (Provincias - Recojo en Agencia)",
    department: "*",
    province: "*",
    district: "*",
    rateAmount: 1800, // S/ 18.00
    freeShippingMinSubtotal: 45000,
    estimatedDaysLabel: "24 a 72 horas hábiles",
    isAvailable: true,
    unavailableReason: null,
    sortOrder: 40,
  },
  {
    code: "AGENCIA_OLVA",
    name: "Olva Courier (Nacional - Domicilio y Agencia)",
    department: "*",
    province: "*",
    district: "*",
    rateAmount: 2200, // S/ 22.00
    freeShippingMinSubtotal: 50000,
    estimatedDaysLabel: "48 a 96 horas hábiles",
    isAvailable: true,
    unavailableReason: null,
    sortOrder: 45,
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
 * inserta las tarifas iniciales configurables. Si ya existen, asegura que las zonas por defecto
 * no registradas sean añadidas.
 */
export async function getOrSeedShippingZones(): Promise<ShippingZoneRecord[]> {
  const db = getDb();

  for (const def of DEFAULT_SHIPPING_ZONES) {
    await db
      .insert(shippingZones)
      .values(def)
      .onConflictDoNothing({ target: shippingZones.code });
  }

  return db
    .select()
    .from(shippingZones)
    .orderBy(asc(shippingZones.sortOrder), asc(shippingZones.id));
}

/**
 * Lista canónica oficial de distritos de Lima Metropolitana.
 */
export const LIMA_METROPOLITANA_DISTRICTS = [
  "Ancón",
  "Ate",
  "Barranco",
  "Breña",
  "Carabayllo",
  "Chaclacayo",
  "Chorrillos",
  "Cieneguilla",
  "Comas",
  "El Agustino",
  "Independencia",
  "Jesús María",
  "La Molina",
  "La Victoria",
  "Lima (Cercado)",
  "Lince",
  "Los Olivos",
  "Lurigancho-Chosica",
  "Lurín",
  "Magdalena del Mar",
  "Miraflores",
  "Pachacámac",
  "Pucusana",
  "Pueblo Libre",
  "Puente Piedra",
  "Punta Hermosa",
  "Punta Negra",
  "Rímac",
  "San Bartolo",
  "San Borja",
  "San Isidro",
  "San Juan de Lurigancho",
  "San Juan de Miraflores",
  "San Luis",
  "San Martín de Porres",
  "San Miguel",
  "Santa Anita",
  "Santa María del Mar",
  "Santa Rosa",
  "Santiago de Surco",
  "Surquillo",
  "Villa El Salvador",
  "Villa María del Triunfo",
] as const;

export interface ProductShippingCoverageInfo {
  /** Distritos de Lima Metropolitana actualmente habilitados según las reglas activas de shipping_zones */
  enabledLimaDistricts: string[];
  /** Destinos configurados para Provincias */
  provinceDestinations: Array<{
    code: string;
    name: string;
    estimatedDays: string;
  }>;
  /** Agencias activas según la configuración de la tienda */
  activeAgencies: Array<{
    code: string;
    name: string;
    description: string;
    estimatedDays: string;
  }>;
  /** Si Shalom está habilitada activamente */
  isShalomEnabled: boolean;
}

/**
 * Deriva la información pública de cobertura logística y agencias para la ficha de producto,
 * utilizando la misma fuente y motor de reglas de PostgreSQL que el checkout.
 */
export function getProductShippingCoverage(zones: ShippingZoneRecord[]): ProductShippingCoverageInfo {
  // 1. Obtener todos los distritos posibles (canónicos + cualquier distrito explícito en shipping_zones)
  const candidateDistricts = new Set<string>(LIMA_METROPOLITANA_DISTRICTS);
  for (const z of zones) {
    if (
      z.department.toLowerCase() === "lima" &&
      z.district &&
      z.district !== "*" &&
      z.district.trim().length > 0
    ) {
      candidateDistricts.add(z.district.trim());
    }
  }

  // 2. Evaluar cada distrito con el mismo motor de resolución que utiliza el checkout
  const enabledLimaDistricts = Array.from(candidateDistricts)
    .filter((districtName) => {
      const calc = resolveShippingFromZones(
        zones,
        { department: "Lima", province: "Lima", district: districtName },
        10000,
      );
      return calc.isAvailable;
    })
    .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  // 3. Destinos en Provincias configurados y habilitados (excluyendo Lima y Callao)
  const provinceDestinations = zones
    .filter(
      (z) =>
        z.isAvailable &&
        z.code !== "LIMA_METRO" &&
        z.code !== "CALLAO_METRO" &&
        !z.code.startsWith("AGENCIA_"),
    )
    .map((z) => ({
      code: z.code,
      name: z.name,
      estimatedDays: z.estimatedDaysLabel,
    }));

  // 4. Agencias activas: Shalom sólo si está explícitamente habilitada en shipping_zones
  const shalomZone = zones.find(
    (z) => z.code === "AGENCIA_SHALOM" || z.name.toLowerCase().includes("shalom"),
  );
  const isShalomEnabled = shalomZone ? shalomZone.isAvailable : true;

  const olvaZone = zones.find(
    (z) => z.code === "AGENCIA_OLVA" || z.name.toLowerCase().includes("olva"),
  );
  const isOlvaEnabled = olvaZone ? olvaZone.isAvailable : true;

  const activeAgencies: Array<{
    code: string;
    name: string;
    description: string;
    estimatedDays: string;
  }> = [];

  if (isOlvaEnabled) {
    activeAgencies.push({
      code: "OLVA",
      name: "Olva Courier",
      description: "Despacho a domicilio o entrega en agencias a nivel nacional.",
      estimatedDays: olvaZone?.estimatedDaysLabel ?? "48 a 96 horas hábiles",
    });
  }

  if (isShalomEnabled) {
    activeAgencies.push({
      code: "SHALOM",
      name: "Shalom",
      description: "Recojo rápido en agencias Shalom autorizadas en todas las provincias del país.",
      estimatedDays: shalomZone?.estimatedDaysLabel ?? "24 a 72 horas hábiles",
    });
  }

  return {
    enabledLimaDistricts,
    provinceDestinations,
    activeAgencies,
    isShalomEnabled,
  };
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

export interface PhysicalStoreRecord {
  id: number;
  code: string;
  name: string;
  department: string;
  province: string;
  district: string;
  address: string;
  reference: string | null;
  phone: string | null;
  openingHours: string;
  googleMapsUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

/**
 * Obtiene todas las tiendas físicas activas para el checkout (recojo en tienda).
 */
export async function getActivePhysicalStores(): Promise<PhysicalStoreRecord[]> {
  const db = getDb();
  return db
    .select()
    .from(physicalStores)
    .where(eq(physicalStores.isActive, true))
    .orderBy(asc(physicalStores.sortOrder), asc(physicalStores.id));
}

/**
 * Obtiene todas las tiendas físicas para el panel de administración.
 */
export async function getAllPhysicalStores(): Promise<PhysicalStoreRecord[]> {
  const db = getDb();
  return db
    .select()
    .from(physicalStores)
    .orderBy(asc(physicalStores.sortOrder), asc(physicalStores.id));
}

/**
 * Crea una nueva tienda física oficial desde el panel administrativo.
 */
export async function createPhysicalStore(
  adminId: number,
  input: {
    name: string;
    department: string;
    province: string;
    district: string;
    address: string;
    reference?: string | null;
    phone?: string | null;
    openingHours?: string;
    googleMapsUrl?: string | null;
    isActive?: boolean;
    sortOrder?: number;
  },
): Promise<PhysicalStoreRecord> {
  const db = getDb();
  const rawCode = `TIENDA_${input.district.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${Date.now().toString(36).toUpperCase()}`;
  const [created] = await db
    .insert(physicalStores)
    .values({
      code: rawCode.slice(0, 60),
      name: input.name.trim().slice(0, 150),
      department: input.department.trim().slice(0, 80),
      province: input.province.trim().slice(0, 80),
      district: input.district.trim().slice(0, 80),
      address: input.address.trim().slice(0, 255),
      reference: input.reference?.trim() ? input.reference.trim().slice(0, 255) : null,
      phone: input.phone?.trim() ? input.phone.trim().slice(0, 30) : null,
      openingHours: (input.openingHours?.trim() || "Lunes a Sábado: 10:00 am - 8:00 pm").slice(0, 150),
      googleMapsUrl: input.googleMapsUrl?.trim() ? input.googleMapsUrl.trim() : null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  await db.insert(auditLogs).values({
    actorId: adminId,
    action: "status_change",
    targetType: "physical_store",
    targetId: created.id,
    details: `Nueva tienda física creada: ${created.name} (${created.district}, ${created.department})`,
  });

  return created;
}

/**
 * Actualiza una tienda física existente.
 */
export async function updatePhysicalStore(
  adminId: number,
  storeId: number,
  input: {
    name: string;
    department: string;
    province: string;
    district: string;
    address: string;
    reference?: string | null;
    phone?: string | null;
    openingHours?: string;
    googleMapsUrl?: string | null;
    isActive?: boolean;
    sortOrder?: number;
  },
): Promise<void> {
  const db = getDb();
  await db
    .update(physicalStores)
    .set({
      name: input.name.trim().slice(0, 150),
      department: input.department.trim().slice(0, 80),
      province: input.province.trim().slice(0, 80),
      district: input.district.trim().slice(0, 80),
      address: input.address.trim().slice(0, 255),
      reference: input.reference?.trim() ? input.reference.trim().slice(0, 255) : null,
      phone: input.phone?.trim() ? input.phone.trim().slice(0, 30) : null,
      openingHours: (input.openingHours?.trim() || "Lunes a Sábado: 10:00 am - 8:00 pm").slice(0, 150),
      googleMapsUrl: input.googleMapsUrl?.trim() ? input.googleMapsUrl.trim() : null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(physicalStores.id, storeId));

  await db.insert(auditLogs).values({
    actorId: adminId,
    action: "status_change",
    targetType: "physical_store",
    targetId: storeId,
    details: `Tienda física #${storeId} actualizada por admin`,
  });
}

/**
 * Elimina una tienda física.
 */
export async function deletePhysicalStore(adminId: number, storeId: number): Promise<void> {
  const db = getDb();
  await db.delete(physicalStores).where(eq(physicalStores.id, storeId));
  await db.insert(auditLogs).values({
    actorId: adminId,
    action: "status_change",
    targetType: "physical_store",
    targetId: storeId,
    details: `Tienda física #${storeId} eliminada`,
  });
}

/**
 * Permite al administrador crear una tarifa personalizada para un distrito o provincia.
 */
export async function createShippingZoneRate(
  adminId: number,
  input: {
    name: string;
    department: string;
    province?: string | null;
    district?: string | null;
    rateAmount: number;
    freeShippingMinSubtotal?: number | null;
    estimatedDaysLabel: string;
    isAvailable?: boolean;
    unavailableReason?: string | null;
  },
): Promise<ShippingZoneRecord> {
  const db = getDb();
  const rawCode = `ZONE_${input.department.toUpperCase()}_${(input.province || "ALL").toUpperCase()}_${(input.district || "ALL").toUpperCase()}_${Date.now().toString(36).toUpperCase()}`
    .replace(/[^A-Z0-9]/g, "_")
    .slice(0, 60);

  const [created] = await db
    .insert(shippingZones)
    .values({
      code: rawCode,
      name: input.name.trim().slice(0, 150),
      department: input.department.trim().slice(0, 80),
      province: input.province?.trim() && input.province !== "*" ? input.province.trim().slice(0, 80) : "*",
      district: input.district?.trim() && input.district !== "*" ? input.district.trim().slice(0, 80) : "*",
      rateAmount: Math.max(0, Math.trunc(input.rateAmount)),
      freeShippingMinSubtotal:
        input.freeShippingMinSubtotal !== undefined && input.freeShippingMinSubtotal !== null && input.freeShippingMinSubtotal > 0
          ? Math.trunc(input.freeShippingMinSubtotal)
          : null,
      estimatedDaysLabel: (input.estimatedDaysLabel.trim() || "24 a 48 horas hábiles").slice(0, 120),
      isAvailable: input.isAvailable ?? true,
      unavailableReason: input.unavailableReason?.trim() ? input.unavailableReason.trim().slice(0, 255) : null,
      sortOrder: input.district && input.district !== "*" ? 5 : input.province && input.province !== "*" ? 15 : 25,
      updatedBy: adminId,
    })
    .returning();

  await db.insert(auditLogs).values({
    actorId: adminId,
    action: "shipping_rate_updated",
    targetType: "shipping_zone",
    targetId: created.id,
    details: `Nueva tarifa de envío creada: ${created.name} (${created.department} - ${created.province} - ${created.district}) -> S/ ${(created.rateAmount / 100).toFixed(2)}`,
  });

  return created;
}

/**
 * Elimina una zona de envío personalizada.
 */
export async function deleteShippingZone(adminId: number, zoneId: number): Promise<void> {
  const db = getDb();
  await db.delete(shippingZones).where(eq(shippingZones.id, zoneId));
  await db.insert(auditLogs).values({
    actorId: adminId,
    action: "shipping_rate_updated",
    targetType: "shipping_zone",
    targetId: zoneId,
    details: `Tarifa de envío #${zoneId} eliminada`,
  });
}
