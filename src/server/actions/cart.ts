"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  carts,
  cartItems,
  products,
  productVariants,
  productPrices,
} from "@/server/db/schema";
import { getCurrentSession } from "@/server/auth/session";
import {
  getCartSnapshot,
  resolveOrCreateActiveCart,
  type CartSnapshot,
} from "@/server/cart/service";
import {
  calculateLinePricing,
  validateRequestedQuantity,
} from "@/server/pricing/engine";
import type { ActionResult } from "./auth";

/**
 * Obtiene el estado actual del carrito desde el servidor (útil para sincronizar el provider de cliente).
 */
export async function fetchCartSnapshotAction(): Promise<ActionResult<CartSnapshot>> {
  try {
    const snapshot = await getCartSnapshot();
    return { success: true, data: snapshot };
  } catch (e) {
    console.error("[Cart] Error al obtener snapshot:", e);
    return { success: false, error: "No se pudo consultar el carrito en este momento." };
  }
}

/**
 * Añade una variante de producto al carrito validando en el servidor:
 * - Existencia y estado activo de la variante y del producto.
 * - Cantidad entera positiva y límites de stock real.
 * - Cálculo de precio vigente en el servidor (nunca acepta precios desde el cliente).
 */
export async function addToCartAction(input: {
  variantId: number;
  quantity?: number;
}): Promise<ActionResult<CartSnapshot>> {
  const variantId = Number(input.variantId);
  if (!Number.isInteger(variantId) || variantId <= 0) {
    return {
      success: false,
      error: "Selecciona una combinación válida de talla y color.",
    };
  }

  const qtyCheck = validateRequestedQuantity(input.quantity ?? 1);
  if (!qtyCheck.valid) {
    return { success: false, error: qtyCheck.error };
  }

  const requestedDelta = qtyCheck.quantity;
  const db = getDb();

  // Consultar variante + producto + precios exclusivamente en el servidor
  const foundRows = await db
    .select({
      variant: productVariants,
      product: products,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (foundRows.length === 0) {
    return {
      success: false,
      error: "La variante seleccionada no existe en el catálogo.",
    };
  }

  const { variant, product } = foundRows[0];

  if (product.status !== "active" || !variant.isActive) {
    return {
      success: false,
      error: "Este producto o variante ya no se encuentra disponible para la venta.",
    };
  }

  if (variant.stock <= 0) {
    return {
      success: false,
      error: "Esta combinación de talla y color se encuentra agotada.",
    };
  }

  const prices = await db
    .select()
    .from(productPrices)
    .where(eq(productPrices.productId, product.id));

  const retailPriceRow = prices.find((p) => p.type === "retail" && p.amount > 0);
  if (!retailPriceRow) {
    return {
      success: false,
      error: "Este producto aún no cuenta con un precio comercial configurado.",
    };
  }

  const { user } = await getCurrentSession();
  const { cartId } = await resolveOrCreateActiveCart(user, true);

  if (!cartId) {
    return {
      success: false,
      error: "No se pudo inicializar el carrito de compras.",
    };
  }

  const existingItemRows = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variant.id)))
    .limit(1);

  const currentQty = existingItemRows[0]?.quantity ?? 0;
  const nextQuantity = currentQty + requestedDelta;

  if (nextQuantity > variant.stock) {
    const remaining = Math.max(0, variant.stock - currentQty);
    return {
      success: false,
      error:
        remaining > 0
          ? `Stock insuficiente para ${product.name} (${variant.colorName ?? ""} ${variant.size ?? ""}). Ya tienes ${currentQty} en tu bolsa y solo puedes añadir ${remaining} más (stock total: ${variant.stock}).`
          : `Ya tienes el máximo disponible en stock (${variant.stock} ${variant.stock === 1 ? "unidad" : "unidades"}) en tu bolsa.`,
    };
  }

  // Calcular precio unitario referencial vigente en el momento de inserción
  const linePricing = calculateLinePricing({
    prices,
    quantity: nextQuantity,
    isProductWholesaleEnabled: product.isWholesale,
    user,
  });

  const now = new Date();

  // Upsert atómico para evitar colisiones por índice único (cart_id, variant_id)
  // ante solicitudes simultáneas desde múltiples pestañas o clics concurrentes
  const [upsertedItem] = await db
    .insert(cartItems)
    .values({
      cartId,
      variantId: variant.id,
      quantity: requestedDelta,
      addedUnitPriceSnapshot: linePricing.effectiveUnitAmount,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.variantId],
      set: {
        quantity: sql`${cartItems.quantity} + ${requestedDelta}`,
        addedUnitPriceSnapshot: linePricing.effectiveUnitAmount,
        updatedAt: now,
      },
    })
    .returning({ id: cartItems.id, quantity: cartItems.quantity });

  // Si solicitudes concurrentes superaron el techo de stock, acotar atómicamente al máximo permitido
  if (upsertedItem && upsertedItem.quantity > variant.stock) {
    await db
      .update(cartItems)
      .set({
        quantity: variant.stock,
        updatedAt: now,
      })
      .where(eq(cartItems.id, upsertedItem.id));

    await db
      .update(carts)
      .set({ updatedAt: now })
      .where(eq(carts.id, cartId));

    revalidatePath("/carrito");
    revalidatePath("/cuenta");

    return {
      success: false,
      error: `Stock insuficiente para ${product.name} (${variant.colorName ?? ""} ${variant.size ?? ""}). La cantidad se ha ajustado al máximo disponible en stock (${variant.stock} uds.).`,
    };
  }

  await db
    .update(carts)
    .set({ updatedAt: now })
    .where(eq(carts.id, cartId));

  revalidatePath("/carrito");
  revalidatePath("/cuenta");

  const snapshot = await getCartSnapshot();
  return {
    success: true,
    data: snapshot,
  };
}

/**
 * Actualiza la cantidad exacta de una línea del carrito validando propiedad del carrito,
 * existencia de la variante y stock disponible en el servidor.
 */
export async function updateCartItemQuantityAction(input: {
  variantId: number;
  quantity: number;
}): Promise<ActionResult<CartSnapshot>> {
  const variantId = Number(input.variantId);
  if (!Number.isInteger(variantId) || variantId <= 0) {
    return { success: false, error: "Variante de producto inválida." };
  }

  // Si la cantidad enviada es 0, interpretamos como eliminación de la línea
  if (input.quantity === 0) {
    return removeCartItemAction({ variantId });
  }

  const qtyCheck = validateRequestedQuantity(input.quantity);
  if (!qtyCheck.valid) {
    return { success: false, error: qtyCheck.error };
  }

  const newQty = qtyCheck.quantity;
  const { user } = await getCurrentSession();
  const { cartId } = await resolveOrCreateActiveCart(user, false);

  if (!cartId) {
    return { success: false, error: "Tu carrito está vacío o ha expirado." };
  }

  const db = getDb();

  const itemRows = await db
    .select({
      item: cartItems,
      variant: productVariants,
      product: products,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)))
    .limit(1);

  if (itemRows.length === 0) {
    return { success: false, error: "El producto indicado no se encuentra en tu carrito." };
  }

  const { item, variant, product } = itemRows[0];

  if (product.status !== "active" || !variant.isActive) {
    return {
      success: false,
      error: "Esta prenda ya no se encuentra disponible para la venta.",
    };
  }

  if (variant.stock <= 0) {
    return {
      success: false,
      error: "Esta variante se ha quedado sin stock disponible.",
    };
  }

  if (newQty > variant.stock) {
    return {
      success: false,
      error: `Stock insuficiente: solo hay ${variant.stock} ${variant.stock === 1 ? "unidad disponible" : "unidades disponibles"} para ${product.name} (${variant.sku}).`,
    };
  }

  const now = new Date();
  await db
    .update(cartItems)
    .set({
      quantity: newQty,
      updatedAt: now,
    })
    .where(eq(cartItems.id, item.id));

  await db
    .update(carts)
    .set({ updatedAt: now })
    .where(eq(carts.id, cartId));

  revalidatePath("/carrito");
  revalidatePath("/cuenta");

  const snapshot = await getCartSnapshot();
  return {
    success: true,
    data: snapshot,
  };
}

/**
 * Elimina una variante específica del carrito activo.
 */
export async function removeCartItemAction(input: {
  variantId: number;
}): Promise<ActionResult<CartSnapshot>> {
  const variantId = Number(input.variantId);
  if (!Number.isInteger(variantId) || variantId <= 0) {
    return { success: false, error: "Variante inválida." };
  }

  const { user } = await getCurrentSession();
  const { cartId } = await resolveOrCreateActiveCart(user, false);

  if (!cartId) {
    const snapshot = await getCartSnapshot();
    return { success: true, data: snapshot };
  }

  const db = getDb();

  await db
    .delete(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)));

  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));

  revalidatePath("/carrito");
  revalidatePath("/cuenta");

  const snapshot = await getCartSnapshot();
  return {
    success: true,
    data: snapshot,
  };
}

/**
 * Vacía todas las líneas del carrito activo del usuario o visitante.
 */
export async function clearCartAction(): Promise<ActionResult<CartSnapshot>> {
  const { user } = await getCurrentSession();
  const { cartId } = await resolveOrCreateActiveCart(user, false);

  if (cartId) {
    const db = getDb();
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));
  }

  revalidatePath("/carrito");
  revalidatePath("/cuenta");

  const snapshot = await getCartSnapshot();
  return {
    success: true,
    data: snapshot,
  };
}

/**
 * Permite cambiar la talla y/o color de una prenda en el carrito sin tener que eliminarla
 * y volver al catálogo.
 * - Valida que ambas variantes correspondan al mismo producto activo.
 * - Valida que la nueva variante esté activa y tenga stock.
 * - Si la nueva variante ya estaba en el carrito, combina las cantidades (acotadas al stock) y elimina el ítem anterior.
 * - Si no estaba, actualiza el variantId y acota la cantidad al stock disponible.
 */
export async function updateCartItemVariantAction(input: {
  currentVariantId: number;
  newVariantId: number;
}): Promise<ActionResult<CartSnapshot>> {
  const currentVariantId = Number(input.currentVariantId);
  const newVariantId = Number(input.newVariantId);

  if (
    !Number.isInteger(currentVariantId) ||
    currentVariantId <= 0 ||
    !Number.isInteger(newVariantId) ||
    newVariantId <= 0
  ) {
    return { success: false, error: "Selección de variante no válida." };
  }

  if (currentVariantId === newVariantId) {
    const snapshot = await getCartSnapshot();
    return { success: true, data: snapshot };
  }

  const { user } = await getCurrentSession();
  const { cartId } = await resolveOrCreateActiveCart(user, false);

  if (!cartId) {
    return { success: false, error: "Tu bolsa de compras está vacía o ha expirado." };
  }

  const db = getDb();

  // Verificar el ítem actual en el carrito
  const currentItemRows = await db
    .select({
      item: cartItems,
      variant: productVariants,
      product: products,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, currentVariantId)))
    .limit(1);

  if (currentItemRows.length === 0) {
    return { success: false, error: "La prenda original no se encuentra en tu bolsa." };
  }

  const currentItem = currentItemRows[0];

  // Verificar la nueva variante
  const newVariantRows = await db
    .select({
      variant: productVariants,
      product: products,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(productVariants.id, newVariantId))
    .limit(1);

  if (newVariantRows.length === 0) {
    return { success: false, error: "La nueva variante seleccionada no existe en el catálogo." };
  }

  const newVariant = newVariantRows[0];

  // Validar que pertenezcan al mismo producto
  if (newVariant.product.id !== currentItem.product.id) {
    return { success: false, error: "La variante seleccionada no pertenece al mismo modelo de prenda." };
  }

  if (newVariant.product.status !== "active" || !newVariant.variant.isActive) {
    return { success: false, error: "Esta variante ya no se encuentra disponible para la venta." };
  }

  if (newVariant.variant.stock <= 0) {
    return {
      success: false,
      error: `La combinación ${newVariant.variant.colorName ?? ""} Talla ${newVariant.variant.size ?? ""} se encuentra temporalmente agotada.`,
    };
  }

  // Precios para actualizar snapshot
  const prices = await db
    .select()
    .from(productPrices)
    .where(eq(productPrices.productId, newVariant.product.id));

  const targetQty = Math.min(currentItem.item.quantity, newVariant.variant.stock);

  const linePricing = calculateLinePricing({
    prices,
    quantity: targetQty,
    isProductWholesaleEnabled: newVariant.product.isWholesale,
    user,
  });

  const now = new Date();

  // Verificar si la nueva variante ya existía en el carrito
  const existingNewVariantItemRows = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, newVariantId)))
    .limit(1);

  if (existingNewVariantItemRows.length > 0) {
    const existing = existingNewVariantItemRows[0];
    const mergedQty = Math.min(
      existing.quantity + currentItem.item.quantity,
      newVariant.variant.stock,
    );

    await db
      .update(cartItems)
      .set({
        quantity: mergedQty,
        addedUnitPriceSnapshot: linePricing.effectiveUnitAmount,
        updatedAt: now,
      })
      .where(eq(cartItems.id, existing.id));

    // Eliminar el ítem anterior
    await db.delete(cartItems).where(eq(cartItems.id, currentItem.item.id));
  } else {
    // Actualizar variantId del ítem actual
    await db
      .update(cartItems)
      .set({
        variantId: newVariantId,
        quantity: targetQty,
        addedUnitPriceSnapshot: linePricing.effectiveUnitAmount,
        updatedAt: now,
      })
      .where(eq(cartItems.id, currentItem.item.id));
  }

  await db
    .update(carts)
    .set({ updatedAt: now })
    .where(eq(carts.id, cartId));

  revalidatePath("/carrito");
  revalidatePath("/cuenta");

  const snapshot = await getCartSnapshot();
  return {
    success: true,
    data: snapshot,
  };
}

