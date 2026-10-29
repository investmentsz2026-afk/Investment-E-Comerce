import "server-only";

import { cookies } from "next/headers";
import { and, eq, inArray, asc, lte, gte } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  carts,
  cartItems,
  products,
  productVariants,
  productPrices,
  productImages,
  categories,
  promotions,
} from "@/server/db/schema";
import { generateSecureToken, hashSecureToken } from "@/server/auth/crypto";
import { getCurrentSession, type AuthUser } from "@/server/auth/session";
import {
  calculateLinePricing,
  isUserAuthorizedForWholesale,
  type LinePricingResult,
} from "@/server/pricing/engine";

const GUEST_CART_COOKIE_NAME = "investments_cart";
const GUEST_CART_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 días

export type CartItemAvailabilityStatus =
  | "available"
  | "low_stock"
  | "exceeds_stock"
  | "out_of_stock"
  | "unavailable_product";

export interface EnrichedCartItem {
  id: number;
  cartId: number;
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  isDemo: boolean;
  categoryName: string;
  categorySlug: string;
  sku: string;
  size: string | null;
  colorName: string | null;
  colorSwatch: string | null;
  imageUrl: string;
  imageAlt: string;
  quantity: number;
  availableStock: number;
  availabilityStatus: CartItemAvailabilityStatus;
  availabilityMessage: string;
  /** Precio unitario referencial en el momento de agregar al carrito (céntimos PEN). */
  addedUnitPriceSnapshot: number;
  /** Resultado vivo del motor de precios en el servidor. */
  pricing: LinePricingResult;
}

export interface CartSnapshot {
  cartId: number | null;
  items: EnrichedCartItem[];
  /** Cantidad total de unidades en el carrito. */
  totalUnits: number;
  /** Número de líneas (variantes distintas). */
  lineCount: number;
  /** Subtotal calculado a precio minorista antes de descuentos mayoristas (céntimos PEN). */
  retailSubtotalAmount: number;
  /** Descuento total por tarifas mayoristas B2B o escalas por volumen (céntimos PEN). */
  wholesaleSavingsAmount: number;
  /** Total estimado de productos en céntimos enteros de PEN (preliminar antes de checkout). */
  estimatedTotalAmount: number;
  currency: "PEN";
  isWholesaleAuthorized: boolean;
  userRole: string | null;
  hasStockIssues: boolean;
}

/**
 * Obtiene el token de carrito de visitante desde la cookie HttpOnly (si existe).
 */
export async function getGuestCartTokenFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Crea o recupera el carrito activo en la base de datos para el usuario o visitante actual.
 * Solo escribe la cookie de visitante cuando `createIfMissing = true` (dentro de una Server Action).
 */
export async function resolveOrCreateActiveCart(
  user: AuthUser | null,
  createIfMissing: boolean,
): Promise<{ cartId: number | null }> {
  const db = getDb();

  if (user) {
    const existing = await db
      .select({ id: carts.id })
      .from(carts)
      .where(and(eq(carts.userId, user.id), eq(carts.status, "active")))
      .limit(1);

    if (existing.length > 0) {
      return { cartId: existing[0].id };
    }

    if (!createIfMissing) {
      return { cartId: null };
    }

    const [created] = await db
      .insert(carts)
      .values({
        userId: user.id,
        status: "active",
      })
      .returning({ id: carts.id });

    return { cartId: created.id };
  }

  // Visitante no autenticado
  const cookieStore = await cookies();
  let rawGuestToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null;

  if (rawGuestToken) {
    const tokenHash = hashSecureToken(rawGuestToken);
    const existingGuest = await db
      .select({ id: carts.id })
      .from(carts)
      .where(and(eq(carts.guestTokenHash, tokenHash), eq(carts.status, "active")))
      .limit(1);

    if (existingGuest.length > 0) {
      return { cartId: existingGuest[0].id };
    }
  }

  if (!createIfMissing) {
    return { cartId: null };
  }

  rawGuestToken = generateSecureToken(32);
  const tokenHash = hashSecureToken(rawGuestToken);

  const [createdGuest] = await db
    .insert(carts)
    .values({
      userId: null,
      guestTokenHash: tokenHash,
      status: "active",
    })
    .returning({ id: carts.id });

  try {
    cookieStore.set(GUEST_CART_COOKIE_NAME, rawGuestToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GUEST_CART_MAX_AGE_SECONDS,
    });
  } catch {
    // Si se invoca desde un contexto de solo lectura, ignoramos set cookie
  }

  return { cartId: createdGuest.id };
}

/**
 * Fusiona de manera segura el carrito temporal de visitante con el carrito en PostgreSQL
 * del usuario que acaba de autenticarse o registrarse.
 *
 * Reglas de fusión:
 * - Si el usuario no tenía carrito activo pero tenía carrito de visitante, el carrito de visitante
 *   se vincula directamente a `userId` y limpia `guestTokenHash`.
 * - Si ambos carritos existen, se combinan las líneas por `variantId`:
 *   - Las cantidades se suman y se acotan automáticamente al stock real disponible de la variante
 *     (mínimo 1 si aún existía la línea).
 *   - El carrito de visitante pasa a estado `merged` y su cookie se elimina.
 */
export async function mergeGuestCartWithUserCart(userId: number): Promise<void> {
  const rawGuestToken = await getGuestCartTokenFromCookie();
  if (!rawGuestToken) return;

  const tokenHash = hashSecureToken(rawGuestToken);
  const db = getDb();

  const guestCartRows = await db
    .select()
    .from(carts)
    .where(and(eq(carts.guestTokenHash, tokenHash), eq(carts.status, "active")))
    .limit(1);

  if (guestCartRows.length === 0) {
    try {
      const cookieStore = await cookies();
      cookieStore.delete(GUEST_CART_COOKIE_NAME);
    } catch {
      // ignore
    }
    return;
  }

  const guestCart = guestCartRows[0];

  const userCartRows = await db
    .select()
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, "active")))
    .limit(1);

  if (userCartRows.length === 0) {
    // Reasignar el carrito de visitante directamente al usuario autenticado
    await db
      .update(carts)
      .set({
        userId,
        guestTokenHash: null,
        updatedAt: new Date(),
      })
      .where(eq(carts.id, guestCart.id));
  } else {
    const userCart = userCartRows[0];
    if (userCart.id !== guestCart.id) {
      const guestItems = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, guestCart.id));

      if (guestItems.length > 0) {
        const userItems = await db
          .select()
          .from(cartItems)
          .where(eq(cartItems.cartId, userCart.id));

        const userItemByVariant = new Map(userItems.map((i) => [i.variantId, i]));
        const variantIds = guestItems.map((i) => i.variantId);

        const variants = await db
          .select({ id: productVariants.id, stock: productVariants.stock, isActive: productVariants.isActive })
          .from(productVariants)
          .where(inArray(productVariants.id, variantIds));

        const variantStockMap = new Map(variants.map((v) => [v.id, v]));

        for (const gItem of guestItems) {
          const vInfo = variantStockMap.get(gItem.variantId);
          // Omitir variantes eliminadas, inactivas o agotadas al fusionar
          if (!vInfo || !vInfo.isActive || vInfo.stock <= 0) continue;

          const maxStock = vInfo.stock;
          const existingUserItem = userItemByVariant.get(gItem.variantId);

          if (existingUserItem) {
            const combinedQty = Math.min(existingUserItem.quantity + gItem.quantity, maxStock);
            await db
              .update(cartItems)
              .set({
                quantity: combinedQty,
                updatedAt: new Date(),
              })
              .where(eq(cartItems.id, existingUserItem.id));
          } else {
            const clampedQty = Math.min(gItem.quantity, maxStock);
            await db.insert(cartItems).values({
              cartId: userCart.id,
              variantId: gItem.variantId,
              quantity: clampedQty,
              addedUnitPriceSnapshot: gItem.addedUnitPriceSnapshot,
            });
          }
        }
      }

      // Marcar el carrito de visitante como fusionado y vaciar sus ítems
      await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
      await db
        .update(carts)
        .set({
          status: "merged",
          guestTokenHash: null,
          updatedAt: new Date(),
        })
        .where(eq(carts.id, guestCart.id));
    }
  }

  try {
    const cookieStore = await cookies();
    cookieStore.delete(GUEST_CART_COOKIE_NAME);
  } catch {
    // ignore
  }
}

/**
 * Construye el estado completo del carrito recalculando en el servidor todos los precios,
 * escalas por volumen, stock disponible y permisos B2C/B2B vigentes.
 */
export async function getCartSnapshot(): Promise<CartSnapshot> {
  const { user } = await getCurrentSession();
  const isWholesaleAuthorized = isUserAuthorizedForWholesale(user);
  const { cartId } = await resolveOrCreateActiveCart(user, false);

  if (!cartId) {
    return {
      cartId: null,
      items: [],
      totalUnits: 0,
      lineCount: 0,
      retailSubtotalAmount: 0,
      wholesaleSavingsAmount: 0,
      estimatedTotalAmount: 0,
      currency: "PEN",
      isWholesaleAuthorized,
      userRole: user?.role ?? null,
      hasStockIssues: false,
    };
  }

  const db = getDb();

  const rawRows = await db
    .select({
      item: cartItems,
      variant: productVariants,
      product: products,
      category: categories,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt), asc(cartItems.id));

  if (rawRows.length === 0) {
    return {
      cartId,
      items: [],
      totalUnits: 0,
      lineCount: 0,
      retailSubtotalAmount: 0,
      wholesaleSavingsAmount: 0,
      estimatedTotalAmount: 0,
      currency: "PEN",
      isWholesaleAuthorized,
      userRole: user?.role ?? null,
      hasStockIssues: false,
    };
  }

  const productIds = Array.from(new Set(rawRows.map((r) => r.product.id)));
  const now = new Date();

  const [allPrices, allImages, activePromotions] = await Promise.all([
    db
      .select()
      .from(productPrices)
      .where(inArray(productPrices.productId, productIds)),
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(asc(productImages.sortOrder)),
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

  const pricesByProduct = new Map<number, (typeof allPrices)[number][]>();
  for (const p of allPrices) {
    const list = pricesByProduct.get(p.productId) ?? [];
    list.push(p);
    pricesByProduct.set(p.productId, list);
  }

  const primaryImageByProduct = new Map<number, { url: string; alt: string }>();
  for (const img of allImages) {
    const current = primaryImageByProduct.get(img.productId);
    if (!current || img.isPrimary) {
      primaryImageByProduct.set(img.productId, { url: img.url, alt: img.alt });
    }
  }

  // Sumar cantidades acumuladas por producto (para escalas mayoristas multi-talla / multi-color)
  const productQuantityTotals = new Map<number, number>();
  for (const row of rawRows) {
    const prev = productQuantityTotals.get(row.product.id) ?? 0;
    productQuantityTotals.set(row.product.id, prev + row.item.quantity);
  }

  let totalUnits = 0;
  let retailSubtotalAmount = 0;
  let wholesaleSavingsAmount = 0;
  let estimatedTotalAmount = 0;
  let hasStockIssues = false;

  const enrichedItems: EnrichedCartItem[] = rawRows.map((row) => {
    const { item, variant, product, category } = row;
    const prodPrices = pricesByProduct.get(product.id) ?? [];
    const groupQty = productQuantityTotals.get(product.id) ?? item.quantity;

    const pricing = calculateLinePricing({
      prices: prodPrices,
      quantity: item.quantity,
      productGroupQuantity: groupQty,
      isProductWholesaleEnabled: product.isWholesale,
      user,
      promotions: activePromotions,
      productId: product.id,
      categoryId: product.categoryId,
      now,
    });

    const img = primaryImageByProduct.get(product.id) ?? {
      url: "/placeholder.jpg",
      alt: product.name,
    };

    let availabilityStatus: CartItemAvailabilityStatus = "available";
    let availabilityMessage = `En stock (${variant.stock} uds. disponibles)`;

    if (product.status !== "active" || !variant.isActive) {
      availabilityStatus = "unavailable_product";
      availabilityMessage = "Esta prenda o variante ya no se encuentra disponible para la venta.";
      hasStockIssues = true;
    } else if (variant.stock <= 0) {
      availabilityStatus = "out_of_stock";
      availabilityMessage = "Variante agotada temporalmente.";
      hasStockIssues = true;
    } else if (item.quantity > variant.stock) {
      availabilityStatus = "exceeds_stock";
      availabilityMessage = `Stock insuficiente: solo quedan ${variant.stock} ${variant.stock === 1 ? "unidad" : "unidades"}. Ajusta la cantidad.`;
      hasStockIssues = true;
    } else if (variant.stock <= 5) {
      availabilityStatus = "low_stock";
      availabilityMessage = `Últimas unidades — quedan ${variant.stock} en stock.`;
    }

    totalUnits += item.quantity;
    retailSubtotalAmount += pricing.retailSubtotalAmount;
    wholesaleSavingsAmount += pricing.lineSavingsAmount;
    estimatedTotalAmount += pricing.lineSubtotalAmount;

    return {
      id: item.id,
      cartId: item.cartId,
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      isDemo: product.isDemo,
      categoryName: category.name,
      categorySlug: category.slug,
      sku: variant.sku,
      size: variant.size,
      colorName: variant.colorName,
      colorSwatch: variant.colorSwatch,
      imageUrl: img.url,
      imageAlt: img.alt,
      quantity: item.quantity,
      availableStock: variant.stock,
      availabilityStatus,
      availabilityMessage,
      addedUnitPriceSnapshot: item.addedUnitPriceSnapshot,
      pricing,
    };
  });

  return {
    cartId,
    items: enrichedItems,
    totalUnits,
    lineCount: enrichedItems.length,
    retailSubtotalAmount,
    wholesaleSavingsAmount,
    estimatedTotalAmount,
    currency: "PEN",
    isWholesaleAuthorized,
    userRole: user?.role ?? null,
    hasStockIssues,
  };
}

