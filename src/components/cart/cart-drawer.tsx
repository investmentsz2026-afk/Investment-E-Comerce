"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  AlertCircle,
  Loader2,
  Pencil,
  FileText,
} from "lucide-react";
import { FaBoxesStacked } from "react-icons/fa6";
import { useCart } from "./cart-provider";
import { CartVariantEditor } from "./cart-variant-editor";
import { useEscapeKey, useLockBodyScroll } from "@/hooks/use-overlay";
import { formatPEN } from "@/lib/format";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const {
    cart,
    isOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    pendingVariantId,
    errorMessage,
    clearError,
  } = useCart();
  const pathname = usePathname();
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);

  useEscapeKey(isOpen, closeDrawer);
  useLockBodyScroll(isOpen);

  // Cerrar el panel lateral automáticamente al cambiar de ruta
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  const itemCountText =
    cart.totalUnits === 1 ? "1 PRENDA" : `${cart.totalUnits} PRENDAS`;

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[70] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-drawer-title"
        >
          {/* Velo de fondo oscuro con desenfoque suave */}
          <motion.div
            key="cart-backdrop"
            aria-hidden
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeDrawer}
          />

          {/* Panel Lateral Deslizable — Paleta cálida marfil/crema #FAF8F5 */}
          <motion.aside
            key="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: ease.luxe }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#FAF8F5] text-neutral-900 shadow-2xl sm:max-w-lg"
          >
            {/* Cabecera Superior: Ícono bolsa + "Tu bolsa" (serif) + "X PRENDAS" + Botón circular ✕ */}
            <div className="flex items-center justify-between border-b border-neutral-200/80 bg-[#FAF8F5] px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-neutral-100/80 text-neutral-800">
                  <ShoppingBag className="size-5 stroke-[1.8]" aria-hidden />
                </div>
                <div>
                  <h2
                    id="cart-drawer-title"
                    className="font-display font-serif text-2xl font-bold tracking-tight text-[#1A1A1A]"
                  >
                    Tu bolsa
                  </h2>
                  <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.16em] text-neutral-500">
                    {itemCountText}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Cerrar bolsa de compras"
                className="flex size-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-xs transition-colors hover:border-black hover:text-black"
              >
                <X className="size-4 stroke-[2]" aria-hidden />
              </button>
            </div>

            {/* Aviso de Tarifa Mayorista B2B (si aplica) */}
            {cart.isWholesaleAuthorized && (
              <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-50/90 px-5 py-2.5 sm:px-6 text-xs text-emerald-950">
                <span className="flex items-center gap-1.5 font-medium">
                  <FaBoxesStacked className="size-3.5 text-emerald-700" aria-hidden />
                  Tarifa mayorista B2B activa
                </span>
                <Link
                  href="/mayorista/cotizaciones"
                  onClick={closeDrawer}
                  className="font-mono text-[0.65rem] font-bold uppercase tracking-wider text-emerald-900 underline hover:text-emerald-950"
                >
                  Ver escalas
                </Link>
              </div>
            )}

            {/* Alerta de Error / Stock */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start justify-between gap-3 border-b border-red-200 bg-red-50 px-5 py-3 text-xs text-red-800"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={clearError}
                  aria-label="Ocultar alerta"
                  className="text-red-500 hover:text-red-800"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            )}

            {/* Contenido Principal: Estado Vacío vs Estado con Prendas */}
            {cart.items.length === 0 ? (
              /* ESTADO VACÍO (según diseño exacto de la referencia) */
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center bg-[#FAF8F5]">
                {/* Ilustración de la Bolsa con pespunte rojo */}
                <div className="relative mx-auto flex h-48 w-52 items-center justify-center">
                  {/* Sombra elíptica suave */}
                  <div className="absolute bottom-2 h-4 w-40 rounded-[50%] bg-neutral-900/5 blur-[3px]" />

                  {/* SVG Ilustración Bolsa con Costura Roja Pespunteada */}
                  <svg
                    viewBox="0 0 160 140"
                    className="h-40 w-44 drop-shadow-xs"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Asas superiores */}
                    <path
                      d="M56 52 V30 C56 18 67 12 80 12 C93 12 104 18 104 30 V52"
                      stroke="#1E1E1E"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    {/* Lateral en perspectiva */}
                    <polygon
                      points="115,48 127,51 121,118 109,114"
                      fill="#ECE7DE"
                      stroke="#1E1E1E"
                      strokeWidth="2.8"
                      strokeLinejoin="round"
                    />
                    {/* Pliegue interno lateral */}
                    <path
                      d="M127 51 L115 116"
                      stroke="#1E1E1E"
                      strokeWidth="1.8"
                      strokeDasharray="3 3"
                    />
                    {/* Panel frontal de la bolsa */}
                    <polygon
                      points="45,48 115,48 109,114 39,114"
                      fill="#FFFFFF"
                      stroke="#1E1E1E"
                      strokeWidth="2.8"
                      strokeLinejoin="round"
                    />
                    {/* Pespunte rojo bordado (marca registrada) */}
                    <polygon
                      points="50,54 110,54 105,108 44,108"
                      stroke="#801323"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      fill="none"
                    />
                  </svg>
                </div>

                <h3 className="mt-4 font-display font-serif text-2xl font-normal text-[#1A1A1A]">
                  Tu bolsa está vacía
                </h3>
                <p className="mt-1.5 max-w-xs text-sm text-neutral-500">
                  Encuentra tu próxima prenda en el catálogo.
                </p>

                <div className="mt-6">
                  <Link
                    href="/catalogo"
                    onClick={closeDrawer}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#801323] hover:bg-[#6b0f1c] px-7 py-3.5 text-xs font-bold text-white shadow-md shadow-[#801323]/25 transition-all active:scale-95"
                  >
                    <span>Explorar catálogo</span>
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            ) : (
              /* ESTADO LLENO CON PRENDAS */
              <>
                <div className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4 sm:px-6">
                  {cart.items.map((item) => {
                    const isUpdating = pendingVariantId === item.variantId;
                    const isEditing = editingVariantId === item.variantId;
                    const subtitle = item.shortDescription || item.categoryName;

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm"
                      >
                        <div className="flex gap-4">
                          {/* Miniatura vertical */}
                          <Link
                            href={`/producto/${item.productSlug}`}
                            onClick={closeDrawer}
                            className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-100"
                          >
                            <Image
                              src={item.imageUrl}
                              alt={item.imageAlt}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </Link>

                          {/* Detalles del Producto */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-bold text-[#1A1A1A] truncate">
                                <Link
                                  href={`/producto/${item.productSlug}`}
                                  onClick={closeDrawer}
                                  className="hover:text-[#0055FF] transition-colors"
                                >
                                  {item.productName}
                                </Link>
                              </h3>

                              {/* Botón Eliminar (Tacho de basura) */}
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => void removeItem(item.variantId)}
                                aria-label={`Eliminar ${item.productName} de la bolsa`}
                                className="p-1 text-neutral-400 transition-colors hover:text-[#801323] disabled:opacity-40"
                              >
                                <Trash2 className="size-4 stroke-[1.8]" aria-hidden />
                              </button>
                            </div>

                            {/* Fit / Categoría */}
                            {subtitle && (
                              <p className="text-xs text-neutral-500 font-normal">
                                {subtitle}
                              </p>
                            )}

                            {/* Muestra de Color y Talla */}
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-700">
                              {item.colorSwatch && (
                                <span
                                  className="size-2.5 rounded-full border border-black/15 shadow-2xs"
                                  style={{ backgroundColor: item.colorSwatch }}
                                  aria-hidden
                                />
                              )}
                              <span>
                                {item.colorName ?? "Color estándar"} · Talla {item.size ?? "Única"}
                              </span>
                            </div>

                            {/* Botón "✎ Editar talla y color" */}
                            <div className="mt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingVariantId(isEditing ? null : item.variantId)
                                }
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0055FF] hover:underline transition-colors"
                              >
                                <Pencil className="size-3" aria-hidden />
                                <span>Editar talla y color</span>
                              </button>
                            </div>

                            {/* Selector de Cantidad y Precio */}
                            <div className="mt-3 flex items-center justify-between gap-3 pt-1">
                              <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white">
                                <button
                                  type="button"
                                  disabled={isUpdating || item.quantity <= 1}
                                  onClick={() =>
                                    void updateQuantity({
                                      variantId: item.variantId,
                                      quantity: item.quantity - 1,
                                    })
                                  }
                                  aria-label={`Disminuir cantidad de ${item.productName}`}
                                  className="flex size-7 items-center justify-center text-neutral-600 transition-colors hover:text-black disabled:opacity-30"
                                >
                                  <Minus className="size-3" aria-hidden />
                                </button>
                                <span className="w-8 text-center font-mono text-xs font-bold tabular-nums text-neutral-900">
                                  {isUpdating ? (
                                    <Loader2 className="mx-auto size-3 animate-spin text-neutral-500" />
                                  ) : (
                                    item.quantity
                                  )}
                                </span>
                                <button
                                  type="button"
                                  disabled={isUpdating || item.quantity >= item.availableStock}
                                  onClick={() =>
                                    void updateQuantity({
                                      variantId: item.variantId,
                                      quantity: item.quantity + 1,
                                    })
                                  }
                                  aria-label={`Aumentar cantidad de ${item.productName}`}
                                  className="flex size-7 items-center justify-center text-neutral-600 transition-colors hover:text-black disabled:opacity-30"
                                >
                                  <Plus className="size-3" aria-hidden />
                                </button>
                              </div>

                              {/* Precio de la Línea */}
                              <div className="text-right">
                                <p className="font-mono text-base font-bold tabular-nums text-[#1A1A1A]">
                                  {formatPEN(item.pricing.lineSubtotalAmount)}
                                </p>
                              </div>
                            </div>

                            {/* Estado de Stock si hay incidencias */}
                            {item.availabilityStatus !== "available" && (
                              <p
                                className={cn(
                                  "mt-2 text-[0.68rem]",
                                  item.availabilityStatus === "low_stock"
                                    ? "text-amber-700"
                                    : "font-semibold text-red-600",
                                )}
                              >
                                {item.availabilityMessage}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Editor de Talla y Color Inline */}
                        {isEditing && (
                          <CartVariantEditor
                            item={item}
                            onClose={() => setEditingVariantId(null)}
                            onSaved={() => setEditingVariantId(null)}
                          />
                        )}
                      </article>
                    );
                  })}
                </div>

                {/* Pie con Resumen y Acciones (Subtotal, Continuar al pago, Ver bolsa) */}
                <div className="border-t border-neutral-200/80 bg-[#FAF8F5] p-5 space-y-3.5 sm:px-6">
                  {cart.wholesaleSavingsAmount > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-1.5 text-xs text-emerald-900">
                      <span>Descuento B2B aplicado</span>
                      <span className="font-mono font-bold text-emerald-700">
                        −{formatPEN(cart.wholesaleSavingsAmount)}
                      </span>
                    </div>
                  )}

                  {/* Fila de Subtotal */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-bold text-[#1A1A1A]">Subtotal</span>
                    <span className="font-mono text-base font-bold tabular-nums text-[#1A1A1A]">
                      {formatPEN(cart.estimatedTotalAmount)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500">
                    El envío se calcula al continuar.
                  </p>

                  {/* Botones de Acción */}
                  <div className="space-y-2 pt-1">
                    {!cart.hasStockIssues && (
                      <Link
                        href="/checkout"
                        onClick={closeDrawer}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#801323] hover:bg-[#6b0f1c] text-xs font-bold text-white shadow-md shadow-[#801323]/25 transition-all active:scale-[0.99]"
                      >
                        <span>Continuar al pago</span>
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    )}

                    <Link
                      href="/carrito"
                      onClick={closeDrawer}
                      className="flex h-11 w-full items-center justify-center rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-800 shadow-2xs transition-colors"
                    >
                      <span>Ver bolsa completa</span>
                    </Link>

                    {cart.isWholesaleAuthorized && (
                      <Link
                        href="/mayorista/cotizaciones?from=cart"
                        onClick={closeDrawer}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-emerald-50 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
                      >
                        <FileText className="size-3.5" aria-hidden />
                        <span>Convertir bolsa en cotización B2B</span>
                      </Link>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
