import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getAdminCategoriesCatalog } from "@/server/queries/admin-commerce";
import { AdminProductEditorForm } from "@/components/admin/admin-product-editor-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Nuevo Producto Comercial — Admin | American Colt JEANS™",
  robots: { index: false, follow: false },
};

export default async function AdminNewProductPage() {
  await requireAdmin();
  const categories = await getAdminCategoriesCatalog();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner Moderno Crear Producto */}
      <div className="relative overflow-hidden rounded-3xl border border-red-100/90 bg-gradient-to-br from-white via-[#FFF9F9] to-red-50/70 p-6 sm:p-8 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-red-500/10 blur-3xl"
        />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-widest text-[#DC2626] shadow-2xs">
            <Sparkles className="size-3" aria-hidden />
            <span>CATÁLOGO COMERCIAL AMERICAN COLT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Crear Nuevo Producto
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-slate-500">
            Registra la información editorial, precios minoristas (B2C), escalas por volumen mayorista (B2B), variantes por talla/color/SKU y galería fotográfica.
          </p>
        </div>
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
