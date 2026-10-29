"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { users, userAddresses, auditLogs } from "@/server/db/schema";
import { getCurrentSession, invalidateOtherUserSessions } from "@/server/auth/session";
import { hashPassword, verifyPassword } from "@/server/auth/crypto";
import {
  validateName,
  validatePassword,
  validatePhone,
} from "@/server/auth/validators";
import type { ActionResult } from "./auth";

/**
 * Actualiza los datos personales permitidos del cliente (nombre, apellidos, teléfono).
 */
export async function updateProfileAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    return { success: false, error: "Debes iniciar sesión para realizar esta acción" };
  }

  const firstName = (formData.get("firstName") as string) ?? "";
  const lastName = (formData.get("lastName") as string) ?? "";
  const phone = (formData.get("phone") as string) ?? "";

  const nameVal = validateName(firstName, "nombre");
  if (!nameVal.valid) return { success: false, error: nameVal.error };

  const lastVal = validateName(lastName, "apellidos");
  if (!lastVal.valid) return { success: false, error: lastVal.error };

  const phoneVal = validatePhone(phone, false);
  if (!phoneVal.valid) return { success: false, error: phoneVal.error };

  const db = getDb();
  const now = new Date();

  await db
    .update(users)
    .set({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || null,
      updatedAt: now,
    })
    .where(eq(users.id, user.id));

  await db.insert(auditLogs).values({
    actorId: user.id,
    action: "profile_update",
    targetType: "user",
    targetId: user.id,
    details: "Datos de perfil actualizados por el usuario",
  });

  revalidatePath("/cuenta");
  return { success: true, data: "Tus datos se actualizaron correctamente" };
}

/**
 * Cambio de contraseña desde la sección de seguridad del cliente.
 */
export async function changePasswordAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    return { success: false, error: "Debes iniciar sesión para realizar esta acción" };
  }

  const currentPassword = (formData.get("currentPassword") as string) ?? "";
  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (!currentPassword) {
    return { success: false, error: "Ingresa tu contraseña actual" };
  }

  const passVal = validatePassword(newPassword);
  if (!passVal.valid) return { success: false, error: passVal.error };

  if (newPassword !== confirmPassword) {
    return { success: false, error: "La nueva contraseña y su confirmación no coinciden" };
  }

  const db = getDb();
  const fullUser = (
    await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
  )[0];

  if (!fullUser) {
    return { success: false, error: "Usuario no encontrado" };
  }

  const valid = await verifyPassword(currentPassword, fullUser.passwordHash);
  if (!valid) {
    return { success: false, error: "La contraseña actual es incorrecta" };
  }

  const newHash = await hashPassword(newPassword);
  const now = new Date();

  await db
    .update(users)
    .set({
      passwordHash: newHash,
      updatedAt: now,
    })
    .where(eq(users.id, user.id));

  // Revocar todas las demás sesiones activas del usuario por seguridad
  await invalidateOtherUserSessions(user.id, session.id);

  await db.insert(auditLogs).values({
    actorId: user.id,
    action: "password_change",
    targetType: "user",
    targetId: user.id,
    details: "Contraseña cambiada exitosamente desde el panel de seguridad (otras sesiones revocadas)",
  });

  revalidatePath("/cuenta/seguridad");
  return { success: true, data: "Tu contraseña ha sido actualizada con éxito" };
}

/**
 * Guarda una nueva dirección en la libreta de direcciones del usuario.
 */
export async function createAddressAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    return { success: false, error: "Debes iniciar sesión para guardar direcciones" };
  }

  const title = ((formData.get("title") as string) ?? "Principal").trim();
  const recipientName = ((formData.get("recipientName") as string) ?? "").trim();
  const recipientPhone = ((formData.get("recipientPhone") as string) ?? "").trim();
  const addressLine1 = ((formData.get("addressLine1") as string) ?? "").trim();
  const addressLine2 = ((formData.get("addressLine2") as string) ?? "").trim();
  const reference = ((formData.get("reference") as string) ?? "").trim();
  const department = ((formData.get("department") as string) ?? "").trim();
  const province = ((formData.get("province") as string) ?? "").trim();
  const district = ((formData.get("district") as string) ?? "").trim();
  const postalCode = ((formData.get("postalCode") as string) ?? "").trim();
  const isDefault = formData.get("isDefault") === "on" || formData.get("isDefault") === "true";

  if (!recipientName) return { success: false, error: "El nombre de quien recibe es obligatorio" };
  const phoneVal = validatePhone(recipientPhone, true);
  if (!phoneVal.valid) return { success: false, error: phoneVal.error };
  if (!addressLine1) return { success: false, error: "La dirección de entrega es obligatoria" };
  if (!department) return { success: false, error: "El departamento es obligatorio" };
  if (!province) return { success: false, error: "La provincia es obligatoria" };
  if (!district) return { success: false, error: "El distrito es obligatorio" };

  const db = getDb();

  // Si se marca como predeterminada, desmarcar las existentes
  if (isDefault) {
    await db
      .update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, user.id));
  }

  // Si es la primera dirección, marcarla como default automáticamente
  const existingCount = await db
    .select({ id: userAddresses.id })
    .from(userAddresses)
    .where(eq(userAddresses.userId, user.id));

  const shouldBeDefault = isDefault || existingCount.length === 0;

  const [inserted] = await db
    .insert(userAddresses)
    .values({
      userId: user.id,
      title: title || "Principal",
      recipientName,
      recipientPhone,
      addressLine1,
      addressLine2: addressLine2 || null,
      reference: reference || null,
      department,
      province,
      district,
      postalCode: postalCode || null,
      isDefault: shouldBeDefault,
    })
    .returning();

  await db.insert(auditLogs).values({
    actorId: user.id,
    action: "address_created",
    targetType: "user_address",
    targetId: inserted.id,
    details: `Dirección "${inserted.title}" creada (${district}, ${province})`,
  });

  revalidatePath("/cuenta/direcciones");
  return { success: true, data: "Dirección registrada correctamente" };
}

/**
 * Establece una dirección como predeterminada verificando que pertenezca al usuario.
 */
export async function setDefaultAddressAction(addressId: number): Promise<ActionResult> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    return { success: false, error: "No autorizado" };
  }

  const db = getDb();
  const target = await db
    .select({ id: userAddresses.id })
    .from(userAddresses)
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, user.id)))
    .limit(1);

  if (target.length === 0) {
    return { success: false, error: "Dirección no encontrada o no tienes permisos para modificarla" };
  }

  await db
    .update(userAddresses)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(eq(userAddresses.userId, user.id));

  await db
    .update(userAddresses)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, user.id)));

  revalidatePath("/cuenta/direcciones");
  return { success: true, data: "Dirección predeterminada actualizada" };
}

/**
 * Elimina una dirección de entrega verificando la pertenencia al usuario.
 */
export async function deleteAddressAction(addressId: number): Promise<ActionResult> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    return { success: false, error: "No autorizado" };
  }

  const db = getDb();
  const deleted = await db
    .delete(userAddresses)
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, user.id)))
    .returning();

  if (deleted.length === 0) {
    return { success: false, error: "Dirección no encontrada o no tienes permisos para eliminarla" };
  }

  const removed = deleted[0];
  if (removed.isDefault) {
    const remaining = await db
      .select({ id: userAddresses.id })
      .from(userAddresses)
      .where(eq(userAddresses.userId, user.id))
      .orderBy(desc(userAddresses.createdAt))
      .limit(1);

    if (remaining.length > 0) {
      await db
        .update(userAddresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(userAddresses.id, remaining[0].id));
    }
  }

  await db.insert(auditLogs).values({
    actorId: user.id,
    action: "address_deleted",
    targetType: "user_address",
    targetId: removed.id,
    details: `Dirección "${removed.title}" eliminada`,
  });

  revalidatePath("/cuenta/direcciones");
  return { success: true, data: "Dirección eliminada" };
}
