import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { searchProducts } from "@/server/queries/products";
import { CatalogBreadcrumbs } from "@/components/catalog/catalog-breadcrumbs";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { CatalogEmpty } from "@/components/catalog/catalog-empty";
import { Reveal } from "@/components/motion/reveal";

/** Datos dinámicos de Neon: la ruta puede bloquear (se renderiza en servidor por petición). */
export const instant = false;

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  return {
    title: q ? `"${q}" — Búsqueda` : "Buscar",
    description: `Busca prendas de moda premium en ${siteConfig.name}.`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const results = query ? await searchProducts(query) : [];

  return (
    <div className="bg-paper pt-[7.5rem] lg:pt-[8.75rem]">
      <div className="shell">
        <CatalogBreadcrumbs items={[{ label: "Búsqueda" }]} />

        <div className="pb-10 pt-4 lg:pb-16 lg:pt-8">
          {query ? (
            <Reveal y={16}>
              <p className="eyebrow text-taupe-500">Resultados para</p>
              <h1 className="mt-3 font-display text-display-lg text-ink">
                &ldquo;{query}&rdquo;
              </h1>
              <p className="mt-4 text-sm text-taupe-600">
                {results.length === 0
                  ? "No encontramos productos que coincidan."
                  : `${results.length} ${results.length === 1 ? "producto encontrado" : "productos encontrados"}.`}
              </p>
            </Reveal>
          ) : (
            <Reveal y={16}>
              <h1 className="font-display text-display-lg text-ink">
                Buscar <em>productos.</em>
              </h1>
              <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-taupe-600">
                Usa la barra de búsqueda en la parte superior para encontrar prendas por nombre, categoría o tipo.
              </p>
            </Reveal>
          )}
        </div>

        <div className="pb-20">
          {results.length > 0 ? (
            <CatalogGrid products={results} />
          ) : query ? (
            <CatalogEmpty
              title="Sin resultados"
              message={`No encontramos prendas que coincidan con "${query}". Intenta con otro término o explora nuestro catálogo completo.`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
