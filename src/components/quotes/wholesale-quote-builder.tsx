"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { submitWholesaleQuoteAction } from "@/server/actions/quotes";
import { formatPEN } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CatalogSelectorProduct {
  id: number;
  slug: string;
  name: string;
  isWholesale: boolean;
  imageUrl: string;
  retailPrice: number;
  wholesaleTiers: {
    minQuantity: number;
    maxQuantity: number | null;
    amount: number;
  }[];
  variants: {
    id: number;
    sku: string;
    size: string | null;
    colorName: string | null;
    colorSwatch: string | null;
    stock: number;
  }[];
}

export interface InitialQuoteLine {
  variantId: number;
  quantity: number;
  itemNotes?: string;
}

interface WholesaleQuoteBuilderProps {
  catalogProducts: CatalogSelectorProduct[];
  initialLines?: InitialQuoteLine[];
  defaultDeliveryCity?: string;
  preselectedProductSlug?: string;
}

export function WholesaleQuoteBuilder({
  catalogProducts,
  initialLines = [],
  defaultDeliveryCity = "Lima",
  preselectedProductSlug,
}: WholesaleQuoteBuilderProps) {
  const router = useRouter();

  // Mapear variantes para búsqueda rápida
  const variantInfoMap = useMemo(() => {
    const map = new Map<
      number,
      {
        product: CatalogSelectorProduct;
        variant: CatalogSelectorProduct["variants"][number];
      }
    >();
    for (const p of catalogProducts) {
      for (const v of p.variants) {
        map.set(v.id, { product: p, variant: v });
      }
    }
    return map;
  }, [catalogProducts]);

  const initialProduct = useMemo(() => {
    if (preselectedProductSlug) {
      const found = catalogProducts.find((p) => p.slug === preselectedProductSlug);
      if (found) return found.id;
    }
    return catalogProducts[0]?.id ?? 0;
  }, [catalogProducts, preselectedProductSlug]);

  const [selectedProductId, setSelectedProductId] = useState<number>(initialProduct);
  const currentProduct = useMemo(
    () => catalogProducts.find((p) => p.id === selectedProductId) ?? catalogProducts[0] ?? null,
    [catalogProducts, selectedProductId],
  );

  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    currentProduct?.variants[0]?.id ?? 0,
  );
  const [addQuantity, setAddQuantity] = useState<number>(
    currentProduct?.wholesaleTiers[0]?.minQuantity ?? 12,
  );
  const [addNotes, setAddNotes] = useState<string>("");

  const [lines, setLines] = useState<
    Array<{ variantId: number; quantity: number; itemNotes: string }>
  >(() =>
    initialLines
      .filter((l) => variantInfoMap.has(l.variantId))
      .map((l) => ({
        variantId: l.variantId,
        quantity: Math.max(1, l.quantity),
        itemNotes: l.itemNotes ?? "",
      })),
  );

  const [deliveryCity, setDeliveryCity] = useState(defaultDeliveryCity);
  const [commercialNeeds, setCommercialNeeds] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successQuote, setSuccessQuote] = useState<{
    quoteId: number;
    quoteNumber: string;
  } | null>(null);

  // Cuando cambia el producto seleccionado, actualizar la primera variante y su cantidad mínima sugerida
  const handleProductChange = (prodId: number) => {
    setSelectedProductId(prodId);
    const prod = catalogProducts.find((p) => p.id === prodId);
    if (prod) {
      setSelectedVariantId(prod.variants[0]?.id ?? 0);
      setAddQuantity(prod.wholesaleTiers[0]?.minQuantity ?? 12);
    }
  };

  const handleAddLine = () => {
    setErrorMessage(null);
    const info = variantInfoMap.get(selectedVariantId);
    if (!info) {
      setErrorMessage("Selecciona una variante válida de producto.");
      return;
    }
    const cleanQty = Math.trunc(Number(addQuantity));
    if (!Number.isFinite(cleanQty) || cleanQty < 1 || cleanQty > 50000) {
      setErrorMessage("Ingresa una cantidad entera válida entre 1 y 50,000 unidades.");
      return;
    }

    setLines((prev) => {
      const existingIdx = prev.findIndex((item) => item.variantId === selectedVariantId);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + cleanQty,
          itemNotes: addNotes.trim() || next[existingIdx].itemNotes,
        };
        return next;
      }
      return [
        ...prev,
        {
          variantId: selectedVariantId,
          quantity: cleanQty,
          itemNotes: addNotes.trim(),
        },
      ];
    });
    setAddNotes("");
  };

  const handleUpdateLineQuantity = (variantId: number, newQty: number) => {
    const clean = Math.max(1, Math.min(50000, Math.trunc(newQty || 1)));
    setLines((prev) =>
      prev.map((l) => (l.variantId === variantId ? { ...l, quantity: clean } : l)),
    );
  };

  const handleRemoveLine = (variantId: number) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  };

  // Calcular subtotales referenciales usando las reglas de volumen del catálogo
  const summaryLines = useMemo(() => {
    // Agrupar cantidades por producto
    const qtyByProduct = new Map<number, number>();
    for (const line of lines) {
      const info = variantInfoMap.get(line.variantId);
      if (!info) continue;
      qtyByProduct.set(
        info.product.id,
        (qtyByProduct.get(info.product.id) ?? 0) + line.quantity,
      );
    }

    return lines
      .map((line) => {
        const info = variantInfoMap.get(line.variantId);
        if (!info) return null;
        const { product, variant } = info;
        const groupQty = qtyByProduct.get(product.id) ?? line.quantity;

        let unitPrice = product.retailPrice;
        let appliedTierMin: number | null = null;

        if (product.isWholesale && product.wholesaleTiers.length > 0) {
          for (const tier of product.wholesaleTiers) {
            if (groupQty >= tier.minQuantity) {
              unitPrice = tier.amount;
              appliedTierMin = tier.minQuantity;
            }
          }
        }

        const subtotal = unitPrice * line.quantity;
        return {
          ...line,
          product,
          variant,
          unitPrice,
          appliedTierMin,
          subtotal,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [lines, variantInfoMap]);

  const totalUnits = useMemo(
    () => summaryLines.reduce((acc, l) => acc + l.quantity, 0),
    [summaryLines],
  );
  const estimatedSubtotal = useMemo(
    () => summaryLines.reduce((acc, l) => acc + l.subtotal, 0),
    [summaryLines],
  );

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (summaryLines.length === 0) {
      setErrorMessage("Agrega al menos una prenda/variante a tu solicitud de cotización.");
      return;
    }

    if (commercialNeeds.trim().length < 10) {
      setErrorMessage(
        "Por favor describe tus necesidades comerciales o condiciones requeridas (mínimo 10 caracteres).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitWholesaleQuoteAction({
        deliveryCity,
        commercialNeeds,
        customerNotes,
        items: summaryLines.map((l) => ({
          variantId: l.variantId,
          quantity: l.quantity,
          itemNotes: l.itemNotes,
        })),
      });

      if (!res.success || !res.data) {
        setErrorMessage(res.error ?? "No se pudo registrar la cotización.");
        return;
      }

      setSuccessQuote(res.data);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successQuote) {
    return (
      <div className="border border-emerald-400 bg-emerald-50/70 p-8 text-emerald-950">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="mt-1 size-6 shrink-0 text-emerald-700" aria-hidden />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-emerald-800">
              Solicitud de Cotización Registrada
            </p>
            <h3 className="mt-1 font-display text-2xl text-ink">
              Expediente <span className="font-mono">{successQuote.quoteNumber}</span> enviado con éxito.
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-900">
              Nuestro equipo de ventas corporativas revisará las cantidades, disponibilidad de producción y condiciones especiales solicitadas. Recibirás una propuesta económica formal con precios unitarios garantizados y fecha de vigencia.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/mayorista/cotizaciones/${successQuote.quoteId}`}
                className="inline-flex h-11 items-center justify-center gap-2 bg-ink px-6 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla"
              >
                Ver detalle de la cotización {successQuote.quoteNumber}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSuccessQuote(null);
                  setLines([]);
                  setCommercialNeeds("");
                  setCustomerNotes("");
                }}
                className="inline-flex h-11 items-center justify-center border border-ink/20 bg-paper px-5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ink hover:border-ink"
              >
                Crear otra solicitud
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitQuote} className="space-y-8">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 border-l-2 border-cochinilla bg-cochinilla/10 p-4 text-xs text-cochinilla"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selector de productos y variantes del catálogo */}
      <div className="border border-ink/15 bg-[#fbfaf7] p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div>
            <p className="eyebrow text-cochinilla">Paso 1 · Selección de Prendas y Variantes</p>
            <h3 className="mt-1 font-display text-2xl text-ink">
              Añadir modelos y tallas al lote
            </h3>
          </div>
          <Sparkles className="size-5 text-cochinilla" aria-hidden />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Producto */}
          <div className="md:col-span-5">
            <label
              htmlFor="quote-product-select"
              className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink"
            >
              Modelo del catálogo
            </label>
            <select
              id="quote-product-select"
              value={selectedProductId}
              onChange={(e) => handleProductChange(Number(e.target.value))}
              className="mt-2 block h-11 w-full border border-ink/20 bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none"
            >
              {catalogProducts.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}{" "}
                  {prod.wholesaleTiers[0]
                    ? `(Mayorista: ${formatPEN(prod.wholesaleTiers[0].amount)} desde ${prod.wholesaleTiers[0].minQuantity} uds.)`
                    : `(Base: ${formatPEN(prod.retailPrice)})`}
                </option>
              ))}
            </select>
          </div>

          {/* Variante (Talla × Color) */}
          <div className="md:col-span-4">
            <label
              htmlFor="quote-variant-select"
              className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink"
            >
              Color y Talla (SKU)
            </label>
            <select
              id="quote-variant-select"
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(Number(e.target.value))}
              className="mt-2 block h-11 w-full border border-ink/20 bg-paper px-3 font-mono text-xs text-ink focus:border-ink focus:outline-none"
            >
              {currentProduct?.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.colorName ?? "Único"} · Talla {v.size ?? "Única"} ({v.sku}) — Stock ref: {v.stock}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="md:col-span-3">
            <label
              htmlFor="quote-qty-input"
              className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink"
            >
              Cantidad (unidades)
            </label>
            <input
              id="quote-qty-input"
              type="number"
              min={1}
              max={50000}
              value={addQuantity}
              onChange={(e) => setAddQuantity(Number(e.target.value))}
              className="mt-2 block h-11 w-full border border-ink/20 bg-paper px-3 font-mono text-sm tabular-nums text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={addNotes}
            onChange={(e) => setAddNotes(e.target.value)}
            placeholder="Observación opcional para esta variante (ej: empaque individual, bordado corporativo)..."
            className="h-10 flex-1 border border-ink/15 bg-paper px-3.5 text-xs text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddLine}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 bg-ink px-5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla"
          >
            <Plus className="size-3.5" aria-hidden />
            Agregar variante al lote
          </button>
        </div>
      </div>

      {/* Tabla de líneas incluidas en la cotización */}
      <div className="border border-ink/15 bg-paper p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div>
            <p className="eyebrow text-taupe-500">Paso 2 · Resumen de Prendas a Cotizar</p>
            <h3 className="mt-1 font-display text-2xl text-ink">
              Detalle por variante ({summaryLines.length}{" "}
              {summaryLines.length === 1 ? "línea" : "líneas"} · {totalUnits} uds.)
            </h3>
          </div>
        </div>

        {summaryLines.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag className="mx-auto size-8 text-taupe-400" aria-hidden />
            <p className="mt-3 text-sm text-taupe-600">
              Aún no has añadido variantes al lote de cotización. Usa el selector superior para agregar tallas y colores.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-ink/10">
            {summaryLines.map((line) => (
              <div
                key={line.variantId}
                data-testid={`quote-builder-line-${line.variant.sku}`}
                className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-taupe-100">
                    <Image
                      src={line.product.imageUrl}
                      alt={line.product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{line.product.name}</p>
                    <p className="font-mono text-xs text-taupe-500">
                      SKU: {line.variant.sku} · Color: {line.variant.colorName ?? "Único"} · Talla:{" "}
                      {line.variant.size ?? "Única"}
                    </p>
                    {line.itemNotes && (
                      <p className="mt-0.5 text-xs italic text-taupe-600">Nota: {line.itemNotes}</p>
                    )}
                    <span
                      className={cn(
                        "mt-1 inline-block px-2 py-0.5 font-mono text-[0.6rem] uppercase",
                        line.appliedTierMin
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-sand/60 text-taupe-700",
                      )}
                    >
                      {line.appliedTierMin
                        ? `Tarifa ref. B2B (≥ ${line.appliedTierMin} uds.): ${formatPEN(line.unitPrice)}/ud.`
                        : `Precio base ref.: ${formatPEN(line.unitPrice)}/ud.`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div>
                    <label className="sr-only" htmlFor={`q-line-${line.variantId}`}>
                      Cantidad para {line.variant.sku}
                    </label>
                    <input
                      id={`q-line-${line.variantId}`}
                      type="number"
                      min={1}
                      max={50000}
                      value={line.quantity}
                      onChange={(e) =>
                        handleUpdateLineQuantity(line.variantId, Number(e.target.value))
                      }
                      className="h-9 w-24 border border-ink/20 bg-paper px-2 text-center font-mono text-xs tabular-nums text-ink"
                    />
                  </div>

                  <div className="min-w-28 text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-ink">
                      {formatPEN(line.subtotal)}
                    </p>
                    <p className="text-[0.65rem] text-taupe-500">Subtotal ref.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(line.variantId)}
                    aria-label={`Quitar ${line.variant.sku}`}
                    className="p-1.5 text-taupe-400 hover:text-cochinilla"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-baseline justify-between pt-5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-taupe-600">
                Valor referencial del lote solicitado
              </span>
              <span className="font-display text-2xl tabular-nums text-ink">
                {formatPEN(estimatedSubtotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Necesidades comerciales y envío */}
      <div className="border border-ink/15 bg-[#fbfaf7] p-6 sm:p-8">
        <p className="eyebrow text-cochinilla">Paso 3 · Condiciones Comerciales y Envío</p>
        <h3 className="mt-1 font-display text-2xl text-ink">
          Requerimientos del pedido corporativo
        </h3>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="quote-commercial-needs"
              className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink"
            >
              Necesidades comerciales y objetivo del pedido *
            </label>
            <textarea
              id="quote-commercial-needs"
              name="commercialNeeds"
              rows={3}
              required
              value={commercialNeeds}
              onChange={(e) => setCommercialNeeds(e.target.value)}
              placeholder="Indica si requieres tarifa especial por volumen superior, cronograma de entregas parciales, facturación a crédito corporativo o personalización textil..."
              className="mt-2 block w-full border border-ink/20 bg-paper p-3.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="quote-delivery-city"
              className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink"
            >
              Ciudad / Destino de despacho
            </label>
            <input
              id="quote-delivery-city"
              name="deliveryCity"
              type="text"
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              placeholder="Lima, Arequipa, Trujillo..."
              className="mt-2 block h-11 w-full border border-ink/20 bg-paper px-3.5 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="quote-customer-notes"
              className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink"
            >
              Observaciones adicionales (opcional)
            </label>
            <input
              id="quote-customer-notes"
              name="customerNotes"
              type="text"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Horario de recepción de almacén, contacto logístico..."
              className="mt-2 block h-11 w-full border border-ink/20 bg-paper px-3.5 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-ink/10 pt-6 sm:flex-row sm:items-center">
          <p className="max-w-xl text-xs leading-relaxed text-taupe-600">
            Nota: El envío de una solicitud de cotización no constituye un cobro automático ni compromete reserva definitiva de inventario hasta la emisión y aceptación de la propuesta formal.
          </p>

          <button
            type="submit"
            disabled={isSubmitting || summaryLines.length === 0}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-ink px-8 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Enviando solicitud...
              </>
            ) : (
              <>
                <FileText className="size-4" aria-hidden />
                Enviar solicitud de cotización B2B
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

