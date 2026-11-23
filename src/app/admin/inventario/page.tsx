import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAdminInventoryCatalog } from "@/server/queries/admin-commerce";
import { AdminInventoryWorkspace } from "@/components/admin/admin-inventory-workspace";

export const instant = false;

export const metadata: Metadata = {
  title: "Inventario, Stock y Kardex 3D — Admin | American Colt JEANS™",
  robots: { index: false, follow: false },
};

export default async function AdminInventoryPage() {
  await requireAdmin();

  const inventory = await getAdminInventoryCatalog({});

  return (
    <AdminInventoryWorkspace
      summary={inventory.summary}
      variants={inventory.variants}
      movements={inventory.movements}
      activeReservations={inventory.activeReservations}
    />
  );
}
