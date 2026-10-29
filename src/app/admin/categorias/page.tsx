import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAdminCategoriesCatalog } from "@/server/queries/admin-commerce";
import { AdminCategoriesManager } from "@/components/admin/admin-categories-manager";

export const instant = false;

export const metadata: Metadata = {
  title: "Categorías y Organización del Catálogo — Admin | INVESTMENTS",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getAdminCategoriesCatalog();

  return (
    <div className="shell py-8 md:py-10 space-y-6">
      <div className="border-b border-ink/10 pb-5">
        <p className="kicker text-cochinilla">ORGANIZACIÓN DEL CATÁLOGO</p>
        <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">
          Categorías y Subcategorías
        </h1>
        <p className="mt-1 text-sm text-taupe-700">
          Administra la estructura de colecciones, slugs únicos, visibilidad y orden en la tienda pública, protegiendo productos contra categorías huérfanas.
        </p>
      </div>

      <AdminCategoriesManager categories={categories} />
    </div>
  );
}

