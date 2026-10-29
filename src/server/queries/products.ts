import "server-only";
import { eq, and, or, sql, asc, desc, inArray, count, type SQL } from "drizzle-orm";
import { getDb } from "@/server/db";
import * as schema from "@/server/db/schema";
import { escapeLike, foldText, clampPage, resolvePageSize } from "@/lib/catalog-params";
import { activeVariants, totalStock as sumStock } from "@/lib/variant-stock";
import type {
  Audience,
  CatalogFilters,
  CatalogProduct,
  PaginatedResult,
  Product,
  ProductRecord,
  AvailableFilters,
  SortOption,
} from "@/types/catalog";

/** Tamaño de página configurable con CATALOG_PAGE_SIZE (por defecto 12, máximo 48). */
function pageSize() {
  return resolvePageSize(process.env.CATALOG_PAGE_SIZE);
}

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

function sizeRank(size: string): number {
  const i = SIZE_ORDER.indexOf(size);
  if (i >= 0) return i;
  const n = Number(size);
  return Number.isFinite(n) ? 100 + n : 1000;
}

/** Relaciones que se cargan en toda tarjeta o ficha de producto (solo variantes activas). */
const productRelations = {
  category: true as const,
  images: { orderBy: [asc(schema.productImages.sortOrder)] },
  variants: {
    where: eq(schema.productVariants.isActive, true),
    orderBy: [asc(schema.productVariants.size)],
  },
  prices: { orderBy: [asc(schema.productPrices.minQuantity)] },
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/** Convierte un ProductRecord (con relaciones) al formato CatalogProduct/Product para tarjetas. */
export function toCardProduct(row: ProductRecord): CatalogProduct {
  const variants = activeVariants(row.variants);
  const primaryImage = row.images.find((i) => i.isPrimary) ?? row.images[0];
  const retailPrice = row.prices.find((p) => p.type === "retail");
  const wholesalePrice = row.prices
    .filter((p) => p.type === "wholesale")
    .sort((a, b) => a.minQuantity - b.minQuantity)[0];

  // Colores únicos (con stock primero para no ofrecer colores agotados como opción principal)
  const colorMap = new Map<string, string>();
  for (const v of variants) {
    if (v.colorName && v.colorSwatch && !colorMap.has(v.colorName)) {
      colorMap.set(v.colorName, v.colorSwatch);
    }
  }
  const colors = Array.from(colorMap.entries()).map(([name, swatch]) => ({ name, swatch }));

  // Tallas únicas con unidades disponibles, en orden lógico
  const sizeSet = new Set<string>();
  for (const v of variants) {
    if (v.size && v.stock > 0) sizeSet.add(v.size);
  }
  const sizes = Array.from(sizeSet).sort((a, b) => sizeRank(a) - sizeRank(b)) as unknown as Product["sizes"];

  // Determinar badge
  let badge: Product["badge"] | undefined;
  if (row.isNew) badge = "nuevo";
  else if (row.badgeLabel === "edicion-limitada") badge = "edicion-limitada";
  else if (row.badgeLabel === "esencial") badge = "esencial";
  else if (row.isWholesale) badge = "mayorista";

  const stock = sumStock(variants);

  return {
    dbId: row.id,
    id: `prod-${row.id}`,
    slug: row.slug,
    name: row.name,
    audience: row.audience,
    category: row.category.name,
    price: retailPrice?.amount ?? 0,
    compareAtPrice: retailPrice?.compareAtAmount ?? undefined,
    colors,
    sizes,
    badge,
    image: {
      src: primaryImage?.url ?? "/placeholder.jpg",
      alt: primaryImage?.alt ?? row.name,
    },
    wholesale: wholesalePrice
      ? { minQuantity: wholesalePrice.minQuantity, unitPrice: wholesalePrice.amount }
      : undefined,
    soldOut: stock === 0,
    shortDescription: row.shortDescription,
    isDemo: row.isDemo,
    totalStock: stock,
  };
}

/** Carga productos completos por id y los devuelve en el mismo orden que `ids`. */
async function loadRecordsByIds(ids: number[]): Promise<ProductRecord[]> {
  if (ids.length === 0) return [];
  const db = getDb();
  const rows = (await db.query.products.findMany({
    where: inArray(schema.products.id, ids),
    with: productRelations,
  })) as unknown as ProductRecord[];
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((r): r is ProductRecord => r !== undefined);
}

// Subconsultas SQL reutilizables (correlacionadas con `products`)

/** Precio minorista (el de menor cantidad mínima) del producto, en céntimos. */
const retailPriceSql = sql`(select pp.amount from product_prices pp where pp.product_id = ${schema.products.id} and pp.type = 'retail' order by pp.min_quantity asc limit 1)`;

/** Texto normalizado (minúsculas, sin tildes) para comparar. */
const fold = (expr: SQL | typeof schema.products.name | typeof schema.products.shortDescription) =>
  sql`translate(lower(${expr}), 'áéíóúüñ', 'aeiouun')`;

/** Condiciones WHERE derivadas de los filtros. Todo se resuelve en SQL para que total y paginación sean exactos. */
async function buildConditions(filters: CatalogFilters): Promise<SQL[] | null> {
  const db = getDb();
  const conditions: SQL[] = [eq(schema.products.status, "active")];

  if (filters.categoria) {
    const cat = await db.query.categories.findFirst({
      where: and(eq(schema.categories.slug, filters.categoria), eq(schema.categories.isActive, true)),
    });
    if (!cat) return null; // categoría inexistente → sin resultados
    conditions.push(eq(schema.products.categoryId, cat.id));
  }

  if (filters.audiencia) conditions.push(eq(schema.products.audience, filters.audiencia));
  if (filters.novedades) conditions.push(eq(schema.products.isNew, true));
  if (filters.mayorista) conditions.push(eq(schema.products.isWholesale, true));

  if (filters.busqueda) {
    const pattern = `%${escapeLike(foldText(filters.busqueda))}%`;
    conditions.push(
      or(
        sql`${fold(schema.products.name)} like ${pattern}`,
        sql`${fold(schema.products.shortDescription)} like ${pattern}`,
        sql`exists (select 1 from categories c where c.id = ${schema.products.categoryId} and ${fold(sql`c.name`)} like ${pattern})`,
      )!,
    );
  }

  // Talla + color + disponibilidad deben coincidir en UNA misma variante activa con stock
  const sizes = filters.tallas ?? [];
  const colors = filters.colores ?? [];
  if (sizes.length > 0 || colors.length > 0 || filters.disponible) {
    const parts: SQL[] = [sql`pv.product_id = ${schema.products.id}`, sql`pv.is_active = true`, sql`pv.stock > 0`];
    if (sizes.length > 0) parts.push(sql`pv.size in (${sql.join(sizes.map((s) => sql`${s}`), sql`, `)})`);
    if (colors.length > 0) parts.push(sql`pv.color_name in (${sql.join(colors.map((c) => sql`${c}`), sql`, `)})`);
    conditions.push(sql`exists (select 1 from product_variants pv where ${sql.join(parts, sql` and `)})`);
  }

  if (filters.precioMin !== undefined) conditions.push(sql`${retailPriceSql} >= ${filters.precioMin}`);
  if (filters.precioMax !== undefined) conditions.push(sql`${retailPriceSql} <= ${filters.precioMax}`);

  return conditions;
}

function getOrderClauses(sort?: SortOption): SQL[] {
  switch (sort) {
    case "recientes":
      return [desc(schema.products.createdAt), asc(schema.products.id)];
    case "precio-asc":
      return [sql`${retailPriceSql} asc nulls last`, asc(schema.products.id)];
    case "precio-desc":
      return [sql`${retailPriceSql} desc nulls last`, asc(schema.products.id)];
    case "nombre":
      return [asc(schema.products.name), asc(schema.products.id)];
    default:
      return [asc(schema.products.sortOrder), desc(schema.products.isNew), asc(schema.products.id)];
  }
}

// ──────────────────────────────────────────────────────────────
// Product queries
// ──────────────────────────────────────────────────────────────

/** Obtener un producto publicado por slug con todas sus relaciones. */
export async function getProductBySlug(slug: string): Promise<ProductRecord | null> {
  const db = getDb();
  const result = await db.query.products.findFirst({
    where: and(eq(schema.products.slug, slug), eq(schema.products.status, "active")),
    with: productRelations,
  });
  if (!result) return null;
  return result as unknown as ProductRecord;
}

/** Obtener productos con filtros, paginación y ordenamiento (todo en SQL). */
export async function getProducts(filters: CatalogFilters = {}): Promise<PaginatedResult<CatalogProduct>> {
  const db = getDb();
  const size = pageSize();
  const conditions = await buildConditions(filters);

  if (!conditions) {
    return { items: [], total: 0, page: 1, pageSize: size, totalPages: 0 };
  }

  const [totalRow] = await db
    .select({ count: count() })
    .from(schema.products)
    .where(and(...conditions));
  const total = Number(totalRow?.count ?? 0);
  const totalPages = Math.ceil(total / size);
  const page = clampPage(filters.pagina, totalPages);

  const idRows = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(and(...conditions))
    .orderBy(...getOrderClauses(filters.orden))
    .limit(size)
    .offset((page - 1) * size);

  const records = await loadRecordsByIds(idRows.map((r) => r.id));
  return { items: records.map(toCardProduct), total, page, pageSize: size, totalPages };
}

/** Obtener productos destacados para el home (limitado). */
export async function getFeaturedProducts(limit = 8): Promise<CatalogProduct[]> {
  const db = getDb();
  const rows = (await db.query.products.findMany({
    where: eq(schema.products.status, "active"),
    with: productRelations,
    orderBy: [desc(schema.products.isNew), asc(schema.products.sortOrder)],
    limit,
  })) as unknown as ProductRecord[];
  return rows.map(toCardProduct);
}

/** Obtener productos relacionados (misma categoría, excluyendo el actual). */
export async function getRelatedProducts(
  productId: number,
  categoryId: number,
  limit = 4,
): Promise<CatalogProduct[]> {
  const db = getDb();
  const rows = (await db.query.products.findMany({
    where: and(
      eq(schema.products.status, "active"),
      eq(schema.products.categoryId, categoryId),
      sql`${schema.products.id} != ${productId}`,
    ),
    with: productRelations,
    orderBy: [asc(schema.products.sortOrder), asc(schema.products.id)],
    limit,
  })) as unknown as ProductRecord[];
  return rows.map(toCardProduct);
}

/** Buscar productos por nombre, descripción corta o categoría (sin distinguir tildes ni mayúsculas). */
export async function searchProducts(query: string, limit = 20): Promise<CatalogProduct[]> {
  const q = query.trim();
  if (!q) return [];
  const db = getDb();
  const conditions = await buildConditions({ busqueda: q.slice(0, 80) });
  if (!conditions) return [];

  const idRows = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(and(...conditions))
    .orderBy(...getOrderClauses())
    .limit(limit);

  const records = await loadRecordsByIds(idRows.map((r) => r.id));
  return records.map(toCardProduct);
}

/** Obtener filtros disponibles para los productos publicados (opcionalmente de una categoría). */
export async function getAvailableFilters(categorySlug?: string): Promise<AvailableFilters> {
  const db = getDb();

  const conditions = [eq(schema.products.status, "active")];
  if (categorySlug) {
    const cat = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, categorySlug),
    });
    if (cat) conditions.push(eq(schema.products.categoryId, cat.id));
  }

  const rows = await db.query.products.findMany({
    where: and(...conditions),
    with: {
      variants: { where: eq(schema.productVariants.isActive, true) },
      prices: { where: eq(schema.productPrices.type, "retail") },
    },
  });

  const sizeSet = new Set<string>();
  const colorCounts = new Map<string, { swatch: string; count: number }>();
  let minPrice = Infinity;
  let maxPrice = 0;
  const audienceCounts = new Map<string, number>();

  for (const product of rows) {
    audienceCounts.set(product.audience, (audienceCounts.get(product.audience) ?? 0) + 1);

    for (const p of product.prices) {
      if (p.amount < minPrice) minPrice = p.amount;
      if (p.amount > maxPrice) maxPrice = p.amount;
    }

    // Cada color se cuenta una sola vez por producto
    const seenColors = new Set<string>();
    for (const v of product.variants) {
      if (v.size) sizeSet.add(v.size);
      if (v.colorName && v.colorSwatch && !seenColors.has(v.colorName)) {
        seenColors.add(v.colorName);
        const existing = colorCounts.get(v.colorName);
        if (existing) existing.count++;
        else colorCounts.set(v.colorName, { swatch: v.colorSwatch, count: 1 });
      }
    }
  }

  return {
    sizes: Array.from(sizeSet).sort((a, b) => sizeRank(a) - sizeRank(b)),
    colors: Array.from(colorCounts.entries()).map(([name, { swatch, count }]) => ({ name, swatch, count })),
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice === 0 ? 0 : maxPrice,
    },
    audiences: Array.from(audienceCounts.entries()).map(([value, count]) => ({
      value: value as Audience,
      count,
    })),
  };
}

/**
 * Entradas del sitemap: solo productos publicados (status = active) y NO de demostración.
 * Los productos demo nunca se indexan públicamente.
 */
export async function getSitemapProducts(): Promise<{ slug: string; updatedAt: Date }[]> {
  const db = getDb();
  return db
    .select({ slug: schema.products.slug, updatedAt: schema.products.updatedAt })
    .from(schema.products)
    .where(and(eq(schema.products.status, "active"), eq(schema.products.isDemo, false)))
    .orderBy(asc(schema.products.id));
}

/** Slugs de categorías activas que tienen al menos un producto publicado no demo. */
export async function getSitemapCategorySlugs(): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .selectDistinct({ slug: schema.categories.slug })
    .from(schema.categories)
    .innerJoin(schema.products, eq(schema.products.categoryId, schema.categories.id))
    .where(
      and(
        eq(schema.categories.isActive, true),
        eq(schema.products.status, "active"),
        eq(schema.products.isDemo, false),
      ),
    );
  return rows.map((r) => r.slug);
}
