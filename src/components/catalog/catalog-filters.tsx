"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import type { AvailableFilters, Audience } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { PriceRangeForm } from "./price-range-form";

interface CatalogFiltersProps {
  available: AvailableFilters;
  className?: string;
}

/** Panel de filtros colapsable para desktop y mobile. */
export function CatalogFilters({ available, className }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Leer filtros activos de URL
  const activeAudience = searchParams.get("audiencia") as Audience | null;
  const activeSizes = searchParams.getAll("talla");
  const activeColors = searchParams.getAll("color");
  const activeNovedades = searchParams.get("novedades") === "1";
  const activeMayorista = searchParams.get("mayorista") === "1";

  const updateParams = useCallback(
    (key: string, value: string | null, isArray = false) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("pagina"); // Reset page

      if (isArray) {
        const current = params.getAll(key);
        if (value && current.includes(value)) {
          // Remove
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

  const activeDisponible = searchParams.get("disponible") === "1";
  const activePrecioMin = searchParams.get("precio_min");
  const activePrecioMax = searchParams.get("precio_max");

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
    <div className={cn("space-y-6", className)}>
      {/* Header + Clear */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-cochinilla transition-colors hover:text-cochinilla-deep"
        >
          <X className="size-3" aria-hidden />
          Limpiar filtros
        </button>
      )}

      {/* Audiencia */}
      {available.audiences.length > 1 && (
        <FilterSection title="Género">
          <div className="flex flex-wrap gap-2">
            {available.audiences.map(({ value, count }) => {
              const isActive = activeAudience === value;
              const label = value === "mujer" ? "Mujer" : value === "hombre" ? "Hombre" : "Unisex";
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateParams("audiencia", isActive ? null : value)}
                  className={cn(
                    "flex items-center gap-1.5 border px-3 py-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] transition-all duration-300",
                    isActive
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/15 text-ink hover:border-ink",
                  )}
                >
                  {label}
                  <span className="font-mono text-[0.6rem] opacity-50">{count}</span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Tallas */}
      {available.sizes.length > 0 && (
        <FilterSection title="Talla">
          <div className="flex flex-wrap gap-1.5">
            {available.sizes.map((size) => {
              const isActive = activeSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateParams("talla", size, true)}
                  className={cn(
                    "flex h-8 min-w-10 items-center justify-center border px-2 font-mono text-[0.65rem] transition-all duration-300",
                    isActive
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/15 text-ink hover:border-ink",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Colores */}
      {available.colors.length > 0 && (
        <FilterSection title="Color">
          <div className="flex flex-wrap gap-2.5">
            {available.colors.map(({ name, swatch }) => {
              const isActive = activeColors.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => updateParams("color", name, true)}
                  className={cn(
                    "flex flex-col items-center gap-1.5",
                  )}
                >
                  <span
                    className={cn(
                      "size-6 rounded-full ring-1 ring-offset-2 ring-offset-paper transition-all duration-300",
                      isActive ? "ring-ink scale-110" : "ring-ink/15 hover:ring-ink/40",
                    )}
                    style={{ backgroundColor: swatch }}
                  />
                  <span className="text-[0.55rem] text-taupe-500">{name}</span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Especiales */}
      <FilterSection title="Especial">
        <div className="flex flex-col gap-2.5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={activeNovedades}
              onChange={() => updateParams("novedades", activeNovedades ? null : "1")}
              className="size-4 cursor-pointer accent-cochinilla"
            />
            <span className="text-sm text-ink">Solo novedades</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={activeMayorista}
              onChange={() => updateParams("mayorista", activeMayorista ? null : "1")}
              className="size-4 cursor-pointer accent-cochinilla"
            />
            <span className="text-sm text-ink">Disponible por mayor</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={activeDisponible}
              onChange={() => updateParams("disponible", activeDisponible ? null : "1")}
              className="size-4 cursor-pointer accent-cochinilla"
            />
            <span className="text-sm text-ink">Solo con stock</span>
          </label>
        </div>
      </FilterSection>

      {/* Rango de precio (en soles) */}
      {available.priceRange.max > 0 && (
        <FilterSection title="Precio">
          {/* La clave reinicia los campos cuando cambian los parámetros de la URL */}
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
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sección colapsable
// ──────────────────────────────────────────────────────────────

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-t border-ink/10 pt-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
        aria-expanded={open}
      >
        <span className="eyebrow text-taupe-600">{title}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-taupe-400 transition-transform duration-300",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: ease.soft }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Mobile filter drawer
// ──────────────────────────────────────────────────────────────

interface MobileFilterDrawerProps {
  available: AvailableFilters;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterDrawer({ available, isOpen, onClose }: MobileFilterDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-ink/40"
            onClick={onClose}
            aria-hidden
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: ease.luxe }}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-sm flex-col bg-paper"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-taupe-500" aria-hidden />
                <h2 className="eyebrow text-ink">Filtros</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 items-center justify-center text-taupe-500 transition-colors hover:text-ink"
                aria-label="Cerrar filtros"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-safe">
              <CatalogFilters available={available} />
            </div>
            <div className="border-t border-ink/10 px-5 py-4 pb-safe">
              <button
                type="button"
                onClick={onClose}
                className="flex h-12 w-full items-center justify-center bg-ink text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
              >
                Ver resultados
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
