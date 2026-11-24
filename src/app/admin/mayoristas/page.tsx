import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getAdminWholesaleProductsData } from "@/server/queries/admin-commerce";
import { AdminWholesaleProductsManager } from "@/components/admin/admin-wholesale-products-manager";

export const instant = false;

export const metadata: Metadata = {
  title: "Productos Mayoristas — Admin | American Colt JEANS™",
  robots: { index: false, follow: false },
};

export default async function AdminWholesaleProductsPage() {
  await requireAdmin();
  const data = await getAdminWholesaleProductsData();

  return (
    <AdminWholesaleProductsManager
      initialItems={data.items}
      categories={data.categories}
    />
  );
}
