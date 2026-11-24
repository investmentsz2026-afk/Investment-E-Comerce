"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Clock, Layers, SlidersHorizontal, X } from "lucide-react";
import { FaBoxesStacked, FaPercent, FaTag } from "react-icons/fa6";
import type { CatalogProduct, AvailableFilters, CategoryRecord } from "@/types/catalog";
import type { PublicPromotionItem } from "@/lib/promo-display";
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
  promotions?: PublicPromotionItem[];
  currentCategoryId?: number;
  title?: string;
}

/** Layout cliente del catálogo enfocado en las categorías reales del catálogo American Colt JEANS™. */
export function CatalogContent({
  products,
  total,
  page,
  totalPages,
  available,
  categories,
  promotions = [],
  currentCategoryId,
  title = "Shop American Colt",
}: CatalogContentProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchParams = useSearchParams();
  const activeOfferPct = searchParams.get("oferta");
  const activeAudience = searchParams.get("audiencia");
  const isWomenSelected = activeAudience === "mujer";
  const isPromoFilterActive = Boolean(activeOfferPct) || searchParams.get("novedades") === "1";
  const isWholesaleFilterActive =
    searchParams.get("mayorista") === "1" || searchParams.get("modalidad") === "mayorista";

  // Mostrar todas las categorías activas configuradas en /admin/categorias
  const visibleCategories = categories;

  // Anuncios dirigidos al Catálogo o a la Categoría actual desde /admin/promociones
  const catalogBanners = promotions.filter((p) => {
    if (!p.showInCatalogBanner) return false;
    if (currentCategoryId !== undefined) {
      return p.categoryId === null || p.categoryId === currentCategoryId;
    }
    return true;
  });

  return (
    <>
      {/* Categorías horizontales rápidas (solo las del catálogo real) */}
      {visibleCategories.length > 0 && <CategoryNav categories={visibleCategories} />}

      {/* Banners de campañas asignadas a Catálogo / Categoría desde /admin/promociones */}
      {!isPromoFilterActive && catalogBanners.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {catalogBanners.slice(0, 2).map((promo, i) => (
            <Link
              key={promo.id}
              href={promo.ctaHref || "/catalogo"}
              className={
                i % 2 === 0
                  ? "bg-flow group flex items-center justify-between gap-4 rounded-2xl border border-red-200/60 bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-5 py-3.5 text-white shadow-md transition-transform hover:-translate-y-0.5"
                  : "bg-flow group flex items-center justify-between gap-4 rounded-2xl border border-blue-200/60 bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB] px-5 py-3.5 text-white shadow-md transition-transform hover:-translate-y-0.5"
              }
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[0.58rem] font-black uppercase text-[#DC2626]">
                    -{promo.discountPercent}% OFF
                  </span>
                  {promo.categoryName && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[0.58rem] font-bold uppercase text-white">
                      {promo.categoryName}
                    </span>
                  )}
                </div>
                <p className="truncate font-sans text-sm font-black uppercase tracking-tight">
                  {promo.name}
                </p>
                <p className="line-clamp-1 text-xs text-white/90">
                  {promo.cleanDescription}
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          ))}
        </div>
      )}

      {/* Banner reluciente cuando el usuario entra haciendo clic en Oferta 3x2 / Descuento */}
      {isPromoFilterActive && (
        <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#EF233C] p-4 text-white shadow-lg sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#EF233C] shadow-md">
              <FaPercent className="size-4" aria-hidden />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <FaTag className="size-3 text-white" aria-hidden />
                <span className="font-mono text-[0.65rem] font-black uppercase tracking-widest text-amber-300">
                  FILTRO DE PROMOCIÓN APLICADO
                </span>
              </div>
              <p className="font-sans text-sm font-black uppercase tracking-tight sm:text-base">
                Mostrando Prendas en Oferta 3x2 y hasta {activeOfferPct || "50"}% de Descuento
              </p>
            </div>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0055FF] shadow-sm transition-transform hover:scale-105 hover:text-[#EF233C]"
          >
            <X className="size-3.5" aria-hidden />
            <span>Quitar filtro de oferta</span>
          </Link>
        </div>
      )}

      {/* Banner cuando el filtro Mayoristas B2B está activo */}
      {isWholesaleFilterActive && (
        <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-blue-300/60 bg-gradient-to-r from-[#0B1120] via-[#172554] to-[#1E3A8A] p-4 text-white shadow-lg sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EF233C] text-white shadow-md">
              <FaBoxesStacked className="size-4" aria-hidden />
            </span>
            <div>
              <span className="font-mono text-[0.62rem] font-black uppercase tracking-widest text-blue-300">
                CANAL MAYORISTA B2B · SELECCIÓN OFICIAL
              </span>
              <p className="font-sans text-sm font-black uppercase tracking-tight sm:text-base">
                Mostrando prendas habilitadas para compras por mayor
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/mayorista/cotizaciones"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#EF233C] px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#D90429]"
            >
              <span>Cotizar lote B2B</span>
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-900 shadow-sm transition-colors hover:bg-slate-100"
            >
              <X className="size-3.5" aria-hidden />
              <span>Ver todo</span>
            </Link>
          </div>
        </div>
      )}

      {/* Barra superior: Título Shop a la izquierda + Ordenar por a la derecha */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-blue-100 pb-3 pt-5">
        <div className="flex items-center gap-3">
          <h2 className="font-sans text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            {isWomenSelected
              ? "Línea Mujer — En Desarrollo"
              : isWholesaleFilterActive
                ? `${title} · Mayoristas B2B`
                : title}
          </h2>
          <span className="rounded-full bg-blue-50 px-3 py-0.5 font-mono text-xs font-extrabold text-[#0055FF] tabular-nums">
            {total} {total === 1 ? "prenda" : "prendas"}
          </span>

          {/* Mobile filter trigger */}
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] px-3.5 py-1.5 text-[0.7rem] font-extrabold uppercase tracking-wider text-white shadow-sm lg:hidden"
            aria-label="Abrir filtros"
          >
            <SlidersHorizontal className="size-3.5 shrink-0" aria-hidden />
            Filtros
          </button>
        </div>
        <CatalogSort total={total} />
      </div>

      <div className="flex gap-8 pb-20 pt-6 lg:gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filtros de catálogo">
          <CatalogFilters available={available} categories={visibleCategories} />
        </aside>

        {/* Products grid o aviso de Línea Mujer en Desarrollo */}
        <div className="min-w-0 flex-1">
          {isWomenSelected ? (
            <div className="overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 via-white to-red-50/40 p-8 text-center shadow-lg sm:p-12">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0055FF] to-[#1D4ED8] text-white shadow-md">
                <Clock className="size-8" aria-hidden />
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3.5 py-1 font-mono text-[0.65rem] font-extrabold uppercase tracking-widest text-[#DC2626]">
                <FaTag className="size-3" aria-hidden />
                <span>PRÓXIMAMENTE EN AMERICAN COLT JEANS™</span>
              </span>
              <h3 className="mt-3 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
                Línea de Prendas para Mujer <span className="text-[#0055FF]">en Desarrollo</span>
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
                Actualmente <strong>American Colt JEANS™</strong> se encuentra desarrollando su nueva colección de prendas femeninas, la cual se integrará más adelante a nuestra tienda online. Por el momento, te invitamos a explorar nuestro catálogo oficial de prendas para hombre (Jeans Denim, Pantalones Drill, Bermudas, Camisas y Polos).
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/catalogo?audiencia=hombre"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-transform hover:scale-105"
                >
                  <Layers className="size-4" aria-hidden />
                  <span>Ver Catálogo Hombre Disponible</span>
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/mayorista/cotizaciones"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-[#DC2626] bg-white px-6 text-xs font-extrabold uppercase tracking-wider text-[#DC2626] transition-colors hover:bg-[#DC2626] hover:text-white"
                >
                  <span>Cotizar Lotes por Mayor</span>
                </Link>
              </div>
            </div>
          ) : products.length > 0 ? (
            <>
              <CatalogGrid products={products} />
              <CatalogPagination
                currentPage={page}
                totalPages={totalPages}
                className="mt-14"
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
        categories={visibleCategories}
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />
    </>
  );
}
