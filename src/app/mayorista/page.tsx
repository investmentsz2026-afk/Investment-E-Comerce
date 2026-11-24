import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts } from "@/server/queries/products";
import { ProductCard } from "@/components/product/product-card";
import { WholesaleLanding3D } from "@/components/wholesale/wholesale-landing-3d";

export const metadata: Metadata = {
  title: "Venta por Mayor y Canal B2B | American Colt JEANS™",
  description:
    "Abastece tu boutique, distribuidora o empresa con prendas de alta confección. Escalas de precio por volumen, facturación con RUC y despacho a todo el Perú.",
};

export const instant = false;

export default async function MayoristaPage() {
  const wholesaleCatalog = await getProducts({ mayorista: true });
  const featuredWholesale = wholesaleCatalog.items.slice(0, 8);

  const featuredProductsSlot =
    featuredWholesale.length > 0 ? (
      <section className="shell mt-10 sm:mt-16 lg:mt-24">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-200 pb-3.5 sm:flex-row sm:items-end sm:gap-3 sm:pb-5">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-[0.12em] text-[#2563EB] sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-[0.14em]">
              Modelos Seleccionados
            </span>
            <h2 className="mt-1.5 font-sans text-lg font-black uppercase tracking-tight text-slate-900 sm:mt-2 sm:text-3xl">
              Prendas con disponibilidad{" "}
              <span className="text-[#EF233C]">mayorista</span>
            </h2>
          </div>
          <Link
            href="/catalogo?mayorista=1"
            className="inline-flex items-center gap-1 text-[0.66rem] font-extrabold uppercase tracking-wider text-[#2563EB] transition-colors hover:text-[#EF233C] sm:gap-1.5 sm:text-xs"
          >
            Ver catálogo mayorista
            <ArrowRight className="size-3 sm:size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-2.5 gap-y-5 sm:mt-8 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 lg:gap-x-6 xl:grid-cols-4">
          {featuredWholesale.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>
    ) : null;

  return <WholesaleLanding3D featuredProductsSlot={featuredProductsSlot} />;
}
