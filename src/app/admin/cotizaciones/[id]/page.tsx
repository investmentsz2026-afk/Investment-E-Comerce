import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import { getQuoteDetailForUser, getQuoteAuditLogs } from "@/server/queries/quotes";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { AdminQuoteProposalForm } from "@/components/admin/admin-quote-proposal-form";
import { formatPEN } from "@/lib/format";
import { ArrowLeft, Building2, History, Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Evaluación de Cotización B2B | Admin",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ user: adminUser }, { id }] = await Promise.all([requireAdmin(), params]);
  const quoteId = Number(id);
  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    notFound();
  }

  const [quote, auditLogs] = await Promise.all([
    getQuoteDetailForUser(quoteId, adminUser.id, true),
    getQuoteAuditLogs(quoteId),
  ]);

  if (!quote) {
    notFound();
  }

  return (
    <div className="shell py-10 space-y-10">
      <div>
        <Link
          href="/admin/cotizaciones"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-taupe-600 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Volver al listado de cotizaciones B2B
        </Link>
      </div>

      {/* Cabecera */}
      <header className="flex flex-col justify-between gap-6 border border-ink/15 bg-paper p-6 sm:p-8 lg:flex-row lg:items-start">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm font-bold text-cochinilla">
              {quote.quoteNumber}
            </span>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <h1 className="font-display text-3xl text-ink">{quote.companyLegalName}</h1>
          <div className="flex flex-wrap items-center gap-4 pt-1 font-mono text-xs text-taupe-600">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-3.5 text-taupe-400" aria-hidden />
              RUC: <strong className="text-ink">{quote.companyTaxId}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5 text-taupe-400" aria-hidden />
              {quote.contactEmail}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="size-3.5 text-taupe-400" aria-hidden />
              {quote.contactPhone}
            </span>
            {quote.deliveryCity && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-taupe-400" aria-hidden />
                {quote.deliveryCity}
              </span>
            )}
          </div>
        </div>

        <div className="border border-ink/10 bg-[#fbfaf7] p-4 font-mono text-xs sm:min-w-64">
          <div className="flex justify-between py-1">
            <span className="text-taupe-500">Ref. Solicitado:</span>
            <span className="font-semibold text-ink">
              {formatPEN(quote.requestedSubtotalAmount)}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-taupe-500">Total Cotizado:</span>
            <span className="font-bold text-emerald-900">
              {quote.quotedTotalAmount !== null ? formatPEN(quote.quotedTotalAmount) : "Sin cotizar"}
            </span>
          </div>
          {quote.businessApplicationId && (
            <div className="mt-2 border-t border-ink/10 pt-2 text-right">
              <Link
                href={`/admin/solicitudes/${quote.businessApplicationId}`}
                className="text-[0.68rem] uppercase text-cochinilla underline"
              >
                Ver expediente RUC de la empresa →
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Requerimientos enviados por la empresa */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border border-ink/15 bg-paper p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-taupe-500">
            Necesidades Comerciales de la Empresa
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">
            {quote.commercialNeeds}
          </p>
          {quote.customerNotes && (
            <p className="mt-3 border-t border-ink/10 pt-3 text-xs text-taupe-600">
              <strong>Observaciones logísticas:</strong> {quote.customerNotes}
            </p>
          )}
        </div>

        <div className="border border-ink/15 bg-paper p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-taupe-500">
            Respuesta / Decisión del Cliente
          </p>
          {quote.decidedAt ? (
            <div className="mt-2 space-y-1.5 text-sm">
              <p className="font-medium text-ink">
                Decisión registrada el{" "}
                {new Date(quote.decidedAt).toLocaleString("es-PE")}
              </p>
              {quote.customerDecisionNotes && (
                <p className="text-xs text-taupe-700">
                  Nota del cliente: “{quote.customerDecisionNotes}”
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-taupe-500">
              El cliente aún no ha registrado una decisión final sobre esta propuesta.
            </p>
          )}
        </div>
      </div>

      {/* Formulario interactivo para armar y publicar la propuesta */}
      <AdminQuoteProposalForm quote={quote} />

      {/* Historial de modificaciones y auditoría */}
      <section aria-labelledby="audit-history-heading" className="border border-ink/15 bg-paper p-6">
        <div className="flex items-center gap-2 border-b border-ink/10 pb-4">
          <History className="size-4 text-cochinilla" aria-hidden />
          <h2 id="audit-history-heading" className="font-display text-xl text-ink">
            Historial de Modificaciones y Auditoría ({auditLogs.length})
          </h2>
        </div>

        {auditLogs.length === 0 ? (
          <p className="py-4 text-xs text-taupe-500">No hay registros de auditoría aún.</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/10 text-xs">
            {auditLogs.map((entry) => (
              <li key={entry.log.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row">
                <div>
                  <span className="font-mono font-semibold uppercase text-ink">
                    [{entry.log.action}]
                  </span>{" "}
                  <span className="text-taupe-700">{entry.log.details}</span>
                </div>
                <div className="shrink-0 font-mono text-[0.68rem] text-taupe-500">
                  {entry.actorFirstName
                    ? `${entry.actorFirstName} ${entry.actorLastName} (${entry.actorEmail})`
                    : "Sistema"}
                  {" · "}
                  {new Date(entry.log.createdAt).toLocaleString("es-PE")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

