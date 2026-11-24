import Image from "next/image";
import Link from "next/link";
import { QuoteStatusBadge, getQuoteStatusMeta } from "@/components/quotes/quote-status-badge";
import { QuoteCustomerDecisionPanel } from "@/components/quotes/quote-customer-decision-panel";
import { formatPEN } from "@/lib/format";
import type { QuoteStatus } from "@/server/queries/quotes";
import { ArrowLeft, AlertTriangle, Building2, Calendar, MapPin } from "lucide-react";

interface QuoteDetailItem {
  id: number;
  productNameSnapshot: string;
  productSlugSnapshot: string;
  skuSnapshot: string;
  colorNameSnapshot: string | null;
  sizeSnapshot: string | null;
  imageUrlSnapshot: string | null;
  itemNotes: string | null;
  requestedQuantity: number;
  approvedQuantity: number | null;
  referenceUnitPriceSnapshot: number;
  retailUnitPriceSnapshot: number;
  quotedUnitPrice: number | null;
  liveStock: number | null;
}

interface QuoteDetailViewProps {
  quote: {
    id: number;
    quoteNumber: string;
    status: QuoteStatus;
    companyLegalName: string;
    companyTaxId: string;
    contactName: string;
    contactEmail: string;
    createdAt: Date | string;
    quotedAt: Date | string | null;
    validUntil: Date | string | null;
    paymentTermsProposal: string | null;
    adminProposalNotes: string | null;
    reviewerName: string | null;
    requestedSubtotalAmount: number;
    quotedTotalAmount: number | null;
    commercialNeeds: string;
    customerNotes: string | null;
    deliveryCity: string | null;
    isExpiredNow: boolean;
    items: QuoteDetailItem[];
  };
  convertedOrder: { id: number; orderNumber: string } | null;
  backHref: "/mayorista/cotizaciones" | "/cuenta/cotizaciones";
}

export function QuoteDetailView({
  quote,
  convertedOrder,
  backHref,
}: QuoteDetailViewProps) {
  const statusMeta = getQuoteStatusMeta(quote.status);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs transition-colors hover:border-slate-900 hover:text-slate-900"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Volver a mis cotizaciones B2B
        </Link>
      </div>

      {/* Cabecera moderna del expediente */}
      <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-mono text-xs font-extrabold uppercase tracking-wider text-[#EF233C]">
                <Building2 className="size-3.5" aria-hidden />
                Expediente {quote.quoteNumber}
              </span>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <h1 className="mt-3 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
              {quote.companyLegalName}
            </h1>
            <p className="mt-1 font-mono text-xs text-slate-500">
              RUC: {quote.companyTaxId} · Contacto: {quote.contactName} ({quote.contactEmail})
            </p>
            <p className="mt-2.5 text-sm text-slate-600">{statusMeta.description}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-xs sm:min-w-72">
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="size-3.5" aria-hidden />
                Fecha de solicitud:
              </span>
              <span className="font-mono font-semibold text-slate-900">
                {new Date(quote.createdAt).toLocaleDateString("es-PE", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {quote.quotedAt && (
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Propuesta emitida:</span>
                <span className="font-mono font-semibold text-slate-900">
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
                <span className="text-slate-500">Vence el:</span>
                <span className="font-mono font-bold text-[#EF233C]">
                  {new Date(quote.validUntil).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {quote.paymentTermsProposal && (
              <div className="mt-2 border-t border-slate-200 pt-2">
                <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                  Condición de pago propuesta:
                </span>
                <span className="mt-0.5 block font-bold text-slate-900">
                  {quote.paymentTermsProposal}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Propuesta del Ejecutivo Comercial si existe */}
      {quote.adminProposalNotes && (
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 p-6 shadow-xs sm:p-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">
            Propuesta Económica y Condiciones de American Colt JEANS™
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {quote.adminProposalNotes}
          </p>
          {quote.reviewerName && (
            <p className="mt-3 font-mono text-[0.68rem] font-semibold text-emerald-700">
              Preparado por: {quote.reviewerName}
            </p>
          )}
        </div>
      )}

      {/* Tabla de prendas y condiciones congeladas */}
      <section aria-labelledby="items-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="items-heading"
            className="font-sans text-xl font-black uppercase tracking-tight text-slate-900 sm:text-2xl"
          >
            Prendas y Condiciones Unitarias ({quote.items.length}{" "}
            {quote.items.length === 1 ? "variante" : "variantes"})
          </h2>
          <span className="font-mono text-[0.68rem] text-slate-500">
            * Precios conservados como snapshot inmutable de esta cotización.
          </span>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Prenda / Variante</th>
                <th className="px-6 py-4">Cant. Solicitada</th>
                <th className="px-6 py-4">Cant. Aprobada</th>
                <th className="px-6 py-4">Precio Ref. Solicitud</th>
                <th className="px-6 py-4">Precio Unit. Cotizado</th>
                <th className="px-6 py-4 text-right">Subtotal Línea</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quote.items.map((item) => {
                const effectiveQty = item.approvedQuantity ?? item.requestedQuantity;
                const effectiveUnit = item.quotedUnitPrice ?? item.referenceUnitPriceSnapshot;
                const stockWarning =
                  item.liveStock !== null && item.liveStock < effectiveQty;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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
                            className="font-bold text-slate-900 hover:text-[#2563EB] hover:underline"
                          >
                            {item.productNameSnapshot}
                          </Link>
                          <p className="font-mono text-xs text-slate-500">
                            SKU: {item.skuSnapshot} · Color: {item.colorNameSnapshot ?? "Único"} · Talla:{" "}
                            {item.sizeSnapshot ?? "Única"}
                          </p>
                          {item.itemNotes && (
                            <p className="mt-0.5 text-xs italic text-slate-600">
                              Nota: {item.itemNotes}
                            </p>
                          )}
                          {stockWarning && (
                            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[0.68rem] font-semibold text-amber-800">
                              <AlertTriangle className="size-3" aria-hidden />
                              Stock inmediato actual: {item.liveStock} uds. (el resto se programa a producción)
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs tabular-nums text-slate-700">
                      {item.requestedQuantity} uds.
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold tabular-nums text-slate-900">
                      {item.approvedQuantity !== null ? `${item.approvedQuantity} uds.` : "—"}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs tabular-nums text-slate-600">
                      {formatPEN(item.referenceUnitPriceSnapshot)}
                      <span className="block text-[0.62rem] text-slate-400">
                        (Retail: {formatPEN(item.retailUnitPriceSnapshot)})
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold tabular-nums text-emerald-700">
                      {item.quotedUnitPrice !== null ? (
                        formatPEN(item.quotedUnitPrice)
                      ) : (
                        <span className="text-slate-400">Pendiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-extrabold tabular-nums text-slate-900">
                      {formatPEN(effectiveQty * effectiveUnit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50/90">
              <tr>
                <td colSpan={5} className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600">
                  Subtotal referencial solicitado:
                </td>
                <td className="px-6 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-slate-700">
                  {formatPEN(quote.requestedSubtotalAmount)}
                </td>
              </tr>
              {quote.quotedTotalAmount !== null && (
                <tr className="border-t border-slate-200 bg-slate-900 text-white">
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-[0.14em]"
                  >
                    Total Propuesta Económica Oficial (PEN):
                  </td>
                  <td
                    data-testid="quote-official-total"
                    className="px-6 py-4 text-right font-sans text-2xl font-black tabular-nums text-white"
                  >
                    {formatPEN(quote.quotedTotalAmount)}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </section>

      {/* Especificaciones + panel de decisión */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-slate-600">
            Necesidades Comerciales Declaradas
          </span>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-800">
            {quote.commercialNeeds}
          </p>
          {quote.customerNotes && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-500">
                Observaciones Logísticas:
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{quote.customerNotes}</p>
            </div>
          )}
          {quote.deliveryCity && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-slate-800">
              <MapPin className="size-3.5 text-[#EF233C]" aria-hidden />
              Destino de despacho: <strong>{quote.deliveryCity}</strong>
            </p>
          )}
        </div>

        <QuoteCustomerDecisionPanel
          quoteId={quote.id}
          status={quote.status}
          isExpiredNow={quote.isExpiredNow}
          convertedOrderId={convertedOrder?.id ?? null}
          convertedOrderNumber={convertedOrder?.orderNumber ?? null}
        />
      </section>
    </div>
  );
}
