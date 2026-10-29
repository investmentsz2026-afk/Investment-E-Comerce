"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import { businessApplications, users, auditLogs, emailVerificationTokens } from "@/server/db/schema";
import { getCurrentSession, createSession } from "@/server/auth/session";
import { mergeGuestCartWithUserCart } from "@/server/cart/service";
import { hashPassword, generateSecureToken, hashSecureToken } from "@/server/auth/crypto";
import {
  validateEmail,
  validateName,
  validatePhone,
  validatePassword,
  validateRucFormat,
  normalizeEmail,
} from "@/server/auth/validators";
import { checkRateLimit, recordFailedAttempt } from "@/server/auth/rate-limit";
import { sendWholesaleReceivedEmail, sendVerificationEmail } from "@/server/email";
import type { ActionResult } from "./auth";

async function getClientContext(): Promise<{ ipAddress?: string; userAgent?: string; baseUrl: string }> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : (headerList.get("x-real-ip") ?? undefined);
    const userAgent = headerList.get("user-agent") ?? undefined;
    const host = headerList.get("host") ?? "localhost:3000";
    const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return { ipAddress, userAgent, baseUrl: `${proto}://${host}` };
  } catch {
    return { baseUrl: "http://localhost:3000" };
  }
}

/**
 * Registro directo de empresa y creación de cuenta comercial B2B.
 * Permite registrar a una empresa con sus datos tributarios, contacto y credenciales de acceso.
 */
export async function registerWholesaleCompanyAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ applicationId: number }>> {
  const { session, user } = await getCurrentSession();

  // Si ya tiene sesión activa, usar el flujo directo con su usuario
  if (session && user) {
    return submitWholesaleApplicationAction(_prevState, formData);
  }

  const legalName = ((formData.get("legalName") as string) ?? "").trim();
  const tradeName = ((formData.get("tradeName") as string) ?? "").trim();
  const taxId = ((formData.get("taxId") as string) ?? "").trim();
  const contactName = ((formData.get("contactName") as string) ?? "").trim();
  const contactEmailRaw = ((formData.get("contactEmail") as string) ?? "").trim();
  const contactPhone = ((formData.get("contactPhone") as string) ?? "").trim();
  const password = ((formData.get("password") as string) ?? "");
  const confirmPassword = ((formData.get("confirmPassword") as string) ?? "");
  const businessType = ((formData.get("businessType") as string) ?? "").trim();
  const addressLine = ((formData.get("addressLine") as string) ?? "").trim();
  const department = ((formData.get("department") as string) ?? "").trim();
  const province = ((formData.get("province") as string) ?? "").trim();
  const district = ((formData.get("district") as string) ?? "").trim();
  const estimatedVolume = ((formData.get("estimatedVolume") as string) ?? "").trim();
  const additionalNotes = ((formData.get("additionalNotes") as string) ?? "").trim();
  const termsAccepted = formData.get("termsAccepted");

  if (!termsAccepted || (termsAccepted !== "on" && termsAccepted !== "true")) {
    return {
      success: false,
      error: "Debes aceptar los términos y condiciones comerciales para mayoristas",
    };
  }

  if (!legalName || legalName.length < 3) {
    return { success: false, error: "La razón social de la empresa es obligatoria (mínimo 3 caracteres)" };
  }
  if (!tradeName || tradeName.length < 2) {
    return { success: false, error: "El nombre comercial de la empresa es obligatorio" };
  }

  const rucVal = validateRucFormat(taxId);
  if (!rucVal.valid) return { success: false, error: rucVal.error };

  const nameVal = validateName(contactName, "representante / contacto");
  if (!nameVal.valid) return { success: false, error: nameVal.error };

  const emailVal = validateEmail(contactEmailRaw);
  if (!emailVal.valid) return { success: false, error: emailVal.error };
  const contactEmail = normalizeEmail(contactEmailRaw);

  const phoneVal = validatePhone(contactPhone, true);
  if (!phoneVal.valid) return { success: false, error: phoneVal.error };

  const passVal = validatePassword(password);
  if (!passVal.valid) return { success: false, error: passVal.error };

  if (password !== confirmPassword) {
    return { success: false, error: "Las contraseñas ingresadas no coinciden" };
  }

  if (!businessType) return { success: false, error: "Selecciona el tipo de negocio o actividad comercial" };
  if (!addressLine) return { success: false, error: "La dirección comercial o fiscal es obligatoria" };
  if (!department) return { success: false, error: "El departamento es obligatorio" };
  if (!province) return { success: false, error: "La provincia es obligatoria" };
  if (!district) return { success: false, error: "El distrito es obligatorio" };
  if (!estimatedVolume) return { success: false, error: "Selecciona tu volumen de compra mensual estimado" };

  const { ipAddress, userAgent, baseUrl } = await getClientContext();
  const rateKey = `wholesale_reg:${ipAddress ?? "local"}`;
  const rateCheck = checkRateLimit(rateKey, 8, 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Demasiadas solicitudes desde esta conexión. Inténtalo de nuevo en ${rateCheck.retryAfterSeconds} segundos.`,
    };
  }
  recordFailedAttempt(rateKey, 8, 60 * 60 * 1000);

  const cleanRuc = taxId.replace(/\D/g, "");
  const db = getDb();

  // 1. Verificar si el correo ya está registrado en users
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, contactEmail))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      success: false,
      error: "Ya existe una cuenta registrada con este correo electrónico. Inicia sesión para presentar la solicitud comercial de tu empresa.",
    };
  }

  // 2. Verificar si el RUC ya tiene una solicitud activa, aprobada o suspendida
  const existingApp = await db
    .select({ id: businessApplications.id, status: businessApplications.status })
    .from(businessApplications)
    .where(
      and(
        eq(businessApplications.taxId, cleanRuc),
        inArray(businessApplications.status, ["pending", "under_review", "approved", "suspended"]),
      ),
    )
    .limit(1);

  if (existingApp.length > 0) {
    const st = existingApp[0].status;
    if (st === "approved") {
      return { success: false, error: "Este RUC ya cuenta con condición mayorista aprobada en INVESTMENTS." };
    }
    if (st === "suspended") {
      return {
        success: false,
        error: "El acceso mayorista para este RUC se encuentra suspendido. Comunícate con nuestro departamento comercial.",
      };
    }
    return {
      success: false,
      error: "Ya existe una solicitud en revisión para este RUC. Nuestro equipo comercial responderá a la brevedad.",
    };
  }

  // 3. Crear usuario con rol business_pending
  const passwordHash = await hashPassword(password);
  const nameParts = contactName.trim().split(/\s+/);
  const firstName = nameParts[0] || "Representante";
  const lastName = nameParts.slice(1).join(" ") || "Comercial";

  const [newUser] = await db
    .insert(users)
    .values({
      email: contactEmail,
      passwordHash,
      firstName,
      lastName,
      phone: contactPhone,
      role: "business_pending",
      isActive: true,
      emailVerifiedAt: null,
    })
    .returning();

  // 4. Crear solicitud empresarial
  const [newApp] = await db
    .insert(businessApplications)
    .values({
      userId: newUser.id,
      legalName,
      tradeName,
      taxId: cleanRuc,
      contactName,
      contactEmail,
      contactPhone,
      businessType,
      addressLine,
      department,
      province,
      district,
      estimatedVolume,
      additionalNotes: additionalNotes || null,
      status: "pending",
    })
    .returning();

  // 5. Token de verificación de correo
  const verifToken = generateSecureToken(32);
  const verifHash = hashSecureToken(verifToken);
  const verifExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(emailVerificationTokens).values({
    userId: newUser.id,
    tokenHash: verifHash,
    email: contactEmail,
    expiresAt: verifExpires,
  });

  // 6. Auditoría
  await db.insert(auditLogs).values({
    actorId: newUser.id,
    action: "application_created",
    targetType: "business_application",
    targetId: newApp.id,
    details: `Registro directo y solicitud B2B para ${legalName} (RUC ${cleanRuc}) por ${contactName}`,
  });

  // 7. Correos en segundo plano
  sendWholesaleReceivedEmail(contactEmail, contactName, legalName).catch((e) =>
    console.error("[Wholesale] Error al enviar confirmación de solicitud:", e),
  );
  sendVerificationEmail(contactEmail, firstName, verifToken, baseUrl).catch((e) =>
    console.error("[Wholesale] Error al enviar verificación:", e),
  );

  // 8. Iniciar sesión automáticamente y fusionar carrito temporal si existiera
  await createSession(newUser.id, { userAgent, ipAddress });
  await mergeGuestCartWithUserCart(newUser.id);

  revalidatePath("/mayorista/solicitud");
  revalidatePath("/cuenta");
  revalidatePath("/admin/solicitudes");

  return {
    success: true,
    data: { applicationId: newApp.id },
  };
}

/**
 * Presentación de solicitud de cuenta comercial mayorista (B2B) para usuario autenticado.
 */
export async function submitWholesaleApplicationAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ applicationId: number }>> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    return {
      success: false,
      error: "Debes iniciar sesión con tu cuenta de usuario para presentar una solicitud comercial",
    };
  }

  const legalName = ((formData.get("legalName") as string) ?? "").trim();
  const tradeName = ((formData.get("tradeName") as string) ?? "").trim();
  const taxId = ((formData.get("taxId") as string) ?? "").trim();
  const contactName = ((formData.get("contactName") as string) ?? "").trim();
  const contactEmail = ((formData.get("contactEmail") as string) ?? "").trim();
  const contactPhone = ((formData.get("contactPhone") as string) ?? "").trim();
  const businessType = ((formData.get("businessType") as string) ?? "").trim();
  const addressLine = ((formData.get("addressLine") as string) ?? "").trim();
  const department = ((formData.get("department") as string) ?? "").trim();
  const province = ((formData.get("province") as string) ?? "").trim();
  const district = ((formData.get("district") as string) ?? "").trim();
  const estimatedVolume = ((formData.get("estimatedVolume") as string) ?? "").trim();
  const additionalNotes = ((formData.get("additionalNotes") as string) ?? "").trim();
  const termsAccepted = formData.get("termsAccepted");

  if (!termsAccepted || (termsAccepted !== "on" && termsAccepted !== "true")) {
    return {
      success: false,
      error: "Debes aceptar los términos y condiciones comerciales para mayoristas",
    };
  }

  if (!legalName || legalName.length < 3) {
    return { success: false, error: "La razón social de la empresa es requerida (mínimo 3 caracteres)" };
  }
  if (!tradeName || tradeName.length < 2) {
    return { success: false, error: "El nombre comercial de la empresa es requerido" };
  }

  const rucVal = validateRucFormat(taxId);
  if (!rucVal.valid) return { success: false, error: rucVal.error };

  const nameVal = validateName(contactName, "representante / contacto");
  if (!nameVal.valid) return { success: false, error: nameVal.error };

  const emailVal = validateEmail(contactEmail);
  if (!emailVal.valid) return { success: false, error: emailVal.error };

  const phoneVal = validatePhone(contactPhone, true);
  if (!phoneVal.valid) return { success: false, error: phoneVal.error };

  if (!businessType) return { success: false, error: "Selecciona el tipo de negocio o actividad comercial" };
  if (!addressLine) return { success: false, error: "La dirección comercial o fiscal es obligatoria" };
  if (!department) return { success: false, error: "El departamento es obligatorio" };
  if (!province) return { success: false, error: "La provincia es obligatoria" };
  if (!district) return { success: false, error: "El distrito es obligatorio" };
  if (!estimatedVolume) return { success: false, error: "Selecciona tu volumen de compra mensual estimado" };

  const db = getDb();

  // Comprobar estado previo
  const existing = await db
    .select({ id: businessApplications.id, status: businessApplications.status })
    .from(businessApplications)
    .where(
      and(
        eq(businessApplications.userId, user.id),
        inArray(businessApplications.status, ["pending", "under_review", "approved", "suspended"]),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const st = existing[0].status;
    if (st === "approved") {
      return { success: false, error: "Tu cuenta ya cuenta con la condición mayorista aprobada" };
    }
    if (st === "suspended") {
      return {
        success: false,
        error: "El acceso mayorista para tu empresa se encuentra suspendido. Comunícate con nuestro departamento comercial.",
      };
    }
    return {
      success: false,
      error: "Ya tienes una solicitud en evaluación. Nuestro equipo te responderá en breve.",
    };
  }

  const [newApp] = await db
    .insert(businessApplications)
    .values({
      userId: user.id,
      legalName,
      tradeName,
      taxId: taxId.replace(/\D/g, ""),
      contactName,
      contactEmail: contactEmail.toLowerCase(),
      contactPhone,
      businessType,
      addressLine,
      department,
      province,
      district,
      estimatedVolume,
      additionalNotes: additionalNotes || null,
      status: "pending",
    })
    .returning();

  // Actualizar rol del usuario a business_pending si era customer
  if (user.role === "customer") {
    await db
      .update(users)
      .set({ role: "business_pending", updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  // Registrar auditoría
  await db.insert(auditLogs).values({
    actorId: user.id,
    action: "application_created",
    targetType: "business_application",
    targetId: newApp.id,
    details: `Solicitud B2B presentada para empresa ${legalName} (RUC ${taxId})`,
  });

  // Notificación de confirmación por correo
  sendWholesaleReceivedEmail(contactEmail, contactName, legalName).catch((e) =>
    console.error("[Wholesale] Error al enviar confirmación de solicitud:", e),
  );

  revalidatePath("/mayorista/solicitud");
  revalidatePath("/cuenta");

  return {
    success: true,
    data: { applicationId: newApp.id },
  };
}
