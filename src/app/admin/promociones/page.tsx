import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FolderTree, Megaphone } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getAdminPromotionsCatalog } from "@/server/queries/admin-commerce";
import { AdminPromotionsManager } from "@/components/admin/admin-promotions-manager";

export const instant = false;

export const metadata: Metadata = {
  title: "Promociones, Cintillo Superior y Popup de Inicio — Admin | American Colt JEANS™",
  robots: { index: false, follow: false },
};

export default async function AdminPromotionsPage() {
  await requireAdmin();
  const data = await getAdminPromotionsCatalog();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Hero Banner Moderno de Promociones y Anuncios ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-red-100/90 bg-gradient-to-br from-white via-[#FFF9F9] to-red-50/70 p-6 sm:p-8 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-red-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-1/3 size-56 rounded-full bg-blue-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-widest text-[#DC2626] shadow-2xs">
              <Megaphone className="size-3.5" aria-hidden />
              <span>CINTILLO SUPERIOR · POPUP AL CARGAR · BANNERS Y DESCUENTOS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Promociones, Anuncios y Campañas 3D
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-500">
              Gestiona en tiempo real los anuncios del{" "}
              <strong className="text-slate-700">Cintillo Superior</strong>, la{" "}
              <strong className="text-slate-700">Ventana Emergente (Popup)</strong> al cargar la página, los banners de inicio/catálogo y las reglas de descuento B2C / B2B.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/categorias"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-[0_2px_0_#E2E8F0] transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
            >
              <FolderTree className="size-3.5" aria-hidden />
              <span>Categorías</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="bg-flow inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] px-5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#1E3A8A,0_10px_22px_-6px_rgba(37,99,235,0.45)] transition-all hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              <span>Ver Anuncios en Tienda</span>
            </Link>
          </div>
        </div>
      </div>

      <AdminPromotionsManager
        promotions={data.promotions}
        categories={data.categories}
        products={data.products}
      />
    </div>
  );
}
