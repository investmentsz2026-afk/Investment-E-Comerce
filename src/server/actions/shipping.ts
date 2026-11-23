"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import {
  createPhysicalStore,
  updatePhysicalStore,
  deletePhysicalStore,
  createShippingZoneRate,
  updateShippingZoneConfig,
  deleteShippingZone,
} from "@/server/shipping/service";
import type { ActionResult } from "./auth";

// ──────────────────────────────────────────────────────────────
// GESTIÓN DE TARIFAS DE ENVÍO POR DEPARTAMENTO, PROVINCIA Y DISTRITO
// ──────────────────────────────────────────────────────────────

export interface SaveShippingRateInput {
  zoneId?: number | null;
  name: string;
  department: string;
  province?: string | null;
  district?: string | null;
  rateSoles: number;
  freeShippingMinSoles?: number | null;
  estimatedDaysLabel: string;
  isAvailable: boolean;
  unavailableReason?: string | null;
}

export async function saveShippingRateAction(
  input: SaveShippingRateInput,
): Promise<ActionResult<{ zoneId: number }>> {
  const { user: admin } = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Acceso no autorizado: se requieren credenciales de administrador." };
  }

  const name = (input.name ?? "").trim();
  const department = (input.department ?? "").trim();
  if (!name || !department) {
    return { success: false, error: "Ingresa el nombre descriptivo y el departamento de la tarifa." };
  }

  const rateAmountCents = Math.max(0, Math.round((Number(input.rateSoles) || 0) * 100));
  const freeShippingMinCents =
    input.freeShippingMinSoles !== undefined &&
    input.freeShippingMinSoles !== null &&
    Number(input.freeShippingMinSoles) > 0
      ? Math.round(Number(input.freeShippingMinSoles) * 100)
      : null;

  try {
    if (input.zoneId && Number(input.zoneId) > 0) {
      await updateShippingZoneConfig(admin.id, Number(input.zoneId), {
        name,
        department,
        province: input.province?.trim() || "*",
        district: input.district?.trim() || "*",
        rateAmount: rateAmountCents,
        freeShippingMinSubtotal: freeShippingMinCents,
        estimatedDaysLabel: (input.estimatedDaysLabel ?? "24 a 48 horas").trim(),
        isAvailable: Boolean(input.isAvailable),
        unavailableReason: input.unavailableReason?.trim() || null,
      });

      revalidatePath("/admin/envios");
      revalidatePath("/admin/pedidos");
      revalidatePath("/checkout");
      revalidatePath("/producto/[slug]", "page");

      return { success: true, data: { zoneId: Number(input.zoneId) } };
    } else {
      const created = await createShippingZoneRate(admin.id, {
        name,
        department,
        province: input.province?.trim() || "*",
        district: input.district?.trim() || "*",
        rateAmount: rateAmountCents,
        freeShippingMinSubtotal: freeShippingMinCents,
        estimatedDaysLabel: (input.estimatedDaysLabel ?? "24 a 48 horas").trim(),
        isAvailable: Boolean(input.isAvailable),
        unavailableReason: input.unavailableReason?.trim() || null,
      });

      revalidatePath("/admin/envios");
      revalidatePath("/admin/pedidos");
      revalidatePath("/checkout");
      revalidatePath("/producto/[slug]", "page");

      return { success: true, data: { zoneId: created.id } };
    }
  } catch (error) {
    console.error("Error guardando tarifa de envío:", error);
    return { success: false, error: "Ocurrió un error al guardar la tarifa de envío en PostgreSQL." };
  }
}

export async function deleteShippingRateAction(zoneId: number): Promise<ActionResult<void>> {
  const { user: admin } = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Acceso no autorizado." };
  }

  try {
    await deleteShippingZone(admin.id, zoneId);
    revalidatePath("/admin/envios");
    revalidatePath("/admin/pedidos");
    revalidatePath("/checkout");
    revalidatePath("/producto/[slug]", "page");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando zona de envío:", error);
    return { success: false, error: "No se pudo eliminar la tarifa de envío." };
  }
}

// ──────────────────────────────────────────────────────────────
// GESTIÓN DE TIENDAS FÍSICAS (PUNTOS DE RECOJO AMERICAN COLT)
// ──────────────────────────────────────────────────────────────

export interface SavePhysicalStoreInput {
  storeId?: number | null;
  name: string;
  department: string;
  province: string;
  district: string;
  address: string;
  reference?: string | null;
  phone?: string | null;
  openingHours?: string;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
  sortOrder?: number;
}

export async function savePhysicalStoreAction(
  input: SavePhysicalStoreInput,
): Promise<ActionResult<{ storeId: number }>> {
  const { user: admin } = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Acceso no autorizado: se requieren credenciales de administrador." };
  }

  const name = (input.name ?? "").trim();
  const district = (input.district ?? "").trim();
  const address = (input.address ?? "").trim();

  if (!name || !district || !address) {
    return { success: false, error: "Completa el nombre de la tienda, distrito y dirección exacta." };
  }

  try {
    if (input.storeId && Number(input.storeId) > 0) {
      await updatePhysicalStore(admin.id, Number(input.storeId), {
        name,
        department: (input.department ?? "Lima").trim(),
        province: (input.province ?? "Lima").trim(),
        district,
        address,
        reference: input.reference?.trim() || null,
        phone: input.phone?.trim() || null,
        openingHours: input.openingHours?.trim() || "Lunes a Sábado: 10:00 am - 8:00 pm",
        googleMapsUrl: input.googleMapsUrl?.trim() || null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        isActive: input.isActive ?? true,
        sortOrder: Number(input.sortOrder) || 0,
      });

      revalidatePath("/admin/tiendas");
      revalidatePath("/checkout");
      revalidatePath("/tiendas");
      revalidatePath("/");

      return { success: true, data: { storeId: Number(input.storeId) } };
    } else {
      const created = await createPhysicalStore(admin.id, {
        name,
        department: (input.department ?? "Lima").trim(),
        province: (input.province ?? "Lima").trim(),
        district,
        address,
        reference: input.reference?.trim() || null,
        phone: input.phone?.trim() || null,
        openingHours: input.openingHours?.trim() || "Lunes a Sábado: 10:00 am - 8:00 pm",
        googleMapsUrl: input.googleMapsUrl?.trim() || null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        isActive: input.isActive ?? true,
        sortOrder: Number(input.sortOrder) || 0,
      });

      revalidatePath("/admin/tiendas");
      revalidatePath("/checkout");
      revalidatePath("/tiendas");
      revalidatePath("/");

      return { success: true, data: { storeId: created.id } };
    }
  } catch (error) {
    console.error("Error guardando tienda física:", error);
    return { success: false, error: "Ocurrió un error al guardar la tienda física en PostgreSQL." };
  }
}

export async function deletePhysicalStoreAction(storeId: number): Promise<ActionResult<void>> {
  const { user: admin } = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Acceso no autorizado." };
  }

  try {
    await deletePhysicalStore(admin.id, storeId);
    revalidatePath("/admin/tiendas");
    revalidatePath("/checkout");
    revalidatePath("/tiendas");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando tienda física:", error);
    return { success: false, error: "No se pudo eliminar la tienda física." };
  }
}
