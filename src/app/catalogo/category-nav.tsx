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
    <nav aria-label="Categorías" className="no-scrollbar -mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
      <ul className="flex gap-1 border-b border-ink/10">
        <li>
          <Link
            href="/catalogo"
            className={cn(
              "relative block whitespace-nowrap px-4 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300",
              pathname === "/catalogo"
                ? "text-ink after:absolute after:inset-x-4 after:-bottom-px after:h-0.5 after:bg-ink"
                : "text-taupe-400 hover:text-ink",
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
                  "relative block whitespace-nowrap px-4 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300",
                  isActive
                    ? "text-ink after:absolute after:inset-x-4 after:-bottom-px after:h-0.5 after:bg-ink"
                    : "text-taupe-400 hover:text-ink",
                )}
              >
                {cat.name}
                {cat.productCount !== undefined && cat.productCount > 0 && (
                  <span className="ml-1 font-mono text-[0.58rem] opacity-50">{cat.productCount}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
