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
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cotizaciones Mayoristas B2B",
  description:
    "Solicita cotizaciones por volumen, selecciona tallas y colores de nuestro catálogo y gestiona tus propuestas comerciales en INVESTMENTS.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function MayoristaCotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; productSlug?: string }>;
}) {
  const [{ user }, params] = await Promise.all([getCurrentSession(), searchParams]);

  // 1. Si no ha iniciado sesión, mostrar invitación a autenticarse o registrarse como empresa
  if (!user) {
    return (
      <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
        <div className="shell max-w-3xl">
          <div className="border border-ink/15 bg-[#fbfaf7] p-8 sm:p-12">
            <div className="flex size-12 items-center justify-center border border-ink/15 bg-paper text-cochinilla">
              <Building2 className="size-6" aria-hidden />
            </div>
            <p className="mt-6 eyebrow text-cochinilla">Canal Corporativo B2B</p>
            <h1 className="mt-2 font-display text-display-sm text-ink">
              Cotizaciones Empresariales y Compras por <em>Volumen.</em>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-taupe-600">
              El módulo de solicitud de cotizaciones por lote, selección multi-talla y condiciones especiales está reservado para empresas mayoristas aprobadas en INVESTMENTS.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/iniciar-sesion?next=/mayorista/cotizaciones"
                className="inline-flex h-12 items-center justify-center gap-2 bg-ink px-7 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
              >
                Iniciar sesión empresarial
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
              <Link
                href="/mayorista/registro"
                className="inline-flex h-12 items-center justify-center gap-2 border border-ink/20 bg-paper px-7 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink"
              >
                Registrar mi empresa (RUC)
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Si está autenticado pero NO tiene rol business_approved ni admin
  if (!isUserAuthorizedForWholesale(user)) {
    return (
      <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
        <div className="shell max-w-3xl">
          <div className="border border-amber-300 bg-amber-50/60 p-8 sm:p-12 text-amber-950">
            <div className="flex size-12 items-center justify-center border border-amber-400 bg-paper text-amber-800">
              {user.role === "business_pending" ? (
                <Clock className="size-6" aria-hidden />
              ) : (
                <Lock className="size-6" aria-hidden />
              )}
            </div>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-amber-800">
              {user.role === "business_pending"
                ? "Solicitud Empresarial en Evaluación"
                : "Acceso Exclusivo para Empresas Aprobadas"}
            </p>
            <h1 className="mt-2 font-display text-display-sm text-ink">
              {user.role === "business_pending"
                ? "Tu cuenta mayorista está siendo revisada"
                : "Habilita tu cuenta comercial B2B"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-amber-900">
              {user.role === "business_pending"
                ? "Nuestro equipo comercial está verificando los datos de tu RUC. Una vez aprobada tu empresa, podrás generar cotizaciones formales y acceder a todas las escalas mayoristas."
                : "Actualmente tu cuenta tiene perfil de cliente minorista (B2C). Si representas a una empresa, boutique o distribuidor con RUC activo, solicita la activación de tu cuenta B2B."}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {user.role === "business_pending" ? (
                <Link
                  href="/mayorista/solicitud"
                  className="inline-flex h-12 items-center justify-center gap-2 bg-ink px-7 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
                >
                  Ver estado de mi solicitud B2B
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              ) : (
                <Link
                  href="/mayorista/registro"
                  className="inline-flex h-12 items-center justify-center gap-2 bg-ink px-7 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
                >
                  Solicitar cuenta mayorista B2B
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              )}
              <Link
                href="/carrito"
                className="inline-flex h-12 items-center justify-center border border-ink/20 bg-paper px-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink hover:border-ink"
              >
                Ir a mi bolsa minorista
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Usuario autorizado (business_approved o admin)
  const [company, catalogProducts, userQuotes, cartSnapshot] = await Promise.all([
    getApprovedCompanyForUser(user.id),
    getWholesaleCatalogSelectorItems(),
    getUserWholesaleQuotes(user.id),
    params.from === "cart" ? getCartSnapshot() : Promise.resolve(null),
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
      <div className="shell space-y-14">
        {/* Cabecera */}
        <header className="flex flex-col justify-between gap-6 border-b border-ink/10 pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 border border-emerald-300 bg-emerald-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-emerald-900">
              <CheckCircle2 className="size-3.5 text-emerald-700" aria-hidden />
              Cuenta Mayorista Autorizada
            </div>
            <h1 className="mt-3 font-display text-display-md text-ink">
              Cotizaciones <em>Empresariales B2B.</em>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-taupe-600">
              Arma lotes combinando tallas y colores de nuestro catálogo, revisa precios mayoristas de referencia y solicita propuestas económicas formales con condiciones especiales.
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

        {/* Historial de cotizaciones propias de la empresa */}
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

        {/* Constructor de nueva solicitud de cotización */}
        <section aria-labelledby="nueva-cotizacion-heading" className="space-y-6 pt-4">
          <div className="border-t border-ink/10 pt-10">
            <p className="eyebrow text-cochinilla">Nueva Solicitud B2B</p>
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
          />
        </section>
      </div>
    </div>
  );
}

