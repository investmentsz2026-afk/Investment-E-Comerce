import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/server/auth/session";
import { getQuoteDetailForUser } from "@/server/queries/quotes";
import { getDb } from "@/server/db";
import { orders } from "@/server/db/schema";
import { QuoteDetailView } from "@/components/quotes/quote-detail-view";

export const metadata: Metadata = {
  title: "Detalle de Cotización B2B | Mi Cuenta · American Colt JEANS™",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AccountQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ user }, { id }] = await Promise.all([
    requireAuth("/cuenta/cotizaciones"),
    params,
  ]);

  const quoteId = Number(id);
  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    notFound();
  }

  const quote = await getQuoteDetailForUser(quoteId, user.id, user.role === "admin");
  if (!quote) {
    notFound();
  }

  const db = getDb();
  const convertedOrderRows = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders)
    .where(eq(orders.quoteId, quote.id))
    .limit(1);
  const convertedOrder = convertedOrderRows[0] ?? null;

  return (
    <QuoteDetailView
      quote={quote}
      convertedOrder={convertedOrder}
      backHref="/cuenta/cotizaciones"
    />
  );
}
