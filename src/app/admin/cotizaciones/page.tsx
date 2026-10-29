import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminWholesaleQuotes } from "@/server/queries/quotes";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { formatPEN } from "@/lib/format";
import {
  FileSpreadsheet,
  Search,
  ArrowRight,
  Calendar,
  Building2,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Gestión de Cotizaciones B2B | Admin",
  robots: { index: false, follow: false },
};

export const instant = false;

const STATUS_TABS = [
  { value: "", label: "Todas" },
  { value: "submitted", label: "Enviadas" },
  { value: "under_review", label: "En revisión" },
  { value: "quoted", label: "Cotizadas" },
  { value: "accepted", label: "Aceptadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "expired", label: "Vencidas" },
  { value: "cancelled", label: "Canceladas" },
] as const;

export default async function AdminCotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const activeStatus = params.status ?? "";
  const searchQuery = params.q ?? "";

  const quotes = await getAdminWholesaleQuotes({
    status: activeStatus || undefined,
    search: searchQuery || undefined,
  });

  return (
    <div className="shell py-10 space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-cochinilla">
            <FileSpreadsheet className="size-4" aria-hidden />
            <span>Mesa de Negociación Mayorista B2B</span>
          </div>
          <h1 className="mt-2 font-display text-display-sm text-ink">
            Gestión de Cotizaciones Empresariales
          </h1>
          <p className="mt-1 text-sm text-taupe-600">
            Evalúa requerimientos por volumen, define precios unitarios especiales, establece fechas de caducidad y audita respuestas de clientes corporativos.
          </p>
        </div>

        <Link
          href="/admin/solicitudes"
          className="inline-flex h-10 items-center gap-2 border border-ink/20 bg-paper px-4 font-mono text-xs uppercase tracking-wider text-ink hover:border-ink"
        >
          <ShieldCheck className="size-3.5 text-cochinilla" aria-hidden />
          Solicitudes de Empresas RUC
        </Link>
      </div>

      {/* Filtros y buscador */}
      <div className="flex flex-col justify-between gap-4 border border-ink/10 bg-paper p-5 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => {
            const active = activeStatus === tab.value;
            const href = tab.value
              ? `/admin/cotizaciones?status=${tab.value}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`
              : `/admin/cotizaciones${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`;
            return (
              <Link
                key={tab.value}
                href={href}
                className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                  active
                    ? "bg-ink text-paper"
                    : "border border-ink/10 bg-[#fbfaf7] text-taupe-700 hover:border-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <form action="/admin/cotizaciones" method="get" className="flex items-center gap-2">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-taupe-400"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Buscar por COT-..., razón social o RUC..."
              className="h-10 w-64 border border-ink/20 bg-[#fbfaf7] pl-9 pr-3 text-xs text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none sm:w-80"
            />
          </div>
          <button
            type="submit"
            className="h-10 bg-ink px-4 font-mono text-xs uppercase tracking-wider text-paper hover:bg-cochinilla"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabla de cotizaciones */}
      {quotes.length === 0 ? (
        <div className="border border-ink/10 bg-paper p-12 text-center">
          <FileSpreadsheet className="mx-auto size-8 text-taupe-400" aria-hidden />
          <p className="mt-3 text-sm font-medium text-ink">
            No se encontraron cotizaciones con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-ink/15 bg-paper">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-[#fbfaf7] font-mono text-[0.65rem] uppercase tracking-[0.14em] text-taupe-600">
              <tr>
                <th className="px-5 py-3.5">Expediente</th>
                <th className="px-5 py-3.5">Empresa / RUC</th>
                <th className="px-5 py-3.5">Lote</th>
                <th className="px-5 py-3.5">Ref. Solicitado</th>
                <th className="px-5 py-3.5">Total Cotizado</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5">Vencimiento</th>
                <th className="px-5 py-3.5 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-[#fbfaf7]/70">
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-bold text-ink">{q.quoteNumber}</span>
                    <span className="mt-0.5 block font-mono text-[0.65rem] text-taupe-500">
                      {new Date(q.createdAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 shrink-0 text-taupe-400" aria-hidden />
                      <span className="font-medium text-ink">{q.companyLegalName}</span>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-taupe-500">
                      RUC: {q.companyTaxId} · {q.contactEmail}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-ink">
                    {q.itemCount} {q.itemCount === 1 ? "línea" : "líneas"} ({q.totalUnits} uds.)
                  </td>
                  <td className="px-5 py-4 font-mono text-xs tabular-nums text-taupe-700">
                    {formatPEN(q.requestedSubtotalAmount)}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs font-semibold tabular-nums text-emerald-900">
                    {q.quotedTotalAmount !== null ? formatPEN(q.quotedTotalAmount) : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <QuoteStatusBadge status={q.status} />
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-taupe-600">
                    {q.validUntil ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3 text-taupe-400" aria-hidden />
                        {new Date(q.validUntil).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/cotizaciones/${q.id}`}
                      className="inline-flex h-9 items-center gap-1.5 bg-ink px-3.5 font-mono text-[0.65rem] uppercase tracking-wider text-paper transition-colors hover:bg-cochinilla"
                    >
                      Evaluar
                      <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

