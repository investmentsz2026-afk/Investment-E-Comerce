"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Loader2,
  ShoppingBag,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { useCart } from "@/components/cart/cart-provider";
import { formatPEN } from "@/lib/format";

export function FavoritesView({ isAccountPage = false }: { isAccountPage?: boolean }) {
  const { items, count, isHydrating, removeFavorite, snapshot } = useFavorites();
  const { addItem, pendingVariantId } = useCart();
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});
  const [removingSlug, setRemovingSlug] = useState<string | null>(null);

  if (isHydrating) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-taupe-400" />
          <p className="eyebrow text-xs text-taupe-500">Cargando tus favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="favorites-container">
      {/* Banner para visitantes no autenticados */}
      {!snapshot.isAuthenticated && (
        <div className="flex flex-col gap-3 border border-ink/10 bg-taupe-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Heart className="size-5 shrink-0 text-cochinilla mt-0.5" aria-hidden />
            <div>
              <p className="text-sm font-medium text-ink">
                Tus favoritos están guardados temporalmente en este dispositivo
              </p>
              <p className="mt-1 text-xs text-taupe-600">
                Inicia sesión o regístrate para conservarlos de forma permanente y acceder a ellos desde cualquier pantalla.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
            <Link
              href="/iniciar-sesion?next=/cuenta/favoritos"
              className="bg-ink px-3.5 py-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-cochinilla"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro?next=/cuenta/favoritos"
              className="border border-ink/20 px-3.5 py-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-ink/5"
            >
              Registrarse
            </Link>
          </div>
        </div>
      )}

      {/* Título de la vista */}
      <div className="flex flex-col gap-1 border-b border-ink/10 pb-5 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-ink">
            {isAccountPage ? "Mis Prendas Favoritas" : "Prendas Guardadas"}
          </h2>
          <p className="mt-1 text-xs text-taupe-500">
            {count === 0
              ? "No tienes prendas guardadas en tu selección."
              : `${count} ${count === 1 ? "prenda guardada" : "prendas guardadas"} en tu lista.`}
          </p>
        </div>
        {count > 0 && (
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-cochinilla underline-offset-4 hover:underline"
          >
            Explorar más en el catálogo <ArrowRight className="size-3" />
          </Link>
        )}
      </div>

      {/* Lista vacía */}
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-ink/15 p-12 text-center sm:p-16">
          <div className="flex size-14 items-center justify-center rounded-full bg-taupe-100 text-taupe-400">
            <Heart className="size-6" />
          </div>
          <h3 className="mt-4 font-display text-lg text-ink">Tu lista de favoritos está vacía</h3>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-taupe-500">
            Explora nuestra colección de sastrería y esenciales textiles contemporáneos. Presiona el ícono del corazón en cualquier prenda para guardarla aquí.
          </p>
          <Link
            href="/catalogo"
            className="mt-6 inline-flex items-center gap-2 bg-ink px-6 py-3 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla"
          >
            Explorar Catálogo Completo
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        /* Cuadrícula de favoritos */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const chosenVariantId =
              selectedVariants[item.productId] ?? item.defaultVariant?.id ?? null;
            const chosenVariant =
              item.variants.find((v) => v.id === chosenVariantId) ?? item.defaultVariant;
            const isAdding = chosenVariant !== null && pendingVariantId === chosenVariant.id;
            const isRemoving = removingSlug === item.slug;

            return (
              <article
                key={item.productId}
                data-testid={`favorite-card-${item.slug}`}
                className="flex flex-col border border-ink/10 bg-paper transition-shadow hover:shadow-sm"
              >
                {/* Imagen del producto con enlace */}
                <div className="relative aspect-[3/4] overflow-hidden bg-taupe-100">
                  <Link href={`/producto/${item.slug}`} className="block h-full w-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </Link>

                  {/* Estado de stock */}
                  <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1">
                    {!item.inStock ? (
                      <span className="bg-ink px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-paper">
                        Agotado
                      </span>
                    ) : item.totalStock <= 5 ? (
                      <span className="bg-amber-800 px-2 py-0.5 font-mono text-[0.58rem] tracking-wider text-paper">
                        Últimas {item.totalStock} uds.
                      </span>
                    ) : (
                      <span className="bg-paper/95 px-2 py-0.5 font-mono text-[0.58rem] text-emerald-800">
                        En stock
                      </span>
                    )}

                    {snapshot.isWholesaleAuthorized && item.isWholesaleProduct && (
                      <span className="bg-emerald-800 px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-paper">
                        B2B Mayorista
                      </span>
                    )}
                  </div>

                  {/* Botón para quitar de favoritos */}
                  <button
                    type="button"
                    disabled={isRemoving}
                    data-testid={`remove-favorite-${item.slug}`}
                    onClick={async () => {
                      setRemovingSlug(item.slug);
                      await removeFavorite(item.slug);
                      setRemovingSlug(null);
                    }}
                    aria-label={`Quitar ${item.name} de favoritos`}
                    className="absolute right-2.5 top-2.5 z-10 flex size-8 items-center justify-center rounded-full bg-paper/90 text-taupe-600 shadow-sm transition-transform hover:scale-110 hover:text-cochinilla active:scale-95 disabled:opacity-50"
                  >
                    {isRemoving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </button>
                </div>

                {/* Detalles y precios */}
                <div className="flex flex-1 flex-col p-4">
                  <p className="eyebrow text-[0.62rem] text-taupe-500">
                    {item.categoryName}
                  </p>
                  <h3 className="mt-1 font-medium text-sm text-ink truncate">
                    <Link
                      href={`/producto/${item.slug}`}
                      className="hover:text-cochinilla transition-colors"
                    >
                      {item.name}
                    </Link>
                  </h3>

                  {/* Precios según rol */}
                  <div className="mt-2 flex items-baseline justify-between gap-2 border-t border-ink/5 pt-2">
                    <div>
                      <p className="text-sm font-semibold tabular-nums text-ink">
                        {formatPEN(item.effectiveUnitPriceAmount)}
                      </p>
                      {item.appliedPriceLabel && (
                        <p className="text-[0.65rem] text-taupe-500">
                          {item.appliedPriceLabel}
                        </p>
                      )}
                    </div>

                    {item.wholesaleFromAmount && !snapshot.isWholesaleAuthorized && (
                      <div className="text-right">
                        <p className="text-[0.68rem] text-cochinilla tabular-nums">
                          Por mayor: {formatPEN(item.wholesaleFromAmount)}
                        </p>
                        <p className="text-[0.6rem] text-taupe-400">
                          mín. {item.wholesaleMinQty ?? 6} uds.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Selector de variantes si hay más de 1 activa */}
                  {item.variants.length > 1 && item.inStock && (
                    <div className="mt-3">
                      <label
                        htmlFor={`variant-select-${item.productId}`}
                        className="block text-[0.65rem] font-medium uppercase tracking-wider text-taupe-600 mb-1"
                      >
                        Combinación (Talla / Color):
                      </label>
                      <select
                        id={`variant-select-${item.productId}`}
                        value={chosenVariantId ?? ""}
                        onChange={(e) =>
                          setSelectedVariants((prev) => ({
                            ...prev,
                            [item.productId]: Number(e.target.value),
                          }))
                        }
                        className="w-full border border-ink/20 bg-paper px-2.5 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
                      >
                        {item.variants.map((v) => (
                          <option
                            key={v.id}
                            value={v.id}
                            disabled={v.stock <= 0}
                          >
                            {v.size ? `Talla ${v.size}` : ""}{" "}
                            {v.colorName ? `· ${v.colorName}` : ""}{" "}
                            {v.stock <= 0 ? "(Agotado)" : `(${v.stock} disponibles)`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Acciones de compra / navegación */}
                  <div className="mt-auto pt-4 space-y-2">
                    {item.inStock && chosenVariant ? (
                      <button
                        type="button"
                        disabled={isAdding || chosenVariant.stock <= 0}
                        onClick={() =>
                          addItem({
                            variantId: chosenVariant.id,
                            quantity: 1,
                            openDrawerOnSuccess: true,
                          })
                        }
                        className="flex h-10 w-full items-center justify-center gap-2 bg-ink px-3 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla disabled:opacity-50"
                      >
                        {isAdding ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Añadiendo...
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="size-3.5" />
                            Agregar a la bolsa
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={`/producto/${item.slug}`}
                        className="flex h-10 w-full items-center justify-center gap-1.5 border border-ink/20 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-taupe-600 hover:border-ink hover:text-ink transition-colors"
                      >
                        <ExternalLink className="size-3.5" />
                        Ver disponibilidad
                      </Link>
                    )}

                    <Link
                      href={`/producto/${item.slug}`}
                      className="block text-center text-[0.65rem] text-taupe-500 hover:text-ink underline-offset-4 hover:underline"
                    >
                      Ver ficha técnica completa
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

