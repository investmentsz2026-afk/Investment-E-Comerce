import "server-only";

import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  categories,
  productImages,
  productPrices,
  products,
  productVariants,
  promotions,
  userFavorites,
} from "@/server/db/schema";
import { getCurrentSession, type AuthUser } from "@/server/auth/session";
import {
  calculateLinePricing,
  isUserAuthorizedForWholesale,
} from "@/server/pricing/engine";

export interface FavoriteVariantOption {
  id: number;
  sku: string;
  size: string | null;
  colorName: string | null;
  colorSwatch: string | null;
  stock: number;
}

export interface FavoriteProductItem {
  productId: number;
  slug: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  imageUrl: string;
  imageAlt: string;
  /** Precio minorista base en céntimos PEN. */
  retailUnitPriceAmount: number;
  /** Precio efectivo para el usuario actual (minorista, promocional o mayorista B2B) en céntimos PEN. */
  effectiveUnitPriceAmount: number;
  /** Etiqueta de tarifa aplicada ("Precio minorista", "Precio mayorista B2B", "Promoción..."). */
  appliedPriceLabel: string;
  /** Precio mayorista referencial desde N unidades (céntimos PEN), si aplica. */
  wholesaleFromAmount: number | null;
  wholesaleMinQty: number | null;
  isWholesaleProduct: boolean;
  /** Stock total disponible sumando variantes activas. */
  totalStock: number;
  inStock: boolean;
  /** Primera variante con stock (o la primera variante activa) para agregar rápido a la bolsa. */
  defaultVariant: FavoriteVariantOption | null;
  variants: FavoriteVariantOption[];
  addedAt?: string;
}

export interface FavoritesSnapshot {
  isAuthenticated: boolean;
  userId: number | null;
  userRole: string | null;
  isWholesaleAuthorized: boolean;
  slugs: string[];
  items: FavoriteProductItem[];
}

function sanitizeSlugs(rawSlugs?: string[]): string[] {
  if (!Array.isArray(rawSlugs)) return [];
  const unique = new Set<string>();
  for (const s of rawSlugs) {
    if (typeof s === "string") {
      const clean = s.trim().toLowerCase().slice(0, 200);
      if (clean && /^[a-z0-9-]+$/.test(clean)) {
        unique.add(clean);
      }
    }
    if (unique.size >= 100) break;
  }
  return Array.from(unique);
}

async function buildFavoriteItemsFromProducts(
  productIdOrder: number[],
  user: AuthUser | null,
  addedAtByProductId?: Map<number, Date>,
): Promise<FavoriteProductItem[]> {
  if (productIdOrder.length === 0) return [];

  const db = getDb();
  const now = new Date();

  const [prodRows, imgRows, varRows, priceRows, activePromos] = await Promise.all([
    db
      .select({
        product: products,
        category: categories,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(inArray(products.id, productIdOrder), eq(products.status, "active"))),
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIdOrder))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select()
      .from(productVariants)
      .where(and(inArray(productVariants.productId, productIdOrder), eq(productVariants.isActive, true)))
      .orderBy(asc(productVariants.id)),
    db
      .select()
      .from(productPrices)
      .where(inArray(productPrices.productId, productIdOrder)),
    db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.isActive, true),
          lte(promotions.startsAt, now),
          gte(promotions.endsAt, now),
        ),
      ),
  ]);

  const prodById = new Map(prodRows.map((r) => [r.product.id, r]));

  const primaryImgByProduct = new Map<number, { url: string; alt: string }>();
  for (const img of imgRows) {
    const existing = primaryImgByProduct.get(img.productId);
    if (!existing || img.isPrimary) {
      primaryImgByProduct.set(img.productId, { url: img.url, alt: img.alt });
    }
  }

  const variantsByProduct = new Map<number, FavoriteVariantOption[]>();
  for (const v of varRows) {
    const list = variantsByProduct.get(v.productId) ?? [];
    list.push({
      id: v.id,
      sku: v.sku,
      size: v.size,
      colorName: v.colorName,
      colorSwatch: v.colorSwatch,
      stock: v.stock,
    });
    variantsByProduct.set(v.productId, list);
  }

  const pricesByProduct = new Map<number, (typeof priceRows)[number][]>();
  for (const p of priceRows) {
    const list = pricesByProduct.get(p.productId) ?? [];
    list.push(p);
    pricesByProduct.set(p.productId, list);
  }

  const result: FavoriteProductItem[] = [];

  for (const pid of productIdOrder) {
    const row = prodById.get(pid);
    if (!row) continue;

    const { product, category } = row;
    const prodPrices = pricesByProduct.get(product.id) ?? [];
    const prodVariants = variantsByProduct.get(product.id) ?? [];
    const totalStock = prodVariants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
    const defaultVariant =
      prodVariants.find((v) => v.stock > 0) ?? prodVariants[0] ?? null;

    const wholesaleTiers = prodPrices
      .filter((p) => p.type === "wholesale")
      .sort((a, b) => a.minQuantity - b.minQuantity);

    const minWholesaleQty = wholesaleTiers[0]?.minQuantity ?? 6;
    const isWholesaleAuth = isUserAuthorizedForWholesale(user);
    const evalQty = isWholesaleAuth && product.isWholesale ? minWholesaleQty : 1;

    const pricing = calculateLinePricing({
      prices: prodPrices,
      quantity: evalQty,
      productGroupQuantity: evalQty,
      isProductWholesaleEnabled: product.isWholesale,
      user,
      promotions: activePromos,
      productId: product.id,
      categoryId: product.categoryId,
      now,
    });

    const img = primaryImgByProduct.get(product.id) ?? {
      url: "/placeholder.jpg",
      alt: product.name,
    };

    const lowestWholesaleAmount =
      wholesaleTiers.length > 0
        ? Math.min(...wholesaleTiers.map((t) => t.amount))
        : null;

    result.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      categoryName: category.name,
      categorySlug: category.slug,
      imageUrl: img.url,
      imageAlt: img.alt,
      retailUnitPriceAmount: pricing.retailUnitAmount ?? 0,
      effectiveUnitPriceAmount: pricing.effectiveUnitAmount,
      appliedPriceLabel: pricing.appliedLabel,
      wholesaleFromAmount: product.isWholesale ? lowestWholesaleAmount : null,
      wholesaleMinQty: product.isWholesale && wholesaleTiers[0] ? wholesaleTiers[0].minQuantity : null,
      isWholesaleProduct: product.isWholesale,
      totalStock,
      inStock: totalStock > 0,
      defaultVariant,
      variants: prodVariants,
      addedAt: addedAtByProductId?.get(product.id)?.toISOString(),
    });
  }

  return result;
}

/**
 * Obtiene la lista completa de favoritos para el usuario autenticado (desde PostgreSQL)
 * o para el visitante (resolviendo sus slugs guardados en localStorage contra PostgreSQL).
 */
export async function getFavoritesSnapshot(guestSlugs?: string[]): Promise<FavoritesSnapshot> {
  const { user } = await getCurrentSession();
  const isWholesaleAuthorized = isUserAuthorizedForWholesale(user);
  const db = getDb();

  if (user) {
    if (guestSlugs && guestSlugs.length > 0) {
      await syncGuestFavoritesToUser(user.id, guestSlugs);
    }

    const favRows = await db
      .select({
        productId: userFavorites.productId,
        createdAt: userFavorites.createdAt,
      })
      .from(userFavorites)
      .where(eq(userFavorites.userId, user.id))
      .orderBy(desc(userFavorites.createdAt), desc(userFavorites.id));

    const productIds = favRows.map((r) => r.productId);
    const addedAtMap = new Map(favRows.map((r) => [r.productId, r.createdAt]));
    const items = await buildFavoriteItemsFromProducts(productIds, user, addedAtMap);

    return {
      isAuthenticated: true,
      userId: user.id,
      userRole: user.role,
      isWholesaleAuthorized,
      slugs: items.map((i) => i.slug),
      items,
    };
  }

  // Visitante no autenticado: enriquecer slugs locales desde la base de datos real
  const cleanSlugs = sanitizeSlugs(guestSlugs);
  if (cleanSlugs.length === 0) {
    return {
      isAuthenticated: false,
      userId: null,
      userRole: null,
      isWholesaleAuthorized: false,
      slugs: [],
      items: [],
    };
  }

  const matchedProducts = await db
    .select({ id: products.id, slug: products.slug })
    .from(products)
    .where(and(inArray(products.slug, cleanSlugs), eq(products.status, "active")));

  const idBySlug = new Map(matchedProducts.map((p) => [p.slug, p.id]));
  const orderedIds: number[] = [];
  for (const slug of cleanSlugs) {
    const pid = idBySlug.get(slug);
    if (pid) orderedIds.push(pid);
  }

  const items = await buildFavoriteItemsFromProducts(orderedIds, null);

  return {
    isAuthenticated: false,
    userId: null,
    userRole: null,
    isWholesaleAuthorized: false,
    slugs: items.map((i) => i.slug),
    items,
  };
}

/**
 * Sincroniza (fusiona) los favoritos guardados como visitante en localStorage
 * hacia la tabla `user_favorites` de PostgreSQL cuando el usuario inicia sesión o se registra.
 */
export async function syncGuestFavoritesToUser(
  userId: number,
  guestSlugs?: string[],
): Promise<void> {
  const cleanSlugs = sanitizeSlugs(guestSlugs);
  if (cleanSlugs.length === 0) return;

  const db = getDb();
  const matchedProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(and(inArray(products.slug, cleanSlugs), eq(products.status, "active")));

  if (matchedProducts.length === 0) return;

  for (const prod of matchedProducts) {
    await db
      .insert(userFavorites)
      .values({
        userId,
        productId: prod.id,
      })
      .onConflictDoNothing({
        target: [userFavorites.userId, userFavorites.productId],
      });
  }
}

