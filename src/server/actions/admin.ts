"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { businessApplications, users, auditLogs } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import {
  sendWholesaleApprovedEmail,
  sendWholesaleRejectedEmail,
  sendWholesaleSuspendedEmail,
} from "@/server/email";
import type { ActionResult } from "./auth";

async function getClientContext(): Promise<{ ipAddress?: string; baseUrl: string }> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : (headerList.get("x-real-ip") ?? undefined);
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { ipAddress, baseUrl: `${proto}://${host}` };
}

export type AllowedReviewStatus = "under_review" | "approved" | "rejected" | "suspended";

/**
 * Acción de administración para revisar, aprobar, rechazar o suspender una solicitud B2B.
 * Protegida estrictamente en el servidor: solo accesible para rol 'admin'.
 */
export async function reviewApplicationAction({
  applicationId,
  newStatus,
  internalNotes,
  rejectionReason,
}: {
  applicationId: number;
  newStatus: AllowedReviewStatus;
  internalNotes?: string;
  rejectionReason?: string;
}): Promise<ActionResult> {
  const { user: adminUser } = await requireAdmin();
  const db = getDb();

  const found = await db
    .select({
      app: businessApplications,
      user: users,
    })
    .from(businessApplications)
    .innerJoin(users, eq(businessApplications.userId, users.id))
    .where(eq(businessApplications.id, applicationId))
    .limit(1);

  if (found.length === 0) {
    return { success: false, error: "Solicitud no encontrada" };
  }

  const { app, user: applicantUser } = found[0];
  const now = new Date();
  const { ipAddress, baseUrl } = await getClientContext();

  if (newStatus === "approved") {
    // 1. Aprobar solicitud y ascender al usuario a 'business_approved'
    await db
      .update(businessApplications)
      .set({
        status: "approved",
        reviewedBy: adminUser.id,
        reviewedAt: now,
        internalNotes: internalNotes || app.internalNotes,
        rejectionReason: null,
        updatedAt: now,
      })
      .where(eq(businessApplications.id, app.id));

    await db
      .update(users)
      .set({
        role: "business_approved",
        updatedAt: now,
      })
      .where(eq(users.id, applicantUser.id));

    await db.insert(auditLogs).values({
      actorId: adminUser.id,
      action: "status_change",
      targetType: "business_application",
      targetId: app.id,
      details: `Solicitud #${app.id} de ${app.legalName} APROBADA por admin #${adminUser.id}. Rol del usuario #${applicantUser.id} actualizado a business_approved.`,
      ipAddress: ipAddress ?? null,
    });

    sendWholesaleApprovedEmail(app.contactEmail, app.contactName, app.legalName, baseUrl).catch((e) =>
      console.error("[Admin] Error al notificar aprobación B2B:", e),
    );
  } else if (newStatus === "rejected") {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      return { success: false, error: "Debes indicar un motivo de rechazo claro (mínimo 5 caracteres)" };
    }

    await db
      .update(businessApplications)
      .set({
        status: "rejected",
        reviewedBy: adminUser.id,
        reviewedAt: now,
        internalNotes: internalNotes || app.internalNotes,
        rejectionReason: rejectionReason.trim(),
        updatedAt: now,
      })
      .where(eq(businessApplications.id, app.id));

    // Si el usuario estaba pendiente, devolver su rol a customer
    if (applicantUser.role === "business_pending") {
      await db
        .update(users)
        .set({ role: "customer", updatedAt: now })
        .where(eq(users.id, applicantUser.id));
    }

    await db.insert(auditLogs).values({
      actorId: adminUser.id,
      action: "status_change",
      targetType: "business_application",
      targetId: app.id,
      details: `Solicitud #${app.id} RECHAZADA. Motivo: ${rejectionReason.trim()}`,
      ipAddress: ipAddress ?? null,
    });

    sendWholesaleRejectedEmail(app.contactEmail, app.contactName, app.legalName, rejectionReason.trim()).catch((e) =>
      console.error("[Admin] Error al notificar rechazo B2B:", e),
    );
  } else if (newStatus === "suspended") {
    await db
      .update(businessApplications)
      .set({
        status: "suspended",
        reviewedBy: adminUser.id,
        reviewedAt: now,
        internalNotes: internalNotes || app.internalNotes,
        rejectionReason: rejectionReason || app.rejectionReason,
        updatedAt: now,
      })
      .where(eq(businessApplications.id, app.id));

    // Revocar privilegios mayoristas
    await db
      .update(users)
      .set({ role: "customer", updatedAt: now })
      .where(eq(users.id, applicantUser.id));

    await db.insert(auditLogs).values({
      actorId: adminUser.id,
      action: "role_change",
      targetType: "business_application",
      targetId: app.id,
      details: `Acceso mayorista SUSPENDIDO para empresa #${app.id} (${app.legalName}). Rol revocado a customer.`,
      ipAddress: ipAddress ?? null,
    });

    sendWholesaleSuspendedEmail(app.contactEmail, app.contactName, app.legalName, rejectionReason).catch((e) =>
      console.error("[Admin] Error al notificar suspensión B2B:", e),
    );
  } else if (newStatus === "under_review") {
    await db
      .update(businessApplications)
      .set({
        status: "under_review",
        reviewedBy: adminUser.id,
        internalNotes: internalNotes || app.internalNotes,
        updatedAt: now,
      })
      .where(eq(businessApplications.id, app.id));

    await db.insert(auditLogs).values({
      actorId: adminUser.id,
      action: "status_change",
      targetType: "business_application",
      targetId: app.id,
      details: `Solicitud #${app.id} pasada a estado 'under_review'`,
      ipAddress: ipAddress ?? null,
    });
  }

  revalidatePath("/admin/solicitudes");
  revalidatePath(`/admin/solicitudes/${app.id}`);
  revalidatePath("/cuenta");
  revalidatePath("/catalogo");

  return { success: true, data: "Estado de la solicitud actualizado correctamente" };
}
