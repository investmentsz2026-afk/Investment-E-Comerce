import type { Metadata } from "next";
import { CartPageView } from "@/components/cart/cart-page-view";

export const metadata: Metadata = {
  title: "Bolsa de Compras",
  description:
    "Revisa tus prendas seleccionadas, disponibilidad por talla y color, y condiciones minoristas o mayoristas B2B en INVESTMENTS.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function CarritoPage() {
  return (
    <div className="bg-paper pt-[7rem] pb-16 sm:pt-[7.25rem] lg:pt-[10.75rem] lg:pb-24">
      <div className="shell">
        <header className="mb-5 border-b border-ink/10 pb-4 sm:mb-10 sm:pb-8">
          <p className="eyebrow text-[0.58rem] text-taupe-500 sm:text-xs">AMERICAN COLT JEANS™ · Selección Comercial</p>
          <h1 className="mt-1.5 font-display text-2xl text-ink sm:mt-2 sm:text-display-md">
            Tu Bolsa de <em>Compras.</em>
          </h1>
        </header>

        <CartPageView />
      </div>
    </div>
  );
}

