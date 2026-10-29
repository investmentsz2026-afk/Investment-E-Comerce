"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CatalogBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/** Ruta de navegación editorial con microdata de Schema.org. */
export function CatalogBreadcrumbs({ items, className }: CatalogBreadcrumbsProps) {
  return (
    <nav aria-label="Ruta de navegación" className={cn("py-4", className)}>
      <ol
        className="flex flex-wrap items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-taupe-500"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        <li
          className="flex items-center gap-1.5"
          itemScope
          itemProp="itemListElement"
          itemType="https://schema.org/ListItem"
        >
          <Link
            href="/"
            className="flex items-center gap-1 transition-colors duration-300 hover:text-ink"
            itemProp="item"
          >
            <Home className="size-3.5" aria-hidden />
            <span itemProp="name">Inicio</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>

        {items.map((item, i) => (
          <li
            key={item.label}
            className="flex items-center gap-1.5"
            itemScope
            itemProp="itemListElement"
            itemType="https://schema.org/ListItem"
          >
            <ChevronRight className="size-3 text-taupe-300" aria-hidden />
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors duration-300 hover:text-ink"
                itemProp="item"
              >
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span className="text-ink" itemProp="name" aria-current="page">
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(i + 2)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
