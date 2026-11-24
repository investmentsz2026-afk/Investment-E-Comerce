import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getCategoryBySlug, getCategories } from "@/server/queries/categories";
import { getProducts, getAvailableFilters } from "@/server/queries/products";
import { getActivePublicPromotions } from "@/server/queries/promotions";
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

  const [result, available, categories, promotions] = await Promise.all([
    getProducts(filters),
    getAvailableFilters(categoria),
    getCategories(),
    getActivePublicPromotions(),
  ]);

  return (
    <div className="bg-paper pt-[7rem] pb-14 sm:pt-[7.25rem] lg:pt-[10.75rem]">
      <div className="shell">
        <div className="sr-only">
          <h1>{category.name}</h1>
        </div>
        <CatalogBreadcrumbs
          items={[
            { label: "Catálogo", href: "/catalogo" },
            { label: category.name },
          ]}
        />

        <CatalogContent
          products={result.items}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          available={available}
          categories={categories}
          promotions={promotions}
          currentCategoryId={category.id}
          title={`Shop ${category.name}`}
        />
      </div>
    </div>
  );
}
