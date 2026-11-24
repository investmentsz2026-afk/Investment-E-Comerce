"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart-provider";
import { CartVariantEditor } from "./cart-variant-editor";
import { formatPEN } from "@/lib/format";
import {
  FaTrashCan,
  FaPlus,
  FaMinus,
  FaArrowRight,
  FaBoxesStacked,
  FaShieldHalved,
  FaTruckFast,
  FaSpinner,
  FaPencil,
} from "react-icons/fa6";

export function AccountCartView() {
  const {
    cart,
    isLoading,
    updateQuantity,
    removeItem,
    pendingVariantId,
  } = useCart();
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);

  if (isLoading && cart.items.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
        <FaSpinner className="mx-auto size-8 animate-spin text-[#0055FF]" aria-hidden />
        <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
          Cargando tu bolsa de compras...
        </p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Mi Bolsa Actual
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Revisa tus prendas seleccionadas y calcula el total de tu pedido.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-[#FAF8F5] p-10 sm:p-14 text-center shadow-xs">
          {/* Ilustración Bolsa con Costura Roja */}
          <div className="relative mx-auto flex h-40 w-44 items-center justify-center">
            <div className="absolute bottom-2 h-3.5 w-36 rounded-[50%] bg-neutral-900/5 blur-[2px]" />
            <svg
              viewBox="0 0 160 140"
              className="h-32 w-36 drop-shadow-xs"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M56 52 V30 C56 18 67 12 80 12 C93 12 104 18 104 30 V52"
                stroke="#1E1E1E"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <polygon
                points="115,48 127,51 121,118 109,114"
                fill="#ECE7DE"
                stroke="#1E1E1E"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
              <path
                d="M127 51 L115 116"
                stroke="#1E1E1E"
                strokeWidth="1.8"
                strokeDasharray="3 3"
              />
              <polygon
                points="45,48 115,48 109,114 39,114"
                fill="#FFFFFF"
                stroke="#1E1E1E"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
              <polygon
                points="50,54 110,54 105,108 44,108"
                stroke="#DC2626"
                strokeWidth="2"
                strokeDasharray="4 3"
                fill="none"
              />
            </svg>
          </div>

          <h3 className="mt-4 font-display font-serif text-2xl font-bold tracking-tight text-slate-900">
            Tu bolsa está vacía
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
            Encuentra tu próxima prenda en el catálogo. Descubre nuestros Jeans Ring Spun, Pantalones Drill y Camisas de algodón peruano.
          </p>
          <div className="mt-6">
            <Link
              href="/catalogo"
              className="bg-flow inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] hover:from-[#7F1D1D] hover:via-[#B91C1C] hover:to-[#DC2626] px-7 py-3 text-xs font-bold text-white shadow-md shadow-blue-900/20 transition-all active:scale-95"
            >
              <span>Explorar catálogo</span>
              <FaArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Mi Bolsa Actual
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {cart.totalUnits} {cart.totalUnits === 1 ? "prenda seleccionada" : "prendas seleccionadas"} ({cart.lineCount} {cart.lineCount === 1 ? "modelo" : "modelos"})
          </p>
        </div>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0055FF] hover:underline"
        >
          <span>Seguir agregando prendas</span>
          <FaArrowRight className="size-3" />
        </Link>
      </div>

      {cart.isWholesaleAuthorized && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-950">
          <FaBoxesStacked className="size-5 shrink-0 text-emerald-700" />
          <div>
            <p className="font-bold uppercase tracking-wider text-emerald-900">
              Tarifa Mayorista B2B Aplicada
            </p>
            <p className="text-emerald-800 text-[0.72rem]">
              Tus precios cuentan con el descuento especial por volumen de fábrica de American Colt JEANS™.
            </p>
          </div>
        </div>
      )}

      {/* Grid de Ítems y Resumen de Compra */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Lista de Prendas */}
        <div className="lg:col-span-7 space-y-4">
          {cart.items.map((item) => {
            const isUpdating = pendingVariantId === item.variantId;
            const isEditing = editingVariantId === item.variantId;
            const subtitle = item.shortDescription || item.categoryName;

            return (
              <article
                key={item.variantId}
                className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs transition-shadow hover:shadow-sm sm:rounded-2xl sm:p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-start gap-3 sm:contents">
                    {/* Imagen de la Prenda */}
                    <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:w-20 sm:rounded-xl">
                      <Image
                        src={item.imageUrl ?? "/placeholder.jpg"}
                        alt={item.productName}
                        fill
                        unoptimized={Boolean(item.imageUrl?.startsWith("/api/media/"))}
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    {/* Info de la Prenda */}
                    <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                      {subtitle && (
                        <span className="block truncate text-[0.58rem] font-bold uppercase tracking-wider text-slate-400 sm:text-[0.65rem]">
                          {subtitle}
                        </span>
                      )}
                      <h3 className="truncate text-xs font-bold text-slate-900 sm:text-sm">
                        <Link href={`/producto/${item.productSlug}`} className="hover:text-[#0055FF]">
                          {item.productName}
                        </Link>
                      </h3>

                      {/* Color y Talla con Swatch */}
                      <div className="flex items-center gap-1.5 text-[0.68rem] text-slate-600 sm:text-xs">
                        {item.colorSwatch && (
                          <span
                            className="size-2.5 shrink-0 rounded-full border border-black/15 shadow-2xs"
                            style={{ backgroundColor: item.colorSwatch }}
                            aria-hidden
                          />
                        )}
                        <span className="truncate">
                          {item.colorName ?? "Estándar"} · Talla {item.size ?? "Única"}
                        </span>
                      </div>

                      {/* Botón Editar Talla y Color */}
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingVariantId(isEditing ? null : item.variantId)
                          }
                          className="inline-flex items-center gap-1 pt-0.5 text-[0.68rem] font-semibold text-[#0055FF] hover:underline sm:gap-1.5 sm:text-xs"
                        >
                          <FaPencil className="size-2.5" />
                          <span>Editar talla y color</span>
                        </button>
                      </div>

                      <p className="pt-0.5 font-mono text-xs font-bold text-slate-900 sm:pt-1">
                        {formatPEN(item.pricing.effectiveUnitAmount)}{" "}
                        <span className="text-[0.62rem] font-normal text-slate-500 sm:text-[0.68rem]">c/u</span>
                      </p>
                    </div>
                  </div>

                  {/* Controles de Cantidad y Subtotal */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Selector +/- */}
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                      <button
                        type="button"
                        disabled={isUpdating || item.quantity <= 1}
                        onClick={() =>
                          updateQuantity({
                            variantId: item.variantId,
                            quantity: item.quantity - 1,
                          })
                        }
                        className="flex size-8 items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
                        aria-label="Disminuir cantidad"
                      >
                        <FaMinus className="size-2.5" />
                      </button>
                      <span className="w-8 text-center font-mono text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isUpdating || item.quantity >= item.availableStock}
                        onClick={() =>
                          updateQuantity({
                            variantId: item.variantId,
                            quantity: item.quantity + 1,
                          })
                        }
                        className="flex size-8 items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
                        aria-label="Aumentar cantidad"
                      >
                        <FaPlus className="size-2.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-black text-slate-900">
                        {formatPEN(item.pricing.lineSubtotalAmount)}
                      </span>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => removeItem(item.variantId)}
                        className="text-slate-400 hover:text-[#DC2626] transition-colors p-1"
                        aria-label={`Eliminar ${item.productName}`}
                      >
                        <FaTrashCan className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Editor Inline de Variante */}
                {isEditing && (
                  <div className="pt-2 border-t border-slate-100 mt-3">
                    <CartVariantEditor
                      item={item}
                      onClose={() => setEditingVariantId(null)}
                      onSaved={() => setEditingVariantId(null)}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Resumen de Compra y Botón Checkout */}
        <div className="lg:col-span-5">
          <div className="sticky top-44 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black uppercase tracking-tight text-slate-900 border-b border-slate-100 pb-3">
              Resumen del Pedido
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal de prendas ({cart.totalUnits} uds):</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatPEN(cart.retailSubtotalAmount)}
                </span>
              </div>

              {cart.wholesaleSavingsAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Ahorro mayorista B2B:</span>
                  <span className="font-mono">
                    −{formatPEN(cart.wholesaleSavingsAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>Despacho:</span>
                <span className="font-medium text-slate-700">Calculado al pagar</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-baseline justify-between">
              <span className="text-sm font-black uppercase tracking-wider text-slate-900">
                Total Estimado:
              </span>
              <span className="text-2xl font-black tabular-nums text-slate-900">
                {formatPEN(cart.estimatedTotalAmount)}
              </span>
            </div>

            <div className="pt-2 space-y-2.5">
              <Link
                href="/checkout"
                className="bg-flow flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] hover:from-[#7F1D1D] hover:via-[#B91C1C] hover:to-[#DC2626] px-6 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-900/20 transition-all active:scale-95"
              >
                <span>Proceder al Pago Seguro</span>
                <FaArrowRight className="size-3.5" />
              </Link>

              <div className="rounded-xl bg-slate-50 p-3 text-[0.68rem] text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <FaTruckFast className="size-3 text-[#0055FF]" />
                  <span>Envíos a todo el Perú (Olva Courier / Shalom)</span>
                </p>
                <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <FaShieldHalved className="size-3 text-emerald-600" />
                  <span>Pago 100% Cifrado y Boleta / Factura SUNAT</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
