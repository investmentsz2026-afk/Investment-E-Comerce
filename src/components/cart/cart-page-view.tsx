"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileText,
  Loader2,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { useCart } from "./cart-provider";
import { formatPEN } from "@/lib/format";
import { cn } from "@/lib/utils";

function CartQuantityInput({
  variantId,
  quantity,
  availableStock,
  isUpdating,
  onUpdate,
}: {
  variantId: number;
  quantity: number;
  availableStock: number;
  isUpdating: boolean;
  onUpdate: (newQuantity: number) => void;
}) {
  const [localVal, setLocalVal] = useState(String(quantity));

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      setLocalVal(String(quantity));
      return;
    }
    if (parsed !== quantity) {
      onUpdate(parsed);
    }
  };

  return (
    <input
      id={`qty-${variantId}`}
      data-testid="cart-line-qty-input"
      type="number"
      min={1}
      max={Math.max(1, availableStock)}
      disabled={isUpdating}
      value={localVal}
      onChange={(e) => {
        setLocalVal(e.target.value);
      }}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit((e.target as HTMLInputElement).value);
        }
      }}
      className="h-full w-14 border-x border-ink/10 bg-transparent text-center font-mono text-xs tabular-nums text-ink focus:outline-none"
    />
  );
}

export function CartPageView() {
  const {
    cart,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
    pendingVariantId,
    errorMessage,
    clearError,
  } = useCart();

  if (isLoading && cart.items.length === 0) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="mx-auto size-7 animate-spin text-taupe-400" aria-hidden />
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-taupe-500">
          Cargando tu bolsa de compras...
        </p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="border border-ink/10 bg-[#fbfaf7] px-6 py-16 text-center sm:px-12 sm:py-24">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-ink/15 bg-paper text-taupe-600">
          <ShoppingBag className="size-7" aria-hidden />
        </div>
        <p className="mt-5 eyebrow text-taupe-500">Bolsa de compras</p>
        <h2 className="mt-2 font-display text-display-sm text-ink">
          Tu bolsa está <em>vacía.</em>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-taupe-600">
          Aún no has agregado prendas a tu bolsa. Descubre nuestras piezas de sastrería contemporánea, básicos de algodón pima y colecciones por mayor.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/catalogo"
            className="inline-flex h-12 items-center justify-center gap-2 bg-ink px-7 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
          >
            Explorar catálogo
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          {cart.isWholesaleAuthorized ? (
            <Link
              href="/mayorista/cotizaciones"
              className="inline-flex h-12 items-center justify-center gap-2 border border-ink/20 bg-paper px-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink"
            >
              <FileText className="size-3.5" aria-hidden />
              Solicitar cotización B2B
            </Link>
          ) : (
            <Link
              href="/mayorista/registro"
              className="inline-flex h-12 items-center justify-center gap-2 border border-ink/20 bg-paper px-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink"
            >
              <Building2 className="size-3.5" aria-hidden />
              Programa Mayorista B2B
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner superior de modalidad comercial */}
      {cart.isWholesaleAuthorized ? (
        <div className="flex flex-col justify-between gap-4 border border-emerald-300 bg-emerald-50/80 p-5 text-emerald-950 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">
                Modalidad Empresarial B2B Activa
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                Tus precios se recalculan automáticamente en el servidor aplicando las escalas mayoristas autorizadas según las cantidades por modelo.
              </p>
            </div>
          </div>
          <Link
            href="/mayorista/cotizaciones?from=cart"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 bg-emerald-900 px-4 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-emerald-950"
          >
            <FileText className="size-3.5" aria-hidden />
            Solicitar cotización formal de esta bolsa
          </Link>
        </div>
      ) : cart.userRole === "business_pending" ? (
        <div className="border border-amber-300 bg-amber-50/70 p-4 text-xs text-amber-950">
          Tu solicitud de cuenta empresarial está en evaluación comercial. Mientras tanto, tu bolsa aplica precios minoristas vigentes.
        </div>
      ) : null}

      {/* Alerta de validación o stock */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 border-l-2 border-cochinilla bg-cochinilla/10 p-4 text-xs text-cochinilla"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="font-mono text-[0.65rem] uppercase underline"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Columna izquierda: Tabla de líneas del carrito */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between border-b border-ink/10 pb-4">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-taupe-600">
              {cart.lineCount} {cart.lineCount === 1 ? "variante seleccionada" : "variantes seleccionadas"} ·{" "}
              {cart.totalUnits} {cart.totalUnits === 1 ? "unidad" : "unidades"}
            </p>
            <button
              type="button"
              onClick={() => void clearCart()}
              className="text-xs text-taupe-500 underline transition-colors hover:text-cochinilla"
            >
              Vaciar bolsa
            </button>
          </div>

          <div className="divide-y divide-ink/10">
            {cart.items.map((item) => {
              const isUpdating = pendingVariantId === item.variantId;
              const isWholesale = item.pricing.appliedMode === "wholesale";

              return (
                <article
                  key={item.id}
                  data-testid={`cart-line-${item.sku}`}
                  className="py-6 sm:py-8"
                >
                  <div className="flex flex-col gap-5 sm:flex-row">
                    {/* Imagen */}
                    <Link
                      href={`/producto/${item.productSlug}`}
                      className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden bg-taupe-100 sm:w-32"
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt}
                        fill
                        sizes="128px"
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </Link>

                    {/* Detalles */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="eyebrow text-[0.6rem] text-taupe-500">
                            <Link href={`/catalogo/${item.categorySlug}`} className="hover:text-ink">
                              {item.categoryName}
                            </Link>
                          </p>
                          <h3 className="mt-1 font-display text-xl text-ink">
                            <Link href={`/producto/${item.productSlug}`} className="hover:underline">
                              {item.productName}
                            </Link>
                          </h3>
                          <p className="mt-1 font-mono text-xs text-taupe-500">
                            SKU: <span className="text-ink">{item.sku}</span>
                            {item.isDemo && (
                              <span className="ml-2 inline-flex items-center border border-amber-400/50 bg-amber-50 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-amber-900">
                                Demo Catálogo
                              </span>
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          data-testid="cart-line-remove-btn"
                          disabled={isUpdating}
                          onClick={() => void removeItem(item.variantId)}
                          className="inline-flex items-center gap-1.5 text-xs text-taupe-500 transition-colors hover:text-cochinilla disabled:opacity-40"
                          aria-label={`Eliminar ${item.productName} (${item.sku})`}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          <span>Eliminar</span>
                        </button>
                      </div>

                      {/* Atributos Talla y Color */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-taupe-700">
                        {item.colorName && (
                          <span className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper px-2.5 py-1">
                            {item.colorSwatch && (
                              <span
                                className="size-3 rounded-full ring-1 ring-ink/20"
                                style={{ backgroundColor: item.colorSwatch }}
                                aria-hidden
                              />
                            )}
                            Color: <strong className="font-medium text-ink">{item.colorName}</strong>
                          </span>
                        )}
                        {item.size && (
                          <span className="inline-flex items-center gap-1 border border-ink/10 bg-paper px-2.5 py-1 font-mono">
                            Talla: <strong className="font-semibold text-ink">{item.size}</strong>
                          </span>
                        )}
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wider",
                            isWholesale
                              ? "border border-emerald-300 bg-emerald-100 text-emerald-950"
                              : "bg-sand/60 text-taupe-800",
                          )}
                        >
                          {item.pricing.appliedLabel}
                        </span>
                      </div>

                      {/* Escalas mayoristas si el producto tiene tramos configurados */}
                      {item.pricing.wholesaleTiers.length > 0 && (
                        <div className="mt-3 border border-ink/10 bg-[#fbfaf7] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[0.7rem]">
                            <span className="font-medium text-ink">
                              Escalas mayoristas del modelo ({item.pricing.productGroupQuantity} uds. acumuladas en bolsa):
                            </span>
                            {item.pricing.nextWholesaleTier ? (
                              <span className="font-medium text-cochinilla">
                                Faltan {item.pricing.nextWholesaleTier.missingUnits} uds. para tarifa de{" "}
                                {formatPEN(item.pricing.nextWholesaleTier.unitAmount)}/ud.
                              </span>
                            ) : isWholesale ? (
                              <span className="font-medium text-emerald-800">
                                ✓ Escala mayorista aplicada
                              </span>
                            ) : !cart.isWholesaleAuthorized ? (
                              <Link href="/mayorista/registro" className="text-cochinilla underline">
                                Requiere cuenta B2B aprobada
                              </Link>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.pricing.wholesaleTiers.map((tier) => (
                              <span
                                key={tier.minQuantity}
                                className={cn(
                                  "inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[0.65rem]",
                                  tier.isUnlocked
                                    ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-950"
                                    : "border-ink/10 bg-paper text-taupe-600",
                                )}
                              >
                                <span>≥ {tier.minQuantity} uds.:</span>
                                <span className="tabular-nums">{formatPEN(tier.unitAmount)}/ud.</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Controles de cantidad + Precio unitario + Subtotal */}
                      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <label
                            htmlFor={`qty-${item.variantId}`}
                            className="block text-[0.65rem] font-medium uppercase tracking-[0.14em] text-taupe-500"
                          >
                            Cantidad
                          </label>
                          <div className="mt-1.5 inline-flex h-10 items-center border border-ink/20 bg-paper">
                            <button
                              type="button"
                              data-testid="cart-line-decrease-btn"
                              disabled={isUpdating || item.quantity <= 1}
                              onClick={() =>
                                void updateQuantity({
                                  variantId: item.variantId,
                                  quantity: item.quantity - 1,
                                })
                              }
                              aria-label={`Disminuir cantidad de ${item.productName}`}
                              className="flex size-10 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:opacity-35"
                            >
                              <Minus className="size-3.5" aria-hidden />
                            </button>
                            <CartQuantityInput
                              key={`${item.variantId}-${item.quantity}`}
                              variantId={item.variantId}
                              quantity={item.quantity}
                              availableStock={item.availableStock}
                              isUpdating={isUpdating}
                              onUpdate={(newQty) =>
                                void updateQuantity({
                                  variantId: item.variantId,
                                  quantity: newQty,
                                })
                              }
                            />
                            <button
                              type="button"
                              data-testid="cart-line-increase-btn"
                              disabled={isUpdating || item.quantity >= item.availableStock}
                              onClick={() =>
                                void updateQuantity({
                                  variantId: item.variantId,
                                  quantity: item.quantity + 1,
                                })
                              }
                              aria-label={`Aumentar cantidad de ${item.productName}`}
                              className="flex size-10 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:opacity-35"
                            >
                              <Plus className="size-3.5" aria-hidden />
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-taupe-500">
                            Precio unitario:{" "}
                            <span className="font-medium tabular-nums text-ink">
                              {formatPEN(item.pricing.effectiveUnitAmount)}
                            </span>
                            {isWholesale && item.pricing.retailUnitAmount && (
                              <span className="ml-1.5 tabular-nums text-taupe-400 line-through">
                                {formatPEN(item.pricing.retailUnitAmount)}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 font-display text-2xl tabular-nums text-ink">
                            {formatPEN(item.pricing.lineSubtotalAmount)}
                          </p>
                          {item.pricing.lineSavingsAmount > 0 && (
                            <p className="text-xs font-medium tabular-nums text-emerald-700">
                              Ahorro B2B en línea: −{formatPEN(item.pricing.lineSavingsAmount)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Estado de stock */}
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5",
                            item.availabilityStatus === "available"
                              ? "text-emerald-700"
                              : item.availabilityStatus === "low_stock"
                                ? "text-amber-700"
                                : "font-medium text-cochinilla",
                          )}
                        >
                          {item.availabilityStatus === "available" ? (
                            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                          ) : (
                            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                          )}
                          {item.availabilityMessage}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-6">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-ink hover:text-cochinilla"
            >
              ← Continuar explorando el catálogo
            </Link>
          </div>
        </div>

        {/* Columna derecha: Resumen comercial */}
        <aside className="lg:col-span-4">
          <div className="sticky top-28 border border-ink/15 bg-[#fbfaf7] p-6 sm:p-8">
            <h2 className="font-display text-2xl text-ink">Resumen Estimado</h2>
            <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-taupe-500">
              Moneda: Sol Peruano (PEN)
            </p>

            <dl className="mt-6 space-y-3 border-t border-ink/10 pt-5 text-sm">
              <div className="flex items-center justify-between text-taupe-600">
                <dt>Total de prendas</dt>
                <dd className="font-mono tabular-nums text-ink">{cart.totalUnits} uds.</dd>
              </div>
              <div className="flex items-center justify-between text-taupe-600">
                <dt>Subtotal a valor minorista</dt>
                <dd className="tabular-nums text-ink">{formatPEN(cart.retailSubtotalAmount)}</dd>
              </div>
              {cart.wholesaleSavingsAmount > 0 && (
                <div className="flex items-center justify-between font-medium text-emerald-800">
                  <dt>Descuento por volumen B2B</dt>
                  <dd className="tabular-nums">−{formatPEN(cart.wholesaleSavingsAmount)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-ink/15 pt-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
                  Total estimado de productos
                </dt>
                <dd
                  data-testid="cart-estimated-total"
                  className="font-display text-3xl tabular-nums text-ink"
                >
                  {formatPEN(cart.estimatedTotalAmount)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-l-2 border-ink/20 bg-paper p-3 text-xs leading-relaxed text-taupe-600">
              Este subtotal corresponde al valor de las prendas seleccionadas. El costo exacto de envío por departamento/distrito, el desglose de IGV (18%) y el método de pago se confirman en el checkout.
            </div>

            <div className="mt-6 space-y-3">
              {cart.hasStockIssues ? (
                <button
                  type="button"
                  disabled
                  className="flex h-13 w-full cursor-not-allowed items-center justify-center gap-2 bg-taupe-200 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-taupe-400"
                >
                  <span>Ajusta el stock para continuar</span>
                </button>
              ) : (
                <Link
                  href="/checkout"
                  data-testid="cart-proceed-checkout-btn"
                  className="flex h-13 w-full items-center justify-center gap-2 bg-ink text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
                >
                  <span>Continuar al checkout</span>
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              )}

              {cart.isWholesaleAuthorized && (
                <Link
                  href="/mayorista/cotizaciones?from=cart"
                  className="flex h-12 w-full items-center justify-center gap-2 border border-emerald-800 bg-emerald-900 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-emerald-950"
                >
                  <FileText className="size-3.5" aria-hidden />
                  Solicitar cotización B2B con esta bolsa
                </Link>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2 border-t border-ink/10 pt-4 text-[0.68rem] text-taupe-500">
              <ShieldCheck className="size-4 shrink-0 text-ink" aria-hidden />
              <span>
                Precios, escalas mayoristas y stock validados en tiempo real por el servidor de INVESTMENTS.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

