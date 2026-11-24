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
    <div className="space-y-4 text-slate-900 sm:space-y-6">
      {/* 1. Banner de Estado / Invitación Mayorista B2B */}
      {user.role === "business_approved" ? (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-600 sm:size-12">
                <FaCircleCheck className="size-5 sm:size-6" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100/70 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-emerald-800 sm:px-2.5 sm:text-[0.65rem]">
                  Condición Mayorista Autorizada
                </span>
                <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 sm:text-lg">
                  Acceso VIP a precios de fábrica
                </h2>
                <p className="max-w-2xl text-[0.68rem] leading-snug text-slate-600 sm:text-xs sm:leading-relaxed">
                  Tarifas con descuento por docena, media y lotes en todo el catálogo de American Colt JEANS™.
                </p>
              </div>
            </div>
            <Link
              href="/catalogo?mayorista=1"
              className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-emerald-700 sm:gap-2 sm:px-5 sm:py-3 sm:text-xs"
            >
              <span>Catálogo B2B</span>
              <FaArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      ) : user.role === "business_pending" ? (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-100 text-amber-600 sm:size-12">
                <FaClock className="size-5 sm:size-6" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100/70 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-amber-800 sm:px-2.5 sm:text-[0.65rem]">
                  Solicitud B2B en Evaluación
                </span>
                <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 sm:text-lg">
                  Postulación de {businessApp?.legalName ?? "tu empresa"} en revisión
                </h2>
                <p className="max-w-2xl text-[0.68rem] leading-snug text-slate-600 sm:text-xs sm:leading-relaxed">
                  Estamos validando tu RUC ante SUNAT. Mientras tanto puedes seguir comprando normalmente.
                </p>
              </div>
            </div>
            <Link
              href="/cuenta/mayorista"
              className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-[0.68rem] font-bold uppercase tracking-wider text-amber-800 hover:bg-amber-50 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs"
            >
              <span>Ver Estado</span>
              <FaArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-red-200/80 bg-gradient-to-r from-red-50/60 via-white to-blue-50/50 p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-100 text-[#EF233C] sm:size-12">
                <FaBuilding className="size-5 sm:size-6" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100/60 px-2 py-0.5 text-[0.56rem] font-bold uppercase tracking-wider text-[#EF233C] sm:px-2.5 sm:text-[0.65rem]">
                    <FaTags className="size-2.5" />
                    Mayorista Oficial
                  </span>
                  <span className="text-[0.58rem] font-bold uppercase text-slate-500 sm:text-[0.68rem]">
                    Hasta -50% OFF
                  </span>
                </div>
                <h2 className="text-sm font-bold uppercase leading-tight tracking-tight text-slate-900 sm:text-xl">
                  ¿Tienes tienda, boutique o distribuyes en provincias?
                </h2>
                <p className="max-w-2xl text-[0.68rem] leading-snug text-slate-600 sm:text-xs sm:leading-relaxed">
                  Regístrate con RUC 20 o 10 para precios mayoristas, curvas completas (28 a 46) y atención prioritaria.
                </p>
              </div>
            </div>
            <Link
              href="/mayorista/registro"
              className="inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#EF233C] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-red-700 sm:gap-2 sm:px-5 sm:py-3 sm:text-xs"
            >
              <span>Solicitar Cuenta B2B</span>
              <FaArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Resumen de Bolsa de Compras y Garantía (2 columnas compactas en móvil) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-6">
        {/* Tarjeta Bolsa Actual */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-[#0055FF] sm:gap-2 sm:text-xs">
                <FaBagShopping className="size-3 sm:size-3.5" aria-hidden />
                Bolsa Actual
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[0.56rem] font-bold text-[#0055FF] sm:px-2.5 sm:text-xs">
                {cart.totalUnits} {cart.totalUnits === 1 ? "ud." : "uds."}
              </span>
            </div>

            <p className="mt-2 text-lg font-black tabular-nums text-slate-900 sm:mt-3 sm:text-3xl">
              {formatPEN(cart.estimatedTotalAmount)}
            </p>

            <p className="mt-0.5 line-clamp-2 text-[0.64rem] text-slate-500 sm:mt-1 sm:text-xs">
              {cart.lineCount > 0
                ? `${cart.lineCount} ${cart.lineCount === 1 ? "modelo" : "modelos"} en tu cuenta.`
                : "Tu bolsa está vacía."}
            </p>
          </div>

          <div className="mt-3 sm:mt-4">
            <Link
              href={cart.lineCount > 0 ? "/cuenta/bolsa" : "/catalogo"}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0055FF] px-2.5 py-2 text-[0.62rem] font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-blue-700 sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs"
            >
              <span className="truncate">{cart.lineCount > 0 ? "Ver Bolsa" : "Explorar"}</span>
              <FaArrowRight className="size-2.5 shrink-0 sm:size-3" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Tarjeta Cotizaciones B2B o Garantía */}
        {user.role === "business_approved" || user.role === "admin" ? (
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-[#EF233C] sm:gap-2 sm:text-xs">
                  <FaFileInvoice className="size-3 sm:size-3.5" aria-hidden />
                  Cotizaciones
                </span>
                <span className="rounded-full bg-red-50 px-2 py-0.5 font-mono text-[0.56rem] font-bold text-[#EF233C] sm:px-2.5 sm:text-xs">
                  {quotes.length}
                </span>
              </div>

              {quotes[0] ? (
                <div className="mt-2 space-y-1 sm:mt-3">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="truncate font-mono text-xs font-bold text-slate-900 sm:text-base">
                      {quotes[0].quoteNumber}
                    </span>
                    <QuoteStatusBadge status={quotes[0].status} />
                  </div>
                  <p className="line-clamp-2 text-[0.62rem] text-slate-500 sm:text-xs">
                    {quotes[0].totalUnits} uds. ·{" "}
                    {formatPEN(quotes[0].quotedTotalAmount ?? quotes[0].requestedSubtotalAmount)}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-[0.64rem] text-slate-500 sm:mt-3 sm:text-xs">
                  Aún sin solicitudes de cotización por volumen.
                </p>
              )}
            </div>

            <div className="mt-3 sm:mt-4">
              <Link
                href="/cuenta/cotizaciones"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-2 text-[0.62rem] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 sm:w-auto sm:gap-2 sm:px-4 sm:text-xs"
              >
                <span className="truncate">Cotizaciones</span>
                <FaArrowRight className="size-2.5 shrink-0 sm:size-3" aria-hidden />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="inline-flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-emerald-700 sm:gap-2 sm:text-xs">
                  <FaGem className="size-3 text-emerald-600 sm:size-3.5" aria-hidden />
                  Garantía
                </span>
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[0.52rem] font-bold uppercase tracking-wider text-emerald-700 sm:px-2.5 sm:text-[0.62rem]">
                  100% Perú
                </span>
              </div>

              <p className="mt-2 text-xs font-bold uppercase leading-tight text-slate-900 sm:text-base">
                Denim &amp; Drill Premium
              </p>
              <p className="mt-1 line-clamp-2 text-[0.62rem] leading-snug text-slate-500 sm:line-clamp-none sm:text-xs sm:leading-relaxed">
                Cambio de talla en 7 días y envíos con Olva y Shalom a todo el país.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.64rem] font-bold sm:mt-4 sm:gap-4 sm:text-xs">
              <Link
                href="/cambios-y-devoluciones"
                className="text-[#0055FF] hover:underline"
              >
                Cambios →
              </Link>
              <Link
                href="/atencion-al-cliente"
                className="text-slate-500 hover:text-slate-900"
              >
                Tallas
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
