"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  adminSaveProductAction,
  adminSetProductStatusAction,
  type AdminProductSavePayload,
} from "@/server/actions/admin-commerce";
import { normalizeCommercialSlug } from "@/server/pricing/admin-validators";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Layers,
  Image as ImageIcon,
  Tag,
} from "lucide-react";

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
}

interface InitialProductData {
  id: number;
  name: string;
  slug: string;
  brand: string;
  shortDescription: string | null;
  fullDescription: string | null;
  categoryId: number;
  audience: "mujer" | "hombre" | "unisex";
  status: "draft" | "active" | "archived";
  badgeLabel: string | null;
  sortOrder: number;
  isNew: boolean;
  isFeatured: boolean;
  isWholesale: boolean;
  retailPricePen: string;
  compareAtPricePen: string;
  wholesaleTiers: Array<{
    minQuantity: string;
    maxQuantity: string;
    pricePen: string;
  }>;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  variants: Array<{
    id?: number;
    sku: string;
    size: string;
    colorName: string;
    colorSwatch: string;
    stock: string;
    isActive: boolean;
    hasHistoricalReferences?: boolean;
  }>;
  hasHistoricalOrdersOrQuotes?: boolean;
}

interface AdminProductEditorFormProps {
  categories: CategoryOption[];
  initialData?: InitialProductData | null;
}

export function AdminProductEditorForm({
  categories,
  initialData,
}: AdminProductEditorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [brand, setBrand] = useState(initialData?.brand ?? "INVESTMENTS");
  const [shortDescription, setShortDescription] = useState(
    initialData?.shortDescription ?? "",
  );
  const [fullDescription, setFullDescription] = useState(
    initialData?.fullDescription ?? "",
  );
  const [categoryId, setCategoryId] = useState<number>(
    initialData?.categoryId ?? (categories[0]?.id ?? 1),
  );
  const [audience, setAudience] = useState<"mujer" | "hombre" | "unisex">(
    initialData?.audience ?? "mujer",
  );
  const [status, setStatus] = useState<"draft" | "active" | "archived">(
    initialData?.status ?? "active",
  );
  const [badgeLabel, setBadgeLabel] = useState(initialData?.badgeLabel ?? "");
  const [sortOrder, setSortOrder] = useState(String(initialData?.sortOrder ?? 0));
  const [isNew, setIsNew] = useState(initialData?.isNew ?? false);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [isWholesale, setIsWholesale] = useState(initialData?.isWholesale ?? true);

  const [retailPricePen, setRetailPricePen] = useState(
    initialData?.retailPricePen ?? "189.00",
  );
  const [compareAtPricePen, setCompareAtPricePen] = useState(
    initialData?.compareAtPricePen ?? "",
  );

  const [wholesaleTiers, setWholesaleTiers] = useState<
    Array<{ minQuantity: string; maxQuantity: string; pricePen: string }>
  >(
    initialData?.wholesaleTiers && initialData.wholesaleTiers.length > 0
      ? initialData.wholesaleTiers
      : [
          { minQuantity: "6", maxQuantity: "11", pricePen: "155.00" },
          { minQuantity: "12", maxQuantity: "", pricePen: "139.00" },
        ],
  );

  const [images, setImages] = useState<
    Array<{ url: string; alt: string; isPrimary: boolean }>
  >(
    initialData?.images && initialData.images.length > 0
      ? initialData.images
      : [
          {
            url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=80",
            alt: initialData?.name || "Prenda INVESTMENTS",
            isPrimary: true,
          },
        ],
  );

  const [variants, setVariants] = useState<
    Array<{
      id?: number;
      sku: string;
      size: string;
      colorName: string;
      colorSwatch: string;
      stock: string;
      isActive: boolean;
      hasHistoricalReferences?: boolean;
    }>
  >(
    initialData?.variants && initialData.variants.length > 0
      ? initialData.variants
      : [
          {
            sku: "INV-NEW-001-S",
            size: "S",
            colorName: "Arena",
            colorSwatch: "#D6C7B2",
            stock: "15",
            isActive: true,
          },
          {
            sku: "INV-NEW-001-M",
            size: "M",
            colorName: "Arena",
            colorSwatch: "#D6C7B2",
            stock: "20",
            isActive: true,
          },
        ],
  );

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialData) {
      setSlug(normalizeCommercialSlug(val));
    }
  };

  const handleAddWholesaleTier = () => {
    setWholesaleTiers((prev) => [
      ...prev,
      { minQuantity: "24", maxQuantity: "", pricePen: "" },
    ]);
  };

  const handleRemoveWholesaleTier = (index: number) => {
    setWholesaleTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    setImages((prev) => [
      ...prev,
      { url: "", alt: name || "Imagen de producto", isPrimary: prev.length === 0 },
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    const baseCode = (slug || "INV-PRENDA")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
    setVariants((prev) => [
      ...prev,
      {
        sku: `${baseCode}-${prev.length + 1}`,
        size: "L",
        colorName: "Negro",
        colorSwatch: "#141312",
        stock: "10",
        isActive: true,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    const target = variants[index];
    if (target?.hasHistoricalReferences) {
      // Si tiene pedidos históricos, la desactivamos en lugar de quitarla
      setVariants((prev) =>
        prev.map((v, i) => (i === index ? { ...v, isActive: false, stock: "0" } : v)),
      );
      return;
    }
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload: AdminProductSavePayload = {
      id: initialData?.id ?? null,
      name,
      slug,
      brand,
      shortDescription,
      fullDescription,
      categoryId: Number(categoryId),
      audience,
      status,
      badgeLabel,
      sortOrder: Number(sortOrder) || 0,
      isNew,
      isFeatured,
      isWholesale,
      retailPricePen,
      compareAtPricePen: compareAtPricePen.trim() || null,
      wholesaleTiers: isWholesale ? wholesaleTiers : [],
      images,
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        colorName: v.colorName,
        colorSwatch: v.colorSwatch,
        stock: Number(v.stock) || 0,
        isActive: v.isActive,
      })),
    };

    startTransition(async () => {
      const res = await adminSaveProductAction(payload);
      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "No se pudo guardar el producto.",
        });
        return;
      }

      setFeedback({
        type: "success",
        text: res.message ?? "Producto guardado correctamente.",
      });

      if (!initialData && res.entityId) {
        router.push(`/admin/productos/${res.entityId}`);
      } else {
        router.refresh();
      }
    });
  };

  const handleQuickArchive = (nextStatus: "active" | "draft" | "archived") => {
    if (!initialData?.id) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await adminSetProductStatusAction({
        productId: initialData.id,
        status: nextStatus,
      });
      if (!res.success) {
        setFeedback({ type: "error", text: res.error ?? "Error al cambiar estado." });
        return;
      }
      setStatus(nextStatus);
      setFeedback({ type: "success", text: res.message ?? "Estado actualizado." });
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Barra superior de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-taupe-700 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          <span>Volver al catálogo administrativo</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          {initialData?.id && (
            <>
              {status !== "archived" ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleQuickArchive("archived")}
                  className="border border-rose-500/30 bg-rose-500/5 px-3.5 py-2 font-mono text-xs uppercase tracking-widest text-rose-800 hover:bg-rose-500/15 disabled:opacity-50"
                >
                  Archivar / Desactivar
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleQuickArchive("active")}
                  className="border border-emerald-600/30 bg-emerald-500/10 px-3.5 py-2 font-mono text-xs uppercase tracking-widest text-emerald-900 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  Reactivar Producto
                </button>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-ink px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-paper transition-colors hover:bg-cochinilla disabled:opacity-50"
          >
            <Save className="size-3.5" aria-hidden />
            <span>
              {isPending
                ? "Guardando en Neon DB..."
                : initialData
                  ? "Guardar Cambios"
                  : "Publicar Producto"}
            </span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-start gap-2.5 border p-4 text-xs ${
            feedback.type === "success"
              ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-950"
              : "border-rose-500/30 bg-rose-500/10 text-rose-950"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-700" aria-hidden />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {initialData?.hasHistoricalOrdersOrQuotes && (
        <div className="border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-950">
          <strong>Protección de Integridad Histórica Activa:</strong> Este producto cuenta con pedidos o cotizaciones registradas. Puedes editar sus precios, descripciones y variantes con total libertad; los pedidos pasados conservarán siempre sus snapshots de precio y SKU inmutables.
        </div>
      )}

      {/* Sección 1: Datos Generales, Marca y Categorización */}
      <section className="border border-ink/10 bg-paper p-6 space-y-5">
        <div className="border-b border-ink/10 pb-3">
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
            1. IDENTIDAD DEL PRODUCTO
          </p>
          <h2 className="font-display text-xl text-ink">
            Nombre, Marca, Categoría y Visibilidad
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <label
              htmlFor="prod-name"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Nombre Comercial del Producto *
            </label>
            <input
              id="prod-name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Abrigo Sastre Alpaca Imperial"
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="prod-slug"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Slug URL (Único) *
            </label>
            <input
              id="prod-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(normalizeCommercialSlug(e.target.value))}
              placeholder="abrigo-sastre-alpaca-imperial"
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3.5 py-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="prod-brand"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Marca / Atelier *
            </label>
            <input
              id="prod-brand"
              type="text"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="prod-category"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Categoría *
            </label>
            <select
              id="prod-category"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="prod-audience"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Colección / Audiencia *
            </label>
            <select
              id="prod-audience"
              value={audience}
              onChange={(e) =>
                setAudience(e.target.value as "mujer" | "hombre" | "unisex")
              }
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              <option value="mujer">Mujer</option>
              <option value="hombre">Hombre</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="prod-status"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Estado de Publicación *
            </label>
            <select
              id="prod-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "active" | "archived")
              }
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              <option value="active">Activo (Visible en tienda)</option>
              <option value="draft">Borrador (Oculto al público)</option>
              <option value="archived">Archivado / Desactivado</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="prod-badge"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Insignia Editorial (Opcional)
            </label>
            <input
              id="prod-badge"
              type="text"
              value={badgeLabel}
              onChange={(e) => setBadgeLabel(e.target.value)}
              placeholder="Ej: Edición Limitada, Baby Alpaca"
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="prod-sort"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Orden de Prioridad
            </label>
            <input
              id="prod-sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="size-4 accent-cochinilla"
            />
            <span>Producto Destacado en Catálogo</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="size-4 accent-cochinilla"
            />
            <span>Marcar en Novedades (Nuevo Lanzamiento)</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
            <input
              type="checkbox"
              checked={isWholesale}
              onChange={(e) => setIsWholesale(e.target.checked)}
              className="size-4 accent-cochinilla"
            />
            <span>Habilitado para Venta Mayorista B2B por Escalas</span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="prod-shortDesc"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Resumen Ejecutivo / Descripción Corta
            </label>
            <textarea
              id="prod-shortDesc"
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Descripción breve para tarjetas y vista rápida..."
              className="mt-1 w-full border border-ink/20 bg-sand-50 p-3 text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="prod-fullDesc"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Ficha Técnica / Descripción Completa
            </label>
            <textarea
              id="prod-fullDesc"
              rows={2}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Composición textil, gramaje, cuidados de lavado y confección..."
              className="mt-1 w-full border border-ink/20 bg-sand-50 p-3 text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Sección 2: Precios Minoristas (B2C) y Escalas Mayoristas (B2B) */}
      <section className="border border-ink/10 bg-paper p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-ink/10 pb-3">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
              2. MOTOR DE PRECIOS B2C Y ESCALAS B2B (SOLES PEN)
            </p>
            <h2 className="font-display text-xl text-ink">
              Tarifas Minoristas y Descuentos por Volumen Mayorista
            </h2>
          </div>
          <Tag className="size-5 text-cochinilla" aria-hidden />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="prod-retailPrice"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Precio Minorista Unitario B2C (S/ PEN con IGV) *
            </label>
            <input
              id="prod-retailPrice"
              type="number"
              step="0.01"
              min="1"
              required
              value={retailPricePen}
              onChange={(e) => setRetailPricePen(e.target.value)}
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3.5 py-2 font-mono text-sm font-bold text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="prod-comparePrice"
              className="block font-mono text-[0.68rem] uppercase tracking-widest text-taupe-700"
            >
              Precio Anterior Tachado B2C (Opcional, S/ PEN)
            </label>
            <input
              id="prod-comparePrice"
              type="number"
              step="0.01"
              min="0"
              value={compareAtPricePen}
              onChange={(e) => setCompareAtPricePen(e.target.value)}
              placeholder="Ej: 249.00"
              className="mt-1 w-full border border-ink/20 bg-sand-50 px-3.5 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        {isWholesale && (
          <div className="border-t border-ink/10 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
                  Escalas por Volumen para Empresas Mayoristas Aprobadas (B2B)
                </h3>
                <p className="text-xs text-taupe-700">
                  El motor del servidor acumula unidades de distintas tallas y colores de este mismo modelo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddWholesaleTier}
                className="inline-flex items-center gap-1.5 border border-ink/20 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-ink hover:border-ink"
              >
                <Plus className="size-3.5 text-cochinilla" aria-hidden />
                <span>Añadir Escala</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {wholesaleTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 border border-ink/10 bg-sand-50/50 p-3 sm:grid-cols-4 items-end"
                >
                  <div>
                    <label className="block font-mono text-[0.65rem] uppercase text-taupe-700">
                      Cantidad Mínima (uds.) *
                    </label>
                    <input
                      type="number"
                      min="2"
                      required
                      value={tier.minQuantity}
                      onChange={(e) =>
                        setWholesaleTiers((prev) =>
                          prev.map((t, i) =>
                            i === idx ? { ...t, minQuantity: e.target.value } : t,
                          ),
                        )
                      }
                      className="mt-1 w-full border border-ink/20 bg-paper px-3 py-1.5 font-mono text-xs text-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[0.65rem] uppercase text-taupe-700">
                      Cantidad Máxima (Opcional)
                    </label>
                    <input
                      type="number"
                      min="2"
                      value={tier.maxQuantity}
                      placeholder="Sin tope"
                      onChange={(e) =>
                        setWholesaleTiers((prev) =>
                          prev.map((t, i) =>
                            i === idx ? { ...t, maxQuantity: e.target.value } : t,
                          ),
                        )
                      }
                      className="mt-1 w-full border border-ink/20 bg-paper px-3 py-1.5 font-mono text-xs text-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[0.65rem] uppercase text-taupe-700">
                      Precio Unitario B2B (S/ PEN) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={tier.pricePen}
                      onChange={(e) =>
                        setWholesaleTiers((prev) =>
                          prev.map((t, i) =>
                            i === idx ? { ...t, pricePen: e.target.value } : t,
                          ),
                        )
                      }
                      className="mt-1 w-full border border-ink/20 bg-paper px-3 py-1.5 font-mono text-xs font-bold text-cochinilla"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveWholesaleTier(idx)}
                      className="inline-flex items-center gap-1 border border-rose-500/30 px-2.5 py-1.5 font-mono text-[0.68rem] text-rose-700 hover:bg-rose-500/10"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Sección 3: Variantes (Talla, Color, SKU y Stock Disponible) */}
      <section className="border border-ink/10 bg-paper p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-ink/10 pb-3">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
              3. MATRIZ DE VARIANTES Y STOCK POR SKU
            </p>
            <h2 className="font-display text-xl text-ink">
              Tallas, Colores, Códigos SKU y Disponibilidad
            </h2>
          </div>
          <button
            type="button"
            onClick={handleAddVariant}
            className="inline-flex items-center gap-1.5 bg-ink px-3.5 py-2 font-mono text-xs uppercase tracking-widest text-paper hover:bg-cochinilla"
          >
            <Layers className="size-3.5" aria-hidden />
            <span>Añadir Variante</span>
          </button>
        </div>

        <div className="space-y-3">
          {variants.map((v, idx) => (
            <div
              key={v.id ?? `new-${idx}`}
              className="grid gap-3 border border-ink/10 bg-sand-50/50 p-3.5 sm:grid-cols-7 items-end"
            >
              <div className="sm:col-span-2">
                <label className="block font-mono text-[0.64rem] uppercase text-taupe-700">
                  Código SKU Único *
                </label>
                <input
                  type="text"
                  required
                  data-testid={`variant-sku-${idx}`}
                  value={v.sku}
                  onChange={(e) =>
                    setVariants((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, sku: e.target.value.toUpperCase() } : item,
                      ),
                    )
                  }
                  className="mt-1 w-full border border-ink/20 bg-paper px-2.5 py-1.5 font-mono text-xs font-bold text-ink"
                />
              </div>

              <div>
                <label className="block font-mono text-[0.64rem] uppercase text-taupe-700">
                  Talla
                </label>
                <input
                  type="text"
                  value={v.size}
                  placeholder="S, M, L, XL"
                  onChange={(e) =>
                    setVariants((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, size: e.target.value } : item,
                      ),
                    )
                  }
                  className="mt-1 w-full border border-ink/20 bg-paper px-2.5 py-1.5 text-xs text-ink"
                />
              </div>

              <div>
                <label className="block font-mono text-[0.64rem] uppercase text-taupe-700">
                  Color
                </label>
                <input
                  type="text"
                  value={v.colorName}
                  placeholder="Ej: Carbón"
                  onChange={(e) =>
                    setVariants((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, colorName: e.target.value } : item,
                      ),
                    )
                  }
                  className="mt-1 w-full border border-ink/20 bg-paper px-2.5 py-1.5 text-xs text-ink"
                />
              </div>

              <div>
                <label className="block font-mono text-[0.64rem] uppercase text-taupe-700">
                  Muestra Hex
                </label>
                <input
                  type="text"
                  value={v.colorSwatch}
                  placeholder="#141312"
                  onChange={(e) =>
                    setVariants((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, colorSwatch: e.target.value } : item,
                      ),
                    )
                  }
                  className="mt-1 w-full border border-ink/20 bg-paper px-2.5 py-1.5 font-mono text-xs text-ink"
                />
              </div>

              <div>
                <label className="block font-mono text-[0.64rem] uppercase text-taupe-700">
                  Stock (uds.) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={v.stock}
                  onChange={(e) =>
                    setVariants((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, stock: e.target.value } : item,
                      ),
                    )
                  }
                  className="mt-1 w-full border border-ink/20 bg-paper px-2.5 py-1.5 font-mono text-xs font-bold text-ink"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] text-ink">
                  <input
                    type="checkbox"
                    checked={v.isActive}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, isActive: e.target.checked } : item,
                        ),
                      )
                    }
                    className="size-3.5 accent-cochinilla"
                  />
                  <span>Activa</span>
                </label>

                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    title={
                      v.hasHistoricalReferences
                        ? "Desactivar variante (protegida por historial de pedidos)"
                        : "Eliminar variante"
                    }
                    className="border border-rose-500/30 p-1.5 text-rose-700 hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección 4: Galería de Imágenes */}
      <section className="border border-ink/10 bg-paper p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-ink/10 pb-3">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
              4. GALERÍA EDITORIAL DEL PRODUCTO
            </p>
            <h2 className="font-display text-xl text-ink">
              Imágenes Principales y Secundarias
            </h2>
          </div>
          <button
            type="button"
            onClick={handleAddImage}
            className="inline-flex items-center gap-1.5 border border-ink/20 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-ink hover:border-ink"
          >
            <ImageIcon className="size-3.5 text-cochinilla" aria-hidden />
            <span>Añadir Imagen</span>
          </button>
        </div>

        <div className="space-y-3">
          {images.map((im, idx) => (
            <div
              key={idx}
              className="grid gap-3 border border-ink/10 bg-sand-50/50 p-3 sm:grid-cols-6 items-end"
            >
              <div className="sm:col-span-3">
                <label className="block font-mono text-[0.64rem] uppercase text-taupe-700">
                  URL de la Imagen *
                </label>
                <input
                  type="text"
                  required
                  value={im.url}
                  placeholder="https://images.unsplash.com/..."
                  onChange={(e) =>
                    setImages((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, url: e.target.value } : item,
                      ),
                    )
                  }
                  className="mt-1 w-full border border-ink/20 bg-paper px-2.5 py-1.5 font-mono text-xs text-ink"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-mono text-[0.64rem] uppercase text-taupe-700">
                  Texto Alternativo (Accesibilidad / SEO)
                </label>
                <input
                  type="text"
                  value={im.alt}
                  onChange={(e) =>
                    setImages((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, alt: e.target.value } : item,
                      ),
                    )
                  }
                  className="mt-1 w-full border border-ink/20 bg-paper px-2.5 py-1.5 text-xs text-ink"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] text-ink">
                  <input
                    type="radio"
                    name="primaryProductImage"
                    checked={im.isPrimary}
                    onChange={() =>
                      setImages((prev) =>
                        prev.map((item, i) => ({
                          ...item,
                          isPrimary: i === idx,
                        })),
                      )
                    }
                    className="size-3.5 accent-cochinilla"
                  />
                  <span>Portada</span>
                </label>

                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="border border-rose-500/30 p-1.5 text-rose-700 hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
