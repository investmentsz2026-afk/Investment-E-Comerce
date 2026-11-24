import type { Metadata } from "next";
import { getActivePhysicalStores } from "@/server/shipping/service";
import { PublicStoresExplorer } from "@/components/stores/public-stores-explorer";

export const metadata: Metadata = {
  title: "Nuestras Tiendas de Recojo | American Colt JEANS™",
  description:
    "Encuentra todas nuestras tiendas físicas oficiales para recojo gratis en tienda, horarios de atención y mapa interactivo de ubicación.",
};

export const instant = false;

export default async function PublicStoresPage() {
  const activeStores = await getActivePhysicalStores();

  return (
    <div className="bg-gradient-to-b from-slate-50/60 to-white pt-[7rem] pb-20 sm:pt-[7.25rem] lg:pt-[10.75rem]">
      <div className="shell">
        <PublicStoresExplorer stores={activeStores} />
      </div>
    </div>
  );
}
