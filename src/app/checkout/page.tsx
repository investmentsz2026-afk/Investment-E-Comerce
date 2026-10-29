import type { Metadata } from "next";
import Link from "next/link";
import { randomBytes } from "node:crypto";
import { getCurrentSession } from "@/server/auth/session";
import { getCheckoutSessionContext } from "@/server/queries/orders";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { Lock, LogIn, UserPlus, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Checkout Seguro",
  description:
    "Confirma tu pedido minorista o mayorista con validación en servidor, cálculo de envío nacional y facturación electrónica.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ quoteId?: string }>;
}) {
  const [{ user }, params] = await Promise.all([getCurrentSession(), searchParams]);
  const quoteIdParam = params.quoteId ? Number(params.quoteId) : null;

  // Exigir sesión autenticada e informar claramente antes de comenzar el checkout
  // (Al iniciar sesión o registrarse, el carrito de visitante se fusiona automáticamente en PostgreSQL)
  if (!user) {
    const nextUrl = quoteIdParam
      ? `/checkout?quoteId=${quoteIdParam}`
      : "/checkout";

    return (
      <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
        <div className="shell max-w-2xl">
          <div className="border border-ink/15 bg-[#fbfaf7] p-8 sm:p-12 text-center space-y-6">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-ink/15 bg-paper text-ink">
              <Lock className="size-7" aria-hidden />
            </div>

            <div>
              <p className="eyebrow text-cochinilla">Checkout Protegido</p>
              <h1 className="mt-2 font-display text-display-sm text-ink">
                Inicia sesión para confirmar tu pedido
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-taupe-600">
                Para resguardar la seguridad de tus pagos, aislar tus comprobantes tributarios (Boleta o Factura Electrónica) y conservar las prendas que ya agregaste a tu bolsa, es necesario identificarte con tu cuenta.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href={`/iniciar-sesion?next=${encodeURIComponent(nextUrl)}`}
                data-testid="checkout-login-btn"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 bg-ink px-8 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla"
              >
                <LogIn className="size-4" aria-hidden />
                Iniciar sesión y continuar
              </Link>
              <Link
                href={`/registro?next=${encodeURIComponent(nextUrl)}`}
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 border border-ink/25 bg-paper px-8 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink"
              >
                <UserPlus className="size-4" aria-hidden />
                Crear cuenta de cliente
              </Link>
            </div>

            <p className="flex items-center justify-center gap-2 border-t border-ink/10 pt-5 text-xs text-taupe-500">
              <ShieldCheck className="size-4 text-emerald-800" aria-hidden />
              <span>Tu bolsa de compras actual se fusionará automáticamente al ingresar.</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const context = await getCheckoutSessionContext(user, quoteIdParam);
  const initialIdempotencyKey = `chk_${user.id}_${randomBytes(12).toString("hex")}`;

  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell space-y-8">
        <header className="border-b border-ink/10 pb-6">
          <p className="eyebrow text-cochinilla">Confirmación Comercial y Despacho</p>
          <h1 className="mt-2 font-display text-display-md text-ink">
            Finalizar Compra
          </h1>
          <p className="mt-1 text-xs text-taupe-600">
            Revisa tus prendas, selecciona tu dirección en el Perú y elige tu comprobante electrónico.
          </p>
        </header>

        <CheckoutView
          context={context}
          user={{
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
          }}
          initialIdempotencyKey={initialIdempotencyKey}
        />
      </div>
    </div>
  );
}

