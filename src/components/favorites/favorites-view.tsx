 "use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaHeart,
  FaBagShopping,
  FaTrashCan,
  FaSpinner,
  FaArrowUpRightFromSquare,
} from "react-icons/fa6";
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
      <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
        <FaSpinner className="mx-auto size-7 animate-spin text-[#0055FF]" />
        <p className="mt-3 font-mono text-xs text-slate-500">Cargando tus favoritos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="favorites-container">
      {/* Banner para visitantes no autenticados */}
      {!snapshot.isAuthenticated && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-[#EF233C]">
              <FaHeart className="size-4" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Tus favoritos están guardados temporalmente en este navegador
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Inicia sesión para conservarlos de forma permanente en tu cuenta de American Colt JEANS™.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 pt-2 sm:pt-0">
            <Link
              href="/iniciar-sesion?next=/cuenta/favoritos"
              className="rounded-xl bg-[#0055FF] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}

      {/* Título de la vista */}
      <div>
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 sm:text-2xl">
          {isAccountPage ? "Mis prendas favoritas" : "Prendas Guardadas"}
        </h2>
        <p className="mt-0.5 text-[0.7rem] text-slate-500 sm:mt-1 sm:text-xs">
          {count === 0
            ? "Encuentra aquí las prendas que guardaste."
            : `${count} ${count === 1 ? "prenda guardada" : "prendas guardadas"} en tu lista.`}
        </p>
      </div>

      {/* Lista vacía idéntica a la maqueta de referencia */}
      {count === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs sm:rounded-3xl sm:p-16">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50/80 shadow-xs sm:size-20 sm:rounded-3xl">
            <div className="relative flex items-center justify-center">
              <FaBagShopping className="size-8 text-blue-400 sm:size-10" />
              <FaHeart className="absolute inset-0 m-auto size-3.5 text-[#EF233C] sm:size-4" />
            </div>
          </div>
          <h3 className="mt-4 text-lg font-black tracking-tight text-slate-900 sm:mt-6 sm:text-xl">
            Tu lista de favoritos está vacía
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500 sm:mt-2">
            Toca el corazón en una prenda para guardarla aquí.
          </p>
          <div className="mt-5 sm:mt-6">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0055FF] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 hover:bg-blue-700 sm:px-8 sm:py-3.5"
            >
              <span>Explorar catálogo →</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Cuadrícula de favoritos (2 columnas en móvil) */
        <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3">
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
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs transition-shadow hover:shadow-md sm:rounded-2xl"
              >
                {/* Imagen del producto con enlace */}
                <div className="relative aspect-[3/4] overflow-hidden bg-slate-50">
                  <Link href={`/producto/${item.slug}`} className="block h-full w-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt}
                      fill
                      unoptimized={item.imageUrl.startsWith("/api/media/")}
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 48vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>

                  {/* Estado de stock */}
                  <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1 sm:left-3 sm:top-3">
                    {!item.inStock ? (
                      <span className="rounded-full bg-slate-900/90 px-2 py-0.5 font-mono text-[0.52rem] font-bold uppercase tracking-wider text-white sm:px-2.5 sm:text-[0.6rem]">
                        Agotado
                      </span>
                    ) : item.totalStock <= 5 ? (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[0.52rem] font-bold tracking-wider text-white sm:px-2.5 sm:text-[0.6rem]">
                        Últimas {item.totalStock}
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 font-mono text-[0.52rem] font-bold text-white sm:px-2.5 sm:text-[0.6rem]">
                        En stock
                      </span>
                    )}

                    {snapshot.isWholesaleAuthorized && item.isWholesaleProduct && (
                      <span className="rounded-full bg-[#0055FF] px-2 py-0.5 font-mono text-[0.5rem] font-bold uppercase tracking-wider text-white sm:px-2.5 sm:text-[0.6rem]">
                        B2B
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
                    className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-xs transition-all hover:scale-110 hover:text-[#EF233C] disabled:opacity-50 sm:right-3 sm:top-3 sm:size-8"
                  >
                    {isRemoving ? (
                      <FaSpinner className="size-3 animate-spin sm:size-3.5" />
                    ) : (
                      <FaTrashCan className="size-3 sm:size-3.5" />
                    )}
                  </button>
                </div>

                {/* Detalles y precios */}
                <div className="flex flex-1 flex-col space-y-1.5 p-2.5 sm:space-y-2 sm:p-4">
                  <p className="truncate font-mono text-[0.54rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.62rem]">
                    {item.categoryName}
                  </p>
                  <h3 className="truncate text-xs font-bold text-slate-900 sm:text-sm">
                    <Link
                      href={`/producto/${item.slug}`}
                      className="transition-colors hover:text-[#0055FF]"
                    >
                      {item.name}
                    </Link>
                  </h3>

                  {/* Precios */}
                  <div className="flex flex-wrap items-baseline justify-between gap-1 border-t border-slate-100 pt-1.5 sm:gap-2 sm:pt-2">
                    <div>
                      <p className="text-sm font-black tabular-nums text-slate-900 sm:text-base">
                        {formatPEN(item.effectiveUnitPriceAmount)}
                      </p>
                      {item.appliedPriceLabel && (
                        <p className="text-[0.56rem] text-slate-500 sm:text-[0.65rem]">
                          {item.appliedPriceLabel}
                        </p>
                      )}
                    </div>

                    {item.wholesaleFromAmount && !snapshot.isWholesaleAuthorized && (
                      <div className="text-right">
                        <p className="text-[0.58rem] font-bold tabular-nums text-[#EF233C] sm:text-[0.68rem]">
                          Mayor: {formatPEN(item.wholesaleFromAmount)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Selector de variantes si hay más de 1 activa */}
                  {item.variants.length > 1 && item.inStock && (
                    <div className="mt-1 sm:mt-2">
                      <select
                        id={`variant-select-${item.productId}`}
                        value={chosenVariantId ?? ""}
                        onChange={(e) =>
                          setSelectedVariants((prev) => ({
                            ...prev,
                            [item.productId]: Number(e.target.value),
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[0.65rem] text-slate-900 focus:border-[#0055FF] focus:bg-white focus:outline-none sm:rounded-xl sm:px-2.5 sm:py-1.5 sm:text-xs"
                      >
                        {item.variants.map((v) => (
                          <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                            {v.size ? `T${v.size}` : ""}{" "}
                            {v.colorName ? `· ${v.colorName}` : ""}{" "}
                            {v.stock <= 0 ? "(Agotado)" : `(${v.stock})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Botón Agregar a la bolsa */}
                  <div className="mt-auto space-y-1.5 pt-1.5 sm:pt-2">
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
                        className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#0055FF] px-2 text-[0.62rem] font-bold uppercase tracking-wider text-white shadow-xs transition-all active:scale-95 hover:bg-blue-700 disabled:opacity-50 sm:h-10 sm:gap-2 sm:rounded-xl sm:px-3 sm:text-xs"
                      >
                        {isAdding ? (
                          <>
                            <FaSpinner className="size-3 animate-spin sm:size-3.5" />
                            <span>Añadiendo...</span>
                          </>
                        ) : (
                          <>
                            <FaBagShopping className="size-3 sm:size-3.5" />
                            <span>Agregar</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={`/producto/${item.slug}`}
                        className="flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-slate-200 text-[0.62rem] font-bold uppercase tracking-wider text-slate-600 hover:border-[#0055FF] hover:text-[#0055FF] sm:h-10 sm:gap-1.5 sm:rounded-xl sm:text-xs"
                      >
                        <FaArrowUpRightFromSquare className="size-2.5 sm:size-3" />
                        <span>Ver stock</span>
                      </Link>
                    )}
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
