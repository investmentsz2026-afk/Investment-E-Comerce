import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PhysicalStoreRecord } from "@/server/shipping/service";
import { PublicStoresExplorer } from "@/components/stores/public-stores-explorer";

export function PickupStoresSection({
  stores,
}: {
  stores: PhysicalStoreRecord[];
}) {
  return (
    <section
      id="tiendas-recojo"
      aria-label="Nuestras Tiendas de Recojo"
      className="scroll-mt-[7rem] lg:scroll-mt-[11.25rem] border-t border-slate-200/80 bg-gradient-to-b from-slate-50/70 to-white py-14 sm:py-20"
    >
      <div className="shell space-y-6">
        <PublicStoresExplorer stores={stores} compactHeading />

        <div className="flex justify-end pt-2">
          <Link
            href="/tiendas"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-[#DC2626]/40 hover:text-[#DC2626]"
          >
            <span>Ver directorio completo de tiendas</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
