"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { productReturns } from "@/server/db/schema";
import { getCurrentSession, requireAdmin } from "@/server/auth/session";
import type { ActionResult } from "./auth";

export interface SubmitReturnInput {
  orderNumber: string;
  taxDocNumber?: string;
  requestType?: string;
  reason: string;
  currentProductDetails: string;
  requestedProductDetails: string;
  customerNotes?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  images?: string[];
}

export interface ReturnTicketData {
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderNumber: string;
  taxDocNumber: string;
  reason: string;
  currentProductDetails: string;
  requestedProductDetails: string;
  customerNotes: string;
}

/**
 * Registra una solicitud de cambio o devolución de prenda asociada a un usuario autenticado.
 */
export async function submitProductReturnAction(
  input: SubmitReturnInput,
): Promise<ActionResult<ReturnTicketData>> {
  const { user } = await getCurrentSession();

  if (!user) {
    return {
      success: false,
      error: "Debes iniciar sesión en tu cuenta para registrar una solicitud de cambio o devolución.",
    };
  }

  const orderNumber = String(input.orderNumber ?? "").trim().toUpperCase();
  if (orderNumber.length < 3) {
    return {
      success: false,
      error: "Ingresa un número de pedido válido (ej: ORD-2026-XXXX).",
    };
  }

  const reason = String(input.reason ?? "").trim();
  if (reason.length < 3) {
    return {
      success: false,
      error: "Por favor selecciona o especifica el motivo del cambio.",
    };
  }

  const currentProductDetails = String(input.currentProductDetails ?? "").trim();
  if (currentProductDetails.length < 3) {
    return {
      success: false,
      error: "Por favor especifica la prenda y talla actual que recibiste.",
    };
  }

  const requestedProductDetails = String(input.requestedProductDetails ?? "").trim();
  if (requestedProductDetails.length < 3) {
    return {
      success: false,
      error: "Por favor especifica la nueva talla o modelo que solicitas.",
    };
  }

  const customerName = (
    String(input.customerName ?? "").trim() ||
    `${user.firstName} ${user.lastName}`.trim() ||
    "Cliente American Colt"
  ).slice(0, 150);

  const customerEmail = (
    String(input.customerEmail ?? "").trim() || user.email
  ).slice(0, 255);

  const customerPhone = (
    String(input.customerPhone ?? "").trim() || user.phone || ""
  ).slice(0, 30);

  const taxDocNumber = String(input.taxDocNumber ?? "").trim().slice(0, 60);
  const customerNotes = String(input.customerNotes ?? "").trim();
  const requestType = String(input.requestType ?? "cambio_talla").trim();

  // Filtrar y limitar imágenes adjuntas
  const rawImages = Array.isArray(input.images) ? input.images : [];
  const safeImages = rawImages
    .filter((img) => typeof img === "string" && img.length > 50)
    .slice(0, 5);

  try {
    const db = getDb();
    const now = new Date();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ticketNumber = `CAMB-${now.getFullYear()}-${randomHex}`;

    await db.insert(productReturns).values({
      ticketNumber,
      userId: user.id,
      customerName,
      customerEmail,
      customerPhone,
      orderNumber,
      taxDocNumber,
      requestType,
      reason,
      currentProductDetails,
      requestedProductDetails,
      customerNotes,
      images: JSON.stringify(safeImages),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/admin/cambios");
    revalidatePath("/admin");
    revalidatePath("/cambios-y-devoluciones");
    revalidatePath("/cuenta/pedidos");

    return {
      success: true,
      data: {
        ticketNumber,
        customerName,
        customerEmail,
        customerPhone,
        orderNumber,
        taxDocNumber,
        reason,
        currentProductDetails,
        requestedProductDetails,
        customerNotes,
      },
    };
  } catch (e) {
    console.error("[ProductReturns] Error al registrar cambio:", e);
    return {
      success: false,
      error: "No se pudo registrar tu solicitud en este momento. Intenta nuevamente.",
    };
  }
}

/**
 * Permite al administrador actualizar el estado y notas de una solicitud de cambio.
 */
export async function updateProductReturnStatusAction(input: {
  id: number;
  status: string;
  adminNotes?: string;
}): Promise<ActionResult<{ id: number; status: string }>> {
  await requireAdmin();
  const id = Number(input.id);
  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, error: "Identificador de solicitud inválido." };
  }

  const validStatuses = ["pending", "in_review", "approved", "completed", "rejected"];
  const status = String(input.status ?? "").trim();
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Estado de solicitud inválido." };
  }

  const adminNotes = String(input.adminNotes ?? "").trim();

  try {
    const db = getDb();
    await db
      .update(productReturns)
      .set({
        status,
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(productReturns.id, id));

    revalidatePath("/admin/cambios");
    revalidatePath("/admin");
    revalidatePath("/cambios-y-devoluciones");

    return {
      success: true,
      data: { id, status },
    };
  } catch (e) {
    console.error("[ProductReturns] Error al actualizar estado:", e);
    return {
      success: false,
      error: "No se pudo actualizar la solicitud.",
    };
  }
}

/**
 * Permite al administrador eliminar una solicitud de cambio.
 */
export async function deleteProductReturnAction(input: {
  id: number;
}): Promise<ActionResult<{ id: number }>> {
  await requireAdmin();
  const id = Number(input.id);
  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, error: "Identificador de solicitud inválido." };
  }

  try {
    const db = getDb();
    await db.delete(productReturns).where(eq(productReturns.id, id));

    revalidatePath("/admin/cambios");
    revalidatePath("/admin");

    return {
      success: true,
      data: { id },
    };
  } catch (e) {
    console.error("[ProductReturns] Error al eliminar solicitud:", e);
    return {
      success: false,
      error: "No se pudo eliminar la solicitud.",
    };
  }
}
