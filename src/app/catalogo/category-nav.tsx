"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CategoryRecord } from "@/types/catalog";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: CategoryRecord[];
}

/** Navegación horizontal de categorías con scroll en mobile. */
export function CategoryNav({ categories }: CategoryNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Categorías" className="no-scrollbar w-full max-w-full overflow-x-auto py-2">
      <ul className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <li>
          <Link
            href="/catalogo"
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-all duration-200",
              pathname === "/catalogo"
                ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] text-white shadow-sm shadow-red-500/25"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#DC2626]/50 hover:bg-red-50/50 hover:text-[#DC2626]",
            )}
          >
            Todo
          </Link>
        </li>
        {categories.map((cat) => {
          const href = `/catalogo/${cat.slug}`;
          const isActive = pathname === href;
          return (
            <li key={cat.id}>
              <Link
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-all duration-200",
                  isActive
                    ? "border-[#DC2626] bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] text-white shadow-sm shadow-red-500/25"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#DC2626]/50 hover:bg-red-50/50 hover:text-[#DC2626]",
                )}
              >
                <span>{cat.name}</span>
                {cat.productCount !== undefined && cat.productCount > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 font-mono text-[0.6rem] font-black",
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
