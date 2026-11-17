import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAdminPromotionsCatalog } from "@/server/queries/admin-commerce";
import { AdminPromotionsManager } from "@/components/admin/admin-promotions-manager";

export const instant = false;

export const metadata: Metadata = {
  title: "Promociones, Cintillo Superior y Popup de Inicio — Admin | American Colt",
  robots: { index: false, follow: false },
};

export default async function AdminPromotionsPage() {
  await requireAdmin();
  const data = await getAdminPromotionsCatalog();

  return (
    <div className="shell py-8 md:py-10 space-y-6">
      <div className="border-b border-ink/10 pb-5">
        <p className="kicker text-cochinilla">POLÍTICA COMERCIAL, CINTILLO SUPERIOR Y POPUP DE INICIO</p>
        <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">
          Promociones, Banners y Anuncios Emergentes
        </h1>
        <p className="mt-1 text-sm text-taupe-700">
          Configura las promociones que aparecen en el cintillo arriba de toda la página, en la ventana emergente (Popup) cuando carga la tienda, en los banners de inicio y los descuentos B2C / B2B.
        </p>
      </div>

      <AdminPromotionsManager
        promotions={data.promotions}
        categories={data.categories}
        products={data.products}
      />
    </div>
  );
}

