import Link from "next/link";
import {
  Building2,
  FileText,
  ArrowRight,
  Clock,
  Lock,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Truck,
  BadgePercent,
  Sparkles,
} from "lucide-react";
import { FaBoxesStacked } from "react-icons/fa6";
import { SiWhatsapp } from "react-icons/si";
import { WholesaleQuoteBuilder, type CatalogSelectorProduct, type InitialQuoteLine } from "@/components/quotes/wholesale-quote-builder";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { formatPEN } from "@/lib/format";
import { siteConfig } from "@/config/site";
import type { QuoteStatus } from "@/server/queries/quotes";

export interface WholesaleQuoteSummaryItem {
  id: number;
  quoteNumber: string;
  createdAt: Date | string;
  itemCount: number;
  totalUnits: number;
  requestedSubtotalAmount: number;
  quotedTotalAmount: number | null;
  status: QuoteStatus;
}

interface WholesaleQuotesPortalProps {
  user: {
    id: number;
    role: string;
  } | null;
  isAuthorized: boolean;
  company: {
    legalName: string;
    taxId: string;
    district: string;
    department: string;
  } | null;
  catalogProducts: CatalogSelectorProduct[];
  userQuotes: WholesaleQuoteSummaryItem[];
  initialLines: InitialQuoteLine[];
  preselectedProductSlug?: string;
  /** Cuando true, se muestra dentro del layout de /cuenta con barra lateral. */
  embedded?: boolean;
  basePath: "/mayorista/cotizaciones" | "/cuenta/cotizaciones";
}

export function WholesaleQuotesPortal({
  user,
  isAuthorized,
  company,
  catalogProducts,
  userQuotes,
  initialLines,
  preselectedProductSlug,
  embedded = false,
  basePath,
}: WholesaleQuotesPortalProps) {
  return (
    <div className="space-y-8">
      {/* Cabecera / Hero */}
      {embedded ? (
        <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-[#0B1120] via-[#131C31] to-[#1E293B] p-6 text-white shadow-md sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#EF233C]/20 blur-3xl"
          />
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-[#EF233C]/15 px-3 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-red-200">
                  <FaBoxesStacked className="size-3 text-[#EF233C]" aria-hidden />
                  Canal Corporativo B2B
                </span>
                {isAuthorized && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-emerald-300">
                    <CheckCircle2 className="size-3" aria-hidden />
                    Autorizada
                  </span>
                )}
              </div>
              <h1 className="font-sans text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                Cotizaciones{" "}
                <span className="bg-gradient-to-r from-[#EF233C] to-rose-400 bg-clip-text text-transparent">
                  Empresariales B2B
                </span>
              </h1>
              <p className="max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                Arma lotes por volumen combinando tallas y colores, consulta escalas en tiempo real y gestiona tus propuestas formales con RUC.
              </p>
            </div>

            {company && (
              <div className="shrink-0 rounded-2xl border border-emerald-400/25 bg-white/10 px-5 py-4 backdrop-blur-md">
                <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-emerald-300">
                  Razón Social Acreditada
                </p>
                <p className="mt-1 text-sm font-extrabold text-white">{company.legalName}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-300">RUC: {company.taxId}</p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#0B1120] via-[#131C31] to-[#1E293B] p-6 text-white shadow-xl sm:p-10 lg:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#EF233C]/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#2563EB]/25 blur-3xl"
          />

          <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-5 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-[#EF233C]/15 px-3.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-red-200">
                  <FaBoxesStacked className="size-3.5 text-[#EF233C]" aria-hidden />
                  Canal Corporativo B2B
                </span>
                {isAuthorized ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-emerald-300">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    Cuenta Mayorista Autorizada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-[#2563EB]/20 px-3.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-blue-200">
                    <Sparkles className="size-3.5" aria-hidden />
                    Precios Directos de Fábrica
                  </span>
                )}
              </div>

              <div>
                <h1 className="font-sans text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Cotizaciones{" "}
                  <span className="bg-gradient-to-r from-[#EF233C] to-rose-400 bg-clip-text text-transparent">
                    Empresariales B2B
                  </span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                  Arma lotes combinando tallas y colores de nuestro catálogo oficial en Denim, Drill y Algodón Peruano, evalúa tarifas escalonadas en vivo y solicita propuestas formales con RUC.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1 text-xs font-semibold text-slate-200">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <BadgePercent className="size-4 text-[#EF233C]" aria-hidden />
                  Escalas desde 12 uds.
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <ShieldCheck className="size-4 text-blue-400" aria-hidden />
                  Facturación SUNAT (RUC)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <Truck className="size-4 text-emerald-400" aria-hidden />
                  Envíos a las 25 regiones
                </span>
              </div>
            </div>

            <div className="lg:col-span-5">
              {company ? (
                <div className="rounded-2xl border border-emerald-400/25 bg-white/10 p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-emerald-300">
                      Empresa Acreditada B2B
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[0.65rem] font-bold text-emerald-200">
                      <CheckCircle2 className="size-3" aria-hidden />
                      Activa
                    </span>
                  </div>
                  <p className="mt-2.5 text-lg font-extrabold text-white">{company.legalName}</p>
                  <p className="mt-1 font-mono text-xs text-slate-300">RUC: {company.taxId}</p>
                  <div className="mt-4 border-t border-white/10 pt-4 text-xs text-slate-300">
                    Tus solicitudes enviadas quedan registradas en tu historial corporativo con seguimiento en línea.
                  </div>
                </div>
              ) : !user ? (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EF233C] text-white shadow-md">
                      <Building2 className="size-5" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-red-200">
                        Empieza tu cotización ahora
                      </p>
                      <h2 className="mt-1 text-lg font-extrabold text-white">
                        Simula tu lote sin registro previo
                      </h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                        Tu borrador se guarda en este dispositivo. Para enviar la solicitud oficial con Factura y RUC, inicia sesión o registra tu empresa.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                    <Link
                      href="/iniciar-sesion?next=/mayorista/cotizaciones"
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#EF233C] px-5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#D90429]"
                    >
                      Iniciar Sesión
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                    <Link
                      href="/mayorista/registro"
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/20"
                    >
                      Registrar Empresa
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 backdrop-blur-md">
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md">
                      {user.role === "business_pending" ? (
                        <Clock className="size-5" aria-hidden />
                      ) : (
                        <Lock className="size-5" aria-hidden />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-amber-300">
                        {user.role === "business_pending"
                          ? "Solicitud B2B en Evaluación"
                          : "Cuenta de Cliente Minorista"}
                      </p>
                      <h2 className="mt-1 text-lg font-extrabold text-white">
                        {user.role === "business_pending"
                          ? "Tu RUC está en revisión comercial"
                          : "Habilita tu cuenta empresarial B2B"}
                      </h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-200">
                        {user.role === "business_pending"
                          ? "Puedes preparar tu borrador aquí. Apenas validemos tu ficha RUC, podrás enviar la cotización oficial."
                          : "Puedes armar tu borrador abajo. Para tarifas por volumen y comprobante Factura, registra los datos de tu empresa."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {user.role === "business_pending" ? (
                      <Link
                        href="/mayorista/solicitud"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-amber-400 px-6 text-xs font-bold uppercase tracking-wider text-slate-950 transition-colors hover:bg-amber-300"
                      >
                        Ver Estado de Solicitud
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    ) : (
                      <Link
                        href="/mayorista/registro"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#EF233C] px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#D90429]"
                      >
                        Registrar Empresa (RUC)
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Historial de cotizaciones */}
      {isAuthorized && (
        <section aria-labelledby="mis-cotizaciones-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#2563EB]">
                Expedientes de tu empresa
              </span>
              <h2
                id="mis-cotizaciones-heading"
                className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900"
              >
                Mis Solicitudes de Cotización ({userQuotes.length})
              </h2>
            </div>
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
                "Hola, necesito asesoría para una cotización mayorista B2B en American Colt JEANS™.",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <SiWhatsapp className="size-4" aria-hidden />
              Asesoría Directa B2B
            </a>
          </div>

          {userQuotes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-xs">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FileText className="size-6" aria-hidden />
              </div>
              <p className="mt-4 text-base font-bold text-slate-900">
                Tu empresa aún no ha enviado solicitudes de cotización
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Utiliza el configurador de abajo para armar tu primer lote por volumen.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/90 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">N° Cotización</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Líneas / Unidades</th>
                    <th className="px-6 py-4">Estimado Solicitado</th>
                    <th className="px-6 py-4">Propuesta Oficial</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userQuotes.map((q) => (
                    <tr key={q.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                        {q.quoteNumber}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate-400" aria-hidden />
                          {new Date(q.createdAt).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                        {q.itemCount} {q.itemCount === 1 ? "variante" : "variantes"} · {q.totalUnits} uds.
                      </td>
                      <td className="px-6 py-4 font-mono text-xs tabular-nums text-slate-600">
                        {formatPEN(q.requestedSubtotalAmount)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold tabular-nums text-slate-900">
                        {q.quotedTotalAmount !== null
                          ? formatPEN(q.quotedTotalAmount)
                          : "En evaluación"}
                      </td>
                      <td className="px-6 py-4">
                        <QuoteStatusBadge status={q.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`${basePath}/${q.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#EF233C]"
                        >
                          Ver Detalle
                          <ArrowRight className="size-3" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Constructor de cotización */}
      <section aria-labelledby="nueva-cotizacion-heading" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#EF233C]">
              {isAuthorized ? "Nueva Solicitud B2B" : "Configurador de Lote B2B"}
            </span>
            <h2
              id="nueva-cotizacion-heading"
              className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl"
            >
              Preparar Solicitud de{" "}
              <span className="text-[#2563EB]">Cotización</span>
            </h2>
          </div>
          <Link
            href="/mayorista"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-[#EF233C]"
          >
            Ver beneficios mayoristas
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <WholesaleQuoteBuilder
          catalogProducts={catalogProducts}
          initialLines={initialLines}
          defaultDeliveryCity={
            company ? `${company.district}, ${company.department}` : "Lima"
          }
          preselectedProductSlug={preselectedProductSlug}
          isUserAuthorized={isAuthorized}
          isAuthenticated={!!user}
          userRole={user?.role ?? null}
          quoteDetailBasePath={basePath}
        />
      </section>
    </div>
  );
}
