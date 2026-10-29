"use client";

import { useEffect } from "react";
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
  Sparkles,
  FileText,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "./cart-provider";
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

  useEscapeKey(isOpen, closeDrawer);
  useLockBodyScroll(isOpen);

  // Cerrar el panel lateral automáticamente al cambiar de ruta
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[70] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-drawer-title"
        >
          {/* Velo de fondo */}
          <motion.div
            key="cart-backdrop"
            aria-hidden
            className="fixed inset-0 bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={closeDrawer}
          />

          {/* Panel deslizable */}
          <motion.aside
            key="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: ease.luxe }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-paper text-ink shadow-2xl sm:max-w-lg"
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <ShoppingBag className="size-5 text-ink" aria-hidden />
                <div>
                  <h2 id="cart-drawer-title" className="font-display text-xl text-ink">
                    Tu Bolsa de Compras
                  </h2>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-taupe-500">
                    {cart.totalUnits} {cart.totalUnits === 1 ? "prenda" : "prendas"} ·{" "}
                    {cart.lineCount} {cart.lineCount === 1 ? "variante" : "variantes"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Cerrar bolsa de compras"
                className="flex size-10 items-center justify-center rounded-full border border-ink/10 text-ink transition-colors hover:border-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            {/* Banner de condición B2B activa */}
            {cart.isWholesaleAuthorized && (
              <div className="flex items-center justify-between border-b border-emerald-300/60 bg-emerald-50/90 px-6 py-2.5 text-xs text-emerald-950">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="size-3.5 text-emerald-700" aria-hidden />
                  Tarifa empresarial B2B activa por volumen
                </span>
                <Link
                  href="/mayorista/cotizaciones"
                  onClick={closeDrawer}
                  className="font-mono text-[0.65rem] uppercase tracking-wider text-emerald-900 underline hover:text-emerald-950"
                >
                  Cotizar lote
                </Link>
              </div>
            )}

            {/* Mensaje de error si ocurre algún problema de stock/validación */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start justify-between gap-3 border-b border-cochinilla/20 bg-cochinilla/10 px-6 py-3 text-xs text-cochinilla"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={clearError}
                  aria-label="Ocultar alerta"
                  className="text-cochinilla/70 hover:text-cochinilla"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            )}

            {/* Lista de prendas */}
            {cart.items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-full border border-ink/10 bg-sand/30 text-taupe-500">
                  <ShoppingBag className="size-7" aria-hidden />
                </div>
                <h3 className="mt-5 font-display text-2xl text-ink">
                  Tu bolsa está <em>vacía.</em>
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-taupe-500">
                  Explora nuestra colección de sastrería, básicos de algodón pima y prendas por menor o por mayor.
                </p>
                <div className="mt-7 flex flex-col gap-3 w-full max-w-xs">
                  <Link
                    href="/catalogo"
                    onClick={closeDrawer}
                    className="flex h-12 items-center justify-center gap-2 bg-ink px-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
                  >
                    Explorar catálogo
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                  {cart.isWholesaleAuthorized && (
                    <Link
                      href="/mayorista/cotizaciones"
                      onClick={closeDrawer}
                      className="flex h-11 items-center justify-center gap-2 border border-ink/20 px-6 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink"
                    >
                      <FileText className="size-3.5" aria-hidden />
                      Solicitar cotización B2B
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 divide-y divide-ink/10 overflow-y-auto px-6">
                  {cart.items.map((item) => {
                    const isUpdating = pendingVariantId === item.variantId;
                    const isWholesaleApplied = item.pricing.appliedMode === "wholesale";

                    return (
                      <div key={item.id} className="py-5">
                        <div className="flex gap-4">
                          <Link
                            href={`/producto/${item.productSlug}`}
                            onClick={closeDrawer}
                            className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-taupe-100"
                          >
                            <Image
                              src={item.imageUrl}
                              alt={item.imageAlt}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link
                                  href={`/producto/${item.productSlug}`}
                                  onClick={closeDrawer}
                                  className="text-sm font-medium text-ink hover:underline"
                                >
                                  {item.productName}
                                </Link>
                                <p className="mt-0.5 font-mono text-[0.65rem] text-taupe-500">
                                  SKU: {item.sku}
                                  {item.isDemo && (
                                    <span className="ml-1.5 inline-flex items-center border border-amber-400/50 bg-amber-50 px-1 py-0.2 font-mono text-[0.55rem] uppercase tracking-wider text-amber-900">
                                      Demo
                                    </span>
                                  )}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => void removeItem(item.variantId)}
                                aria-label={`Eliminar ${item.productName} de la bolsa`}
                                className="p-1 text-taupe-400 transition-colors hover:text-cochinilla disabled:opacity-40"
                              >
                                <Trash2 className="size-4" aria-hidden />
                              </button>
                            </div>

                            {/* Atributos de variante */}
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-taupe-600">
                              {item.colorName && (
                                <span className="inline-flex items-center gap-1.5">
                                  {item.colorSwatch && (
                                    <span
                                      className="size-2.5 rounded-full ring-1 ring-ink/20"
                                      style={{ backgroundColor: item.colorSwatch }}
                                      aria-hidden
                                    />
                                  )}
                                  {item.colorName}
                                </span>
                              )}
                              {item.size && (
                                <>
                                  <span aria-hidden>·</span>
                                  <span className="font-mono text-[0.7rem]">Talla {item.size}</span>
                                </>
                              )}
                            </div>

                            {/* Etiqueta de modalidad de precio */}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider",
                                  isWholesaleApplied
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                    : "bg-sand/60 text-taupe-700",
                                )}
                              >
                                {isWholesaleApplied ? "Tarifa Mayorista B2B" : "Precio Minorista"}
                              </span>
                              <span className="text-xs font-medium tabular-nums text-ink">
                                {formatPEN(item.pricing.effectiveUnitAmount)} / ud.
                              </span>
                              {isWholesaleApplied && item.pricing.retailUnitAmount && (
                                <span className="text-[0.7rem] tabular-nums text-taupe-400 line-through">
                                  {formatPEN(item.pricing.retailUnitAmount)}
                                </span>
                              )}
                            </div>

                            {/* Aviso de próxima escala mayorista para empresas aprobadas */}
                            {item.pricing.nextWholesaleTier && (
                              <p className="mt-1.5 text-[0.68rem] text-cochinilla">
                                Agrega {item.pricing.nextWholesaleTier.missingUnits} uds. más de este modelo para activar{" "}
                                <span className="font-semibold">
                                  {formatPEN(item.pricing.nextWholesaleTier.unitAmount)}/ud.
                                </span>{" "}
                                (mín. {item.pricing.nextWholesaleTier.minQuantity} uds.).
                              </p>
                            )}

                            {/* Controles de cantidad y subtotal */}
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="inline-flex items-center border border-ink/20">
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
                                  className="flex size-8 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:opacity-35"
                                >
                                  <Minus className="size-3" aria-hidden />
                                </button>
                                <span className="flex h-8 min-w-9 items-center justify-center px-2 font-mono text-xs tabular-nums text-ink">
                                  {isUpdating ? (
                                    <Loader2 className="size-3.5 animate-spin text-taupe-500" />
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
                                  className="flex size-8 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:opacity-35"
                                >
                                  <Plus className="size-3" aria-hidden />
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-semibold tabular-nums text-ink">
                                  {formatPEN(item.pricing.lineSubtotalAmount)}
                                </p>
                                {item.pricing.lineSavingsAmount > 0 && (
                                  <p className="text-[0.68rem] font-medium tabular-nums text-emerald-700">
                                    Ahorras {formatPEN(item.pricing.lineSavingsAmount)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Estado de disponibilidad */}
                            <p
                              className={cn(
                                "mt-2 flex items-center gap-1 text-[0.68rem]",
                                item.availabilityStatus === "available"
                                  ? "text-emerald-700"
                                  : item.availabilityStatus === "low_stock"
                                    ? "text-amber-700"
                                    : "font-medium text-cochinilla",
                              )}
                            >
                              {item.availabilityStatus === "available" && (
                                <CheckCircle2 className="size-3 shrink-0" aria-hidden />
                              )}
                              <span>{item.availabilityMessage}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pie con resumen y acciones */}
                <div className="border-t border-ink/10 bg-[#fbfaf7] px-6 py-5">
                  <div className="space-y-1.5 text-sm">
                    {cart.wholesaleSavingsAmount > 0 && (
                      <>
                        <div className="flex items-center justify-between text-xs text-taupe-500">
                          <span>Valor minorista referencial</span>
                          <span className="tabular-nums line-through">
                            {formatPEN(cart.retailSubtotalAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-emerald-800">
                          <span>Descuento mayorista B2B aplicado</span>
                          <span className="tabular-nums">
                            −{formatPEN(cart.wholesaleSavingsAmount)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-taupe-600">
                        Total estimado (PEN)
                      </span>
                      <span className="font-display text-2xl tabular-nums text-ink">
                        {formatPEN(cart.estimatedTotalAmount)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-[0.68rem] leading-relaxed text-taupe-500">
                    Importe preliminar calculado en servidor. El envío y la confirmación final del pedido se gestionarán en el checkout (Fase 5).
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2.5">
                    {!cart.hasStockIssues && (
                      <Link
                        href="/checkout"
                        onClick={closeDrawer}
                        className="flex h-12 w-full items-center justify-center gap-2 bg-ink text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
                      >
                        Proceder al Checkout
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    )}

                    <Link
                      href="/carrito"
                      onClick={closeDrawer}
                      className="flex h-11 w-full items-center justify-center gap-2 border border-ink/20 bg-paper text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink"
                    >
                      Ver bolsa detallada y gestionar
                    </Link>

                    {cart.isWholesaleAuthorized && (
                      <Link
                        href="/mayorista/cotizaciones?from=cart"
                        onClick={closeDrawer}
                        className="flex h-11 w-full items-center justify-center gap-2 border border-emerald-800 bg-emerald-900/5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-emerald-950 transition-colors hover:bg-emerald-900 hover:text-paper"
                      >
                        <FileText className="size-3.5" aria-hidden />
                        Convertir bolsa en cotización B2B
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

