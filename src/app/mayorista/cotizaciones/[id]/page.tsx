import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getCurrentSession } from "@/server/auth/session";
import { getQuoteDetailForUser } from "@/server/queries/quotes";
import { getDb } from "@/server/db";
import { orders } from "@/server/db/schema";
import { QuoteDetailView } from "@/components/quotes/quote-detail-view";

export const metadata: Metadata = {
  title: "Detalle de Cotización B2B | American Colt JEANS™",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ user }, { id }] = await Promise.all([getCurrentSession(), params]);

  if (!user) {
    redirect(`/iniciar-sesion?next=/mayorista/cotizaciones/${id}`);
  }

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
    <div className="bg-gradient-to-b from-slate-50/90 via-white to-slate-50/70 pt-[7rem] pb-16 sm:pt-[7.25rem] lg:pt-[10.75rem] lg:pb-24">
      <div className="shell">
        <QuoteDetailView
          quote={quote}
          convertedOrder={convertedOrder}
          backHref="/mayorista/cotizaciones"
        />
      </div>
    </div>
  );
}
