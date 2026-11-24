import { requireAuth } from "@/server/auth/session";
import { getUserBusinessApplication } from "@/server/queries/account";
import { getCartSnapshot } from "@/server/cart/service";
import { getUserWholesaleQuotes } from "@/server/queries/quotes";
import { ProfileForm } from "@/components/auth/profile-form";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import { formatPEN } from "@/lib/format";
import Link from "next/link";
import {
  FaArrowRight,
  FaBuilding,
  FaCircleCheck,
  FaClock,
  FaBagShopping,
  FaFileInvoice,
  FaTags,
  FaGem,
} from "react-icons/fa6";

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
    <div className="space-y-6 text-slate-900">
      {/* 1. Banner de Estado / Invitación Mayorista B2B */}
      {user.role === "business_approved" ? (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200">
                <FaCircleCheck className="size-6" aria-hidden />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100/70 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-emerald-800">
                  Condición Mayorista Autorizada
                </span>
                <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900">
                  Tu empresa cuenta con acceso VIP a precios de fábrica
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Tienes habilitadas las tarifas con descuento por docena, media y lotes en todo el catálogo oficial de American Colt JEANS™.
                </p>
              </div>
            </div>
            <Link
              href="/catalogo"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors"
            >
              <span>Catálogo B2B</span>
              <FaArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      ) : user.role === "business_pending" ? (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200">
                <FaClock className="size-6" aria-hidden />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100/70 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-amber-800">
                  Solicitud B2B en Evaluación
                </span>
                <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900">
                  Postulación de {businessApp?.legalName ?? "tu empresa"} en revisión
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Nuestro equipo comercial está validando tu RUC ante SUNAT. Mientras tanto, puedes continuar comprando como cliente minorista.
                </p>
              </div>
            </div>
            <Link
              href="/cuenta/mayorista"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-800 hover:bg-amber-50"
            >
              <span>Ver Estado</span>
              <FaArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-red-200/80 bg-gradient-to-r from-red-50/60 via-white to-blue-50/50 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-[#EF233C] border border-red-200">
                <FaBuilding className="size-6" aria-hidden />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100/60 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[#EF233C]">
                    <FaTags className="size-2.5" />
                    Canal Mayorista Oficial
                  </span>
                  <span className="text-[0.68rem] font-bold text-slate-500 uppercase">
                    Hasta -50% de Descuento
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-slate-900">
                  ¿Tienes tienda, boutique o distribuyes en provincias?
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Regístrate con tu RUC 20 o 10 para acceder a precios mayoristas oficiales, curvas de tallas completas (28 a 46) y atención prioritaria.
                </p>
              </div>
            </div>
            <Link
              href="/mayorista/registro"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#EF233C] hover:bg-red-700 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors"
            >
              <span>Solicitar Cuenta B2B</span>
              <FaArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Resumen de Bolsa de Compras y Garantía */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Tarjeta Bolsa Actual */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0055FF]">
              <FaBagShopping className="size-3.5" aria-hidden />
              Bolsa de Compras Actual
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#0055FF]">
              {cart.totalUnits} {cart.totalUnits === 1 ? "prenda" : "prendas"}
            </span>
          </div>

          <p className="mt-3 text-3xl font-black tabular-nums text-slate-900">
            {formatPEN(cart.estimatedTotalAmount)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {cart.lineCount > 0
              ? `${cart.lineCount} ${cart.lineCount === 1 ? "modelo" : "modelos"} reservados en tu cuenta.`
              : "Tu bolsa de compras está vacía en este momento."}
          </p>

          <div className="mt-4">
            <Link
              href={cart.lineCount > 0 ? "/cuenta/bolsa" : "/catalogo"}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0055FF] hover:bg-blue-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all"
            >
              <span>{cart.lineCount > 0 ? "Ver Mi Bolsa Actual" : "Explorar Prendas"}</span>
              <FaArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Tarjeta Cotizaciones B2B o Garantía */}
        {user.role === "business_approved" || user.role === "admin" ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EF233C]">
                <FaFileInvoice className="size-3.5" aria-hidden />
                Cotizaciones Empresariales B2B
              </span>
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 font-mono text-xs font-bold text-[#EF233C]">
                {quotes.length} {quotes.length === 1 ? "solicitud" : "solicitudes"}
              </span>
            </div>

            {quotes[0] ? (
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900">
                    {quotes[0].quoteNumber}
                  </span>
                  <QuoteStatusBadge status={quotes[0].status} />
                </div>
                <p className="text-xs text-slate-500">
                  Última orden por {quotes[0].totalUnits} uds. (
                  {formatPEN(quotes[0].quotedTotalAmount ?? quotes[0].requestedSubtotalAmount)})
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                Aún no has registrado solicitudes de cotización por volumen mayorista.
              </p>
            )}

            <div className="mt-4">
              <Link
                href="/cuenta/cotizaciones"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
              >
                <span>Gestionar Cotizaciones B2B</span>
                <FaArrowRight className="size-3" aria-hidden />
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <FaGem className="size-3.5 text-emerald-600" aria-hidden />
                Garantía American Colt JEANS™
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-emerald-700">
                100% Calidad
              </span>
            </div>

            <p className="mt-2 text-base font-bold uppercase text-slate-900">
              Mezclilla Ring Spun &amp; Drill Premium
            </p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Garantía de confección 100% peruana, cambio de talla disponible y despachos a todo el país con Olva Courier y Shalom.
            </p>

            <div className="mt-4 flex items-center gap-4 text-xs font-bold">
              <Link
                href="/cambios-y-devoluciones"
                className="text-[#0055FF] hover:underline"
              >
                Cambios y devoluciones →
              </Link>
              <Link
                href="/atencion-al-cliente"
                className="text-slate-500 hover:text-slate-900"
              >
                Guía de tallas
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 3. Formulario de Información Personal */}
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
