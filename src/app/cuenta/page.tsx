import { requireAuth } from "@/server/auth/session";
import { getUserBusinessApplication } from "@/server/queries/account";
import { getCartSnapshot } from "@/server/cart/service";
import { getUserWholesaleQuotes } from "@/server/queries/quotes";
import { ProfileForm } from "@/components/auth/profile-form";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { formatPEN } from "@/lib/format";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Clock, ShoppingBag, FileText } from "lucide-react";

export const instant = false;

export default async function AccountPage() {
  const { user } = await requireAuth();
  const [businessApp, cart, quotes] = await Promise.all([
    getUserBusinessApplication(user.id),
    getCartSnapshot(),
    user.role === "business_approved" || user.role === "admin"
      ? getUserWholesaleQuotes(user.id)
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      {/* Banner de estado B2B */}
      {user.role === "business_approved" ? (
        <div className="border border-emerald-300 bg-emerald-50/70 p-6 text-emerald-950">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-700 mt-0.5" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">
                Condición mayorista autorizada
              </p>
              <p className="mt-1 text-sm text-emerald-800 leading-relaxed">
                Tu empresa cuenta con acceso preferencial a precios mayoristas y compras por lote. Al explorar el catálogo verás los precios y mínimos por docena o lote habilitados.
              </p>
              <div className="mt-3">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-emerald-900 underline hover:text-emerald-950"
                >
                  Explorar catálogo con tarifas B2B
                  <ArrowRight className="size-3" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : user.role === "business_pending" ? (
        <div className="border border-amber-300 bg-amber-50/70 p-6 text-amber-950">
          <div className="flex items-start gap-3">
            <Clock className="size-5 shrink-0 text-amber-700 mt-0.5" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-900">
                Solicitud empresarial en revisión
              </p>
              <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                Tu solicitud para {businessApp?.legalName ?? "tu empresa"} está siendo evaluada por nuestro equipo comercial. Mientras tanto, puedes continuar navegando como cliente minorista.
              </p>
              <div className="mt-3">
                <Link
                  href="/mayorista/solicitud"
                  className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-amber-900 underline hover:text-amber-950"
                >
                  Ver detalles de mi solicitud
                  <ArrowRight className="size-3" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-ink/10 bg-paper p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="size-5 shrink-0 text-taupe-500 mt-0.5" aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
                  ¿Eres distribuidor, tienda o confeccionista?
                </p>
                <p className="mt-1 text-xs text-taupe-600 leading-relaxed">
                  Solicita una cuenta mayorista B2B para acceder a precios escalonados por volumen y atención ejecutiva.
                </p>
              </div>
            </div>
            <Link
              href="/mayorista/registro"
              className="inline-flex shrink-0 items-center justify-center gap-2 bg-ink px-4 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla"
            >
              Solicitar B2B
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      )}

      {/* Resumen rápido de Carrito Actual y Cotizaciones B2B */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border border-ink/15 bg-[#fbfaf7] p-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-taupe-600">
              <ShoppingBag className="size-4 text-cochinilla" aria-hidden />
              Bolsa de Compras Actual
            </span>
            <span className="font-mono text-xs font-semibold text-ink">
              {cart.totalUnits} {cart.totalUnits === 1 ? "prenda" : "prendas"}
            </span>
          </div>
          <p className="mt-3 font-display text-2xl tabular-nums text-ink">
            {formatPEN(cart.estimatedTotalAmount)}
          </p>
          <p className="mt-1 text-xs text-taupe-600">
            {cart.lineCount > 0
              ? `${cart.lineCount} ${cart.lineCount === 1 ? "variante" : "variantes"} guardadas en tu cuenta.`
              : "Tu bolsa está vacía en este momento."}
          </p>
          <div className="mt-4">
            <Link
              href="/carrito"
              className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-cochinilla hover:underline"
            >
              {cart.lineCount > 0 ? "Ir a mi bolsa de compras" : "Explorar prendas"}
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>

        {(user.role === "business_approved" || user.role === "admin") && (
          <div className="border border-ink/15 bg-[#fbfaf7] p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-taupe-600">
                <FileText className="size-4 text-cochinilla" aria-hidden />
                Cotizaciones Empresariales B2B
              </span>
              <span className="font-mono text-xs font-semibold text-ink">
                {quotes.length} {quotes.length === 1 ? "solicitud" : "solicitudes"}
              </span>
            </div>
            {quotes[0] ? (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-ink">
                    {quotes[0].quoteNumber}
                  </span>
                  <QuoteStatusBadge status={quotes[0].status} />
                </div>
                <p className="mt-1 text-xs text-taupe-600">
                  Última solicitud por {quotes[0].totalUnits} uds. (
                  {formatPEN(quotes[0].quotedTotalAmount ?? quotes[0].requestedSubtotalAmount)})
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-taupe-600">
                Aún no has registrado solicitudes de cotización por volumen.
              </p>
            )}
            <div className="mt-4">
              <Link
                href="/mayorista/cotizaciones"
                className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-cochinilla hover:underline"
              >
                Gestionar cotizaciones B2B
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Formulario de información personal */}
      <ProfileForm
        initialData={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          emailVerifiedAt: user.emailVerifiedAt,
          createdAt: user.createdAt,
        }}
      />
    </div>
  );
}
