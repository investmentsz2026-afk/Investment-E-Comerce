import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getCategoryBySlug, getCategoriesWithProducts } from "@/server/queries/categories";
import { getProducts, getAvailableFilters } from "@/server/queries/products";
import { parseCatalogParams, type RawSearchParams } from "@/lib/catalog-params";
import { CatalogBreadcrumbs } from "@/components/catalog/catalog-breadcrumbs";
import { CatalogContent } from "../catalog-content";

/** Datos dinámicos de Neon: la ruta puede bloquear (se renderiza en servidor por petición). */
export const instant = false;

interface CategoryPageProps {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) notFound();

  return {
    title: category.name,
    description: category.description ?? `Explora ${category.name} en ${siteConfig.name}.`,
    alternates: { canonical: `/catalogo/${category.slug}` },
    openGraph: {
      title: `${category.name} | ${siteConfig.name}`,
      description: category.description ?? `Colección de ${category.name}.`,
      url: `/catalogo/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) notFound();

  const sp = await searchParams;

  const filters = parseCatalogParams(sp, { categoria });

  const [result, available, categories] = await Promise.all([
    getProducts(filters),
    getAvailableFilters(categoria),
    getCategoriesWithProducts(),
  ]);

  return (
    <div className="bg-paper pt-[7.5rem] lg:pt-[8.75rem]">
      <div className="shell">
        <CatalogBreadcrumbs
          items={[
            { label: "Catálogo", href: "/catalogo" },
            { label: category.name },
          ]}
        />

        {/* Editorial header */}
        <div className="pb-10 pt-4 lg:pb-16 lg:pt-8">
          <h1 className="font-display text-display-lg text-ink">{category.name}</h1>
          {category.description && (
            <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-taupe-600">
              {category.description}
            </p>
          )}
        </div>

        <CatalogContent
          products={result.items}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          available={available}
          categories={categories}
        />
      </div>
    </div>
  );
}
