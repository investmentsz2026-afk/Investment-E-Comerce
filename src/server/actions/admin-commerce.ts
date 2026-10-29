"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  auditLogs,
  categories,
  inventoryMovements,
  inventoryReservations,
  orderItems,
  productImages,
  productPrices,
  products,
  productVariants,
  promotions,
  sessions,
  users,
  wholesaleQuoteItems,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import {
  recordAdminInventoryAdjustment,
  type AdminInventoryOperationKind,
} from "@/server/inventory/service";
import {
  validateCategoryPayload,
  validateProductCommercialPayload,
  validatePromotionPayload,
} from "@/server/pricing/admin-validators";

export interface AdminActionResult {
  success: boolean;
  message?: string;
  error?: string;
  entityId?: number;
}

export interface AdminProductSavePayload {
  id?: number | null;
  name: string;
  slug: string;
  brand: string;
  shortDescription?: string;
  fullDescription?: string;
  categoryId: number;
  audience: "mujer" | "hombre" | "unisex";
  status: "draft" | "active" | "archived";
  badgeLabel?: string;
  sortOrder?: number;
  isNew: boolean;
  isFeatured: boolean;
  isWholesale: boolean;
  retailPricePen: string | number;
  compareAtPricePen?: string | number | null;
  wholesaleTiers: Array<{
    minQuantity: number | string;
    maxQuantity?: number | string | null;
    pricePen: number | string;
  }>;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
    sortOrder?: number;
  }>;
  variants: Array<{
    id?: number;
    sku: string;
    size?: string | null;
    colorName?: string | null;
    colorSwatch?: string | null;
    stock: number | string;
    isActive: boolean;
  }>;
}

function revalidateCatalogAndAdminPaths(productSlug?: string) {
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/mujer");
  revalidatePath("/hombre");
  revalidatePath("/novedades");
  revalidatePath("/mayorista");
  revalidatePath("/carrito");
  revalidatePath("/checkout");
  if (productSlug) {
    revalidatePath(`/producto/${productSlug}`);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/productos");
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/promociones");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/pedidos");
}

/**
 * 6.2 — Crear o actualizar un producto comercial completo (datos base, categoría, precios B2C/B2B, imágenes y variantes).
 * Protege los pedidos históricos: impide eliminar variantes con referencias en `order_items`, `wholesale_quote_items` o `inventory_movements`.
 */
export async function adminSaveProductAction(
  payload: AdminProductSavePayload,
): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const validation = validateProductCommercialPayload({
    name: payload.name,
    slug: payload.slug,
    categoryId: Number(payload.categoryId),
    audience: payload.audience,
    status: payload.status,
    retailPricePen: payload.retailPricePen,
    compareAtPricePen: payload.compareAtPricePen,
    isWholesale: Boolean(payload.isWholesale),
    wholesaleTiers: payload.wholesaleTiers,
    variants: payload.variants,
  });

  if (
    !validation.valid ||
    !validation.normalizedSlug ||
    validation.retailAmountCents === undefined
  ) {
    return { success: false, error: validation.error ?? "Datos de producto inválidos." };
  }

  const slug = validation.normalizedSlug;
  const isUpdate = Boolean(payload.id && Number.isInteger(payload.id) && payload.id > 0);
  const productId = isUpdate ? Number(payload.id) : null;

  // Verificar que la categoría exista
  const [catRow] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, Number(payload.categoryId)))
    .limit(1);

  if (!catRow) {
    return { success: false, error: "La categoría seleccionada no existe en la base de datos." };
  }

  // Verificar unicidad del slug del producto
  const duplicateSlugRows = await db
    .select({ id: products.id })
    .from(products)
    .where(
      productId
        ? and(eq(products.slug, slug), ne(products.id, productId))
        : eq(products.slug, slug),
    )
    .limit(1);

  if (duplicateSlugRows.length > 0) {
    return {
      success: false,
      error: `El slug "${slug}" ya está siendo utilizado por otro producto. Elige uno distinto.`,
    };
  }

  // Verificar unicidad global de SKUs frente a otros productos
  const incomingSkus = payload.variants.map((v) => v.sku.trim().toUpperCase());
  const conflictingSkuRows = await db
    .select({ id: productVariants.id, sku: productVariants.sku, productId: productVariants.productId })
    .from(productVariants)
    .where(
      productId
        ? and(inArray(productVariants.sku, incomingSkus), ne(productVariants.productId, productId))
        : inArray(productVariants.sku, incomingSkus),
    )
    .limit(1);

  if (conflictingSkuRows.length > 0) {
    return {
      success: false,
      error: `El SKU "${conflictingSkuRows[0].sku}" ya pertenece a otro producto del catálogo.`,
    };
  }

  const now = new Date();
  let targetProductId = productId ?? 0;

  if (!isUpdate) {
    const [inserted] = await db
      .insert(products)
      .values({
        name: payload.name.trim(),
        slug,
        brand: (payload.brand || "INVESTMENTS").trim().slice(0, 120),
        shortDescription: payload.shortDescription?.trim() || null,
        fullDescription: payload.fullDescription?.trim() || null,
        categoryId: Number(payload.categoryId),
        audience: payload.audience,
        status: payload.status,
        badgeLabel: payload.badgeLabel?.trim().slice(0, 60) || null,
        sortOrder: Number.isInteger(Number(payload.sortOrder)) ? Number(payload.sortOrder) : 0,
        isNew: Boolean(payload.isNew),
        isFeatured: Boolean(payload.isFeatured),
        isWholesale: Boolean(payload.isWholesale),
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: products.id });

    targetProductId = inserted.id;
  } else {
    await db
      .update(products)
      .set({
        name: payload.name.trim(),
        slug,
        brand: (payload.brand || "INVESTMENTS").trim().slice(0, 120),
        shortDescription: payload.shortDescription?.trim() || null,
        fullDescription: payload.fullDescription?.trim() || null,
        categoryId: Number(payload.categoryId),
        audience: payload.audience,
        status: payload.status,
        badgeLabel: payload.badgeLabel?.trim().slice(0, 60) || null,
        sortOrder: Number.isInteger(Number(payload.sortOrder)) ? Number(payload.sortOrder) : 0,
        isNew: Boolean(payload.isNew),
        isFeatured: Boolean(payload.isFeatured),
        isWholesale: Boolean(payload.isWholesale),
        updatedAt: now,
      })
      .where(eq(products.id, targetProductId));
  }

  // Sincronizar precios (retail + escalas wholesale)
  await db.delete(productPrices).where(eq(productPrices.productId, targetProductId));
  const priceRowsToInsert: Array<typeof productPrices.$inferInsert> = [
    {
      productId: targetProductId,
      type: "retail",
      amount: validation.retailAmountCents,
      compareAtAmount: validation.compareAtAmountCents ?? null,
      minQuantity: 1,
      maxQuantity: null,
    },
  ];

  if (payload.isWholesale && validation.validatedTiers) {
    for (const tier of validation.validatedTiers) {
      priceRowsToInsert.push({
        productId: targetProductId,
        type: "wholesale",
        amount: tier.amountCents,
        compareAtAmount: null,
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity,
      });
    }
  }
  await db.insert(productPrices).values(priceRowsToInsert);

  // Sincronizar imágenes del producto
  const validImages = (payload.images ?? [])
    .map((im) => ({
      url: im.url.trim(),
      alt: (im.alt || payload.name).trim().slice(0, 300),
      isPrimary: Boolean(im.isPrimary),
    }))
    .filter((im) => im.url.length > 0);

  await db.delete(productImages).where(eq(productImages.productId, targetProductId));
  if (validImages.length > 0) {
    const hasPrimary = validImages.some((im) => im.isPrimary);
    await db.insert(productImages).values(
      validImages.map((im, idx) => ({
        productId: targetProductId,
        url: im.url,
        alt: im.alt,
        isPrimary: hasPrimary ? im.isPrimary : idx === 0,
        sortOrder: idx,
      })),
    );
  }

  // Sincronizar variantes respetando el historial de pedidos e inventario
  const existingVariants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, targetProductId));

  const existingById = new Map(existingVariants.map((v) => [v.id, v]));
  const existingBySku = new Map(existingVariants.map((v) => [v.sku.toUpperCase(), v]));
  const keptVariantIds = new Set<number>();

  for (const vInput of payload.variants) {
    const cleanSku = vInput.sku.trim().toUpperCase();
    const newStock = Math.max(0, Math.trunc(Number(vInput.stock)));
    const matchedExisting =
      (vInput.id && existingById.get(Number(vInput.id))) || existingBySku.get(cleanSku) || null;

    if (matchedExisting) {
      keptVariantIds.add(matchedExisting.id);
      const stockDelta = newStock - matchedExisting.stock;

      await db
        .update(productVariants)
        .set({
          sku: cleanSku,
          size: vInput.size?.trim() || null,
          colorName: vInput.colorName?.trim() || null,
          colorSwatch: vInput.colorSwatch?.trim() || null,
          stock: newStock,
          isActive: Boolean(vInput.isActive),
        })
        .where(eq(productVariants.id, matchedExisting.id));

      // Si el stock cambió desde la ficha de producto, registrar el movimiento en kardex
      if (stockDelta !== 0) {
        await db.insert(inventoryMovements).values({
          variantId: matchedExisting.id,
          orderId: null,
          actorId: admin.id,
          skuSnapshot: cleanSku,
          movementType: "manual_adjustment",
          quantityDelta: stockDelta,
          stockBefore: matchedExisting.stock,
          stockAfter: newStock,
          idempotencyKey: `product_save:${targetProductId}:variant:${matchedExisting.id}:${now.getTime()}`,
          notes: `Actualización de stock en edición administrativa del producto "${payload.name.trim()}"`,
          createdAt: now,
        });
      }
    } else {
      const [createdVar] = await db
        .insert(productVariants)
        .values({
          productId: targetProductId,
          sku: cleanSku,
          size: vInput.size?.trim() || null,
          colorName: vInput.colorName?.trim() || null,
          colorSwatch: vInput.colorSwatch?.trim() || null,
          stock: newStock,
          isActive: Boolean(vInput.isActive),
        })
        .returning({ id: productVariants.id });

      keptVariantIds.add(createdVar.id);

      if (newStock > 0) {
        await db.insert(inventoryMovements).values({
          variantId: createdVar.id,
          orderId: null,
          actorId: admin.id,
          skuSnapshot: cleanSku,
          movementType: "manual_adjustment",
          quantityDelta: newStock,
          stockBefore: 0,
          stockAfter: newStock,
          idempotencyKey: `variant_init:${createdVar.id}:${now.getTime()}`,
          notes: `Stock inicial al registrar variante ${cleanSku} en "${payload.name.trim()}"`,
          createdAt: now,
        });
      }
    }
  }

  // Para variantes que fueron quitadas del formulario: si tienen historial (pedidos, cotizaciones, reservas o movimientos),
  // se desactivan (`isActive: false, stock: 0`) en vez de borrarse físicamente para nunca romper pedidos históricos.
  for (const oldVar of existingVariants) {
    if (keptVariantIds.has(oldVar.id)) continue;

    const [hasOrders, hasQuotes, hasMovs, hasRes] = await Promise.all([
      db.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.variantId, oldVar.id)).limit(1),
      db
        .select({ id: wholesaleQuoteItems.id })
        .from(wholesaleQuoteItems)
        .where(eq(wholesaleQuoteItems.variantId, oldVar.id))
        .limit(1),
      db
        .select({ id: inventoryMovements.id })
        .from(inventoryMovements)
        .where(eq(inventoryMovements.variantId, oldVar.id))
        .limit(1),
      db
        .select({ id: inventoryReservations.id })
        .from(inventoryReservations)
        .where(eq(inventoryReservations.variantId, oldVar.id))
        .limit(1),
    ]);

    if (
      hasOrders.length > 0 ||
      hasQuotes.length > 0 ||
      hasMovs.length > 0 ||
      hasRes.length > 0
    ) {
      await db
        .update(productVariants)
        .set({ isActive: false, stock: 0 })
        .where(eq(productVariants.id, oldVar.id));
    } else {
      await db.delete(productVariants).where(eq(productVariants.id, oldVar.id));
    }
  }

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: isUpdate ? "product_updated" : "product_created",
    targetType: "product",
    targetId: targetProductId,
    details: `${isUpdate ? "Actualización" : "Creación"} de producto "${payload.name.trim()}" (slug: ${slug}, estado: ${payload.status}, precio B2C: S/ ${(validation.retailAmountCents / 100).toFixed(2)}, variantes: ${payload.variants.length})`,
  });

  revalidateCatalogAndAdminPaths(slug);
  revalidatePath(`/admin/productos/${targetProductId}`);

  return {
    success: true,
    entityId: targetProductId,
    message: isUpdate
      ? "Producto comercial actualizado correctamente."
      : "Nuevo producto creado y publicado en el catálogo.",
  };
}

/**
 * 6.2 — Cambiar rápidamente el estado de un producto (active / draft / archived) sin destruir pedidos históricos.
 */
export async function adminSetProductStatusAction(input: {
  productId: number;
  status: "draft" | "active" | "archived";
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  if (!["draft", "active", "archived"].includes(input.status)) {
    return { success: false, error: "Estado de producto inválido." };
  }

  const [found] = await db
    .select()
    .from(products)
    .where(eq(products.id, Number(input.productId)))
    .limit(1);

  if (!found) {
    return { success: false, error: "El producto indicado no existe." };
  }

  await db
    .update(products)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(products.id, found.id));

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "product_updated",
    targetType: "product",
    targetId: found.id,
    details: `Cambio de estado comercial en producto "${found.name}": ${found.status} → ${input.status}`,
  });

  revalidateCatalogAndAdminPaths(found.slug);
  return {
    success: true,
    message: `Estado del producto "${found.name}" actualizado a ${input.status}.`,
  };
}

/**
 * 6.3 — Crear o editar una categoría o subcategoría manteniendo sincronizada la navegación pública.
 */
export async function adminSaveCategoryAction(input: {
  id?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: number | null;
  audience?: "mujer" | "hombre" | "unisex" | null;
  sortOrder?: number;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const catId = input.id && Number.isInteger(input.id) && input.id > 0 ? Number(input.id) : null;
  const parentId =
    input.parentId && Number.isInteger(input.parentId) && input.parentId > 0
      ? Number(input.parentId)
      : null;

  const check = validateCategoryPayload({
    id: catId,
    name: input.name,
    slug: input.slug,
    parentId,
  });

  if (!check.valid || !check.normalizedSlug) {
    return { success: false, error: check.error ?? "Datos de categoría no válidos." };
  }

  const slug = check.normalizedSlug;

  // Verificar que no exista otra categoría con el mismo slug
  const dup = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      catId
        ? and(eq(categories.slug, slug), ne(categories.id, catId))
        : eq(categories.slug, slug),
    )
    .limit(1);

  if (dup.length > 0) {
    return {
      success: false,
      error: `Ya existe otra categoría con el slug "${slug}".`,
    };
  }

  // Verificar que parentId exista y no genere un ciclo
  if (parentId) {
    const [parentCat] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, parentId))
      .limit(1);

    if (!parentCat) {
      return { success: false, error: "La categoría padre seleccionada no existe." };
    }

    if (catId && parentCat.parentId === catId) {
      return {
        success: false,
        error: "Referencia circular detectada: la categoría seleccionada ya es hija de esta categoría.",
      };
    }
  }

  const now = new Date();
  let savedId = catId ?? 0;

  if (!catId) {
    const [inserted] = await db
      .insert(categories)
      .values({
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        parentId,
        audience: input.audience ?? null,
        sortOrder: Number.isInteger(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
        isActive: Boolean(input.isActive),
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: categories.id });

    savedId = inserted.id;
  } else {
    await db
      .update(categories)
      .set({
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        parentId,
        audience: input.audience ?? null,
        sortOrder: Number.isInteger(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
        isActive: Boolean(input.isActive),
        updatedAt: now,
      })
      .where(eq(categories.id, catId));
  }

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "category_updated",
    targetType: "category",
    targetId: savedId,
    details: `${catId ? "Edición" : "Creación"} de categoría "${input.name.trim()}" (slug: ${slug}, activa: ${input.isActive})`,
  });

  revalidateCatalogAndAdminPaths();
  return {
    success: true,
    entityId: savedId,
    message: catId
      ? "Categoría actualizada correctamente."
      : "Nueva categoría registrada en el catálogo.",
  };
}

/**
 * 6.3 — Eliminar o desactivar una categoría verificando que no deje productos huérfanos.
 */
export async function adminDeleteOrArchiveCategoryAction(
  categoryId: number,
): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, Number(categoryId)))
    .limit(1);

  if (!cat) {
    return { success: false, error: "La categoría indicada no existe." };
  }

  const [linkedProducts, childCats] = await Promise.all([
    db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.categoryId, cat.id))
      .limit(1),
    db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, cat.id))
      .limit(1),
  ]);

  if (linkedProducts.length > 0 || childCats.length > 0) {
    // No eliminar físicamente para evitar productos o subcategorías huérfanas; desactivar de forma segura
    await db
      .update(categories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(categories.id, cat.id));

    await db.insert(auditLogs).values({
      actorId: admin.id,
      action: "category_updated",
      targetType: "category",
      targetId: cat.id,
      details: `Categoría "${cat.name}" desactivada (posee productos o subcategorías vinculadas; se protege contra huérfanos).`,
    });

    revalidateCatalogAndAdminPaths();
    return {
      success: true,
      message: `La categoría "${cat.name}" tiene productos o subcategorías asociadas: fue desactivada de la navegación pública para evitar registros huérfanos.`,
    };
  }

  await db.delete(categories).where(eq(categories.id, cat.id));
  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "category_updated",
    targetType: "category",
    targetId: cat.id,
    details: `Eliminación de categoría sin productos vinculados: "${cat.name}" (${cat.slug})`,
  });

  revalidateCatalogAndAdminPaths();
  return {
    success: true,
    message: `Categoría "${cat.name}" eliminada correctamente.`,
  };
}

/**
 * 6.4 — Crear o actualizar una promoción comercial con vigencia por fechas y canal objetivo.
 */
export async function adminSavePromotionAction(input: {
  id?: number | null;
  code: string;
  name: string;
  description?: string | null;
  discountPercent: number | string;
  categoryId?: number | null;
  productId?: number | null;
  channelTarget: "retail" | "wholesale";
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const promoId = input.id && Number.isInteger(input.id) && input.id > 0 ? Number(input.id) : null;
  const check = validatePromotionPayload({
    code: input.code,
    name: input.name,
    discountPercent: input.discountPercent,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  });

  if (
    !check.valid ||
    !check.normalizedCode ||
    !check.discountPercent ||
    !check.startsDate ||
    !check.endsDate
  ) {
    return { success: false, error: check.error ?? "Datos de promoción inválidos." };
  }

  const dup = await db
    .select({ id: promotions.id })
    .from(promotions)
    .where(
      promoId
        ? and(eq(promotions.code, check.normalizedCode), ne(promotions.id, promoId))
        : eq(promotions.code, check.normalizedCode),
    )
    .limit(1);

  if (dup.length > 0) {
    return {
      success: false,
      error: `Ya existe una promoción registrada con el código "${check.normalizedCode}".`,
    };
  }

  const now = new Date();
  let savedId = promoId ?? 0;

  if (!promoId) {
    const [inserted] = await db
      .insert(promotions)
      .values({
        code: check.normalizedCode,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        discountPercent: check.discountPercent,
        categoryId:
          input.categoryId && Number(input.categoryId) > 0 ? Number(input.categoryId) : null,
        productId:
          input.productId && Number(input.productId) > 0 ? Number(input.productId) : null,
        channelTarget: input.channelTarget === "wholesale" ? "wholesale" : "retail",
        startsAt: check.startsDate,
        endsAt: check.endsDate,
        isActive: Boolean(input.isActive),
        createdBy: admin.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: promotions.id });

    savedId = inserted.id;
  } else {
    await db
      .update(promotions)
      .set({
        code: check.normalizedCode,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        discountPercent: check.discountPercent,
        categoryId:
          input.categoryId && Number(input.categoryId) > 0 ? Number(input.categoryId) : null,
        productId:
          input.productId && Number(input.productId) > 0 ? Number(input.productId) : null,
        channelTarget: input.channelTarget === "wholesale" ? "wholesale" : "retail",
        startsAt: check.startsDate,
        endsAt: check.endsDate,
        isActive: Boolean(input.isActive),
        updatedAt: now,
      })
      .where(eq(promotions.id, promoId));
  }

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "promotion_updated",
    targetType: "promotion",
    targetId: savedId,
    details: `${promoId ? "Actualización" : "Creación"} de promoción ${check.normalizedCode} (${input.name.trim()}): -${check.discountPercent}%, activa: ${input.isActive}`,
  });

  revalidateCatalogAndAdminPaths();
  return {
    success: true,
    entityId: savedId,
    message: promoId
      ? "Promoción comercial actualizada correctamente."
      : "Promoción comercial creada y activada.",
  };
}

/**
 * 6.4 — Activar o pausar rápidamente una promoción comercial.
 */
export async function adminTogglePromotionStatusAction(input: {
  promotionId: number;
  isActive: boolean;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const [promo] = await db
    .select()
    .from(promotions)
    .where(eq(promotions.id, Number(input.promotionId)))
    .limit(1);

  if (!promo) {
    return { success: false, error: "La promoción indicada no existe." };
  }

  await db
    .update(promotions)
    .set({
      isActive: Boolean(input.isActive),
      updatedAt: new Date(),
    })
    .where(eq(promotions.id, promo.id));

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "promotion_updated",
    targetType: "promotion",
    targetId: promo.id,
    details: `Promoción ${promo.code} ${input.isActive ? "activada" : "pausada"} por administrador.`,
  });

  revalidateCatalogAndAdminPaths();
  return {
    success: true,
    message: `Promoción ${promo.code} ${input.isActive ? "activada" : "pausada"} correctamente.`,
  };
}

/**
 * 6.5 — Registrar entrada de inventario, ajuste manual o merma/pérdida pasando por el servicio centralizado.
 */
export async function adminAdjustInventoryAction(input: {
  variantId: number;
  operationKind: AdminInventoryOperationKind;
  quantity: number;
  reason: string;
  idempotencyKey?: string;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();

  const result = await recordAdminInventoryAdjustment({
    variantId: Number(input.variantId),
    actorId: admin.id,
    operationKind: input.operationKind,
    quantity: Number(input.quantity),
    reason: input.reason,
    idempotencyKey: input.idempotencyKey,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error ?? "No se pudo registrar el movimiento de inventario.",
    };
  }

  revalidateCatalogAndAdminPaths();
  return {
    success: true,
    entityId: result.movementId,
    message: `Movimiento registrado en kardex: ${result.quantityDelta && result.quantityDelta > 0 ? `+${result.quantityDelta}` : result.quantityDelta} uds. (Stock: ${result.stockBefore} → ${result.stockAfter} uds.).`,
  };
}

/**
 * 6.6 — Activar o suspender una cuenta de cliente / empresa, revocando sesiones si se suspende.
 * Impide que el administrador en sesión se desactive a sí mismo.
 */
export async function adminSetCustomerActiveStateAction(input: {
  userId: number;
  isActive: boolean;
  reason?: string;
}): Promise<AdminActionResult> {
  const { user: admin } = await requireAdmin();
  const db = getDb();

  const targetUserId = Number(input.userId);
  if (targetUserId === admin.id) {
    return {
      success: false,
      error: "Por seguridad, no puedes suspender o desactivar tu propia cuenta de administrador.",
    };
  }

  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!targetUser) {
    return { success: false, error: "El usuario indicado no existe." };
  }

  const nextActive = Boolean(input.isActive);
  await db
    .update(users)
    .set({
      isActive: nextActive,
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetUser.id));

  if (!nextActive) {
    // Revocar todas las sesiones activas inmediatamente al suspender una cuenta
    await db.delete(sessions).where(eq(sessions.userId, targetUser.id));
  }

  await db.insert(auditLogs).values({
    actorId: admin.id,
    action: "customer_status_change",
    targetType: "user",
    targetId: targetUser.id,
    details: `Cuenta de ${targetUser.email} ${nextActive ? "REACTIVADA" : "SUSPENDIDA"}. ${input.reason?.trim() ? `Motivo: ${input.reason.trim()}` : ""}`,
  });

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${targetUser.id}`);
  revalidatePath("/admin");

  return {
    success: true,
    message: nextActive
      ? `La cuenta de ${targetUser.firstName} ${targetUser.lastName} fue reactivada.`
      : `La cuenta de ${targetUser.firstName} ${targetUser.lastName} fue suspendida y sus sesiones activas se cerraron.`,
  };
}
