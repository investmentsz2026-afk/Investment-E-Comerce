import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FolderTree, Plus } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getAdminCategoriesCatalog } from "@/server/queries/admin-commerce";
import { AdminCategoriesManager } from "@/components/admin/admin-categories-manager";

export const instant = false;

export const metadata: Metadata = {
  title: "Categorías y Organización del Catálogo — Admin | American Colt JEANS™",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getAdminCategoriesCatalog();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Banner Moderno del Módulo de Categorías ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-red-100/90 bg-gradient-to-br from-white via-[#FFF9F9] to-red-50/70 p-6 sm:p-8 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-60 rounded-full bg-red-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-1/3 size-52 rounded-full bg-blue-500/8 blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-widest text-[#DC2626] shadow-2xs">
              <FolderTree className="size-3.5" aria-hidden />
              <span>ORGANIZACIÓN DEL CATÁLOGO · AMERICAN COLT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Categorías y Subcategorías
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-500">
              Todas las categorías activas que gestiones aquí aparecen automáticamente en el{" "}
              <strong className="text-slate-700">catálogo público</strong> y en el selector al crear o editar productos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/catalogo"
              target="_blank"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50/60 hover:text-blue-700"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              <span>Ver Catálogo Público</span>
            </Link>

            <Link
              href="/admin/productos/nuevo"
              className="bg-flow inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] px-5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#1E3A8A,0_10px_22px_-6px_rgba(37,99,235,0.45)] transition-all hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <Plus className="size-4" aria-hidden />
              <span>Nuevo Producto</span>
            </Link>
          </div>
        </div>
      </div>

      <AdminCategoriesManager categories={categories} />
    </div>
  );
}
