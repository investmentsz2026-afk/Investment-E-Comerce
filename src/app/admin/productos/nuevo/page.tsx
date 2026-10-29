import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAdminCategoriesCatalog } from "@/server/queries/admin-commerce";
import { AdminProductEditorForm } from "@/components/admin/admin-product-editor-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Nuevo Producto Comercial — Admin | INVESTMENTS",
  robots: { index: false, follow: false },
};

export default async function AdminNewProductPage() {
  await requireAdmin();
  const categories = await getAdminCategoriesCatalog();

  return (
    <div className="shell py-8 md:py-10 space-y-6">
      <div>
        <p className="kicker text-cochinilla">CATÁLOGO COMERCIAL INVESTMENTS</p>
        <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">
          Crear Nuevo Producto
        </h1>
        <p className="mt-1 text-sm text-taupe-700">
          Registra la información editorial, precios minoristas (B2C), escalas por volumen mayorista (B2B) y variantes por talla/color/SKU.
        </p>
      </div>

      <AdminProductEditorForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          parentId: c.parentId,
        }))}
        initialData={null}
      />
    </div>
  );
}

