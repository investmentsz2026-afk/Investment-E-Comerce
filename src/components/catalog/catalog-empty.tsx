"use client";

import { SearchX, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";

interface CatalogEmptyProps {
  title?: string;
  message?: string;
  /** Sugerencia o acción. */
  showBrowseLink?: boolean;
}

/** Estado vacío elegante cuando no hay productos que mostrar. */
export function CatalogEmpty({
  title = "Sin resultados",
  message = "No encontramos productos que coincidan con tu búsqueda o filtros. Intenta ajustar tus criterios.",
  showBrowseLink = true,
}: CatalogEmptyProps) {
  return (
    <Reveal className="flex flex-col items-center py-20 text-center lg:py-32">
      <div className="flex size-20 items-center justify-center rounded-full bg-bone text-taupe-400">
        <SearchX className="size-8" aria-hidden />
      </div>
      <h2 className="mt-8 font-display text-display-sm text-ink">{title}</h2>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-taupe-500">{message}</p>
      {showBrowseLink && (
        <Link
          href="/catalogo"
          className="group/link mt-8 inline-flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-cochinilla transition-colors duration-300 hover:text-cochinilla-deep"
        >
          Ver todo el catálogo
          <ArrowRight className="size-3.5 transition-transform duration-500 ease-luxe group-hover/link:translate-x-1" />
        </Link>
      )}
    </Reveal>
  );
}
