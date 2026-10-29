"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  className?: string;
}

/** Paginación editorial con sincronización de URL. */
export function CatalogPagination({ currentPage, totalPages, className }: CatalogPaginationProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("pagina");
    } else {
      params.set("pagina", String(page));
    }
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav aria-label="Paginación del catálogo" className={cn("flex items-center justify-center gap-1", className)}>
      {/* Anterior */}
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="flex size-10 items-center justify-center text-taupe-500 transition-colors duration-300 hover:text-ink"
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className="flex size-10 items-center justify-center text-taupe-200" aria-disabled>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {/* Números */}
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="flex size-10 items-center justify-center text-taupe-400">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            className={cn(
              "flex size-10 items-center justify-center font-mono text-xs transition-colors duration-300",
              page === currentPage
                ? "bg-ink text-paper"
                : "text-taupe-500 hover:bg-bone hover:text-ink",
            )}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Página ${page}`}
          >
            {page}
          </Link>
        ),
      )}

      {/* Siguiente */}
      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="flex size-10 items-center justify-center text-taupe-500 transition-colors duration-300 hover:text-ink"
          aria-label="Página siguiente"
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className="flex size-10 items-center justify-center text-taupe-200" aria-disabled>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}

/** Genera la lista de páginas visibles con elipsis. */
function getVisiblePages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}
