"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { CatalogProduct, AvailableFilters, CategoryRecord } from "@/types/catalog";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { CatalogSort } from "@/components/catalog/catalog-sort";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { CatalogFilters, MobileFilterDrawer } from "@/components/catalog/catalog-filters";
import { CatalogEmpty } from "@/components/catalog/catalog-empty";
import { CategoryNav } from "./category-nav";

interface CatalogContentProps {
  products: CatalogProduct[];
  total: number;
  page: number;
  totalPages: number;
  available: AvailableFilters;
  categories: CategoryRecord[];
}

/** Layout cliente del catálogo: sidebar de filtros + grid + paginación. */
export function CatalogContent({
  products,
  total,
  page,
  totalPages,
  available,
  categories,
}: CatalogContentProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <>
      {/* Categorías horizontales */}
      {categories.length > 0 && <CategoryNav categories={categories} />}

      {/* Barra de herramientas */}
      <div className="flex items-center justify-between gap-2 border-b border-ink/10 pb-4 pt-6">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile filter trigger */}
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-1.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink sm:gap-2 lg:hidden"
            aria-label="Abrir filtros"
          >
            <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
            Filtros
          </button>
          <span className="text-xs text-taupe-300 lg:hidden" aria-hidden>·</span>
          <p className="text-xs text-taupe-500 sm:text-sm lg:hidden">
            <span className="font-medium tabular-nums text-ink">{total}</span>{" "}
            {total === 1 ? "producto" : "productos"}
          </p>
        </div>
        <CatalogSort total={total} />
      </div>

      <div className="flex gap-10 pb-20 pt-8 lg:gap-14">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block" aria-label="Filtros de catálogo">
          <CatalogFilters available={available} />
        </aside>

        {/* Products grid */}
        <div className="min-w-0 flex-1">
          {products.length > 0 ? (
            <>
              <CatalogGrid products={products} />
              <CatalogPagination
                currentPage={page}
                totalPages={totalPages}
                className="mt-16"
              />
            </>
          ) : (
            <CatalogEmpty />
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        available={available}
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />
    </>
  );
}
