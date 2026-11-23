import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Edit3, Layers } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getAdminProductDetail } from "@/server/queries/admin-commerce";
import { AdminProductEditorForm } from "@/components/admin/admin-product-editor-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Editar Producto Comercial — Admin | American Colt JEANS™",
  robots: { index: false, follow: false },
};

interface AdminEditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductPage({
  params,
}: AdminEditProductPageProps) {
  await requireAdmin();
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    notFound();
  }

  const detail = await getAdminProductDetail(productId);
  if (!detail) {
    notFound();
  }

  const retailPriceRow = detail.prices.find((p) => p.type === "retail") ?? null;
  const wholesaleTiers = detail.prices
    .filter((p) => p.type === "wholesale")
    .sort((a, b) => a.minQuantity - b.minQuantity);

  const primaryImage =
    detail.images.find((im) => im.isPrimary) ?? detail.images[0] ?? null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner Moderno de Edición de Producto */}
      <div className="relative overflow-hidden rounded-3xl border border-red-100/90 bg-gradient-to-br from-white via-[#FFF9F9] to-red-50/70 p-6 sm:p-8 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-red-500/10 blur-3xl"
        />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          {primaryImage?.url && (
            <div className="relative size-18 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryImage.url}
                alt={detail.product.name}
                className="size-full object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-widest text-[#DC2626] shadow-2xs">
                <Edit3 className="size-3" aria-hidden />
                <span>FICHA DE PRODUCTO #{detail.product.id}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-0.5 font-mono text-[0.65rem] font-bold text-slate-600">
                <Layers className="size-3 text-slate-400" aria-hidden />
                {detail.variants.length}{" "}
                {detail.variants.length === 1 ? "variante" : "variantes"}
              </span>
            </div>
            <h1 className="truncate text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {detail.product.name}
            </h1>
            <p className="font-mono text-xs text-slate-500">
              Slug: <span className="font-bold text-slate-700">/{detail.product.slug}</span> · Marca:{" "}
              <span className="font-bold text-slate-700">{detail.product.brand}</span>
            </p>
          </div>
        </div>
      </div>

      <AdminProductEditorForm
        categories={detail.categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          parentId: c.parentId,
        }))}
        initialData={{
          id: detail.product.id,
          name: detail.product.name,
          slug: detail.product.slug,
          brand: detail.product.brand,
          shortDescription: detail.product.shortDescription,
          fullDescription: detail.product.fullDescription,
          categoryId: detail.product.categoryId,
          audience: detail.product.audience,
          status: detail.product.status,
          badgeLabel: detail.product.badgeLabel,
          sortOrder: detail.product.sortOrder,
          isNew: detail.product.isNew,
          isFeatured: detail.product.isFeatured,
          isWholesale: detail.product.isWholesale,
          retailPricePen: retailPriceRow
            ? (retailPriceRow.amount / 100).toFixed(2)
            : "0.00",
          compareAtPricePen:
            retailPriceRow?.compareAtAmount
              ? (retailPriceRow.compareAtAmount / 100).toFixed(2)
              : "",
          wholesaleTiers: wholesaleTiers.map((t) => ({
            minQuantity: String(t.minQuantity),
            maxQuantity: t.maxQuantity ? String(t.maxQuantity) : "",
            pricePen: (t.amount / 100).toFixed(2),
          })),
          images: detail.images.map((im) => ({
            url: im.url,
            alt: im.alt,
            isPrimary: im.isPrimary,
            imageType:
              im.imageType === "portada" ||
              im.imageType === "cerca" ||
              im.imageType === "reverso" ||
              im.imageType === "ficha" ||
              im.imageType === "galeria"
                ? im.imageType
                : im.isPrimary
                  ? "portada"
                  : "galeria",
            colorName: im.colorName ?? null,
          })),
          variants: detail.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size ?? "",
            colorName: v.colorName ?? "",
            colorSwatch: v.colorSwatch ?? "",
            stock: String(v.stock),
            isActive: v.isActive,
            hasHistoricalReferences: v.hasHistoricalReferences,
          })),
          hasHistoricalOrdersOrQuotes: detail.hasHistoricalOrdersOrQuotes,
        }}
      />
    </div>
  );
}
