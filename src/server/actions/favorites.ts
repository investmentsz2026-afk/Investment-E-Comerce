"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { newsletterSubscribers, products, userFavorites } from "@/server/db/schema";
import { getCurrentSession } from "@/server/auth/session";
import { normalizeEmail, validateEmail } from "@/server/auth/validators";
import {
  getFavoritesSnapshot,
  syncGuestFavoritesToUser,
  type FavoritesSnapshot,
} from "@/server/favorites/service";
import type { ActionResult } from "./auth";

/**
 * Obtiene el estado actual de los favoritos del usuario autenticado o visitante.
 */
export async function fetchFavoritesSnapshotAction(input?: {
  guestSlugs?: string[];
}): Promise<ActionResult<FavoritesSnapshot>> {
  try {
    const snapshot = await getFavoritesSnapshot(input?.guestSlugs);
    return { success: true, data: snapshot };
  } catch (e) {
    console.error("[Favorites] Error al consultar favoritos:", e);
    return {
      success: false,
      error: "No se pudo consultar tu lista de favoritos en este momento.",
    };
  }
}

/**
 * Alterna (agrega o elimina) un producto en los favoritos del usuario autenticado.
 * Para visitantes no autenticados, verifica que el producto exista y devuelve la lista actualizada.
 */
export async function toggleFavoriteAction(input: {
  productSlug: string;
  guestSlugs?: string[];
}): Promise<
  ActionResult<{
    favorited: boolean;
    productName: string;
    snapshot: FavoritesSnapshot;
  }>
> {
  const slug = String(input.productSlug ?? "").trim().toLowerCase();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: "Identificador de prenda inválido." };
  }

  try {
    const db = getDb();
    const foundProducts = await db
      .select({ id: products.id, slug: products.slug, name: products.name, status: products.status })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (foundProducts.length === 0 || foundProducts[0].status !== "active") {
      return {
        success: false,
        error: "La prenda seleccionada no se encuentra disponible en el catálogo.",
      };
    }

    const product = foundProducts[0];
    const { user } = await getCurrentSession();

    if (user) {
      const existing = await db
        .select({ id: userFavorites.id })
        .from(userFavorites)
        .where(and(eq(userFavorites.userId, user.id), eq(userFavorites.productId, product.id)))
        .limit(1);

      let favorited = false;
      if (existing.length > 0) {
        await db
          .delete(userFavorites)
          .where(and(eq(userFavorites.userId, user.id), eq(userFavorites.productId, product.id)));
        favorited = false;
      } else {
        await db
          .insert(userFavorites)
          .values({
            userId: user.id,
            productId: product.id,
          })
          .onConflictDoNothing({
            target: [userFavorites.userId, userFavorites.productId],
          });
        favorited = true;
      }

      revalidatePath("/cuenta/favoritos");
      revalidatePath("/favoritos");

      const snapshot = await getFavoritesSnapshot();
      return {
        success: true,
        data: {
          favorited,
          productName: product.name,
          snapshot,
        },
      };
    }

    // Visitante no autenticado: alternar sobre la lista enviada desde localStorage
    const currentGuestSlugs = Array.isArray(input.guestSlugs) ? input.guestSlugs : [];
    const existsInGuest = currentGuestSlugs.includes(product.slug);
    const nextGuestSlugs = existsInGuest
      ? currentGuestSlugs.filter((s) => s !== product.slug)
      : [product.slug, ...currentGuestSlugs.filter((s) => s !== product.slug)];

    const snapshot = await getFavoritesSnapshot(nextGuestSlugs);
    return {
      success: true,
      data: {
        favorited: !existsInGuest,
        productName: product.name,
        snapshot,
      },
    };
  } catch (e) {
    console.error("[Favorites] Error al alternar favorito:", e);
    return {
      success: false,
      error: "No se pudo actualizar tus favoritos. Intenta nuevamente.",
    };
  }
}

/**
 * Elimina un producto de los favoritos del usuario autenticado (aislado estrictamente por `user.id`).
 */
export async function removeFavoriteAction(input: {
  productSlug: string;
  guestSlugs?: string[];
}): Promise<ActionResult<FavoritesSnapshot>> {
  const slug = String(input.productSlug ?? "").trim().toLowerCase();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, error: "Identificador de prenda inválido." };
  }

  try {
    const db = getDb();
    const { user } = await getCurrentSession();

    if (user) {
      const foundProducts = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);

      if (foundProducts.length > 0) {
        await db
          .delete(userFavorites)
          .where(
            and(
              eq(userFavorites.userId, user.id),
              eq(userFavorites.productId, foundProducts[0].id),
            ),
          );
      }

      revalidatePath("/cuenta/favoritos");
      revalidatePath("/favoritos");

      const snapshot = await getFavoritesSnapshot();
      return { success: true, data: snapshot };
    }

    const nextGuestSlugs = (input.guestSlugs ?? []).filter((s) => s !== slug);
    const snapshot = await getFavoritesSnapshot(nextGuestSlugs);
    return { success: true, data: snapshot };
  } catch (e) {
    console.error("[Favorites] Error al eliminar favorito:", e);
    return {
      success: false,
      error: "No se pudo quitar la prenda de tus favoritos.",
    };
  }
}

/**
 * Sincroniza los favoritos guardados en localStorage durante una sesión de visitante
 * con la cuenta en PostgreSQL del usuario autenticado, evitando duplicados.
 */
export async function syncGuestFavoritesAction(input: {
  guestSlugs: string[];
}): Promise<ActionResult<FavoritesSnapshot>> {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      const snapshot = await getFavoritesSnapshot(input.guestSlugs);
      return { success: true, data: snapshot };
    }

    await syncGuestFavoritesToUser(user.id, input.guestSlugs);
    revalidatePath("/cuenta/favoritos");
    revalidatePath("/favoritos");

    const snapshot = await getFavoritesSnapshot();
    return { success: true, data: snapshot };
  } catch (e) {
    console.error("[Favorites] Error al sincronizar favoritos de visitante:", e);
    return {
      success: false,
      error: "No se pudieron sincronizar tus favoritos.",
    };
  }
}

/**
 * Registra un correo electrónico en la tabla `newsletter_subscribers` de PostgreSQL.
 */
export async function subscribeNewsletterAction(input: {
  email: string;
}): Promise<ActionResult<{ email: string }>> {
  const emailVal = validateEmail(input.email ?? "");
  if (!emailVal.valid) {
    return {
      success: false,
      error: emailVal.error ?? "Ingresa un correo electrónico válido.",
    };
  }

  const email = normalizeEmail(input.email);

  try {
    const db = getDb();
    const now = new Date();

    await db
      .insert(newsletterSubscribers)
      .values({
        email,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [newsletterSubscribers.email],
        set: {
          isActive: true,
          updatedAt: now,
        },
      });

    return {
      success: true,
      data: { email },
    };
  } catch (e) {
    console.error("[Newsletter] Error al registrar suscripción:", e);
    return {
      success: false,
      error: "No pudimos procesar tu suscripción en este momento.",
    };
  }
}

