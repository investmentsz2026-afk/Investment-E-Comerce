import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/server/db";
import { sessions, users } from "@/server/db/schema";
import { generateSecureToken, hashSecureToken } from "./crypto";

export const SESSION_COOKIE_NAME = "investments_session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 días
const SESSION_RENEWAL_WINDOW_SECONDS = 15 * 24 * 60 * 60; // Renovar si quedan menos de 15 días

export type UserRole = "customer" | "business_pending" | "business_approved" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  emailVerifiedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: number;
  userId: number;
  expiresAt: Date;
  createdAt: Date;
  lastActiveAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface SessionValidationResult {
  session: AuthSession | null;
  user: AuthUser | null;
}

/**
 * Crea una nueva sesión para el usuario y establece la cookie HttpOnly.
 */
export async function createSession(
  userId: number,
  reqContext?: { userAgent?: string; ipAddress?: string },
): Promise<{ rawToken: string; session: AuthSession }> {
  const db = getDb();
  const rawToken = generateSecureToken(32);
  const tokenHash = hashSecureToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

  const [newSession] = await db
    .insert(sessions)
    .values({
      userId,
      tokenHash,
      expiresAt,
      createdAt: now,
      lastActiveAt: now,
      userAgent: reqContext?.userAgent?.slice(0, 500) ?? null,
      ipAddress: reqContext?.ipAddress?.slice(0, 45) ?? null,
    })
    .returning();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return {
    rawToken,
    session: newSession as AuthSession,
  };
}

/**
 * Valida la sesión actual a partir de la cookie HttpOnly.
 * Aplica renovación deslizante (sliding expiration) si le quedan menos de 15 días.
 */
export async function getCurrentSession(): Promise<SessionValidationResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return { session: null, user: null };
  }

  const tokenHash = hashSecureToken(token);
  const db = getDb();

  const rows = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  if (rows.length === 0) {
    // Cookie huérfana o token inválido
    try {
      cookieStore.delete(SESSION_COOKIE_NAME);
    } catch {
      // En Server Components de Next.js las cookies son de solo lectura;
      // se limpian cuando se ejecuta una Server Action o Route Handler.
    }
    return { session: null, user: null };
  }

  const { session, user } = rows[0];
  const now = new Date();

  // Sesión expirada o usuario inactivo
  if (session.expiresAt <= now || !user.isActive) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    try {
      cookieStore.delete(SESSION_COOKIE_NAME);
    } catch {
      // En Server Components las cookies son de solo lectura; la fila en BD ya fue purgada.
    }
    return { session: null, user: null };
  }

  // Renovación deslizante si quedan menos de 15 días
  const remainingSeconds = Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000);
  if (remainingSeconds < SESSION_RENEWAL_WINDOW_SECONDS) {
    const newExpiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
    await db
      .update(sessions)
      .set({
        expiresAt: newExpiresAt,
        lastActiveAt: now,
      })
      .where(eq(sessions.id, session.id));

    try {
      cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
    } catch {
      // En Server Components las cookies son de solo lectura; la expiración en BD sí se extiende.
    }
    session.expiresAt = newExpiresAt;
  } else {
    // Actualizar actividad cada cierto tiempo
    const timeSinceLastActive = now.getTime() - session.lastActiveAt.getTime();
    if (timeSinceLastActive > 60 * 60 * 1000) {
      // 1 hora
      await db
        .update(sessions)
        .set({ lastActiveAt: now })
        .where(eq(sessions.id, session.id));
    }
  }

  return {
    session: session as AuthSession,
    user: user as AuthUser,
  };
}

/**
 * Cierra la sesión activa borrando el registro de la base de datos y la cookie.
 */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = hashSecureToken(token);
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

/**
 * Revoca todas las sesiones activas de un usuario (ej: al cambiar contraseña o por seguridad).
 */
export async function invalidateAllUserSessions(userId: number, clearCallerCookie = true): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
  if (clearCallerCookie) {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

/**
 * Revoca todas las demás sesiones activas de un usuario, conservando únicamente la sesión actual.
 */
export async function invalidateOtherUserSessions(userId: number, currentSessionId: number): Promise<void> {
  const db = getDb();
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)));
}

/**
 * Guard de servidor: Requiere autenticación. Redirige al login si no hay sesión.
 */
export async function requireAuth(returnTo = "/cuenta"): Promise<{ session: AuthSession; user: AuthUser }> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    const nextParam = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/iniciar-sesion${nextParam}`);
  }
  return { session, user };
}

/**
 * Guard de servidor: Requiere un rol específico. Redirige si el usuario no tiene permisos suficientes.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  redirectOnForbidden = "/cuenta",
): Promise<{ session: AuthSession; user: AuthUser }> {
  const { session, user } = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect(redirectOnForbidden);
  }
  return { session, user };
}

/**
 * Guard de servidor: Exclusivo para administradores.
 * Redirige a login si no está autenticado; emite 403 Forbidden si está autenticado sin rol admin.
 */
export async function requireAdmin(): Promise<{ session: AuthSession; user: AuthUser }> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    redirect("/iniciar-sesion?next=/admin/solicitudes");
  }
  if (user.role !== "admin") {
    redirect("/cuenta?error=acceso-denegado");
  }
  return { session, user };
}
