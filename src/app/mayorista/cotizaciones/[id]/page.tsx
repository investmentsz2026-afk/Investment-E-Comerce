import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { getQuoteDetailForUser } from "@/server/queries/quotes";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { orders } from "@/server/db/schema";
import { QuoteStatusBadge, getQuoteStatusMeta } from "@/components/quotes/quote-status-badge";
import { QuoteCustomerDecisionPanel } from "@/components/quotes/quote-customer-decision-panel";
import { formatPEN } from "@/lib/format";
import {
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Detalle de Cotización B2B",
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

  // Verificar aislamiento de datos: solo el propietario de la cotización (o admin) puede leerla
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

  const statusMeta = getQuoteStatusMeta(quote.status);

  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell space-y-10">
        <div>
          <Link
            href="/mayorista/cotizaciones"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-taupe-600 hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Volver a mis cotizaciones B2B
          </Link>
        </div>

        {/* Cabecera del expediente */}
        <header className="flex flex-col justify-between gap-6 border-b border-ink/10 pb-8 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-cochinilla">
                Expediente {quote.quoteNumber}
              </span>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <h1 className="mt-2 font-display text-display-sm text-ink">
              {quote.companyLegalName}
            </h1>
            <p className="mt-1 font-mono text-xs text-taupe-600">
              RUC: {quote.companyTaxId} · Contacto: {quote.contactName} ({quote.contactEmail})
            </p>
            <p className="mt-2 text-xs text-taupe-500">{statusMeta.description}</p>
          </div>

          <div className="border border-ink/15 bg-[#fbfaf7] p-5 text-xs sm:min-w-72">
            <div className="flex items-center justify-between py-1">
              <span className="text-taupe-500">Fecha de solicitud:</span>
              <span className="font-mono text-ink">
                {new Date(quote.createdAt).toLocaleDateString("es-PE", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {quote.quotedAt && (
              <div className="flex items-center justify-between py-1">
                <span className="text-taupe-500">Propuesta emitida:</span>
                <span className="font-mono text-ink">
                  {new Date(quote.quotedAt).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {quote.validUntil && (
              <div className="flex items-center justify-between py-1">
                <span className="text-taupe-500">Vence el:</span>
                <span className="font-mono font-semibold text-cochinilla">
                  {new Date(quote.validUntil).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {quote.paymentTermsProposal && (
              <div className="mt-2 border-t border-ink/10 pt-2">
                <span className="block text-[0.65rem] uppercase tracking-wider text-taupe-500">
                  Condición de pago propuesta:
                </span>
                <span className="mt-0.5 block font-medium text-ink">
                  {quote.paymentTermsProposal}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Propuesta del Ejecutivo Comercial si existe */}
        {quote.adminProposalNotes && (
          <div className="border border-emerald-400 bg-emerald-50/70 p-6 text-emerald-950">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">
              Propuesta Económica y Condiciones de INVESTMENTS
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-emerald-900">
              {quote.adminProposalNotes}
            </p>
            {quote.reviewerName && (
              <p className="mt-3 font-mono text-[0.68rem] text-emerald-800">
                Preparado por: {quote.reviewerName}
              </p>
            )}
          </div>
        )}

        {/* Tabla de prendas y condiciones congeladas (Snapshot inmutable) */}
        <section aria-labelledby="items-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="items-heading" className="font-display text-2xl text-ink">
              Prendas y Condiciones Unitarias ({quote.items.length}{" "}
              {quote.items.length === 1 ? "variante" : "variantes"})
            </h2>
            <span className="font-mono text-[0.68rem] text-taupe-500">
              * Los precios registrados se conservan como snapshot inmutable de esta cotización.
            </span>
          </div>

          <div className="overflow-x-auto border border-ink/15 bg-paper">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-[#fbfaf7] font-mono text-[0.65rem] uppercase tracking-[0.14em] text-taupe-600">
                <tr>
                  <th className="px-5 py-3.5">Prenda / Variante</th>
                  <th className="px-5 py-3.5">Cant. Solicitada</th>
                  <th className="px-5 py-3.5">Cant. Aprobada</th>
                  <th className="px-5 py-3.5">Precio Ref. Solicitud</th>
                  <th className="px-5 py-3.5">Precio Unit. Cotizado</th>
                  <th className="px-5 py-3.5 text-right">Subtotal Línea</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {quote.items.map((item) => {
                  const effectiveQty = item.approvedQuantity ?? item.requestedQuantity;
                  const effectiveUnit = item.quotedUnitPrice ?? item.referenceUnitPriceSnapshot;
                  const stockWarning =
                    item.liveStock !== null && item.liveStock < effectiveQty;

                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden bg-taupe-100">
                            <Image
                              src={item.imageUrlSnapshot ?? "/placeholder.jpg"}
                              alt={item.productNameSnapshot}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/producto/${item.productSlugSnapshot}`}
                              className="font-medium text-ink hover:underline"
                            >
                              {item.productNameSnapshot}
                            </Link>
                            <p className="font-mono text-xs text-taupe-500">
                              SKU: {item.skuSnapshot} · Color: {item.colorNameSnapshot ?? "Único"} · Talla:{" "}
                              {item.sizeSnapshot ?? "Única"}
                            </p>
                            {item.itemNotes && (
                              <p className="mt-0.5 text-xs italic text-taupe-600">
                                Nota: {item.itemNotes}
                              </p>
                            )}
                            {stockWarning && (
                              <p className="mt-1 inline-flex items-center gap-1 text-[0.68rem] text-amber-800">
                                <AlertTriangle className="size-3" aria-hidden />
                                Stock inmediato actual: {item.liveStock} uds. (el resto se programa a producción)
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs tabular-nums text-taupe-700">
                        {item.requestedQuantity} uds.
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-semibold tabular-nums text-ink">
                        {item.approvedQuantity !== null ? `${item.approvedQuantity} uds.` : "—"}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs tabular-nums text-taupe-600">
                        {formatPEN(item.referenceUnitPriceSnapshot)}
                        <span className="block text-[0.62rem] text-taupe-400">
                          (Retail: {formatPEN(item.retailUnitPriceSnapshot)})
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-semibold tabular-nums text-emerald-900">
                        {item.quotedUnitPrice !== null ? (
                          formatPEN(item.quotedUnitPrice)
                        ) : (
                          <span className="text-taupe-500">Pendiente</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                        {formatPEN(effectiveQty * effectiveUnit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-ink/15 bg-[#fbfaf7]">
                <tr>
                  <td colSpan={5} className="px-5 py-3 text-right text-xs text-taupe-600">
                    Subtotal referencial solicitado:
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm tabular-nums text-taupe-700">
                    {formatPEN(quote.requestedSubtotalAmount)}
                  </td>
                </tr>
                {quote.quotedTotalAmount !== null && (
                  <tr className="border-t border-ink/10">
                    <td
                      colSpan={5}
                      className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-ink"
                    >
                      Total Propuesta Económica Oficial (PEN):
                    </td>
                    <td
                      data-testid="quote-official-total"
                      className="px-5 py-4 text-right font-display text-2xl tabular-nums text-ink"
                    >
                      {formatPEN(quote.quotedTotalAmount)}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </section>

        {/* Especificaciones enviadas por el cliente */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border border-ink/15 bg-[#fbfaf7] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-taupe-500">
              Necesidades Comerciales Declaradas
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">
              {quote.commercialNeeds}
            </p>
            {quote.customerNotes && (
              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="font-mono text-[0.65rem] uppercase text-taupe-500">
                  Observaciones Logísticas:
                </p>
                <p className="mt-1 text-xs text-taupe-700">{quote.customerNotes}</p>
              </div>
            )}
            {quote.deliveryCity && (
              <p className="mt-3 font-mono text-xs text-taupe-600">
                Destino de despacho: <strong className="text-ink">{quote.deliveryCity}</strong>
              </p>
            )}
          </div>

          {/* Panel de aceptación / rechazo del cliente */}
          <QuoteCustomerDecisionPanel
            quoteId={quote.id}
            status={quote.status}
            isExpiredNow={quote.isExpiredNow}
            convertedOrderId={convertedOrder?.id ?? null}
            convertedOrderNumber={convertedOrder?.orderNumber ?? null}
          />
        </section>
      </div>
    </div>
  );
}
