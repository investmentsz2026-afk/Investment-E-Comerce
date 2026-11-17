import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { getOrSeedShippingZones } from "@/server/shipping/service";
import { AdminShippingManager } from "@/components/admin/admin-shipping-manager";

export const metadata: Metadata = {
  title: "Tarifas de Envíos Perú | Admin American Colt JEANS™",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminShippingPage() {
  await requireAdmin();
  const zones = await getOrSeedShippingZones();

  return (
    <div className="py-6 sm:py-8">
      <AdminShippingManager initialZones={zones} />
    </div>
  );
}
