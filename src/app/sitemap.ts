import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getSitemapCategorySlugs, getSitemapProducts } from "@/server/queries/products";

/**
 * Sitemap público.
 * - Siempre incluye portada y catálogo.
 * - Añade categorías y productos publicados (status = active) que NO sean de demostración.
 * - Los productos con is_demo = true se excluyen: no deben indexarse públicamente.
 * - Si la base de datos no responde, devuelve solo las rutas estáticas (no rompe el sitemap).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const [categorySlugs, products] = await Promise.all([getSitemapCategorySlugs(), getSitemapProducts()]);

    for (const slug of categorySlugs) {
      entries.push({ url: `${base}/catalogo/${slug}`, changeFrequency: "weekly", priority: 0.8 });
    }
    for (const p of products) {
      entries.push({
        url: `${base}/producto/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error("[sitemap] No se pudo consultar la base de datos; se publica solo la parte estática.", error);
  }

  return entries;
}
