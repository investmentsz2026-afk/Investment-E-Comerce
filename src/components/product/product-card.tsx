"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import type { Product, ProductBadge } from "@/types/catalog";
import { formatPEN } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/components/favorites/favorites-provider";

const badgeStyles: Record<ProductBadge, { label: string; className: string }> = {
  nuevo: { label: "Nuevo", className: "bg-paper text-ink" },
  "edicion-limitada": { label: "Edición limitada", className: "bg-ink text-paper" },
  mayorista: { label: "Disponible por mayor", className: "bg-cochinilla text-paper" },
  esencial: { label: "Esencial", className: "bg-bone text-ink" },
};

const audienceLabel: Record<Product["audience"], string> = {
  mujer: "Mujer",
  hombre: "Hombre",
  unisex: "Unisex",
};

interface ProductCardProps {
  product: Product;
  /** Prioriza la carga de las imágenes visibles al inicio. */
  eager?: boolean;
}

export function ProductCard({ product, eager = false }: ProductCardProps) {
  const [colorIndex, setColorIndex] = useState(0);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(product.slug);

  const color = product.colors[colorIndex] ?? product.colors[0];
  const badge = product.badge ? badgeStyles[product.badge] : null;
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  const productHref = `/producto/${product.slug}`;

  return (
    <article
      className="group/product flex flex-col"
      aria-labelledby={`${product.id}-name`}
      data-testid={`product-card-${product.slug}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-taupe-100">
        {/* Enlace principal sobre la imagen hacia la página real de detalle */}
        <Link
          href={productHref}
          className="absolute inset-0 z-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          aria-label={`Ver detalle de ${product.name}`}
        >
          <Image
            src={product.image.src}
            alt={product.image.alt}
            fill
            loading={eager ? "eager" : "lazy"}
            sizes="(min-width: 1280px) 24vw, (min-width: 768px) 32vw, 48vw"
            placeholder={typeof product.image.src === "string" ? "empty" : "blur"}
            className="object-cover transition-transform duration-[1.4s] ease-luxe group-hover/product:scale-[1.06]"
          />
        </Link>

        {badge || discount ? (
          <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
            {badge ? (
              <span
                className={cn(
                  "px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] sm:px-2.5 sm:text-[0.6rem]",
                  badge.className,
                )}
              >
                {badge.label}
              </span>
            ) : null}
            {discount ? (
              <span className="bg-cochinilla px-2 py-1 font-mono text-[0.58rem] tracking-[0.14em] text-paper sm:px-2.5 sm:text-[0.6rem]">
                −{discount}%
              </span>
            ) : null}
          </div>
        ) : null}

        {product.soldOut ? (
          <span className="pointer-events-none absolute bottom-3 left-3 z-10 bg-ink px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper">
            Agotado
          </span>
        ) : null}

        {/* Botón de favoritos independiente del enlace del producto */}
        <button
          type="button"
          data-testid={`favorite-toggle-${product.slug}`}
          aria-pressed={favorited}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggleFavorite(product.slug, product.name);
          }}
          aria-label={
            favorited
              ? `Quitar ${product.name} de favoritos`
              : `Guardar ${product.name} en favoritos`
          }
          className={cn(
            "absolute right-2.5 top-2.5 z-20 flex size-9 items-center justify-center rounded-full transition-all duration-300 ease-luxe hover:scale-110 active:scale-90 sm:right-3 sm:top-3",
            favorited
              ? "bg-cochinilla text-paper shadow-sm"
              : "bg-paper/90 text-ink hover:bg-paper",
          )}
        >
          <Heart className={cn("size-4", favorited && "fill-current")} aria-hidden />
        </button>

        {/* Panel rápido en escritorio: emerge al pasar el cursor y lleva al detalle */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 hidden translate-y-[calc(100%+1rem)] bg-paper/95 p-4 transition-transform duration-700 ease-luxe group-focus-within/product:translate-y-0 group-hover/product:translate-y-0 lg:block">
          <p className="eyebrow text-taupe-500">Tallas</p>
          <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Tallas disponibles">
            {product.sizes.map((size) => (
              <li
                key={size}
                className="flex h-7 min-w-9 items-center justify-center border border-ink/15 px-2 font-mono text-[0.65rem] text-ink"
              >
                {size}
              </li>
            ))}
          </ul>
          <Link
            href={productHref}
            className="pointer-events-auto mt-3.5 flex h-10 w-full items-center justify-center gap-2 bg-ink text-[0.65rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
          >
            Ver producto
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-[0.6rem] text-taupe-500">
            {audienceLabel[product.audience]} · {product.category}
          </p>
          <h3
            id={`${product.id}-name`}
            className="mt-1.5 truncate text-sm font-medium text-ink sm:text-[0.95rem]"
          >
            <Link
              href={productHref}
              className="transition-colors hover:text-cochinilla focus-visible:outline-none focus-visible:underline"
            >
              {product.name}
            </Link>
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium tabular-nums text-ink sm:text-[0.95rem]">
            {formatPEN(product.price)}
          </p>
          {product.compareAtPrice ? (
            <p className="text-xs tabular-nums text-taupe-400 line-through">
              {formatPEN(product.compareAtPrice)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-2"
          role="radiogroup"
          aria-label={`Color de ${product.name}`}
        >
          {product.colors.map((c, i) => (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={i === colorIndex}
              aria-label={c.name}
              title={c.name}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setColorIndex(i);
              }}
              className={cn(
                "size-4 rounded-full ring-1 ring-offset-2 ring-offset-paper transition-[box-shadow,transform] duration-300 hover:scale-110",
                i === colorIndex ? "ring-ink" : "ring-ink/15",
              )}
              style={{ backgroundColor: c.swatch }}
            />
          ))}
        </div>
        <p className="truncate text-xs text-taupe-500">
          <span className="sr-only">Color seleccionado: </span>
          {color?.name}
          <span className="hidden sm:inline"> · {product.sizes.length} tallas</span>
        </p>
      </div>

      {product.wholesale ? (
        <p className="mt-3 border-t border-ink/10 pt-3 text-xs text-cochinilla">
          Por mayor desde{" "}
          <span className="font-medium tabular-nums">{formatPEN(product.wholesale.unitPrice)}</span>
          <span className="text-taupe-500"> · mín. {product.wholesale.minQuantity} uds.</span>
        </p>
      ) : null}

      <div className="mt-3 pt-1 lg:hidden">
        <Link
          href={productHref}
          className="flex h-9 w-full items-center justify-center gap-1.5 border border-ink/20 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
        >
          Ver producto
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
