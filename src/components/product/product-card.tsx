"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Heart, ShoppingBag } from "lucide-react";
import type { ImageAsset, Product, ProductBadge } from "@/types/catalog";
import { formatPEN } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/components/favorites/favorites-provider";

const badgeStyles: Record<ProductBadge, { label: string; className: string }> = {
  nuevo: { label: "Nuevo", className: "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white" },
  "edicion-limitada": { label: "Edición Limitada", className: "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white" },
  mayorista: { label: "Mayorista B2B", className: "bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white" },
  esencial: { label: "Básico Ring", className: "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white" },
};

interface ProductCardProps {
  product: Product;
  /** Prioriza la carga de las imágenes visibles al inicio. */
  eager?: boolean;
}

export function ProductCard({ product, eager = false }: ProductCardProps) {
  const [colorIndex, setColorIndex] = useState(() => {
    const portadaSrc =
      typeof product.image.src === "string" ? product.image.src : null;
    if (portadaSrc && product.colorImages) {
      const matchedIdx = product.colors.findIndex(
        (c) => product.colorImages?.[c.name]?.primary?.src === portadaSrc,
      );
      if (matchedIdx >= 0) return matchedIdx;
    }
    return 0;
  });
  const [displayedAssets, setDisplayedAssets] = useState<{
    primary: ImageAsset;
    hover?: ImageAsset;
  }>(() => ({
    primary: product.image,
    hover: product.hoverImage,
  }));
  const [missingColorNotice, setMissingColorNotice] = useState<string | null>(null);
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

  const handleSelectColor = (index: number) => {
    setColorIndex(index);
    const chosen = product.colors[index];
    if (!chosen) return;

    const colorSet = product.colorImages?.[chosen.name];
    if (colorSet?.primary) {
      setDisplayedAssets({
        primary: colorSet.primary,
        hover: colorSet.hover,
      });
      setMissingColorNotice(null);
    } else if (colorSet?.hover) {
      setDisplayedAssets({
        primary: colorSet.hover,
        hover: undefined,
      });
      setMissingColorNotice(null);
    } else {
      // Mantiene las imágenes actuales que sí estaban visibles y muestra aviso amigable
      setMissingColorNotice(chosen.name);
    }
  };

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
            const primarySrc = displayedAssets.primary.src;
            const autoCloseupSrc =
              typeof primarySrc === "string" && primarySrc.endsWith("-model.png")
                ? primarySrc.replace("-model.png", "-closeup.png")
                : null;
            const hoverSrc = displayedAssets.hover?.src ?? autoCloseupSrc;
            const hoverAlt =
              displayedAssets.hover?.alt ?? `Vista cercana de ${product.name}`;
            const isPrimaryApiMedia =
              typeof primarySrc === "string" && primarySrc.startsWith("/api/media/");
            const isHoverApiMedia =
              typeof hoverSrc === "string" && hoverSrc.startsWith("/api/media/");

            return (
              <>
                <Image
                  src={primarySrc}
                  alt={displayedAssets.primary.alt}
                  fill
                  unoptimized={isPrimaryApiMedia}
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
                    unoptimized={isHoverApiMedia}
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
            "absolute left-2 top-2 z-20 flex size-7 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-110 active:scale-90 sm:left-2.5 sm:top-2.5 sm:size-9",
            favorited
              ? "bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white"
              : "bg-white/95 text-slate-800 hover:bg-white hover:text-[#DC2626]",
          )}
        >
          <Heart className={cn("size-3.5 sm:size-4", favorited && "fill-current")} aria-hidden />
        </button>

        {/* Insignias arriba a la derecha: "Envío 24Hrs" + Círculo de Descuento % */}
        <div className="pointer-events-none absolute right-1.5 top-2 z-10 flex flex-col items-end gap-1 sm:right-2.5 sm:top-3 sm:gap-1.5">
          <span className="rounded-full bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] px-2 py-0.5 text-[0.5rem] font-extrabold tracking-tight text-white shadow-md sm:px-3 sm:py-1 sm:text-[0.66rem]">
            Envío 24Hrs
          </span>

          {discount ? (
            <span className="bg-flow flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] font-mono text-[0.55rem] font-black text-white shadow-md shadow-rose-500/25 sm:size-9 sm:text-xs">
              -{discount}%
            </span>
          ) : badge ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[0.5rem] font-extrabold uppercase tracking-wider shadow-xs sm:px-2.5 sm:text-[0.55rem]",
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

        {/* Aviso flotante cuando el color seleccionado aún no tiene fotos cargadas */}
        {missingColorNotice ? (
          <div
            role="status"
            className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex items-center justify-center gap-1.5 rounded-xl border border-amber-300/70 bg-slate-950/85 px-2.5 py-1.5 text-center text-[0.62rem] font-bold leading-tight text-amber-100 shadow-lg backdrop-blur-md transition-opacity duration-200 group-hover/product:opacity-0"
          >
            <Clock className="size-3 shrink-0 text-amber-300" aria-hidden />
            <span className="line-clamp-2">
              Foto en color {missingColorNotice} en proceso de subida
            </span>
          </div>
        ) : null}

        {/* Barra inferior redondeada "Compra Rápida" al pasar el cursor */}
        <Link
          href={productHref}
          className="bg-flow absolute inset-x-2 bottom-2 z-10 flex h-10 translate-y-[130%] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB] text-xs font-extrabold tracking-wide text-white shadow-lg transition-all duration-300 ease-out group-focus-within/product:translate-y-0 group-hover/product:translate-y-0 hover:from-[#DC2626] hover:via-[#B91C1C] hover:to-[#EF233C]"
        >
          <ShoppingBag className="size-3.5" aria-hidden />
          <span>Compra Rápida</span>
        </Link>
      </div>

      {/* Información centrada con tipografía limpia y colores modernos */}
      <div className="mt-2 flex flex-col items-center px-1 text-center sm:mt-3 sm:px-2">
        {product.category ? (
          <span className="mb-0.5 inline-flex items-center rounded-full border border-red-100 bg-red-50 px-2 py-0.5 font-mono text-[0.5rem] font-extrabold uppercase tracking-wider text-[#DC2626] sm:mb-1 sm:px-2.5 sm:text-[0.58rem]">
            {product.category}
          </span>
        ) : null}

        <h3
          id={`${product.id}-name`}
          className="line-clamp-1 w-full text-[0.7rem] font-extrabold uppercase tracking-tight text-slate-900 sm:text-[0.82rem]"
        >
          <Link
            href={productHref}
            className="transition-colors hover:text-[#1E40AF] focus-visible:outline-none focus-visible:underline"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-0.5 font-mono text-[0.56rem] text-slate-400 sm:text-[0.66rem]">
          SKU: {skuCode}
        </p>

        {/* Precio actual + Precio anterior tachado */}
        <div className="mt-1 flex flex-wrap items-baseline justify-center gap-1.5 sm:mt-1.5 sm:gap-2">
          <p className="text-xs font-black tabular-nums text-[#1E40AF] sm:text-[1rem]">
            {formatPEN(product.price)}
          </p>
          {product.compareAtPrice ? (
            <p className="text-[0.62rem] tabular-nums text-slate-400 line-through sm:text-[0.72rem]">
              {formatPEN(product.compareAtPrice)}
            </p>
          ) : null}
        </div>

        {/* Cantidad de colores disponibles + Selector de color */}
        <p className="mt-0.5 text-[0.58rem] font-semibold text-slate-500 sm:mt-1 sm:text-[0.68rem]">
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
                handleSelectColor(i);
              }}
              className={cn(
                "size-3.5 rounded-full ring-1 ring-offset-1 ring-offset-white transition-transform duration-200 hover:scale-110",
                i === colorIndex ? "ring-[#2563EB] scale-110" : "ring-slate-300",
              )}
              style={{ backgroundColor: c.swatch }}
            />
          ))}
        </div>

        {missingColorNotice ? (
          <p className="mt-1.5 rounded-lg bg-amber-50 px-2 py-0.5 text-[0.62rem] font-semibold text-amber-800 border border-amber-200/80">
            Color {missingColorNotice}: imagen en proceso de subida
          </p>
        ) : null}

        {/* Etiqueta B2B Mayorista Redondeada */}
        {product.wholesale ? (
          <div className="mt-2.5 w-full rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 py-1 text-[0.65rem] font-bold text-[#1E40AF]">
            Por mayor: <span className="font-black tabular-nums text-[#DC2626]">{formatPEN(product.wholesale.unitPrice)}</span>{" "}
            <span className="text-slate-600">(mín. {product.wholesale.minQuantity} uds.)</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}
