import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { promotions } from "@/server/db/schema";
import { parsePromoDescription, stripEmojis, type PublicPromotionItem } from "@/lib/promo-display";

/**
 * Obtiene las promociones activas desde Neon PostgreSQL para mostrarlas en:
 * 1. Cintillo superior (arriba de la página)
 * 2. Ventana emergente al cargar la página (Popup de bienvenida)
 * 3. Banners promocionales de la página de inicio
 */
export async function getActivePublicPromotions(): Promise<PublicPromotionItem[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(promotions)
      .where(eq(promotions.isActive, true))
      .orderBy(desc(promotions.createdAt));

    const now = new Date();
    const validRows = rows.filter((r) => now <= r.endsAt);

    return validRows.map((row) => {
      const parsed = parsePromoDescription(row.description, row.code);
      return {
        id: row.id,
        code: row.code,
        name: stripEmojis(row.name),
        description: row.description,
        cleanDescription:
          parsed.cleanDescription ||
          `${stripEmojis(row.name)} — Obtén ${row.discountPercent}% de descuento directo en prendas seleccionadas.`,
        discountPercent: row.discountPercent,
        channelTarget: row.channelTarget,
        placement: parsed.placement,
        ctaHref:
          parsed.ctaHref && parsed.ctaHref !== "/catalogo"
            ? parsed.ctaHref
            : row.channelTarget === "wholesale"
              ? "/mayorista/cotizaciones"
              : "/catalogo",
        showInTopBar: parsed.showInTopBar,
        showInPopup: parsed.showInPopup,
        showInHomeBanner: parsed.showInHomeBanner,
        endsAtIso: row.endsAt.toISOString(),
      };
    });
  } catch {
    return [];
  }
}
