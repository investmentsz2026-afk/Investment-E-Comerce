import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import {
  getQuoteDetailForUser,
  getQuoteAuditLogs,
} from "@/server/queries/quotes";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { AdminQuoteProposalForm } from "@/components/admin/admin-quote-proposal-form";
import { formatPEN } from "@/lib/format";
import {
  ArrowLeft,
  Building2,
  History,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  FileText,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Evaluación de Cotización B2B | Admin American Colt",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ user: adminUser }, { id }] = await Promise.all([
    requireAdmin(),
    params,
  ]);
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
    <div className="space-y-6 font-sans">
      <div>
        <Link
          href="/admin/cotizaciones"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#DC2626]/40 hover:text-[#DC2626]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver al listado de cotizaciones B2B
        </Link>
      </div>

      {/* CABECERA HERO 3D */}
      <header className="relative overflow-hidden rounded-3xl border border-red-900/20 bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] p-6 text-white shadow-[0_20px_48px_-14px_rgba(220,38,38,0.42)] sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-white/15 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md">
                <Sparkles className="size-3.5" />
                {quote.quoteNumber}
              </span>
              <QuoteStatusBadge status={quote.status} />
            </div>

            <h1 className="font-sans text-3xl font-black tracking-tight sm:text-4xl">
              {quote.companyLegalName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5" aria-hidden />
                RUC:{" "}
                <strong className="font-extrabold text-white">
                  {quote.companyTaxId}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" aria-hidden />
                {quote.contactEmail}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5" aria-hidden />
                {quote.contactPhone}
              </span>
              {quote.deliveryCity && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden />
                  {quote.deliveryCity}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/25 bg-white/95 px-6 py-4 text-xs text-slate-900 shadow-lg sm:min-w-72">
            <div className="flex items-center justify-between gap-4 py-1">
              <span className="font-bold text-slate-500">Ref. Solicitado:</span>
              <span className="font-extrabold tabular-nums text-slate-900">
                {formatPEN(quote.requestedSubtotalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 py-1">
              <span className="font-bold text-slate-500">Total Cotizado:</span>
              <span className="text-base font-black tabular-nums text-emerald-700">
                {quote.quotedTotalAmount !== null
                  ? formatPEN(quote.quotedTotalAmount)
                  : "Sin cotizar"}
              </span>
            </div>
            {quote.businessApplicationId && (
              <div className="mt-2 border-t border-slate-200 pt-2 text-right">
                <Link
                  href={`/admin/solicitudes/${quote.businessApplicationId}`}
                  className="text-[0.7rem] font-extrabold uppercase text-[#DC2626] hover:underline"
                >
                  Ver expediente RUC de la empresa →
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Requerimientos enviados por la empresa */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2.5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.14)]">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-600">
            <FileText className="size-4 text-[#DC2626]" />
            <span>Necesidades Comerciales de la Empresa</span>
          </div>
          <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-slate-800">
            {quote.commercialNeeds}
          </p>
          {quote.customerNotes && (
            <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600">
              <strong className="font-extrabold text-slate-900">
                Observaciones logísticas:
              </strong>{" "}
              {quote.customerNotes}
            </p>
          )}
        </div>

        <div className="space-y-2.5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.14)]">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-600">
            <CheckCircle2 className="size-4 text-blue-700" />
            <span>Respuesta / Decisión del Cliente</span>
          </div>
          {quote.decidedAt ? (
            <div className="space-y-2 text-sm">
              <p className="font-extrabold text-slate-900">
                Decisión registrada el{" "}
                {new Date(quote.decidedAt).toLocaleString("es-PE")}
              </p>
              {quote.customerDecisionNotes && (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                  Nota del cliente: &ldquo;{quote.customerDecisionNotes}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-500">
              El cliente aún no ha registrado una decisión final sobre esta
              propuesta.
            </p>
          )}
        </div>
      </div>

      {/* Formulario interactivo para armar y publicar la propuesta */}
      <AdminQuoteProposalForm quote={quote} />

      {/* Historial de modificaciones y auditoría */}
      <section
        aria-labelledby="audit-history-heading"
        className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.14)]"
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <History className="size-5 text-[#DC2626]" aria-hidden />
          <h2
            id="audit-history-heading"
            className="font-sans text-xl font-black text-slate-900"
          >
            Historial de Modificaciones y Auditoría ({auditLogs.length})
          </h2>
        </div>

        {auditLogs.length === 0 ? (
          <p className="py-4 text-xs font-semibold text-slate-500">
            No hay registros de auditoría aún.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 text-xs">
            {auditLogs.map((entry) => (
              <li
                key={entry.log.id}
                className="flex flex-col justify-between gap-2 py-3 sm:flex-row"
              >
                <div>
                  <span className="rounded-lg bg-red-50 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase text-[#DC2626]">
                    {entry.log.action}
                  </span>{" "}
                  <span className="font-medium text-slate-800">
                    {entry.log.details}
                  </span>
                </div>
                <div className="shrink-0 font-bold text-slate-500">
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
