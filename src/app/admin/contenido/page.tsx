import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAdminShowcaseData } from "@/server/queries/lookbook";
import {
  getAdminCategoriesCatalog,
  getAdminProductsCatalog,
} from "@/server/queries/admin-commerce";
import { formatPrice } from "@/lib/format";
import {
  AdminLookbookManager,
  type LookbookProductOption,
} from "@/components/admin/admin-lookbook-manager";
import type { LineCategoryOption } from "@/components/admin/admin-lines-submanager";

export const instant = false;

export const metadata: Metadata = {
  title: "Contenido E-Commerce y Lookbook 3D — Admin | INVESTMENTS",
  robots: { index: false, follow: false },
};

export default async function AdminEcommerceContentPage() {
  await requireAdmin();

  const [showcase, catalog, rawCategories] = await Promise.all([
    getAdminShowcaseData(),
    getAdminProductsCatalog({ pageSize: 100 }),
    getAdminCategoriesCatalog(),
  ]);

  const productOptions: LookbookProductOption[] = catalog.items.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    retailPriceText:
      typeof p.retailAmount === "number" ? formatPrice(p.retailAmount) : null,
    imageUrl: p.primaryImageUrl,
    fitText: p.badgeLabel ?? p.categoryName ?? null,
  }));

  const categoryOptions: LineCategoryOption[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    audience: c.audience ?? null,
    activeProductsCount: c.activeProductsCount,
  }));

  return (
    <div className="shell py-6 md:py-8">
      <AdminLookbookManager
        slides={showcase.slides}
        heroSlides={showcase.heroSlides}
        homeLines={showcase.homeLines}
        showcaseConfig={showcase.config}
        brandConfig={showcase.brandConfig}
        products={productOptions}
        categories={categoryOptions}
      />
    </div>
  );
}
