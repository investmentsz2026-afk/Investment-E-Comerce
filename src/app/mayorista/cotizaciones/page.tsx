import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentSession } from "@/server/auth/session";
import { isUserAuthorizedForWholesale } from "@/server/pricing/engine";
import {
  getApprovedCompanyForUser,
  getUserWholesaleQuotes,
  getWholesaleCatalogSelectorItems,
} from "@/server/queries/quotes";
import { getCartSnapshot } from "@/server/cart/service";
import { WholesaleQuoteBuilder } from "@/components/quotes/wholesale-quote-builder";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { formatPEN } from "@/lib/format";
import {
  Building2,
  FileText,
  ArrowRight,
  Clock,
  Lock,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cotizaciones Mayoristas B2B | INVESTMENTS",
  description:
    "Solicita cotizaciones por volumen, selecciona tallas y colores de nuestro catálogo textil y gestiona tus propuestas comerciales en INVESTMENTS.",
};

export const instant = false;

export default async function MayoristaCotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; productSlug?: string }>;
}) {
  const [{ user }, params] = await Promise.all([getCurrentSession(), searchParams]);
  const isAuthorized = isUserAuthorizedForWholesale(user);

  const [company, catalogProducts, userQuotes, cartSnapshot] = await Promise.all([
    user && isAuthorized ? getApprovedCompanyForUser(user.id) : Promise.resolve(null),
    getWholesaleCatalogSelectorItems(),
    user && isAuthorized ? getUserWholesaleQuotes(user.id) : Promise.resolve([]),
    user && params.from === "cart" ? getCartSnapshot() : Promise.resolve(null),
  ]);

  const initialLines =
    cartSnapshot && cartSnapshot.items.length > 0
      ? cartSnapshot.items.map((it) => ({
          variantId: it.variantId,
          quantity: it.quantity,
        }))
      : [];

  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell space-y-12">
        {/* Banner de estado para usuarios no autorizados o visitantes */}
        {!user ? (
          <div className="border border-ink/15 bg-[#fbfaf7] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center border border-ink/15 bg-paper text-cochinilla">
                  <Building2 className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="eyebrow text-cochinilla">Canal Corporativo B2B</p>
                  <h2 className="mt-1 font-display text-xl sm:text-2xl text-ink">
                    Cotizaciones Empresariales y Compras por Lote
                  </h2>
                  <p className="mt-1 text-xs text-taupe-600 max-w-2xl leading-relaxed">
                    Puedes armar y simular tu pedido por volumen seleccionando prendas, tallas y notas a continuación. Tu borrador se guarda en este dispositivo. Para emitir una cotización formal con RUC y condiciones mayoristas, inicia sesión o registra tu empresa.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 pt-2 sm:pt-0">
                <Link
                  href="/iniciar-sesion?next=/mayorista/cotizaciones"
                  className="inline-flex h-10 items-center justify-center gap-1.5 bg-ink px-4 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-paper hover:bg-cochinilla transition-colors"
                >
                  Iniciar sesión
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/mayorista/registro"
                  className="inline-flex h-10 items-center justify-center gap-1.5 border border-ink/20 bg-paper px-4 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-ink hover:border-ink transition-colors"
                >
                  Registrar empresa (RUC)
                </Link>
              </div>
            </div>
          </div>
        ) : !isAuthorized ? (
          <div className="border border-amber-300 bg-amber-50/70 p-6 sm:p-8 text-amber-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center border border-amber-400 bg-paper text-amber-800">
                  {user.role === "business_pending" ? (
                    <Clock className="size-5" aria-hidden />
                  ) : (
                    <Lock className="size-5" aria-hidden />
                  )}
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-amber-800">
                    {user.role === "business_pending"
                      ? "Solicitud Empresarial en Evaluación"
                      : "Cuenta de Cliente Minorista"}
                  </p>
                  <h2 className="mt-1 font-display text-xl sm:text-2xl text-ink">
                    {user.role === "business_pending"
                      ? "Tu RUC está en revisión comercial"
                      : "Habilita tu cuenta empresarial B2B"}
                  </h2>
                  <p className="mt-1 text-xs text-amber-900 max-w-2xl leading-relaxed">
                    {user.role === "business_pending"
                      ? "Puedes ir preparando tu borrador de cotización. En cuanto nuestro equipo valide tu ficha RUC, podrás enviar formalmente la propuesta."
                      : "Puedes armar tu borrador de lote a continuación. Para procesar pedidos por volumen y acceder a tarifas B2B con comprobante Factura, registra los datos de tu empresa."}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                {user.role === "business_pending" ? (
                  <Link
                    href="/mayorista/solicitud"
                    className="inline-flex h-10 items-center justify-center gap-1.5 bg-amber-800 px-4 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-paper hover:bg-amber-900 transition-colors"
                  >
                    Ver estado de solicitud
                    <ArrowRight className="size-3" />
                  </Link>
                ) : (
                  <Link
                    href="/mayorista/registro"
                    className="inline-flex h-10 items-center justify-center gap-1.5 bg-cochinilla px-4 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-paper hover:bg-cochinilla-deep transition-colors"
                  >
                    Registrar empresa (RUC)
                    <ArrowRight className="size-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Cabecera principal */}
        <header className="flex flex-col justify-between gap-6 border-b border-ink/10 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 border border-ink/20 bg-paper px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink">
              {isAuthorized ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-700" aria-hidden />
                  <span className="text-emerald-800">Cuenta Mayorista Autorizada</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 text-cochinilla" aria-hidden />
                  <span>Canal Textil Corporativo</span>
                </>
              )}
            </div>
            <h1 className="mt-3 font-display text-display-md text-ink">
              Cotizaciones <em>Empresariales B2B.</em>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-taupe-600">
              Arma lotes combinando tallas y colores de nuestro catálogo textil, evalúa precios escalonados y solicita propuestas económicas formales con atención personalizada.
            </p>
          </div>

          {company && (
            <div className="border border-ink/10 bg-[#fbfaf7] px-5 py-4 text-xs">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-taupe-500">
                Razón Social Acreditada
              </p>
              <p className="mt-1 font-semibold text-ink">{company.legalName}</p>
              <p className="font-mono text-taupe-600">RUC: {company.taxId}</p>
            </div>
          )}
        </header>

        {/* Historial de cotizaciones (solo para empresas autorizadas con expedientes) */}
        {isAuthorized && (
          <section aria-labelledby="mis-cotizaciones-heading" className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow text-taupe-500">Expedientes de tu empresa</p>
                <h2 id="mis-cotizaciones-heading" className="mt-1 font-display text-2xl text-ink">
                  Mis Solicitudes de Cotización ({userQuotes.length})
                </h2>
              </div>
            </div>

            {userQuotes.length === 0 ? (
              <div className="border border-ink/10 bg-[#fbfaf7] p-8 text-center">
                <FileText className="mx-auto size-7 text-taupe-400" aria-hidden />
                <p className="mt-3 text-sm font-medium text-ink">
                  Tu empresa aún no ha enviado solicitudes de cotización.
                </p>
                <p className="mt-1 text-xs text-taupe-500">
                  Utiliza el formulario inferior para armar tu primera solicitud por volumen.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-ink/15 bg-paper">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-ink/10 bg-[#fbfaf7] font-mono text-[0.65rem] uppercase tracking-[0.14em] text-taupe-600">
                    <tr>
                      <th className="px-5 py-3.5">N° Cotización</th>
                      <th className="px-5 py-3.5">Fecha</th>
                      <th className="px-5 py-3.5">Líneas / Unidades</th>
                      <th className="px-5 py-3.5">Estimado Solicitado</th>
                      <th className="px-5 py-3.5">Propuesta Oficial</th>
                      <th className="px-5 py-3.5">Estado</th>
                      <th className="px-5 py-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {userQuotes.map((q) => (
                      <tr key={q.id} className="hover:bg-[#fbfaf7]/60">
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-ink">
                          {q.quoteNumber}
                        </td>
                        <td className="px-5 py-4 text-xs text-taupe-600">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3 text-taupe-400" aria-hidden />
                            {new Date(q.createdAt).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-ink">
                          {q.itemCount} {q.itemCount === 1 ? "variante" : "variantes"} · {q.totalUnits} uds.
                        </td>
                        <td className="px-5 py-4 font-mono text-xs tabular-nums text-taupe-700">
                          {formatPEN(q.requestedSubtotalAmount)}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs font-semibold tabular-nums text-ink">
                          {q.quotedTotalAmount !== null
                            ? formatPEN(q.quotedTotalAmount)
                            : "En evaluación"}
                        </td>
                        <td className="px-5 py-4">
                          <QuoteStatusBadge status={q.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/mayorista/cotizaciones/${q.id}`}
                            className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-cochinilla hover:underline"
                          >
                            Ver detalle
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
        <section aria-labelledby="nueva-cotizacion-heading" className="space-y-6 pt-4">
          <div className="border-t border-ink/10 pt-10">
            <p className="eyebrow text-cochinilla">
              {isAuthorized ? "Nueva Solicitud B2B" : "Configurador de Lote B2B"}
            </p>
            <h2 id="nueva-cotizacion-heading" className="mt-1 font-display text-3xl text-ink">
              Preparar Solicitud de <em>Cotización.</em>
            </h2>
          </div>

          <WholesaleQuoteBuilder
            catalogProducts={catalogProducts}
            initialLines={initialLines}
            defaultDeliveryCity={
              company ? `${company.district}, ${company.department}` : "Lima"
            }
            preselectedProductSlug={params.productSlug}
            isUserAuthorized={isAuthorized}
            isAuthenticated={!!user}
            userRole={user?.role ?? null}
          />
        </section>
      </div>
    </div>
  );
}
