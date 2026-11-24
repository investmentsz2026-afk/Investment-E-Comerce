"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Minus, Plus, X, SlidersHorizontal, Check, Clock } from "lucide-react";
import { FaClock } from "react-icons/fa6";
import type { AvailableFilters, Audience, CategoryRecord } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { PriceRangeForm } from "./price-range-form";

interface CatalogFiltersProps {
  available: AvailableFilters;
  categories?: CategoryRecord[];
  className?: string;
}

/** Panel de filtros colapsable estilo Pionier.pe con acento Rojo Oficial American Colt (#91151B). */
export function CatalogFilters({ available, categories = [], className }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Leer filtros activos de URL
  const activeAudience = searchParams.get("audiencia") as Audience | null;
  const activeSizes = searchParams.getAll("talla");
  const activeColors = searchParams.getAll("color");
  const activeNovedades = searchParams.get("novedades") === "1";
  const activeMayorista =
    searchParams.get("mayorista") === "1" || searchParams.get("modalidad") === "mayorista";
  const activeDisponible = searchParams.get("disponible") === "1";
  const activePrecioMin = searchParams.get("precio_min");
  const activePrecioMax = searchParams.get("precio_max");

  const updateParams = useCallback(
    (key: string, value: string | null, isArray = false) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("pagina");

      if (isArray) {
        const current = params.getAll(key);
        if (value && current.includes(value)) {
          params.delete(key);
          current.filter((v) => v !== value).forEach((v) => params.append(key, v));
        } else if (value) {
          params.append(key, value);
        }
      } else {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const setPriceRange = useCallback(
    (min: string, max: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("pagina");
      if (min) params.set("precio_min", min);
      else params.delete("precio_min");
      if (max) params.set("precio_max", max);
      else params.delete("precio_max");
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const hasActiveFilters =
    activeAudience ||
    activeSizes.length > 0 ||
    activeColors.length > 0 ||
    activeNovedades ||
    activeMayorista ||
    activeDisponible ||
    activePrecioMin ||
    activePrecioMax;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Limpiar filtros */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="flex w-full items-center justify-center gap-1.5 rounded-xs border border-cochinilla bg-cochinilla/5 py-2 text-xs font-extrabold uppercase tracking-wider text-cochinilla transition-colors hover:bg-cochinilla hover:text-paper"
        >
          <X className="size-3.5" aria-hidden />
          Limpiar filtros activos
        </button>
      )}

      {/* Lista de Categorías estilo Pionier con barra lateral roja */}
      {categories.length > 0 && (
        <div className="relative border-b border-ink/15 pb-5 pr-3">
          <span
            aria-hidden
            className="absolute right-0 top-1 bottom-5 w-1.5 rounded-full bg-cochinilla"
          />
          <ul className="space-y-3">
            <li>
              <Link
                href="/catalogo"
                className="group flex items-center gap-3 text-xs font-medium text-ink transition-colors hover:text-cochinilla"
              >
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-xs border",
                    pathname === "/catalogo" && !activeMayorista
                      ? "border-cochinilla bg-cochinilla text-paper"
                      : "border-ink/25 bg-paper group-hover:border-cochinilla",
                  )}
                >
                  {pathname === "/catalogo" && !activeMayorista && (
                    <Check className="size-3 stroke-[3]" aria-hidden />
                  )}
                </span>
                <span
                  className={cn(
                    pathname === "/catalogo" && !activeMayorista && "font-extrabold text-cochinilla",
                  )}
                >
                  Todas las Prendas
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/catalogo?mayorista=1"
                className="group flex items-center gap-3 text-xs font-medium text-[#1D4ED8] transition-colors hover:text-[#DC2626]"
              >
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-xs border",
                    activeMayorista
                      ? "border-[#1D4ED8] bg-[#1D4ED8] text-white"
                      : "border-blue-300 bg-blue-50 group-hover:border-[#1D4ED8]",
                  )}
                >
                  {activeMayorista && <Check className="size-3 stroke-[3]" aria-hidden />}
                </span>
                <span className={cn("font-bold", activeMayorista && "font-extrabold")}>
                  Mayoristas B2B
                </span>
              </Link>
            </li>
            {categories.map((cat) => {
              const href = `/catalogo/${cat.slug}`;
              const isCurrent = pathname === href;
              return (
                <li key={cat.id}>
                  <Link
                    href={href}
                    className="group flex items-center gap-3 text-xs font-medium text-taupe-600 transition-colors hover:text-cochinilla"
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-xs border",
                        isCurrent
                          ? "border-cochinilla bg-cochinilla text-paper"
                          : "border-ink/25 bg-paper group-hover:border-cochinilla",
                      )}
                    >
                      {isCurrent && <Check className="size-3 stroke-[3]" aria-hidden />}
                    </span>
                    <span className={cn(isCurrent && "font-extrabold text-cochinilla")}>
                      {cat.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Rango de precio (en soles) estilo Pionier */}
      {available.priceRange.max > 0 && (
        <FilterSection title="Precio" defaultOpen>
          <PriceRangeForm
            key={`${activePrecioMin ?? ""}-${activePrecioMax ?? ""}`}
            minBound={available.priceRange.min}
            maxBound={available.priceRange.max}
            initialMin={activePrecioMin ?? ""}
            initialMax={activePrecioMax ?? ""}
            onApply={setPriceRange}
          />
        </FilterSection>
      )}

      {/* Tallas */}
      {available.sizes.length > 0 && (
        <FilterSection title="Tallas" defaultOpen>
          <div className="flex flex-wrap gap-1.5">
            {available.sizes.map((size) => {
              const isActive = activeSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateParams("talla", size, true)}
                  className={cn(
                    "flex h-8 min-w-10 items-center justify-center rounded-xs border px-2 font-mono text-xs font-bold transition-all duration-200",
                    isActive
                      ? "border-cochinilla bg-cochinilla text-paper"
                      : "border-ink/20 text-ink hover:border-cochinilla hover:text-cochinilla",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Descuentos / Modalidad Especial */}
      <FilterSection title="Descuentos y Modalidad" defaultOpen>
        <div className="flex flex-col gap-2.5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={activeNovedades}
              onChange={() => updateParams("novedades", activeNovedades ? null : "1")}
              className="size-4 cursor-pointer accent-cochinilla"
            />
            <span className="text-xs font-medium text-ink">Novedades y Promociones</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={activeMayorista}
              onChange={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("pagina");
                params.delete("modalidad");
                if (activeMayorista) {
                  params.delete("mayorista");
                } else {
                  params.set("mayorista", "1");
                }
                const query = params.toString();
                router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
              }}
              className="size-4 cursor-pointer accent-cochinilla"
            />
            <span className="text-xs font-medium text-ink">Disponible por Mayor B2B</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={activeDisponible}
              onChange={() => updateParams("disponible", activeDisponible ? null : "1")}
              className="size-4 cursor-pointer accent-cochinilla"
            />
            <span className="text-xs font-medium text-ink">Envío 24Hrs (Con stock)</span>
          </label>
        </div>
      </FilterSection>

      {/* Género / Línea (Hombre activo y aviso de Mujer en desarrollo) */}
      <FilterSection title="Género / Línea" defaultOpen>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateParams("audiencia", activeAudience === "hombre" ? null : "hombre")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider transition-all duration-200",
                activeAudience === "hombre" || !activeAudience
                  ? "border-[#0055FF] bg-[#0055FF] text-white shadow-sm"
                  : "border-ink/20 text-ink hover:border-[#0055FF] hover:text-[#0055FF]",
              )}
            >
              <span>Hombre</span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 font-mono text-[0.6rem]">
                Catálogo
              </span>
            </button>

            <button
              type="button"
              onClick={() => updateParams("audiencia", activeAudience === "mujer" ? null : "mujer")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider transition-all duration-200",
                activeAudience === "mujer"
                  ? "border-cochinilla bg-cochinilla text-paper shadow-sm"
                  : "border-ink/20 text-ink hover:border-cochinilla hover:text-cochinilla",
              )}
            >
              <Clock className="size-3.5" aria-hidden />
              <span>Mujer</span>
            </button>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-3 text-left">
            <div className="flex items-center gap-1.5 font-mono text-[0.62rem] font-extrabold uppercase tracking-wider text-[#0055FF]">
              <FaClock className="size-3 text-cochinilla shrink-0" aria-hidden />
              <span>Línea Mujer en Desarrollo</span>
            </div>
            <p className="mt-1 text-[0.7rem] leading-relaxed text-slate-600">
              La empresa se encuentra en desarrollo de prendas para mujer y se integrará más adelante. Actualmente todo nuestro stock corresponde al catálogo oficial de hombre.
            </p>
          </div>
        </div>
      </FilterSection>

      {/* Colores */}
      {available.colors.length > 0 && (
        <FilterSection title="Colores" defaultOpen>
          <div className="flex flex-wrap gap-2.5">
            {available.colors.map(({ name, swatch }) => {
              const isActive = activeColors.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => updateParams("color", name, true)}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className={cn(
                      "size-6 rounded-full ring-1 ring-offset-2 ring-offset-paper transition-all duration-200",
                      isActive ? "ring-cochinilla scale-110" : "ring-ink/20 hover:ring-cochinilla",
                    )}
                    style={{ backgroundColor: swatch }}
                  />
                  <span className="text-[0.58rem] font-medium text-taupe-600">{name}</span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}
    </div>
  );
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-ink/15 pb-4 pt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 text-left"
        aria-expanded={open}
      >
        <span className="text-xs font-bold text-ink">{title}</span>
        {open ? (
          <Minus className="size-3.5 text-taupe-500" aria-hidden />
        ) : (
          <Plus className="size-3.5 text-taupe-500" aria-hidden />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: ease.soft }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MobileFilterDrawerProps {
  available: AvailableFilters;
  categories?: CategoryRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterDrawer({
  available,
  categories = [],
  isOpen,
  onClose,
}: MobileFilterDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-ink/40"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: ease.luxe }}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-sm flex-col bg-paper"
          >
            <div className="flex items-center justify-between bg-cochinilla px-5 py-4 text-paper">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4" aria-hidden />
                <h2 className="font-mono text-xs font-extrabold uppercase tracking-widest">
                  Filtrar Prendas
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full bg-white/15 text-paper transition-colors hover:bg-white hover:text-cochinilla"
                aria-label="Cerrar filtros"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-safe">
              <CatalogFilters available={available} categories={categories} />
            </div>
            <div className="border-t border-ink/10 px-5 py-4 pb-safe">
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-full items-center justify-center rounded-full bg-cochinilla text-xs font-extrabold uppercase tracking-widest text-paper transition-colors hover:bg-cochinilla-deep"
              >
                Ver Resultados
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
