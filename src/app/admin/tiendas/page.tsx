import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAllPhysicalStores } from "@/server/shipping/service";
import { AdminStoresManager } from "@/components/admin/admin-stores-manager";

export const metadata: Metadata = {
  title: "Tiendas Físicas y Puntos de Recojo | Admin American Colt JEANS™",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminStoresPage() {
  await requireAdmin();
  const stores = await getAllPhysicalStores();

  return (
    <div className="py-6 sm:py-8">
      <AdminStoresManager initialStores={stores} />
    </div>
  );
}
