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
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell">
        <header className="mb-10 border-b border-ink/10 pb-8">
          <p className="eyebrow text-taupe-500">INVESTMENTS · Selección Comercial</p>
          <h1 className="mt-2 font-display text-display-md text-ink">
            Tu Bolsa de <em>Compras.</em>
          </h1>
        </header>

        <CartPageView />
      </div>
    </div>
  );
}

