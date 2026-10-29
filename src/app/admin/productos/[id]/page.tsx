import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/session";
import { getAdminProductDetail } from "@/server/queries/admin-commerce";
import { AdminProductEditorForm } from "@/components/admin/admin-product-editor-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Editar Producto Comercial — Admin | INVESTMENTS",
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

  return (
    <div className="shell py-8 md:py-10 space-y-6">
      <div>
        <p className="kicker text-cochinilla">
          FICHA ADMINISTRATIVA DE PRODUCTO #{detail.product.id}
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">
          {detail.product.name}
        </h1>
        <p className="mt-1 font-mono text-xs text-taupe-600">
          Slug: /{detail.product.slug} · Marca: {detail.product.brand} ·{" "}
          {detail.variants.length} variantes configuradas
        </p>
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

