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
    <div className="space-y-4 sm:space-y-8">
      {/* Cabecera / Hero */}
      {embedded ? (
        <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-[#0B1120] via-[#131C31] to-[#1E293B] p-4 text-white shadow-md sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#EF233C]/20 blur-3xl"
          />
          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-[#EF233C]/15 px-2.5 py-0.5 text-[0.56rem] font-extrabold uppercase tracking-[0.12em] text-red-200 sm:gap-1.5 sm:px-3 sm:text-[0.65rem] sm:tracking-[0.14em]">
                  <FaBoxesStacked className="size-2.5 text-[#EF233C] sm:size-3" aria-hidden />
                  Canal Corporativo B2B
                </span>
                {isAuthorized && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[0.56rem] font-bold uppercase tracking-wider text-emerald-300 sm:px-2.5 sm:text-[0.65rem]">
                    <CheckCircle2 className="size-2.5 sm:size-3" aria-hidden />
                    Autorizada
                  </span>
                )}
              </div>
              <h1 className="font-sans text-xl font-black uppercase tracking-tight text-white sm:text-3xl">
                Cotizaciones{" "}
                <span className="bg-gradient-to-r from-[#EF233C] to-rose-400 bg-clip-text text-transparent">
                  Empresariales B2B
                </span>
              </h1>
              <p className="max-w-2xl text-[0.7rem] leading-snug text-slate-300 sm:text-sm sm:leading-relaxed">
                Arma lotes por volumen combinando tallas y colores, consulta escalas en tiempo real y gestiona propuestas con RUC.
              </p>
            </div>

            {company && (
              <div className="shrink-0 rounded-xl border border-emerald-400/25 bg-white/10 px-3.5 py-2.5 backdrop-blur-md sm:rounded-2xl sm:px-5 sm:py-4">
                <p className="text-[0.55rem] font-extrabold uppercase tracking-[0.12em] text-emerald-300 sm:text-[0.62rem] sm:tracking-[0.14em]">
                  Razón Social Acreditada
                </p>
                <p className="mt-0.5 text-xs font-extrabold text-white sm:mt-1 sm:text-sm">{company.legalName}</p>
                <p className="mt-0.5 font-mono text-[0.68rem] text-slate-300 sm:text-xs">RUC: {company.taxId}</p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-[#0B1120] via-[#131C31] to-[#1E293B] p-4 text-white shadow-xl sm:rounded-3xl sm:p-10 lg:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#EF233C]/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#2563EB]/25 blur-3xl"
          />

          <div className="relative z-10 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center lg:gap-8">
            <div className="space-y-3 sm:space-y-5 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-[#EF233C]/15 px-2.5 py-0.5 text-[0.56rem] font-extrabold uppercase tracking-[0.12em] text-red-200 sm:gap-2 sm:px-3.5 sm:py-1 sm:text-[0.68rem] sm:tracking-[0.14em]">
                  <FaBoxesStacked className="size-3 text-[#EF233C] sm:size-3.5" aria-hidden />
                  Canal Corporativo B2B
                </span>
                {isAuthorized ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.1em] text-emerald-300 sm:gap-1.5 sm:px-3.5 sm:py-1 sm:text-[0.68rem]">
                    <CheckCircle2 className="size-3 sm:size-3.5" aria-hidden />
                    Autorizada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-[#2563EB]/20 px-2.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.1em] text-blue-200 sm:gap-1.5 sm:px-3.5 sm:py-1 sm:text-[0.68rem]">
                    <Sparkles className="size-3 sm:size-3.5" aria-hidden />
                    Precios de Fábrica
                  </span>
                )}
              </div>

              <div>
                <h1 className="font-sans text-2xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Cotizaciones{" "}
                  <span className="bg-gradient-to-r from-[#EF233C] to-rose-400 bg-clip-text text-transparent">
                    Empresariales B2B
                  </span>
                </h1>
                <p className="mt-1.5 max-w-2xl text-xs leading-snug text-slate-300 sm:mt-3 sm:text-base sm:leading-relaxed">
                  Arma lotes combinando tallas y colores de nuestro catálogo en Denim, Drill y Algodón Peruano, evalúa escalas en vivo y solicita propuestas con RUC.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5 text-[0.62rem] font-semibold text-slate-200 sm:gap-2.5 sm:pt-1 sm:text-xs">
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2">
                  <BadgePercent className="size-3 text-[#EF233C] sm:size-4" aria-hidden />
                  Desde 12 uds.
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2">
                  <ShieldCheck className="size-3 text-blue-400 sm:size-4" aria-hidden />
                  Factura SUNAT
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2">
                  <Truck className="size-3 text-emerald-400 sm:size-4" aria-hidden />
                  25 Regiones
                </span>
              </div>
            </div>

            <div className="lg:col-span-5">
              {company ? (
                <div className="rounded-xl border border-emerald-400/25 bg-white/10 p-3.5 backdrop-blur-md sm:rounded-2xl sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-emerald-300 sm:text-[0.65rem] sm:tracking-[0.16em]">
                      Empresa Acreditada B2B
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.58rem] font-bold text-emerald-200 sm:px-2.5 sm:text-[0.65rem]">
                      <CheckCircle2 className="size-2.5 sm:size-3" aria-hidden />
                      Activa
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-extrabold text-white sm:mt-2.5 sm:text-lg">{company.legalName}</p>
                  <p className="mt-0.5 font-mono text-[0.68rem] text-slate-300 sm:mt-1 sm:text-xs">RUC: {company.taxId}</p>
                  <div className="mt-2.5 border-t border-white/10 pt-2.5 text-[0.68rem] text-slate-300 sm:mt-4 sm:pt-4 sm:text-xs">
                    Tus solicitudes quedan registradas en tu historial corporativo.
                  </div>
                </div>
              ) : !user ? (
                <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md sm:rounded-2xl sm:p-6">
                  <div className="flex items-start gap-2.5 sm:gap-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EF233C] text-white shadow-md sm:size-11 sm:rounded-xl">
                      <Building2 className="size-4 sm:size-5" aria-hidden />
                    </div>
                    <div>
                      <p className="text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-red-200 sm:text-xs sm:tracking-[0.14em]">
                        Empieza tu cotización ahora
                      </p>
                      <h2 className="mt-0.5 text-sm font-extrabold text-white sm:mt-1 sm:text-lg">
                        Simula tu lote sin registro
                      </h2>
                      <p className="mt-1 text-[0.66rem] leading-snug text-slate-300 sm:mt-1.5 sm:text-xs sm:leading-relaxed">
                        Tu borrador se guarda aquí. Para enviar cotización formal con RUC, inicia sesión o registra tu empresa.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:gap-2.5">
                    <Link
                      href="/iniciar-sesion?next=/mayorista/cotizaciones"
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-[#EF233C] px-3 text-[0.62rem] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#D90429] sm:h-11 sm:gap-2 sm:px-5 sm:text-xs"
                    >
                      Iniciar Sesión
                      <ArrowRight className="size-3 sm:size-3.5" aria-hidden />
                    </Link>
                    <Link
                      href="/mayorista/registro"
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full border border-white/25 bg-white/10 px-3 text-[0.62rem] font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/20 sm:h-11 sm:gap-2 sm:px-5 sm:text-xs"
                    >
                      Registrar RUC
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
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center shadow-xs sm:rounded-3xl sm:p-10">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 sm:size-14 sm:rounded-2xl">
                <FileText className="size-5 sm:size-6" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900 sm:mt-4 sm:text-base">
                Tu empresa aún no ha enviado solicitudes de cotización
              </p>
              <p className="mt-1 text-[0.7rem] text-slate-500 sm:text-xs">
                Utiliza el configurador de abajo para armar tu primer lote por volumen.
              </p>
            </div>
          ) : (
            <>
              {/* Tarjetas compactas en móvil (< sm) para evitar scroll horizontal en tabla */}
              <div className="space-y-2.5 sm:hidden">
                {userQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <p className="font-mono text-xs font-black text-slate-900">
                          {q.quoteNumber}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[0.62rem] text-slate-500">
                          <Calendar className="size-3 text-slate-400" aria-hidden />
                          {new Date(q.createdAt).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          <span>· {q.totalUnits} uds.</span>
                        </p>
                      </div>
                      <QuoteStatusBadge status={q.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 p-2">
                        <p className="text-[0.54rem] font-bold uppercase text-slate-400">Estimado</p>
                        <p className="font-mono text-xs font-bold tabular-nums text-slate-700">
                          {formatPEN(q.requestedSubtotalAmount)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2">
                        <p className="text-[0.54rem] font-bold uppercase text-slate-400">Propuesta</p>
                        <p className="font-mono text-xs font-extrabold tabular-nums text-slate-900">
                          {q.quotedTotalAmount !== null
                            ? formatPEN(q.quotedTotalAmount)
                            : "En evaluación"}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`${basePath}/${q.id}`}
                      className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 text-[0.64rem] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#EF233C]"
                    >
                      <span>Ver Detalle</span>
                      <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  </div>
                ))}
              </div>

              {/* Tabla completa en tablet / escritorio */}
              <div className="hidden overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-sm sm:block">
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
            </>
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
