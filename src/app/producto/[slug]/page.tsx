import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getProductBySlug, getRelatedProducts } from "@/server/queries/products";
import { totalStock as sumStock } from "@/lib/variant-stock";
import { CatalogBreadcrumbs } from "@/components/catalog/catalog-breadcrumbs";
import { getCurrentSession } from "@/server/auth/session";
import { ProductDetailView } from "./product-detail-view";

/** Datos dinámicos de Neon: la ruta puede bloquear (se renderiza en servidor por petición). */
export const instant = false;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];

  return {
    title: product.name,
    description: product.shortDescription ?? `${product.name} — ${siteConfig.name}`,
    alternates: { canonical: `/producto/${product.slug}` },
    // Los productos de demostración no se indexan públicamente.
    robots: product.isDemo ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: `${product.name} | ${siteConfig.name}`,
      description: product.shortDescription ?? product.name,
      url: `/producto/${product.slug}`,
      images: primaryImage ? [{ url: primaryImage.url, alt: primaryImage.alt }] : [],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.categoryId, 4);

  // Structured data (Product schema)
  const retailPrice = product.prices.find((p) => p.type === "retail");
  const totalStock = sumStock(product.variants);
  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.name,
    image: primaryImage ? new URL(primaryImage.url, siteConfig.url).toString() : undefined,
    sku: product.variants[0]?.sku,
    offers: retailPrice
      ? {
          "@type": "Offer",
          priceCurrency: "PEN",
          price: (retailPrice.amount / 100).toFixed(2),
          availability:
            totalStock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url: `${siteConfig.url}/producto/${product.slug}`,
        }
      : undefined,
  };

  const { user } = await getCurrentSession();

  return (
    <div className="bg-paper pt-[7.5rem] lg:pt-[8.75rem]">
      <div className="shell">
        <CatalogBreadcrumbs
          items={[
            { label: "Catálogo", href: "/catalogo" },
            { label: product.category.name, href: `/catalogo/${product.category.slug}` },
            { label: product.name },
          ]}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />

        <ProductDetailView product={product} related={related} userRole={user?.role ?? null} />
      </div>
    </div>
  );
}
