"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { SortOption } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { ArrowDownUp } from "lucide-react";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "relevancia", label: "Relevancia" },
  { value: "recientes", label: "Más recientes" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "nombre", label: "Nombre A–Z" },
];

interface CatalogSortProps {
  className?: string;
  total?: number;
}

/** Selector de ordenamiento que sincroniza con URL params. */
export function CatalogSort({ className, total }: CatalogSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("orden") as SortOption) || "relevancia";

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "relevancia") {
        params.delete("orden");
      } else {
        params.set("orden", value);
      }
      params.delete("pagina"); // Reset page on sort change
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {total !== undefined && (
        <p className="hidden text-sm text-taupe-500 lg:block">
          <span className="font-medium tabular-nums text-ink">{total}</span>{" "}
          {total === 1 ? "producto" : "productos"}
        </p>
      )}
      <div className="relative flex items-center gap-1.5 sm:gap-2">
        <ArrowDownUp className="size-3.5 shrink-0 text-taupe-400" aria-hidden />
        <select
          value={current}
          onChange={(e) => handleChange(e.target.value)}
          className="max-w-[130px] truncate cursor-pointer appearance-none border-0 bg-transparent py-1 pr-5 text-[0.72rem] font-medium uppercase tracking-[0.12em] text-ink outline-none focus-visible:ring-2 focus-visible:ring-cochinilla-bright sm:max-w-none sm:pr-6 sm:tracking-[0.14em]"
          aria-label="Ordenar productos"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
