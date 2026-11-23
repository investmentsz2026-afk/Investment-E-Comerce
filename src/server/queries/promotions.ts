import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { categories, promotions } from "@/server/db/schema";
import {
  parsePromoDescription,
  stripEmojis,
  type PublicPromotionItem,
} from "@/lib/promo-display";

/**
 * Obtiene las promociones activas y vigentes desde Neon PostgreSQL para mostrarlas en:
 * 1. Cintillo superior (arriba de la página)
 * 2. Ventana emergente al cargar la página (Popup de bienvenida)
 * 3. Banners promocionales de la página de inicio
 * 4. Banners dentro del catálogo y categorías seleccionadas
 */
export async function getActivePublicPromotions(): Promise<PublicPromotionItem[]> {
  try {
    const db = getDb();
    const [rows, allCategories] = await Promise.all([
      db
        .select()
        .from(promotions)
        .where(eq(promotions.isActive, true))
        .orderBy(desc(promotions.createdAt)),
      db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        })
        .from(categories)
        .orderBy(asc(categories.sortOrder)),
    ]);

    const catById = new Map(allCategories.map((c) => [c.id, c]));
    const now = new Date();
    const validRows = rows.filter((r) => now >= r.startsAt && now <= r.endsAt);

    return validRows.map((row) => {
      const parsed = parsePromoDescription(row.description, row.code);
      const linkedCat = row.categoryId ? (catById.get(row.categoryId) ?? null) : null;

      let resolvedHref = parsed.ctaHref;
      if (!resolvedHref || resolvedHref === "/catalogo") {
        if (linkedCat) {
          resolvedHref = `/catalogo/${linkedCat.slug}`;
        } else if (row.channelTarget === "wholesale") {
          resolvedHref = "/mayorista/cotizaciones";
        } else {
          resolvedHref = "/catalogo";
        }
      }

      return {
        id: row.id,
        code: row.code,
        name: stripEmojis(row.name),
        description: row.description,
        cleanDescription:
          parsed.cleanDescription ||
          `${stripEmojis(row.name)} — Obtén ${row.discountPercent}% de descuento directo en prendas seleccionadas.`,
        discountPercent: row.discountPercent,
        categoryId: row.categoryId ?? null,
        categorySlug: linkedCat?.slug ?? null,
        categoryName: linkedCat?.name ?? null,
        channelTarget: row.channelTarget,
        placement: parsed.placement,
        ctaHref: resolvedHref,
        applyToCart: parsed.applyToCart,
        imageUrl: parsed.imageUrl,
        showInTopBar: parsed.showInTopBar,
        showInPopup: parsed.showInPopup,
        showInHomeBanner: parsed.showInHomeBanner,
        showInCatalogBanner: parsed.showInCatalogBanner,
        endsAtIso: row.endsAt.toISOString(),
      };
    });
  } catch {
    return [];
  }
}
