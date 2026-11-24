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
      <section className="shell mt-20 lg:mt-24">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#2563EB]">
              Modelos Seleccionados
            </span>
            <h2 className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
              Prendas con disponibilidad{" "}
              <span className="text-[#EF233C]">mayorista</span>
            </h2>
          </div>
          <Link
            href="/catalogo?mayorista=1"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#2563EB] transition-colors hover:text-[#EF233C]"
          >
            Ver todo el catálogo mayorista
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 xl:grid-cols-4">
          {featuredWholesale.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>
    ) : null;

  return <WholesaleLanding3D featuredProductsSlot={featuredProductsSlot} />;
}
