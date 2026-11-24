"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Clock,
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
import type {
  ProductRecord,
  ProductImageRecord,
  CatalogProduct,
} from "@/types/catalog";
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

const IMAGE_ROLE_WEIGHT: Record<string, number> = {
  portada: 0,
  cerca: 1,
  reverso: 2,
  ficha: 3,
  galeria: 4,
};

const IMAGE_ROLE_LABEL: Record<string, string | null> = {
  portada: "Modelo",
  cerca: "De cerca",
  reverso: "Reverso",
  ficha: "Ficha",
  galeria: null,
};

function sortImagesByRole(list: ProductImageRecord[]): ProductImageRecord[] {
  return [...list].sort((a, b) => {
    const wa = IMAGE_ROLE_WEIGHT[a.imageType ?? "galeria"] ?? 4;
    const wb = IMAGE_ROLE_WEIGHT[b.imageType ?? "galeria"] ?? 4;
    if (wa !== wb) return wa - wb;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
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

  // Variant selection options
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

  // Galería base (imágenes generales del producto)
  const generalImages = useMemo<ProductImageRecord[]>(() => {
    const fallbackPlaceholder: ProductImageRecord[] = [
      {
        id: 0,
        url: "/placeholder.jpg",
        alt: product.name,
        sortOrder: 0,
        isPrimary: true,
        imageType: "portada",
        colorName: null,
      },
    ];
    if (product.images.length === 0) return fallbackPlaceholder;
    const generalOnly = product.images.filter(
      (im) => !im.colorName || !im.colorName.trim(),
    );
    return sortImagesByRole(generalOnly.length > 0 ? generalOnly : product.images);
  }, [product.images, product.name]);

  const getImagesForColor = useCallback(
    (colorName: string | null): ProductImageRecord[] | null => {
      if (!colorName || !colorName.trim()) return null;
      const target = colorName.trim().toLowerCase();
      const matching = product.images.filter(
        (im) => im.colorName && im.colorName.trim().toLowerCase() === target,
      );
      if (matching.length === 0) return null;

      const sorted = sortImagesByRole(matching);
      // Si la ficha técnica existe en la galería general y el color no tiene una propia, la anexamos al final
      const generalFicha = generalImages.find((im) => im.imageType === "ficha");
      const hasColorFicha = sorted.some((im) => im.imageType === "ficha");
      if (generalFicha && !hasColorFicha) {
        return [...sorted, generalFicha];
      }
      return sorted;
    },
    [product.images, generalImages],
  );

  const initialColor = useMemo(() => {
    const mainPortadaUrl = generalImages[0]?.url;
    if (mainPortadaUrl) {
      const matched = uniqueColors.find((c) => {
        const keyLower = c.name.trim().toLowerCase();
        return product.images.some(
          (im) =>
            im.colorName &&
            im.colorName.trim().toLowerCase() === keyLower &&
            im.url === mainPortadaUrl,
        );
      });
      if (matched) return matched.name;
    }
    return uniqueColors[0]?.name ?? null;
  }, [generalImages, uniqueColors, product.images]);

  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor);
  const [displayedImages, setDisplayedImages] = useState<ProductImageRecord[]>(
    () => getImagesForColor(initialColor) ?? generalImages,
  );
  const [pendingColorNotice, setPendingColorNotice] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const images = displayedImages.length > 0 ? displayedImages : generalImages;
  const selectedImage = images[selectedImageIdx] ?? images[0];

  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    setSizeHint(false);

    const colorGallery = getImagesForColor(colorName);
    if (colorGallery && colorGallery.length > 0) {
      setDisplayedImages(colorGallery);
      setSelectedImageIdx(0);
      setPendingColorNotice(null);
    } else {
      // Conservamos las imágenes que sí se estaban mostrando y avisamos al cliente
      setPendingColorNotice(colorName);
    }
  };

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
    <div className="pb-16 pt-2 text-neutral-900 sm:pt-4 lg:pb-28 lg:pt-8">
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-14">
        {/* ─── Columna Izquierda: Galería Moderna ─── */}
        <div className="flex flex-col-reverse items-start gap-2.5 sm:flex-row sm:gap-4 lg:col-span-6">
          {/* Miniaturas verticales (escritorio) / fila horizontal (móvil) */}
          {images.length > 1 && (
            <div className="no-scrollbar flex w-full shrink-0 gap-2 overflow-x-auto sm:max-h-[640px] sm:w-20 sm:flex-col sm:gap-2.5 sm:overflow-y-auto">
              {images.map((img, i) => {
                const roleLabel = img.imageType
                  ? IMAGE_ROLE_LABEL[img.imageType] ?? null
                  : null;
                return (
                  <button
                    key={`${img.id}-${i}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(i)}
                    className={cn(
                      "relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] sm:w-20",
                      i === selectedImageIdx
                        ? "border-[#2563EB] shadow-sm ring-1 ring-[#2563EB]"
                        : "border-neutral-200/80 opacity-70 hover:border-neutral-400 hover:opacity-100",
                    )}
                    aria-label={`Ver foto ${i + 1} de ${product.name}`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      unoptimized={img.url.startsWith("/api/media/")}
                      sizes="80px"
                      className="object-cover"
                    />
                    {roleLabel && (
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-slate-950/70 py-0.5 text-center font-mono text-[0.48rem] font-bold uppercase tracking-wider text-white backdrop-blur-2xs sm:text-[0.52rem]">
                        {roleLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Imagen Principal Grande con Bordes Redondeados 3D y Fondo Suave */}
          <div className="relative aspect-[3/3.55] w-full flex-1 overflow-hidden rounded-2xl border border-neutral-200/60 bg-[#EBF3EF] shadow-xs sm:aspect-[3/4] sm:rounded-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedImage.id}-${selectedImage.url}`}
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
                  unoptimized={selectedImage.url.startsWith("/api/media/")}
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
              {selectedImage.imageType && IMAGE_ROLE_LABEL[selectedImage.imageType] && (
                <span className="rounded-full bg-slate-950/75 px-3 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-xs">
                  {IMAGE_ROLE_LABEL[selectedImage.imageType]}
                </span>
              )}
            </div>

            {/* Aviso sobre la imagen cuando el color seleccionado aún no tiene fotos propias */}
            <AnimatePresence>
              {pendingColorNotice && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-4 left-4 right-20 z-10 flex items-center gap-2 rounded-2xl border border-amber-300/80 bg-slate-950/85 px-3.5 py-2 text-xs font-semibold text-amber-100 shadow-lg backdrop-blur-md"
                >
                  <Clock className="size-3.5 shrink-0 text-amber-300" aria-hidden />
                  <span>
                    Foto en color <strong>{pendingColorNotice}</strong> en proceso de subida
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Flechas de Navegación Anterior / Siguiente */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur-xs transition-transform hover:scale-110 hover:bg-white active:scale-95 sm:left-3 sm:size-9"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="size-4 sm:size-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur-xs transition-transform hover:scale-110 hover:bg-white active:scale-95 sm:right-3 sm:size-9"
                  aria-label="Foto siguiente"
                >
                  <ChevronRight className="size-4 sm:size-5" />
                </button>
              </>
            )}

            {/* Contador de Fotos (ej: 1 / 4) */}
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 z-10 rounded-full bg-white/90 px-2.5 py-0.5 font-mono text-[0.65rem] font-bold text-neutral-800 shadow-xs backdrop-blur-xs sm:bottom-4 sm:right-4 sm:px-3 sm:py-1 sm:text-xs">
                {selectedImageIdx + 1} / {images.length}
              </div>
            )}
          </div>
        </div>

        {/* ─── Columna Derecha: Información y Opciones de Compra ─── */}
        <div className="space-y-3.5 sm:space-y-5 lg:col-span-6">
          <Reveal y={12}>
            {/* Categoría oficial de la prenda */}
            <div className="mb-1.5 flex flex-wrap items-center gap-2 sm:mb-2">
              <Link
                href={`/catalogo/${product.category.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-2.5 py-0.5 font-mono text-[0.58rem] font-extrabold uppercase tracking-widest text-[#DC2626] transition-colors hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white sm:px-3 sm:py-1 sm:text-[0.65rem]"
              >
                <span>{product.category.name}</span>
              </Link>
            </div>

            {/* Título de la Prenda */}
            <h1 className="text-xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            {/* Subtítulo / Fit */}
            {fitLabel && (
              <p className="mt-0.5 text-sm font-medium text-neutral-500 sm:mt-1 sm:text-lg">
                {fitLabel}
              </p>
            )}

            {/* Precio */}
            <div className="mt-2 flex items-baseline gap-2.5 sm:mt-3 sm:gap-3">
              <span className="text-xl font-extrabold tabular-nums text-neutral-900 sm:text-3xl">
                {retailPrice ? formatPEN(retailPrice.amount) : "Precio no disponible"}
              </span>
              {retailPrice?.compareAtAmount && (
                <span className="text-sm tabular-nums text-neutral-400 line-through sm:text-base">
                  {formatPEN(retailPrice.compareAtAmount)}
                </span>
              )}
            </div>

            {/* Resumen corto / Balas */}
            {product.shortDescription && (
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 sm:mt-3 sm:text-sm">
                {product.shortDescription}
              </p>
            )}

            {/* Selector de Color */}
            {uniqueColors.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <p className="text-xs font-bold text-neutral-900 sm:text-sm">
                  Color: <span className="font-semibold text-neutral-700">{selectedColor}</span>
                </p>
                <div
                  className="mt-2 flex flex-wrap items-center gap-2.5 sm:mt-2.5 sm:gap-3"
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
                        onClick={() => handleSelectColor(c.name)}
                        title={inStock ? c.name : `${c.name} (agotado)`}
                        className={cn(
                          "size-7 rounded-full border border-black/10 transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] sm:size-8",
                          isSelected && "ring-2 ring-[#2563EB] ring-offset-2",
                          !inStock && "opacity-35",
                        )}
                        style={{ backgroundColor: c.swatch }}
                      />
                    );
                  })}
                </div>

                {/* Aviso amigable cuando el color elegido aún no tiene imágenes subidas */}
                <AnimatePresence>
                  {pendingColorNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      role="status"
                      className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-[0.7rem] font-medium text-amber-950 shadow-2xs sm:mt-3 sm:gap-2.5 sm:rounded-2xl sm:px-3.5 sm:py-2.5 sm:text-xs"
                    >
                      <Clock
                        className="mt-0.5 size-3.5 shrink-0 text-amber-600 sm:size-4"
                        aria-hidden
                      />
                      <p>
                        La imagen en color{" "}
                        <strong className="font-extrabold">{pendingColorNotice}</strong>{" "}
                        está en proceso de subida. Mostramos la vista de referencia.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Selector de Talla con Enlace a Guía de Tallas */}
            {uniqueSizes.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-neutral-900 sm:text-sm">Elige tu talla</p>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-[#0055FF] transition-colors hover:underline sm:gap-1.5 sm:text-xs"
                  >
                    <FaRulerHorizontal className="size-3 text-[#0055FF]" />
                    <span>Guía de tallas</span>
                  </button>
                </div>

                <div
                  className="mt-2 flex flex-wrap gap-1.5 sm:mt-2.5 sm:gap-2.5"
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
                          "flex h-9 min-w-11 items-center justify-center rounded-xl border px-2 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] sm:h-11 sm:min-w-14 sm:text-sm",
                          isSelected
                            ? "border-[#2563EB] bg-blue-50/70 font-bold text-[#1E40AF] shadow-xs"
                            : available
                              ? "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500"
                              : "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 line-through",
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {sizeHint && !selectedSize && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-[#DC2626] sm:mt-2">
                    Selecciona una talla para continuar.
                  </p>
                )}
              </div>
            )}

            {/* Disponibilidad en stock + Selector de Cantidad compactos */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:mt-6 sm:block">
              {selectedVariant && (
                <div className="flex items-center gap-1.5 text-[0.7rem] font-medium sm:text-xs">
                  {selectedVariant.stock > 0 ? (
                    <>
                      <Check className="size-3.5 text-emerald-600 sm:size-4" aria-hidden />
                      <span className="text-emerald-800">
                        En stock — {selectedVariant.stock} {selectedVariant.stock === 1 ? "ud." : "uds."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Package className="size-3.5 text-neutral-400 sm:size-4" aria-hidden />
                      <span className="text-neutral-500">Agotado en esta combinación</span>
                    </>
                  )}
                </div>
              )}

              {!isOutOfStock && (
                <div className="flex items-center gap-2.5 sm:mt-5 sm:block">
                  <p className="text-[0.7rem] font-bold text-neutral-700 sm:text-xs">Cantidad</p>
                  <div className="inline-flex items-center rounded-xl border border-neutral-300 bg-white shadow-2xs sm:mt-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isAddingCurrent}
                      aria-label="Disminuir cantidad"
                      className="flex size-8 items-center justify-center text-neutral-600 transition-colors hover:text-black disabled:opacity-30 sm:size-10"
                    >
                      <Minus className="size-3 sm:size-3.5" aria-hidden />
                    </button>
                    <span className="w-9 text-center font-mono text-xs font-bold tabular-nums text-neutral-900 sm:w-12 sm:text-sm">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxSelectableQty, q + 1))}
                      disabled={quantity >= maxSelectableQty || isAddingCurrent}
                      aria-label="Aumentar cantidad"
                      className="flex size-8 items-center justify-center text-neutral-600 transition-colors hover:text-black disabled:opacity-30 sm:size-10"
                    >
                      <Plus className="size-3 sm:size-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {actionFeedback && (
              <p role="alert" className="mt-2.5 text-xs font-semibold text-[#DC2626] sm:mt-3">
                {actionFeedback}
              </p>
            )}

            {/* Botones de Acción: Agregar a la bolsa + Favorito */}
            <div className="mt-4 flex items-center gap-2.5 sm:mt-6 sm:gap-3">
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
                  "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[0.7rem] font-bold uppercase tracking-wider text-white shadow-md transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] sm:h-13 sm:gap-2.5 sm:text-xs",
                  isOutOfStock || (selectedVariant !== null && selectedVariant.stock <= 0)
                    ? "cursor-not-allowed bg-neutral-300 text-neutral-500 shadow-none"
                    : "bg-flow bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] shadow-red-600/25 hover:from-[#7F1D1D] hover:via-[#B91C1C] hover:to-[#DC2626]",
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
                  "flex size-11 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] sm:size-13",
                  favorited
                    ? "border-rose-300 bg-rose-50 text-[#DC2626]"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-black hover:text-black",
                )}
                aria-label={
                  favorited
                    ? `Quitar ${product.name} de favoritos`
                    : `Guardar ${product.name} en favoritos`
                }
              >
                <Heart
                  className={cn("size-4 sm:size-5", favorited && "fill-[#DC2626] text-[#DC2626]")}
                />
              </button>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════
                LOS TRES DESPLEGABLES OFICIALES DE LA FICHA AMERICAN COLT
                ═════════════════════════════════════════════════════════════════════ */}
            <div className="mt-5 space-y-2.5 sm:mt-8 sm:space-y-3">
              {/* ── 1. DESPLEGABLE: DESCRIPCIÓN REAL DEL PRODUCTO ── */}
              <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-[#FAF8F5] shadow-2xs transition-colors">
                <button
                  type="button"
                  id="accordion-description-header"
                  aria-expanded={showDescription}
                  aria-controls="accordion-description-content"
                  onClick={() => setShowDescription((prev) => !prev)}
                  className="flex w-full items-center justify-between p-4 sm:p-4.5 text-left transition-colors hover:bg-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
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
                  className="flex w-full items-center justify-between p-4 sm:p-4.5 text-left transition-colors hover:bg-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
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
                            <span>Lima Metropolitana y Callao (Zonas habilitadas)</span>
                          </div>
                          <p className="mt-1 text-neutral-500 text-[0.72rem]">
                            Zonas y distritos de Lima Metropolitana / Callao configurados por la tienda:
                          </p>

                          {shippingCoverage.configuredLimaPlaces.length > 0 ? (
                            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {shippingCoverage.configuredLimaPlaces.map((place) => (
                                <div
                                  key={place.code}
                                  className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/80 bg-white px-3 py-2 shadow-2xs"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-neutral-900">
                                      {place.district && place.district !== "*"
                                        ? place.district
                                        : place.name}
                                    </p>
                                    {place.district && place.district !== "*" && (
                                      <p className="truncate text-[0.65rem] text-neutral-500">
                                        {place.name}
                                      </p>
                                    )}
                                  </div>
                                  <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[0.6rem] font-bold text-emerald-700">
                                    {place.estimatedDays}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2.5 rounded-xl border border-neutral-200/80 bg-white p-3 text-[0.7rem] text-neutral-500">
                              No hay zonas de Lima habilitadas actualmente en administración.
                            </div>
                          )}

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
                            Despachamos hacia las provincias habilitadas y agencias autorizadas:
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

                          {/* Destinos provinciales configurados por admin */}
                          {shippingCoverage.provinceDestinations.length > 0 && (
                            <div className="mt-2.5 rounded-xl border border-neutral-200/80 bg-white p-3 text-[0.68rem] text-neutral-600 space-y-1.5">
                              <span className="font-bold text-neutral-800 block uppercase tracking-wider text-[0.62rem]">
                                Provincias y zonas habilitadas ({shippingCoverage.provinceDestinations.length}):
                              </span>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {shippingCoverage.provinceDestinations.map((d) => (
                                  <li key={d.code}>
                                    <strong>{d.name}</strong>
                                    {d.department && d.department !== "*"
                                      ? ` — ${d.department}${d.province && d.province !== "*" ? ` / ${d.province}` : ""}`
                                      : ""}{" "}
                                    ({d.estimatedDays})
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
                            <RotateCcw className="size-3.5 text-[#DC2626]" />
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
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E40AF] hover:underline"
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
                    className="flex w-full items-center justify-between p-4 sm:p-4.5 text-left transition-colors hover:bg-[#F5F2EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
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
                                <span className="font-mono font-bold text-[#DC2626]">
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
                              className="bg-flow inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] text-xs font-bold text-white shadow-xs transition-all hover:brightness-105"
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
                  <FaRulerHorizontal className="size-4 text-[#2563EB]" />
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
                    <tr className="bg-blue-50/50 font-semibold text-[#1E40AF]">
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
        <section className="mt-12 lg:mt-28" aria-labelledby="relacionados-title">
          <Reveal>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200/80 pb-3 sm:pb-4">
              <h2
                id="relacionados-title"
                className="text-lg font-extrabold tracking-tight text-neutral-900 sm:text-3xl"
              >
                También te puede interesar
              </h2>
              <Link
                href={`/catalogo/${product.category.slug}`}
                className="text-[0.7rem] font-bold text-[#0055FF] hover:underline sm:text-xs"
              >
                Ver más {product.category.name.toLowerCase()} →
              </Link>
            </div>
          </Reveal>
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
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
