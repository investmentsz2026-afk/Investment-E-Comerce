"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Package,
  ArrowRight,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Loader2,
  FileText,
  Truck,
  ShoppingBag,
  RotateCcw,
  Building2,
  X,
} from "lucide-react";
import { FaRulerHorizontal, FaShieldHalved } from "react-icons/fa6";
import type { ProductRecord, CatalogProduct } from "@/types/catalog";
import type { ProductShippingCoverageInfo } from "@/server/shipping/service";
import { formatPEN } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { colorInStock, findVariant, isSoldOut, sizeInStock } from "@/lib/variant-stock";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { useCart } from "@/components/cart/cart-provider";

interface ProductDetailViewProps {
  product: ProductRecord;
  related: CatalogProduct[];
  userRole?: string | null;
  shippingCoverage: ProductShippingCoverageInfo;
}

export function ProductDetailView({
  product,
  related,
  userRole,
  shippingCoverage,
}: ProductDetailViewProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(product.slug);
  const { addItem, pendingVariantId } = useCart();

  // Image gallery state
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const images =
    product.images.length > 0
      ? product.images
      : [
          {
            id: 0,
            url: "/placeholder.jpg",
            alt: product.name,
            sortOrder: 0,
            isPrimary: true,
          },
        ];
  const selectedImage = images[selectedImageIdx] ?? images[0];

  // Variant selection state
  const uniqueColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of product.variants) {
      if (v.colorName && v.colorSwatch && !map.has(v.colorName)) {
        map.set(v.colorName, v.colorSwatch);
      }
    }
    return Array.from(map.entries()).map(([name, swatch]) => ({ name, swatch }));
  }, [product.variants]);

  const uniqueSizes = useMemo(() => {
    const set = new Set<string>();
    for (const v of product.variants) {
      if (v.size) set.add(v.size);
    }
    return Array.from(set);
  }, [product.variants]);

  const [selectedColor, setSelectedColor] = useState(uniqueColors[0]?.name ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(() => {
    if (uniqueSizes.includes("30")) return "30";
    return uniqueSizes[0] ?? null;
  });

  // Find the matching variant (solo variantes activas)
  const selectedVariant = useMemo(
    () => findVariant(product.variants, selectedColor, selectedSize),
    [product.variants, selectedColor, selectedSize],
  );

  // Check if a size is available for the selected color
  const isSizeAvailable = (size: string) =>
    sizeInStock(product.variants, selectedColor, size);

  // Prices
  const retailPrice = product.prices.find((p) => p.type === "retail");
  const wholesalePrices = product.prices
    .filter((p) => p.type === "wholesale")
    .sort((a, b) => a.minQuantity - b.minQuantity);

  const isOutOfStock = isSoldOut(product.variants);
  const [sizeHint, setSizeHint] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const isWholesaleApproved = userRole === "business_approved" || userRole === "admin";
  const maxSelectableQty = selectedVariant ? Math.max(1, selectedVariant.stock) : 99;
  const isAddingCurrent =
    selectedVariant !== null && pendingVariantId === selectedVariant.id;

  // Desplegables de información técnica (los 3 desplegables oficiales)
  const [showDescription, setShowDescription] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [showWholesale, setShowWholesale] = useState(isWholesaleApproved);

  // Modal Guía de Tallas
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Navegación de galería
  const handlePrevImage = () => {
    setSelectedImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };
  const handleNextImage = () => {
    setSelectedImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Extraer calce/fit del nombre o categoría
  const fitLabel = useMemo(() => {
    const lower = `${product.name} ${product.shortDescription ?? ""}`.toLowerCase();
    if (lower.includes("skinny fit")) return "Skinny Fit";
    if (lower.includes("slim fit")) return "Slim Fit";
    if (lower.includes("classic fit") || lower.includes("clásico")) return "Classic Fit";
    if (lower.includes("straight fit")) return "Straight Fit";
    if (lower.includes("relaxed fit")) return "Relaxed Fit";
    return null;
  }, [product.name, product.shortDescription]);

  return (
    <div className="pb-20 pt-4 lg:pb-32 lg:pt-8 text-neutral-900">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* ─── Columna Izquierda: Galería Moderna ─── */}
        <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 items-start">
          {/* Miniaturas verticales (escritorio) */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:max-h-[640px] no-scrollbar w-full sm:w-20 shrink-0">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageIdx(i)}
                  className={cn(
                    "relative aspect-[3/4] w-16 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#801323]",
                    i === selectedImageIdx
                      ? "border-[#801323] shadow-sm ring-1 ring-[#801323]"
                      : "border-neutral-200/80 opacity-70 hover:opacity-100 hover:border-neutral-400",
                  )}
                  aria-label={`Ver foto ${i + 1} de ${product.name}`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Imagen Principal Grande con Bordes Redondeados 3D y Fondo Suave */}
          <div className="relative aspect-[3/4] w-full flex-1 overflow-hidden rounded-3xl bg-[#EBF3EF] border border-neutral-200/60 shadow-xs">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: ease.soft }}
                className="absolute inset-0"
              >
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  quality={90}
                />
              </motion.div>
            </AnimatePresence>

            {/* Badges Oficiales */}
            <div className="absolute left-4 top-4 flex flex-col gap-1.5 z-10">
              {product.isNew && (
                <span className="rounded-full bg-white/95 px-3 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-neutral-900 shadow-xs backdrop-blur-xs">
                  Nuevo
                </span>
              )}
              {isOutOfStock && (
                <span className="rounded-full bg-neutral-900 px-3 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-white shadow-xs">
                  Agotado
                </span>
              )}
            </div>

            {/* Flechas de Navegación Anterior / Siguiente */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur-xs transition-transform hover:scale-110 hover:bg-white active:scale-95"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur-xs transition-transform hover:scale-110 hover:bg-white active:scale-95"
                  aria-label="Foto siguiente"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}

            {/* Contador de Fotos (ej: 1 / 4) */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 z-10 rounded-full bg-white/90 px-3 py-1 font-mono text-xs font-bold text-neutral-800 shadow-xs backdrop-blur-xs">
                {selectedImageIdx + 1} / {images.length}
              </div>
            )}
          </div>
        </div>

        {/* ─── Columna Derecha: Información y Opciones de Compra ─── */}
        <div className="lg:col-span-6 space-y-5">
          <Reveal y={12}>
            {/* Título de la Prenda */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 leading-tight">
              {product.name}
            </h1>

            {/* Subtítulo / Fit */}
            {fitLabel && (
              <p className="mt-1 text-lg font-medium text-neutral-500">
                {fitLabel}
              </p>
            )}

            {/* Precio */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold tabular-nums text-neutral-900">
                {retailPrice ? formatPEN(retailPrice.amount) : "Precio no disponible"}
              </span>
              {retailPrice?.compareAtAmount && (
                <span className="text-base tabular-nums text-neutral-400 line-through">
                  {formatPEN(retailPrice.compareAtAmount)}
                </span>
              )}
            </div>

            {/* Resumen corto / Balas */}
            {product.shortDescription && (
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                {product.shortDescription}
              </p>
            )}

            {/* Selector de Color */}
            {uniqueColors.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-bold text-neutral-900">
                  Color: <span className="font-semibold text-neutral-700">{selectedColor}</span>
                </p>
                <div
                  className="mt-2.5 flex items-center gap-3"
                  role="radiogroup"
                  aria-label="Seleccionar color"
                >
                  {uniqueColors.map((c) => {
                    const isSelected = selectedColor === c.name;
                    const inStock = colorInStock(product.variants, c.name);

                    return (
                      <button
                        key={c.name}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={c.name}
                        onClick={() => {
                          setSelectedColor(c.name);
                          setSizeHint(false);
                        }}
                        title={inStock ? c.name : `${c.name} (agotado)`}
                        className={cn(
                          "size-8 rounded-full border border-black/10 transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#801323]",
                          isSelected && "ring-2 ring-offset-2 ring-[#801323]",
                          !inStock && "opacity-35",
                        )}
                        style={{ backgroundColor: c.swatch }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selector de Talla con Enlace a Guía de Tallas */}
            {uniqueSizes.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-neutral-900">Elige tu talla</p>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0055FF] hover:underline transition-colors"
                  >
                    <FaRulerHorizontal className="size-3 text-[#0055FF]" />
                    <span>Guía de tallas</span>
                  </button>
                </div>

                <div
                  className="mt-2.5 flex flex-wrap gap-2.5"
                  role="radiogroup"
                  aria-label="Seleccionar talla"
                >
                  {uniqueSizes.map((size) => {
                    const available = isSizeAvailable(size);
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={!available}
                        onClick={() => {
                          setSelectedSize(size);
                          setSizeHint(false);
                        }}
                        className={cn(
                          "flex h-11 min-w-14 items-center justify-center rounded-xl border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#801323]",
                          isSelected
                            ? "border-[#801323] bg-[#801323]/5 font-bold text-[#801323] shadow-xs"
                            : available
                              ? "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500"
                              : "border-neutral-200 bg-neutral-100 text-neutral-400 line-through cursor-not-allowed",
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {sizeHint && !selectedSize && (
                  <p role="alert" className="mt-2 text-xs font-semibold text-[#801323]">
                    Selecciona una talla para continuar.
                  </p>
                )}
              </div>
            )}

            {/* Disponibilidad en stock */}
            {selectedVariant && (
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium">
                {selectedVariant.stock > 0 ? (
                  <>
                    <Check className="size-4 text-emerald-600" aria-hidden />
                    <span className="text-emerald-800">
                      En stock — {selectedVariant.stock} {selectedVariant.stock === 1 ? "unidad disponible" : "unidades disponibles"}
                    </span>
                  </>
                ) : (
                  <>
                    <Package className="size-4 text-neutral-400" aria-hidden />
                    <span className="text-neutral-500">Agotado en esta combinación</span>
                  </>
                )}
              </div>
            )}

            {/* Selector de Cantidad */}
            {!isOutOfStock && (
              <div className="mt-6">
                <p className="text-xs font-bold text-neutral-700">Cantidad</p>
                <div className="mt-2 inline-flex items-center rounded-xl border border-neutral-300 bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isAddingCurrent}
                    aria-label="Disminuir cantidad"
                    className="flex size-10 items-center justify-center text-neutral-600 transition-colors hover:text-black disabled:opacity-30"
                  >
                    <Minus className="size-3.5" aria-hidden />
                  </button>
                  <span className="w-12 text-center font-mono text-sm font-bold tabular-nums text-neutral-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxSelectableQty, q + 1))}
                    disabled={quantity >= maxSelectableQty || isAddingCurrent}
                    aria-label="Aumentar cantidad"
                    className="flex size-10 items-center justify-center text-neutral-600 transition-colors hover:text-black disabled:opacity-30"
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            )}

            {actionFeedback && (
              <p role="alert" className="mt-3 text-xs font-semibold text-[#801323]">
                {actionFeedback}
              </p>
            )}

            {/* Botones de Acción: Agregar a la bolsa + Favorito */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  setActionFeedback(null);
                  if (uniqueSizes.length > 0 && !selectedSize) {
                    setSizeHint(true);
                    return;
                  }
                  const targetVariant =
                    selectedVariant ??
                    product.variants.find((v) => v.isActive && v.stock > 0);
                  if (!targetVariant) {
                    setActionFeedback("Esta combinación no tiene stock disponible.");
                    return;
                  }
                  const res = await addItem({
                    variantId: targetVariant.id,
                    quantity,
                    openDrawerOnSuccess: true,
                  });
                  if (!res.success && res.error) {
                    setActionFeedback(res.error);
                  }
                }}
                disabled={
                  isOutOfStock ||
                  isAddingCurrent ||
                  (selectedVariant !== null && selectedVariant.stock <= 0)
                }
                className={cn(
                  "flex h-13 flex-1 items-center justify-center gap-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#801323]",
                  isOutOfStock || (selectedVariant !== null && selectedVariant.stock <= 0)
                    ? "cursor-not-allowed bg-neutral-300 text-neutral-500 shadow-none"
                    : "bg-[#801323] hover:bg-[#6b0f1c] shadow-[#801323]/25",
                )}
              >
                {isAddingCurrent ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span>Agregando a tu bolsa...</span>
                  </>
                ) : isOutOfStock ? (
                  <span>Agotado</span>
                ) : (
                  <>
                    <ShoppingBag className="size-4" aria-hidden />
                    <span>Agregar a la bolsa</span>
                  </>
                )}
              </button>

              <button
                type="button"
                data-testid="product-detail-favorite-button"
                aria-pressed={favorited}
                onClick={() => void toggleFavorite(product.slug, product.name)}
                className={cn(
                  "flex size-13 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#801323]",
                  favorited
                    ? "border-[#801323] bg-red-50 text-[#801323]"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-black hover:text-black",
                )}
                aria-label={
                  favorited
                    ? `Quitar ${product.name} de favoritos`
                    : `Guardar ${product.name} en favoritos`
                }
              >
                <Heart
                  className={cn("size-5", favorited && "fill-[#801323] text-[#801323]")}
                />
              </button>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════
                LOS TRES DESPLEGABLES OFICIALES DE LA FICHA AMERICAN COLT
                ═════════════════════════════════════════════════════════════════════ */}
            <div className="mt-8 space-y-3">
              {/* ── 1. DESPLEGABLE: DESCRIPCIÓN REAL DEL PRODUCTO ── */}
              <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-[#FAF8F5] shadow-2xs transition-colors">
                <button
                  type="button"
                  id="accordion-description-header"
                  aria-expanded={showDescription}
                  aria-controls="accordion-description-content"
                  onClick={() => setShowDescription((prev) => !prev)}
                  className="flex w-full items-center justify-between p-4 sm:p-4.5 text-left transition-colors hover:bg-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#801323]"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-4 text-neutral-800" aria-hidden />
                    <span className="text-sm font-bold text-neutral-900">
                      Descripción
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 text-neutral-500 transition-transform duration-200",
                      showDescription && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>

                <AnimatePresence initial={false}>
                  {showDescription && (
                    <motion.div
                      id="accordion-description-content"
                      role="region"
                      aria-labelledby="accordion-description-header"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: ease.soft }}
                      className="overflow-hidden border-t border-neutral-200/70"
                    >
                      <div className="p-4 sm:p-5 space-y-4 text-xs leading-relaxed text-neutral-700">
                        {/* Texto real completo del producto */}
                        <p className="text-neutral-800 font-normal">
                          {product.fullDescription || product.shortDescription || "Prenda de confección nacional de alta calidad en algodón peruano."}
                        </p>

                        {/* Ficha técnica estructurada cuando hay datos del catálogo */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200/60 font-sans">
                          {fitLabel && (
                            <div className="rounded-xl bg-white p-2.5 border border-neutral-200/80">
                              <span className="block font-bold text-[0.65rem] uppercase tracking-wider text-neutral-400">
                                Corte / Calce
                              </span>
                              <span className="font-semibold text-neutral-900">{fitLabel}</span>
                            </div>
                          )}

                          <div className="rounded-xl bg-white p-2.5 border border-neutral-200/80">
                            <span className="block font-bold text-[0.65rem] uppercase tracking-wider text-neutral-400">
                              Origen y Marca
                            </span>
                            <span className="font-semibold text-neutral-900">
                              American Colt JEANS™ (Perú)
                            </span>
                          </div>

                          <div className="rounded-xl bg-white p-2.5 border border-neutral-200/80">
                            <span className="block font-bold text-[0.65rem] uppercase tracking-wider text-neutral-400">
                              Tejido / Confección
                            </span>
                            <span className="font-semibold text-neutral-900">
                              {product.category.name.toLowerCase().includes("jean")
                                ? "Denim Ring Spun de alto gramaje"
                                : product.category.name.toLowerCase().includes("drill") || product.name.toLowerCase().includes("drill")
                                  ? "Drill Stretch alta recuperación"
                                  : "100% Algodón Peruano de tacto suave"}
                            </span>
                          </div>

                          <div className="rounded-xl bg-white p-2.5 border border-neutral-200/80">
                            <span className="block font-bold text-[0.65rem] uppercase tracking-wider text-neutral-400">
                              Cuidados de Lavado
                            </span>
                            <span className="font-semibold text-neutral-900">
                              Lavar al revés con agua fría
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── 2. DESPLEGABLE: ENVÍOS Y CAMBIOS ── */}
              <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-[#FAF8F5] shadow-2xs transition-colors">
                <button
                  type="button"
                  id="accordion-shipping-header"
                  aria-expanded={showShipping}
                  aria-controls="accordion-shipping-content"
                  onClick={() => setShowShipping((prev) => !prev)}
                  className="flex w-full items-center justify-between p-4 sm:p-4.5 text-left transition-colors hover:bg-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#801323]"
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="size-4 text-neutral-800" aria-hidden />
                    <span className="text-sm font-bold text-neutral-900">
                      Envíos y cambios
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 text-neutral-500 transition-transform duration-200",
                      showShipping && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>

                <AnimatePresence initial={false}>
                  {showShipping && (
                    <motion.div
                      id="accordion-shipping-content"
                      role="region"
                      aria-labelledby="accordion-shipping-header"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: ease.soft }}
                      className="overflow-hidden border-t border-neutral-200/70"
                    >
                      <div className="p-4 sm:p-5 space-y-5 text-xs text-neutral-700">
                        {/* Bloque 1: Lima Metropolitana */}
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                            <span className="size-2 rounded-full bg-emerald-600" />
                            <span>Lima Metropolitana y Callao (Distritos habilitados)</span>
                          </div>
                          <p className="mt-1 text-neutral-500 text-[0.72rem]">
                            Despacho directo a domicilio en todos los distritos activos de la capital:
                          </p>

                          {/* Lista alfabética en varias columnas en escritorio y legible en celular */}
                          <div className="mt-2.5 max-h-48 overflow-y-auto rounded-xl border border-neutral-200/80 bg-white p-3 shadow-2xs">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-1.5 font-mono text-[0.68rem] text-neutral-700">
                              {shippingCoverage.enabledLimaDistricts.map((district) => (
                                <span key={district} className="truncate">
                                  • {district}
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="mt-2 text-[0.7rem] text-neutral-500 italic">
                            El costo de envío se calcula cuando eliges tu destino al finalizar la compra.
                          </p>
                        </div>

                        {/* Bloque 2: Provincias */}
                        <div className="pt-3 border-t border-neutral-200/60">
                          <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                            <Truck className="size-3.5 text-[#0055FF]" />
                            <span>Envíos a Provincias</span>
                          </div>

                          <p className="mt-1 text-neutral-500 text-[0.72rem]">
                            Despachamos hacia todas las regiones del Perú a través de agencias autorizadas:
                          </p>

                          {/* Agencias activas (incluye Shalom únicamente si está habilitada) */}
                          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {shippingCoverage.activeAgencies.map((agency) => (
                              <div
                                key={agency.code}
                                className="rounded-xl border border-neutral-200/80 bg-white p-3 shadow-2xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <strong className="font-bold text-neutral-900">
                                    {agency.name}
                                  </strong>
                                  <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-[#0055FF]">
                                    {agency.estimatedDays}
                                  </span>
                                </div>
                                <p className="text-[0.68rem] text-neutral-500">
                                  {agency.description}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Destinos configurados */}
                          {shippingCoverage.provinceDestinations.length > 0 && (
                            <div className="mt-2.5 rounded-xl border border-neutral-200/80 bg-white p-3 text-[0.68rem] text-neutral-600 space-y-1">
                              <span className="font-bold text-neutral-800 block uppercase tracking-wider text-[0.62rem]">
                                Destinos con cobertura configurada:
                              </span>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {shippingCoverage.provinceDestinations.map((d) => (
                                  <li key={d.code}>
                                    <strong>{d.name}</strong> ({d.estimatedDays})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <p className="mt-2 text-[0.7rem] text-neutral-500 italic">
                            El costo de envío se calcula cuando eliges tu destino al finalizar la compra.
                          </p>
                        </div>

                        {/* Bloque 3: Cambios y Devoluciones */}
                        <div className="pt-3 border-t border-neutral-200/60">
                          <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                            <RotateCcw className="size-3.5 text-[#801323]" />
                            <span>Cambios y Devoluciones (Garantía Oficial)</span>
                          </div>

                          <div className="mt-2 rounded-xl border border-neutral-200/80 bg-white p-3 space-y-1.5 text-[0.72rem] text-neutral-600">
                            <p>
                              • <strong>Plazo de solicitud:</strong> Hasta siete (7) días calendario posteriores a la recepción de tu compra.
                            </p>
                            <p>
                              • <strong>Condición de la prenda:</strong> Artículo sin uso, sin lavar, con etiquetas y empaques originales intactos, junto a la boleta o factura emitida.
                            </p>
                            <p>
                              • <strong>Pedidos mayoristas B2B:</strong> Garantía ante defectos de fabricación reportados dentro de las 48 horas de recibido el lote.
                            </p>
                            <div className="pt-1.5">
                              <Link
                                href="/cambios-y-devoluciones"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0055FF] hover:underline"
                              >
                                <span>Gestionar solicitud de cambio de talla o modelo</span>
                                <ArrowRight className="size-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── 3. DESPLEGABLE: DISPONIBLE POR MAYOR B2B ── */}
              {product.isWholesale && wholesalePrices.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-[#FAF8F5] shadow-2xs transition-colors">
                  <button
                    type="button"
                    id="accordion-wholesale-header"
                    aria-expanded={showWholesale}
                    aria-controls="accordion-wholesale-content"
                    onClick={() => setShowWholesale((prev) => !prev)}
                    className="flex w-full items-center justify-between p-4 sm:p-4.5 text-left transition-colors hover:bg-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#801323]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="size-4 text-neutral-800" aria-hidden />
                      <span className="text-sm font-bold text-neutral-900">
                        Disponible por mayor
                      </span>
                      {userRole === "business_approved" && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-900">
                          Tarifas B2B
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 text-neutral-500 transition-transform duration-200",
                        showWholesale && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {showWholesale && (
                      <motion.div
                        id="accordion-wholesale-content"
                        role="region"
                        aria-labelledby="accordion-wholesale-header"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: ease.soft }}
                        className="overflow-hidden border-t border-neutral-200/70"
                      >
                        <div className="p-4 sm:p-5 space-y-3 text-xs text-neutral-700">
                          {isWholesaleApproved ? (
                            <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-3 text-emerald-900">
                              ✓ Condición mayorista autorizada activa para tu empresa.
                            </div>
                          ) : userRole === "business_pending" ? (
                            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-amber-900">
                              Tu solicitud empresarial con RUC está en evaluación comercial.
                            </div>
                          ) : (
                            <p className="text-neutral-500 text-[0.72rem]">
                              Escalas de precio de fábrica para tiendas, boutiques y distribuidores autorizados con RUC:
                            </p>
                          )}

                          {/* Escalas de volumen */}
                          <div className="rounded-xl border border-neutral-200/80 bg-white divide-y divide-neutral-100">
                            {wholesalePrices.map((wp) => (
                              <div
                                key={wp.id}
                                className="flex items-center justify-between p-2.5 text-xs"
                              >
                                <span className="font-medium text-neutral-700">
                                  Desde {wp.minQuantity} uds.
                                  {wp.maxQuantity ? ` hasta ${wp.maxQuantity} uds.` : " a más"}
                                </span>
                                <span className="font-mono font-bold text-[#801323]">
                                  {formatPEN(wp.amount)} / ud.
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Botones según rol */}
                          {isWholesaleApproved ? (
                            <Link
                              href={`/mayorista/cotizaciones?productSlug=${product.slug}`}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-xs font-bold text-white shadow-xs transition-colors"
                            >
                              <FileText className="size-3.5" />
                              <span>Solicitar cotización B2B de este modelo</span>
                              <ArrowRight className="size-3.5" />
                            </Link>
                          ) : userRole === "business_pending" ? (
                            <Link
                              href="/mayorista/solicitud"
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-xs font-bold text-white shadow-xs transition-colors"
                            >
                              <span>Consultar estado de solicitud comercial</span>
                              <ArrowRight className="size-3.5" />
                            </Link>
                          ) : (
                            <Link
                              href="/mayorista/registro"
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#801323] hover:bg-[#6b0f1c] text-xs font-bold text-white shadow-xs transition-colors"
                            >
                              <Building2 className="size-3.5" />
                              <span>Registrar empresa mayorista con RUC</span>
                              <ArrowRight className="size-3.5" />
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── Modal Guía de Tallas Anatómicas ── */}
      <AnimatePresence>
        {showSizeGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <FaRulerHorizontal className="size-4 text-[#801323]" />
                  <h3
                    id="size-guide-title"
                    className="text-base font-extrabold uppercase tracking-tight text-neutral-900"
                  >
                    Guía de Tallas Oficial American Colt
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(false)}
                  className="size-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black"
                >
                  <X className="size-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-600">
                Medidas anatómicas estándar en centímetros (cm) con tolerancia de ±1 cm en tela stretch de alta recuperación.
              </p>

              <div className="overflow-x-auto rounded-xl border border-neutral-200">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#FAF8F5] text-neutral-800 font-bold border-b border-neutral-200">
                    <tr>
                      <th className="p-2.5">Talla</th>
                      <th className="p-2.5">Cintura</th>
                      <th className="p-2.5">Cadera</th>
                      <th className="p-2.5">Largo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    <tr>
                      <td className="p-2.5 font-bold text-neutral-900">28</td>
                      <td className="p-2.5">74 - 76 cm</td>
                      <td className="p-2.5">90 - 92 cm</td>
                      <td className="p-2.5">102 cm</td>
                    </tr>
                    <tr className="bg-neutral-50/60 font-semibold text-[#801323]">
                      <td className="p-2.5 font-bold">30</td>
                      <td className="p-2.5">78 - 80 cm</td>
                      <td className="p-2.5">94 - 96 cm</td>
                      <td className="p-2.5">103 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-neutral-900">32</td>
                      <td className="p-2.5">82 - 85 cm</td>
                      <td className="p-2.5">98 - 100 cm</td>
                      <td className="p-2.5">104 cm</td>
                    </tr>
                    <tr className="bg-neutral-50/60">
                      <td className="p-2.5 font-bold text-neutral-900">34</td>
                      <td className="p-2.5">86 - 90 cm</td>
                      <td className="p-2.5">102 - 104 cm</td>
                      <td className="p-2.5">105 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-neutral-900">36</td>
                      <td className="p-2.5">91 - 95 cm</td>
                      <td className="p-2.5">106 - 108 cm</td>
                      <td className="p-2.5">106 cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-1 text-[0.7rem] text-neutral-500">
                <span className="flex items-center gap-1 font-medium text-emerald-700">
                  <FaShieldHalved className="size-3" />
                  Cambio de talla 100% garantizado
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(false)}
                  className="font-bold text-[#0055FF] hover:underline"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── También te puede interesar ── */}
      {related.length > 0 && (
        <section className="mt-20 lg:mt-28" aria-labelledby="relacionados-title">
          <Reveal>
            <div className="flex items-baseline justify-between border-b border-neutral-200/80 pb-4">
              <h2
                id="relacionados-title"
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900"
              >
                También te puede interesar
              </h2>
              <Link
                href={`/catalogo/${product.category.slug}`}
                className="text-xs font-bold text-[#0055FF] hover:underline"
              >
                Ver más {product.category.name.toLowerCase()} →
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <ProductCard product={p} eager={i < 2} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
