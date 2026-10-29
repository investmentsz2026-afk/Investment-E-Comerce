"use server";

import { headers } from "next/headers";
import { and, eq, isNull, gt } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  users,
  passwordResetTokens,
  emailVerificationTokens,
  auditLogs,
} from "@/server/db/schema";
import { hashPassword, verifyPassword, generateSecureToken, hashSecureToken } from "@/server/auth/crypto";
import {
  createSession,
  destroyCurrentSession,
  getCurrentSession,
  invalidateAllUserSessions,
} from "@/server/auth/session";
import { mergeGuestCartWithUserCart } from "@/server/cart/service";
import {
  validateEmail,
  validatePassword,
  validateName,
  normalizeEmail,
} from "@/server/auth/validators";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "@/server/auth/rate-limit";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/server/email";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

// Hash ficticio para timing constante cuando el usuario no existe en login
const DUMMY_SCRYPT_HASH =
  "scrypt$7f66a57cdbd3439898c87e0a7431ef027f66a57cdbd3439898c87e0a7431ef02$a0b1c2d3e4f5061728394a5b6c7d8e9fa0b1c2d3e4f5061728394a5b6c7d8e9fa0b1c2d3e4f5061728394a5b6c7d8e9fa0b1c2d3e4f5061728394a5b6c7d8e9f";

async function getClientContext(): Promise<{ ipAddress?: string; userAgent?: string; baseUrl: string }> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : (headerList.get("x-real-ip") ?? undefined);
  const userAgent = headerList.get("user-agent") ?? undefined;
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { ipAddress, userAgent, baseUrl: `${proto}://${host}` };
}

/**
 * Registro de cliente minorista (B2C).
 */
export async function registerCustomerAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ userId: number }>> {
  const firstName = (formData.get("firstName") as string) ?? "";
  const lastName = (formData.get("lastName") as string) ?? "";
  const rawEmail = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";
  const termsAccepted = formData.get("termsAccepted");

  if (!termsAccepted || (termsAccepted !== "on" && termsAccepted !== "true")) {
    return {
      success: false,
      error: "Debes aceptar los términos y condiciones y la política de privacidad para continuar",
    };
  }

  const nameVal = validateName(firstName, "nombre");
  if (!nameVal.valid) return { success: false, error: nameVal.error };

  const lastVal = validateName(lastName, "apellidos");
  if (!lastVal.valid) return { success: false, error: lastVal.error };

  const emailVal = validateEmail(rawEmail);
  if (!emailVal.valid) return { success: false, error: emailVal.error };

  const passVal = validatePassword(password);
  if (!passVal.valid) return { success: false, error: passVal.error };

  if (password !== confirmPassword) {
    return { success: false, error: "Las contraseñas ingresadas no coinciden" };
  }

  const email = normalizeEmail(rawEmail);
  const { ipAddress, userAgent, baseUrl } = await getClientContext();

  const rateKey = `register:${ipAddress ?? "local"}`;
  const rateCheck = checkRateLimit(rateKey, 10, 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Demasiados registros desde esta conexión. Inténtalo de nuevo en ${rateCheck.retryAfterSeconds} segundos.`,
    };
  }
  recordFailedAttempt(rateKey, 10, 60 * 60 * 1000);

  const db = getDb();

  // Comprobar existencia
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return {
      success: false,
      error: "Ya existe una cuenta registrada con este correo electrónico",
    };
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: "customer",
      isActive: true,
    })
    .returning();

  // Generar token de verificación
  const verifToken = generateSecureToken(32);
  const verifHash = hashSecureToken(verifToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(emailVerificationTokens).values({
    userId: newUser.id,
    tokenHash: verifHash,
    email,
    expiresAt,
  });

  // Enviar correo de confirmación de forma no bloqueante
  sendVerificationEmail(email, newUser.firstName, verifToken, baseUrl).catch((e) =>
    console.error("[Auth] Error al despachar verificación:", e),
  );

  // Iniciar sesión automáticamente y fusionar carrito temporal si existiera
  await createSession(newUser.id, { userAgent, ipAddress });
  await mergeGuestCartWithUserCart(newUser.id);

  return {
    success: true,
    data: { userId: newUser.id },
  };
}

/**
 * Inicio de sesión con correo y contraseña.
 */
export async function loginAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ role: string; redirect: string }>> {
  const rawEmail = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const nextParam = (formData.get("next") as string) ?? "";

  const email = normalizeEmail(rawEmail);
  if (!email || !password) {
    return { success: false, error: "Ingresa tu correo y contraseña" };
  }

  const { ipAddress, userAgent } = await getClientContext();
  const rateKey = `login:${email}:${ipAddress ?? "local"}`;
  const rateStatus = checkRateLimit(rateKey, 5, 15 * 60 * 1000);

  if (!rateStatus.allowed) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Por tu seguridad, espera ${rateStatus.retryAfterSeconds} segundos antes de volver a intentar.`,
    };
  }

  const db = getDb();
  const found = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = found[0];

  // Si no existe, ejecutamos un verify dummy para mitigar timing attacks
  const valid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, DUMMY_SCRYPT_HASH);

  if (!user || !valid) {
    recordFailedAttempt(rateKey, 5, 15 * 60 * 1000);
    return {
      success: false,
      error: "El correo electrónico o la contraseña son incorrectos",
    };
  }

  if (!user.isActive) {
    return {
      success: false,
      error: "Esta cuenta se encuentra inactiva. Comunícate con atención al cliente de INVESTMENTS.",
    };
  }

  clearRateLimit(rateKey);
  await createSession(user.id, { userAgent, ipAddress });
  await mergeGuestCartWithUserCart(user.id);

  let targetRedirect = "/cuenta";
  if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
    targetRedirect = nextParam;
  } else if (user.role === "admin") {
    targetRedirect = "/admin/solicitudes";
  } else if (user.role === "business_approved" || user.role === "business_pending") {
    targetRedirect = "/cuenta";
  }

  return {
    success: true,
    data: { role: user.role, redirect: targetRedirect },
  };
}

/**
 * Cierre de sesión.
 */
export async function logoutAction(): Promise<ActionResult> {
  await destroyCurrentSession();
  return { success: true };
}

/**
 * Solicitud de restablecimiento de contraseña.
 * Respuesta genérica anti-enumeración.
 */
export async function requestPasswordResetAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const rawEmail = (formData.get("email") as string) ?? "";
  const emailVal = validateEmail(rawEmail);
  if (!emailVal.valid) {
    return { success: false, error: emailVal.error };
  }

  const email = normalizeEmail(rawEmail);
  const { ipAddress, baseUrl } = await getClientContext();

  const rateKey = `pwd_reset:${email}:${ipAddress ?? "local"}`;
  const rateStatus = checkRateLimit(rateKey, 3, 30 * 60 * 1000);
  if (!rateStatus.allowed) {
    return {
      success: false,
      error: `Has solicitado demasiados enlaces de recuperación. Espera ${rateStatus.retryAfterSeconds} segundos.`,
    };
  }

  recordFailedAttempt(rateKey, 3, 30 * 60 * 1000);

  const db = getDb();
  const found = await db
    .select({ id: users.id, firstName: users.firstName, isActive: users.isActive })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (found.length > 0 && found[0].isActive) {
    const user = found[0];
    const rawToken = generateSecureToken(32);
    const tokenHash = hashSecureToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Invalidar tokens previos sin usar
    await db
      .delete(passwordResetTokens)
      .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    sendPasswordResetEmail(email, user.firstName, rawToken, baseUrl).catch((e) =>
      console.error("[Auth] Error al despachar recuperación de contraseña:", e),
    );
  }

  return {
    success: true,
    data: "Si el correo está registrado en INVESTMENTS, te hemos enviado un enlace para restablecer tu contraseña.",
  };
}

/**
 * Establecimiento de nueva contraseña con token de 1 solo uso.
 */
export async function resetPasswordAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const token = (formData.get("token") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (!token) {
    return { success: false, error: "El token de recuperación es requerido" };
  }

  const passVal = validatePassword(password);
  if (!passVal.valid) return { success: false, error: passVal.error };

  if (password !== confirmPassword) {
    return { success: false, error: "Las contraseñas no coinciden" };
  }

  const tokenHash = hashSecureToken(token);
  const now = new Date();
  const db = getDb();

  const foundTokens = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (foundTokens.length === 0) {
    return {
      success: false,
      error: "El enlace de recuperación es inválido, ha expirado o ya fue utilizado",
    };
  }

  const resetToken = foundTokens[0];
  const newPasswordHash = await hashPassword(password);
  const { ipAddress } = await getClientContext();

  // Actualizar contraseña y quemar token
  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: now,
    })
    .where(eq(users.id, resetToken.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.id, resetToken.id));

  // Revocar todas las sesiones existentes por seguridad
  await invalidateAllUserSessions(resetToken.userId);

  // Registrar en auditoría
  await db.insert(auditLogs).values({
    actorId: resetToken.userId,
    action: "password_change",
    targetType: "user",
    targetId: resetToken.userId,
    details: "Contraseña restablecida vía token de correo",
    ipAddress: ipAddress ?? null,
  });

  return { success: true };
}

/**
 * Verificación de correo electrónico.
 */
export async function verifyEmailAction(token: string): Promise<ActionResult> {
  if (!token) {
    return { success: false, error: "El token de verificación es requerido" };
  }

  const tokenHash = hashSecureToken(token);
  const now = new Date();
  const db = getDb();

  const found = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        isNull(emailVerificationTokens.usedAt),
        gt(emailVerificationTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (found.length === 0) {
    return {
      success: false,
      error: "El enlace de confirmación es inválido o ha expirado. Puedes solicitar uno nuevo desde tu perfil.",
    };
  }

  const row = found[0];

  await db
    .update(users)
    .set({
      emailVerifiedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, row.userId));

  await db
    .update(emailVerificationTokens)
    .set({ usedAt: now })
    .where(eq(emailVerificationTokens.id, row.id));

  return { success: true };
}

/**
 * Reenvío de correo de verificación desde el perfil del usuario autenticado.
 */
export async function resendVerificationEmailAction(): Promise<ActionResult> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    return { success: false, error: "Debes iniciar sesión para realizar esta acción" };
  }

  if (user.emailVerifiedAt) {
    return { success: true, data: "Tu correo electrónico ya se encuentra verificado" };
  }

  const { ipAddress, baseUrl } = await getClientContext();
  const rateKey = `verif_resend:${user.id}:${ipAddress ?? "local"}`;
  const rateCheck = checkRateLimit(rateKey, 3, 30 * 60 * 1000);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Has solicitado demasiados reenvíos. Espera ${rateCheck.retryAfterSeconds} segundos antes de volver a intentar.`,
    };
  }
  recordFailedAttempt(rateKey, 3, 30 * 60 * 1000);

  const db = getDb();

  // Limpiar tokens anteriores no usados
  await db
    .delete(emailVerificationTokens)
    .where(and(eq(emailVerificationTokens.userId, user.id), isNull(emailVerificationTokens.usedAt)));

  const verifToken = generateSecureToken(32);
  const verifHash = hashSecureToken(verifToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    tokenHash: verifHash,
    email: user.email,
    expiresAt,
  });

  const emailRes = await sendVerificationEmail(user.email, user.firstName, verifToken, baseUrl);

  return {
    success: true,
    data: emailRes.sent
      ? "Te hemos enviado un nuevo enlace de confirmación a tu correo"
      : "Se ha generado un nuevo enlace de confirmación (revisa la consola del servidor en modo desarrollo)",
  };
}
