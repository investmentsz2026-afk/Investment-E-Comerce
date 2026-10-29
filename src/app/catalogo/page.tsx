import type { Metadata } from "next";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { getProducts, getAvailableFilters } from "@/server/queries/products";
import { getCategoriesWithProducts } from "@/server/queries/categories";
import { parseCatalogParams, type RawSearchParams } from "@/lib/catalog-params";
import { CatalogBreadcrumbs } from "@/components/catalog/catalog-breadcrumbs";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { CatalogContent } from "./catalog-content";

/** Datos dinámicos de Neon: la ruta puede bloquear (se renderiza en servidor por petición). */
export const instant = false;

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explora nuestra colección completa de moda premium: blazers, camisas, polos, casacas, denim y más. Venta por menor y por mayor.",
  alternates: { canonical: "/catalogo" },
  openGraph: {
    title: `Catálogo | ${siteConfig.name}`,
    description: "Colección completa de moda premium INVESTMENTS.",
    url: "/catalogo",
  },
};

interface CatalogPageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const filters = parseCatalogParams(await searchParams);

  const [result, available, categories] = await Promise.all([
    getProducts(filters),
    getAvailableFilters(),
    getCategoriesWithProducts(),
  ]);

  return (
    <div className="bg-paper pt-[7.5rem] lg:pt-[8.75rem]">
      <div className="shell">
        <CatalogBreadcrumbs items={[{ label: "Catálogo" }]} />

        {/* Editorial header */}
        <div className="pb-10 pt-4 lg:pb-16 lg:pt-8">
          <h1 className="font-display text-display-lg text-ink">
            Nuestra <em>colección.</em>
          </h1>
          <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-taupe-600">
            Explora prendas pensadas para vestir con intención. Moda premium por menor y
            soluciones textiles por mayor.
          </p>
        </div>

        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogContent
            products={result.items}
            total={result.total}
            page={result.page}
            totalPages={result.totalPages}
            available={available}
            categories={categories}
          />
        </Suspense>
      </div>
    </div>
  );
}
