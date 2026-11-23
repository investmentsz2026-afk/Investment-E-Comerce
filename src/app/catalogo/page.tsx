import type { Metadata } from "next";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { getProducts, getAvailableFilters } from "@/server/queries/products";
import { getCategories } from "@/server/queries/categories";
import { getActivePublicPromotions } from "@/server/queries/promotions";
import { parseCatalogParams, type RawSearchParams } from "@/lib/catalog-params";
import { CatalogBreadcrumbs } from "@/components/catalog/catalog-breadcrumbs";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { CatalogContent } from "./catalog-content";

/** Datos dinámicos de Neon: la ruta puede bloquear (se renderiza en servidor por petición). */
export const instant = false;

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explora nuestra colección completa de Jeans, Casacas, Polos, Camisas y más en American Colt JEANS™. Venta por menor y por mayor.",
  alternates: { canonical: "/catalogo" },
  openGraph: {
    title: `Catálogo | ${siteConfig.name}`,
    description: "Colección completa de moda y denim American Colt JEANS™.",
    url: "/catalogo",
  },
};

interface CatalogPageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const filters = parseCatalogParams(await searchParams);

  const [result, available, categories, promotions] = await Promise.all([
    getProducts(filters),
    getAvailableFilters(),
    getCategories(),
    getActivePublicPromotions(),
  ]);

  return (
    <div className="bg-paper pt-[6.5rem] lg:pt-[10.25rem]">
      <div className="shell">
        <CatalogBreadcrumbs items={[{ label: "Catálogo" }]} />

        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogContent
            products={result.items}
            total={result.total}
            page={result.page}
            totalPages={result.totalPages}
            available={available}
            categories={categories}
            promotions={promotions}
            title="Shop American Colt"
          />
        </Suspense>
      </div>
    </div>
  );
}
