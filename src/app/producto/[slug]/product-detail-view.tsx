"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Check, Package, ArrowRight, Heart, ChevronDown, Minus, Plus, Loader2, FileText } from "lucide-react";
import type { ProductRecord, CatalogProduct } from "@/types/catalog";
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
}

export function ProductDetailView({ product, related, userRole }: ProductDetailViewProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(product.slug);
  const { addItem, pendingVariantId } = useCart();

  // Image gallery state
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const images = product.images.length > 0 ? product.images : [{ id: 0, url: "/placeholder.jpg", alt: product.name, sortOrder: 0, isPrimary: true }];
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
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Find the matching variant (solo variantes activas)
  const selectedVariant = useMemo(
    () => findVariant(product.variants, selectedColor, selectedSize),
    [product.variants, selectedColor, selectedSize],
  );

  // Check if a size is available for the selected color
  const isSizeAvailable = (size: string) => sizeInStock(product.variants, selectedColor, size);

  // Prices
  const retailPrice = product.prices.find((p) => p.type === "retail");
  const wholesalePrices = product.prices
    .filter((p) => p.type === "wholesale")
    .sort((a, b) => a.minQuantity - b.minQuantity);

  const isOutOfStock = isSoldOut(product.variants);
  const [sizeHint, setSizeHint] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const isWholesaleUser = userRole === "business_approved" || userRole === "admin";
  const maxSelectableQty = selectedVariant ? Math.max(1, selectedVariant.stock) : 99;
  const isAddingCurrent = selectedVariant !== null && pendingVariantId === selectedVariant.id;

  // Description accordion
  const [showDescription, setShowDescription] = useState(false);
  const [showWholesale, setShowWholesale] = useState(
    userRole === "business_approved" || userRole === "admin",
  );

  return (
    <div className="pb-20 pt-4 lg:pb-32 lg:pt-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* ─── Gallery ─── */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-[3/4] overflow-hidden bg-taupe-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: ease.soft }}
                className="absolute inset-0"
              >
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  quality={85}
                />
              </motion.div>
            </AnimatePresence>

            {/* Badges */}
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {product.isNew && (
                <span className="bg-paper px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink">
                  Nuevo
                </span>
              )}
              {isOutOfStock && (
                <span className="bg-ink px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper">
                  Agotado
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageIdx(i)}
                  className={cn(
                    "relative aspect-square w-20 shrink-0 overflow-hidden border-2 transition-all duration-300",
                    i === selectedImageIdx ? "border-ink" : "border-transparent opacity-60 hover:opacity-100",
                  )}
                >
                  <Image src={img.url} alt={img.alt} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Product info ─── */}
        <div className="lg:pt-4">
          <Reveal y={16}>
            {/* Category + Audience */}
            <p className="eyebrow text-taupe-500">
              {product.audience === "mujer" ? "Mujer" : product.audience === "hombre" ? "Hombre" : "Unisex"} ·{" "}
              <Link href={`/catalogo/${product.category.slug}`} className="transition-colors hover:text-ink">
                {product.category.name}
              </Link>
            </p>

            {/* Name */}
            <h1 className="mt-3 font-display text-display-md text-ink">{product.name}</h1>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-xl font-medium tabular-nums text-ink">
                {retailPrice ? formatPEN(retailPrice.amount) : "Precio no disponible"}
              </span>
              {retailPrice?.compareAtAmount && (
                <span className="text-sm tabular-nums text-taupe-400 line-through">
                  {formatPEN(retailPrice.compareAtAmount)}
                </span>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="mt-5 text-sm leading-relaxed text-taupe-600">{product.shortDescription}</p>
            )}

            {/* Demo notice */}
            {product.isDemo && (
              <p className="mt-4 text-xs italic text-taupe-400">
                Producto de demostración — los datos pueden no representar un producto real.
              </p>
            )}

            {/* Color selector */}
            {uniqueColors.length > 0 && (
              <div className="mt-8">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-taupe-600">
                  Color: <span className="text-ink">{selectedColor}</span>
                </p>
                <div className="mt-3 flex gap-2.5" role="radiogroup" aria-label="Seleccionar color">
                  {uniqueColors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      role="radio"
                      aria-checked={selectedColor === c.name}
                      aria-label={c.name}
                      onClick={() => {
                        setSelectedColor(c.name);
                        setSelectedSize(null);
                        setSizeHint(false);
                      }}
                      title={colorInStock(product.variants, c.name) ? c.name : `${c.name} (agotado)`}
                      className={cn(
                        "size-8 rounded-full ring-1 ring-offset-2 ring-offset-paper transition-all duration-300 hover:scale-110",
                        selectedColor === c.name ? "ring-ink" : "ring-ink/15",
                        !colorInStock(product.variants, c.name) && "opacity-40",
                      )}
                      style={{ backgroundColor: c.swatch }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {uniqueSizes.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-taupe-600">Talla</p>
                <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Seleccionar talla">
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
                          "flex h-10 min-w-12 items-center justify-center border px-3 font-mono text-[0.7rem] transition-all duration-300",
                          isSelected
                            ? "border-ink bg-ink text-paper"
                            : available
                              ? "border-ink/20 text-ink hover:border-ink"
                              : "border-ink/10 text-taupe-300 line-through cursor-not-allowed",
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {sizeHint && !selectedSize && (
                  <p role="alert" className="mt-3 text-xs font-medium text-cochinilla">
                    Selecciona una talla para continuar.
                  </p>
                )}
              </div>
            )}

            {/* Stock info */}
            {selectedVariant && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-1.5 text-xs"
              >
                {selectedVariant.stock > 0 ? (
                  <>
                    <Check className="size-3.5 text-green-600" aria-hidden />
                    <span className="text-green-700">
                      En stock — {selectedVariant.stock} {selectedVariant.stock === 1 ? "unidad" : "unidades"}
                    </span>
                  </>
                ) : (
                  <>
                    <Package className="size-3.5 text-taupe-400" aria-hidden />
                    <span className="text-taupe-500">Agotado en esta combinación</span>
                  </>
                )}
              </motion.p>
            )}

            {/* Selector de cantidad */}
            {!isOutOfStock && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="product-quantity-input"
                    className="text-xs font-medium uppercase tracking-[0.14em] text-taupe-600"
                  >
                    Cantidad
                  </label>
                  {isWholesaleUser && wholesalePrices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const minW = wholesalePrices[0].minQuantity;
                        const limit = selectedVariant ? Math.min(minW, selectedVariant.stock) : minW;
                        setQuantity(Math.max(1, limit));
                      }}
                      className="font-mono text-[0.65rem] uppercase tracking-wider text-cochinilla underline hover:text-cochinilla-deep"
                    >
                      Usar lote mínimo ({wholesalePrices[0].minQuantity} uds.)
                    </button>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <div className="inline-flex h-11 items-center border border-ink/20 bg-paper">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isAddingCurrent}
                      aria-label="Disminuir cantidad"
                      className="flex size-11 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:opacity-35"
                    >
                      <Minus className="size-3.5" aria-hidden />
                    </button>
                    <input
                      id="product-quantity-input"
                      type="number"
                      min={1}
                      max={maxSelectableQty}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (Number.isNaN(val) || val < 1) {
                          setQuantity(1);
                        } else {
                          setQuantity(Math.min(val, maxSelectableQty));
                        }
                      }}
                      className="h-full w-16 border-x border-ink/10 bg-transparent text-center font-mono text-sm tabular-nums text-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxSelectableQty, q + 1))}
                      disabled={quantity >= maxSelectableQty || isAddingCurrent}
                      aria-label="Aumentar cantidad"
                      className="flex size-11 items-center justify-center text-ink transition-colors hover:bg-ink/5 disabled:opacity-35"
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </button>
                  </div>

                  {isWholesaleUser &&
                    wholesalePrices[0] &&
                    quantity >= wholesalePrices[0].minQuantity && (
                      <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-emerald-900">
                        Tarifa mayorista activa ({formatPEN(wholesalePrices[0].amount)}/ud.)
                      </span>
                    )}
                </div>
              </div>
            )}

            {actionFeedback && (
              <p role="alert" className="mt-3 text-xs font-medium text-cochinilla">
                {actionFeedback}
              </p>
            )}

            {/* CTA */}
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  setActionFeedback(null);
                  if (uniqueSizes.length > 0 && !selectedVariant) {
                    setSizeHint(true);
                    return;
                  }
                  const targetVariant = selectedVariant ?? product.variants.find((v) => v.isActive && v.stock > 0);
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
                disabled={isOutOfStock || isAddingCurrent || (selectedVariant !== null && selectedVariant.stock <= 0)}
                className={cn(
                  "flex h-14 flex-1 items-center justify-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300",
                  isOutOfStock || (selectedVariant !== null && selectedVariant.stock <= 0)
                    ? "cursor-not-allowed bg-taupe-200 text-taupe-400"
                    : "bg-ink text-paper hover:bg-cochinilla",
                )}
              >
                {isAddingCurrent ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Agregando...
                  </>
                ) : isOutOfStock ? (
                  "Agotado"
                ) : (
                  "Agregar a la bolsa"
                )}
              </button>
              <button
                type="button"
                data-testid="product-detail-favorite-button"
                aria-pressed={favorited}
                onClick={() => void toggleFavorite(product.slug, product.name)}
                className={cn(
                  "flex size-14 items-center justify-center border transition-colors duration-300",
                  favorited
                    ? "border-cochinilla bg-cochinilla text-paper hover:bg-cochinilla-deep"
                    : "border-ink/20 text-ink hover:border-ink",
                )}
                aria-label={
                  favorited
                    ? `Quitar ${product.name} de favoritos`
                    : `Guardar ${product.name} en favoritos`
                }
              >
                <Heart className={cn("size-5", favorited && "fill-current")} />
              </button>
            </div>

            {/* Wholesale info */}
            {wholesalePrices.length > 0 && (
              <div className="mt-8 border border-cochinilla/20 bg-cochinilla/5 p-5">
                <button
                  type="button"
                  onClick={() => setShowWholesale(!showWholesale)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-cochinilla" aria-hidden />
                    <span className="text-sm font-medium text-ink">
                      Disponible por mayor
                      {userRole === "business_approved" && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-semibold text-emerald-900">
                          Tarifas B2B
                        </span>
                      )}
                    </span>
                  </div>
                  <ChevronDown className={cn("size-4 text-taupe-400 transition-transform", showWholesale && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {showWholesale && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: ease.soft }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-2">
                        {userRole === "business_approved" || userRole === "admin" ? (
                          <div className="border border-emerald-300 bg-emerald-50/80 p-3 text-xs text-emerald-900 mb-3">
                            ✓ Condición mayorista autorizada para tu empresa.
                          </div>
                        ) : userRole === "business_pending" ? (
                          <div className="border border-amber-300 bg-amber-50/80 p-3 text-xs text-amber-900 mb-3">
                            Tu solicitud empresarial está en evaluación comercial.
                          </div>
                        ) : null}

                        {wholesalePrices.map((wp) => (
                          <div key={wp.id} className="flex items-center justify-between text-sm">
                            <span className="text-taupe-600">
                              Desde {wp.minQuantity} uds.
                              {wp.maxQuantity ? ` hasta ${wp.maxQuantity} uds.` : "+"}
                            </span>
                            <span className="font-medium tabular-nums text-cochinilla">
                              {formatPEN(wp.amount)} / ud.
                            </span>
                          </div>
                        ))}
                        <p className="mt-3 text-xs text-taupe-500">
                          {userRole === "business_approved" || userRole === "admin"
                            ? "Tarifas y escalas preferenciales vigentes para pedidos por lote de tu empresa."
                            : "Precios de referencia para cuentas empresariales autorizadas."}
                        </p>

                        {userRole === "business_approved" || userRole === "admin" ? (
                          <Link
                            href={`/mayorista/cotizaciones?productSlug=${product.slug}`}
                            className="mt-3 flex h-10 w-full items-center justify-center gap-2 bg-emerald-900 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-emerald-950"
                          >
                            <FileText className="size-3.5" />
                            Solicitar cotización B2B de este modelo
                            <ArrowRight className="size-3.5" />
                          </Link>
                        ) : userRole === "business_pending" ? (
                          <Link
                            href="/mayorista/solicitud"
                            className="mt-3 flex h-10 w-full items-center justify-center gap-2 bg-amber-800 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-amber-900"
                          >
                            Consultar estado de solicitud
                            <ArrowRight className="size-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href="/mayorista/registro"
                            className="mt-3 flex h-10 w-full items-center justify-center gap-2 bg-cochinilla text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla-deep"
                          >
                            Solicitar cuenta mayorista B2B
                            <ArrowRight className="size-3.5" />
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Full description */}
            {product.fullDescription && (
              <div className="mt-8 border-t border-ink/10 pt-6">
                <button
                  type="button"
                  onClick={() => setShowDescription(!showDescription)}
                  className="flex w-full items-center justify-between"
                >
                  <span className="eyebrow text-taupe-600">Descripción</span>
                  <ChevronDown className={cn("size-4 text-taupe-400 transition-transform", showDescription && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {showDescription && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: ease.soft }}
                      className="overflow-hidden"
                    >
                      <p className="pt-4 text-sm leading-relaxed text-taupe-600">{product.fullDescription}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* SKU */}
            {selectedVariant && (
              <p className="mt-6 text-xs text-taupe-400">SKU: {selectedVariant.sku}</p>
            )}
          </Reveal>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-20 lg:mt-32" aria-labelledby="relacionados-title">
          <Reveal>
            <h2 id="relacionados-title" className="font-display text-display-sm text-ink">
              También te puede <em>interesar.</em>
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 xl:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <ProductCard product={p} eager={i < 2} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
