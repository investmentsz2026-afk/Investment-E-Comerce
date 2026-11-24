import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { siteConfig } from "@/config/site";
import { trendingSearches } from "@/config/navigation";
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
    <div className="bg-gradient-to-b from-slate-50/70 to-white pt-[7rem] pb-16 sm:pt-[7.25rem] lg:pt-[10.75rem]">
      <div className="shell">
        <CatalogBreadcrumbs items={[{ label: "Búsqueda" }]} />

        <div className="mt-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:rounded-3xl sm:p-6">
          <Reveal y={12}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 font-mono text-[0.56rem] font-extrabold uppercase tracking-widest text-[#DC2626] sm:text-[0.64rem]">
                  <Search className="size-3" aria-hidden />
                  {query ? "Resultados de Búsqueda" : "Explora Nuestro Catálogo"}
                </span>
                <h1 className="mt-1.5 truncate font-sans text-xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
                  {query ? `“${query}”` : "Buscar Prendas"}
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  {query
                    ? results.length === 0
                      ? "No encontramos productos que coincidan."
                      : `${results.length} ${results.length === 1 ? "producto encontrado" : "productos encontrados"}.`
                    : "Escribe el nombre de la prenda, modelo o tela que estás buscando."}
                </p>
              </div>

              <form
                action="/buscar"
                method="GET"
                role="search"
                className="flex w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 p-1 focus-within:border-[#2563EB] focus-within:bg-white sm:max-w-sm"
              >
                <Search className="ml-2.5 size-4 shrink-0 text-slate-400" aria-hidden />
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar King 767, Camisa, Polo..."
                  aria-label="Buscar prendas"
                  className="h-8 min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 sm:h-9 sm:text-sm"
                />
                <button
                  type="submit"
                  className="bg-flow inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-3.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-white shadow-xs transition-transform hover:scale-105 sm:h-9 sm:px-4 sm:text-xs"
                >
                  <span>Buscar</span>
                  <ArrowRight className="size-3" aria-hidden />
                </button>
              </form>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
              <span className="font-mono text-[0.58rem] font-bold uppercase tracking-wider text-slate-400">
                Populares:
              </span>
              {trendingSearches.map((term) => (
                <Link
                  key={term}
                  href={`/buscar?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[0.62rem] font-bold text-slate-700 transition-colors hover:border-[#DC2626] hover:bg-red-50 hover:text-[#DC2626] sm:text-xs"
                >
                  {term}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mt-5 pb-12 sm:mt-8">
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
