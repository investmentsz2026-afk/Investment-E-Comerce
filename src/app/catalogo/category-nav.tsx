"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FaBoxesStacked } from "react-icons/fa6";
import type { CategoryRecord } from "@/types/catalog";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: CategoryRecord[];
}

/** Navegación horizontal de categorías con acceso directo a Mayoristas B2B y scroll en mobile. */
export function CategoryNav({ categories }: CategoryNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isWholesaleActive =
    searchParams.get("mayorista") === "1" || searchParams.get("modalidad") === "mayorista";
  const isAllActive = pathname === "/catalogo" && !isWholesaleActive;

  return (
    <nav aria-label="Categorías" className="no-scrollbar w-full max-w-full overflow-x-auto py-1 sm:py-2">
      <ul className="flex items-center gap-1.5 border-b border-slate-200/80 pb-2 sm:gap-2 sm:pb-3">
        <li>
          <Link
            href="/catalogo"
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-wider transition-all duration-200 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-xs",
              isAllActive
                ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] text-white shadow-sm shadow-red-500/25"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#DC2626]/50 hover:bg-red-50/50 hover:text-[#DC2626]",
            )}
          >
            Todo
          </Link>
        </li>
        <li>
          <Link
            href="/catalogo?mayorista=1"
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-wider transition-all duration-200 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-xs",
              isWholesaleActive
                ? "border-[#1D4ED8] bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB] text-white shadow-sm shadow-blue-500/25"
                : "border-blue-200 bg-blue-50/70 text-[#1D4ED8] hover:border-[#1D4ED8] hover:bg-[#1D4ED8] hover:text-white",
            )}
          >
            <FaBoxesStacked className="size-3 sm:size-3.5" aria-hidden />
            <span>Mayoristas</span>
          </Link>
        </li>
        {categories.map((cat) => {
          const href = isWholesaleActive
            ? `/catalogo/${cat.slug}?mayorista=1`
            : `/catalogo/${cat.slug}`;
          const isActive = pathname === `/catalogo/${cat.slug}`;
          return (
            <li key={cat.id}>
              <Link
                href={href}
                className={cn(
                  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-wider transition-all duration-200 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-xs",
                  isActive
                    ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] text-white shadow-sm shadow-red-500/25"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#DC2626]/50 hover:bg-red-50/50 hover:text-[#DC2626]",
                )}
              >
                <span>{cat.name}</span>
                {cat.productCount !== undefined && cat.productCount > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 font-mono text-[0.54rem] font-black sm:text-[0.6rem]",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {cat.productCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
