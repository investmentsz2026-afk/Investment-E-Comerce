import "server-only";
import { eq, and, asc, count } from "drizzle-orm";
import { getDb } from "@/server/db";
import * as schema from "@/server/db/schema";
import type { CategoryRecord } from "@/types/catalog";

// ──────────────────────────────────────────────────────────────
// Category queries
// ──────────────────────────────────────────────────────────────

/** Obtener todas las categorías activas con conteo de productos. */
export async function getCategories(): Promise<CategoryRecord[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: schema.categories.id,
      slug: schema.categories.slug,
      name: schema.categories.name,
      description: schema.categories.description,
      imageUrl: schema.categories.imageUrl,
      parentId: schema.categories.parentId,
      audience: schema.categories.audience,
      sortOrder: schema.categories.sortOrder,
      productCount: count(schema.products.id),
    })
    .from(schema.categories)
    .leftJoin(
      schema.products,
      and(
        eq(schema.products.categoryId, schema.categories.id),
        eq(schema.products.status, "active"),
      ),
    )
    .where(eq(schema.categories.isActive, true))
    .groupBy(schema.categories.id)
    .orderBy(asc(schema.categories.sortOrder), asc(schema.categories.name));

  return rows.map((r) => ({
    ...r,
    productCount: Number(r.productCount),
  }));
}

/** Obtener categorías que tienen al menos un producto activo. */
export async function getCategoriesWithProducts(): Promise<CategoryRecord[]> {
  const all = await getCategories();
  return all.filter((c) => (c.productCount ?? 0) > 0);
}

/** Obtener una categoría por slug. */
export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryRecord | null> {
  const db = getDb();

  const rows = await db
    .select({
      id: schema.categories.id,
      slug: schema.categories.slug,
      name: schema.categories.name,
      description: schema.categories.description,
      imageUrl: schema.categories.imageUrl,
      parentId: schema.categories.parentId,
      audience: schema.categories.audience,
      sortOrder: schema.categories.sortOrder,
      productCount: count(schema.products.id),
    })
    .from(schema.categories)
    .leftJoin(
      schema.products,
      and(
        eq(schema.products.categoryId, schema.categories.id),
        eq(schema.products.status, "active"),
      ),
    )
    .where(and(eq(schema.categories.slug, slug), eq(schema.categories.isActive, true)))
    .groupBy(schema.categories.id);

  return rows[0] ? { ...rows[0], productCount: Number(rows[0].productCount) } : null;
}

/** Obtener categorías hijas de una categoría padre. */
export async function getChildCategories(
  parentId: number,
): Promise<CategoryRecord[]> {
  const all = await getCategories();
  return all.filter((c) => c.parentId === parentId);
}
