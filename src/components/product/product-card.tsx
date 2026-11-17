"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product, ProductBadge } from "@/types/catalog";
import { formatPEN } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/components/favorites/favorites-provider";

const badgeStyles: Record<ProductBadge, { label: string; className: string }> = {
  nuevo: { label: "Nuevo", className: "bg-[#0055FF] text-white" },
  "edicion-limitada": { label: "Edición Limitada", className: "bg-[#0055FF] text-white" },
  mayorista: { label: "Mayorista B2B", className: "bg-[#EF233C] text-white" },
  esencial: { label: "Básico Ring", className: "bg-[#0055FF] text-white" },
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
  const skuCode = String(product.id).replace(/^prod-/, "507090").toUpperCase();

  return (
    <article
      className="group/product flex flex-col overflow-hidden rounded-2xl border border-blue-100/90 bg-white p-2 pb-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#0055FF]/40 hover:shadow-[0_14px_34px_-8px_rgba(0,85,255,0.2)]"
      aria-labelledby={`${product.id}-name`}
      data-testid={`product-card-${product.slug}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-100">
        {/* Enlace principal sobre la imagen hacia la página real de detalle (Cambia de Modelo -> Solo Prenda al pasar el mouse) */}
        <Link
          href={productHref}
          className="absolute inset-0 z-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0055FF]"
          aria-label={`Ver detalle de ${product.name}`}
        >
          {(() => {
            const primarySrc = product.image.src;
            const autoCloseupSrc =
              typeof primarySrc === "string" && primarySrc.endsWith("-model.png")
                ? primarySrc.replace("-model.png", "-closeup.png")
                : null;
            const hoverSrc = product.hoverImage?.src ?? autoCloseupSrc;
            const hoverAlt = product.hoverImage?.alt ?? `Vista cercana de ${product.name}`;

            return (
              <>
                <Image
                  src={primarySrc}
                  alt={product.image.alt}
                  fill
                  loading={eager ? "eager" : "lazy"}
                  sizes="(min-width: 1280px) 24vw, (min-width: 768px) 32vw, 48vw"
                  placeholder={typeof primarySrc === "string" ? "empty" : "blur"}
                  className={cn(
                    "object-cover transition-all duration-500 ease-out",
                    hoverSrc
                      ? "opacity-100 group-hover/product:scale-105 group-hover/product:opacity-0"
                      : "group-hover/product:scale-108",
                  )}
                />
                {hoverSrc ? (
                  <Image
                    src={hoverSrc}
                    alt={hoverAlt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1280px) 24vw, (min-width: 768px) 32vw, 48vw"
                    placeholder={typeof hoverSrc === "string" ? "empty" : "blur"}
                    className="scale-105 object-cover opacity-0 transition-all duration-500 ease-out group-hover/product:scale-100 group-hover/product:opacity-100"
                  />
                ) : null}
              </>
            );
          })()}
        </Link>

        {/* Botón de favoritos arriba a la izquierda */}
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
            "absolute left-2.5 top-2.5 z-20 flex size-8 sm:size-9 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-110 active:scale-90",
            favorited
              ? "bg-[#EF233C] text-white"
              : "bg-white/95 text-slate-800 hover:bg-white hover:text-[#EF233C]",
          )}
        >
          <Heart className={cn("size-4", favorited && "fill-current")} aria-hidden />
        </button>

        {/* Insignias relucientes arriba a la derecha: "Envío 24Hrs" + Círculo de Descuento % */}
        <div className="pointer-events-none absolute right-2 top-2.5 z-10 flex flex-col items-end gap-1.5 sm:right-2.5 sm:top-3">
          <span className="rounded-full bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] px-2.5 py-1 text-[0.6rem] font-extrabold tracking-tight text-white shadow-md sm:px-3 sm:text-[0.66rem]">
            Envío 24Hrs
          </span>

          {discount ? (
            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#EF233C] to-[#91151B] font-mono text-[0.65rem] font-black text-white shadow-md sm:size-9 sm:text-xs">
              -{discount}%
            </span>
          ) : badge ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 font-mono text-[0.55rem] font-extrabold uppercase tracking-wider shadow-xs",
                badge.className,
              )}
            >
              {badge.label}
            </span>
          ) : null}
        </div>

        {product.soldOut ? (
          <span className="pointer-events-none absolute bottom-12 left-2.5 z-10 rounded-full bg-slate-900 px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-white">
            Agotado
          </span>
        ) : null}

        {/* Barra inferior redondeada "Compra Rápida" al pasar el cursor */}
        <Link
          href={productHref}
          className="absolute inset-x-2 bottom-2 z-10 flex h-10 translate-y-[130%] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] text-xs font-extrabold tracking-wide text-white shadow-lg transition-transform duration-300 ease-out group-focus-within/product:translate-y-0 group-hover/product:translate-y-0 hover:from-[#EF233C] hover:to-[#B91C24]"
        >
          <ShoppingBag className="size-3.5" aria-hidden />
          <span>Compra Rápida</span>
        </Link>
      </div>

      {/* Información centrada estilo Pionier con colores relucientes */}
      <div className="mt-3 flex flex-col items-center px-2 text-center">
        <h3
          id={`${product.id}-name`}
          className="line-clamp-1 w-full text-xs font-extrabold uppercase tracking-tight text-slate-900 sm:text-[0.82rem]"
        >
          <Link
            href={productHref}
            className="transition-colors hover:text-[#0055FF] focus-visible:outline-none focus-visible:underline"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-0.5 font-mono text-[0.66rem] text-slate-400">
          SKU: {skuCode}
        </p>

        {/* Precio actual + Precio anterior tachado */}
        <div className="mt-1.5 flex flex-wrap items-baseline justify-center gap-2">
          <p className="text-sm font-black tabular-nums text-[#0055FF] sm:text-[1rem]">
            {formatPEN(product.price)}
          </p>
          {product.compareAtPrice ? (
            <p className="text-[0.72rem] tabular-nums text-slate-400 line-through">
              Antes {formatPEN(product.compareAtPrice)}
            </p>
          ) : null}
        </div>

        {/* Cantidad de colores disponibles + Selector de color */}
        <p className="mt-1 text-[0.68rem] font-semibold text-slate-500">
          {product.colors.length}{" "}
          {product.colors.length === 1 ? "Color disponible" : "Colores disponibles"}
          <span className="sr-only"> — Color seleccionado: {color?.name}</span>
        </p>

        <div
          className="mt-2 flex items-center justify-center gap-1.5"
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
                "size-3.5 rounded-full ring-1 ring-offset-1 ring-offset-white transition-transform duration-200 hover:scale-110",
                i === colorIndex ? "ring-[#0055FF] scale-110" : "ring-slate-300",
              )}
              style={{ backgroundColor: c.swatch }}
            />
          ))}
        </div>

        {/* Etiqueta B2B Mayorista Redondeada */}
        {product.wholesale ? (
          <div className="mt-2.5 w-full rounded-xl border border-blue-100 bg-blue-50/70 px-2.5 py-1 text-[0.65rem] font-bold text-[#0055FF]">
            Por mayor: <span className="font-black tabular-nums text-[#B91C24]">{formatPEN(product.wholesale.unitPrice)}</span>{" "}
            <span className="text-slate-600">(mín. {product.wholesale.minQuantity} uds.)</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}
