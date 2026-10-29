"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateShippingZoneAction } from "@/server/actions/orders";
import type { ShippingZoneRecord } from "@/server/shipping/service";
import { Truck, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function AdminShippingZonesPanel({
  zones,
}: {
  zones: ShippingZoneRecord[];
}) {
  const router = useRouter();
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSaveZone = async (
    e: React.FormEvent<HTMLFormElement>,
    zoneId: number,
  ) => {
    e.preventDefault();
    setFeedback(null);
    setError(null);
    setEditingZoneId(zoneId);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await adminUpdateShippingZoneAction({
        zoneId,
        rateAmountSoles: String(fd.get("rateAmountSoles") ?? "0"),
        freeShippingMinSoles: String(fd.get("freeShippingMinSoles") ?? ""),
        estimatedDaysLabel: String(fd.get("estimatedDaysLabel") ?? ""),
        isAvailable: fd.get("isAvailable") === "on",
        unavailableReason: String(fd.get("unavailableReason") ?? ""),
      });

      if (!res.success) {
        setError(res.error ?? "No se pudo actualizar la tarifa.");
        return;
      }

      setFeedback("Tarifa de envío actualizada y registrada en auditoría.");
      router.refresh();
    } finally {
      setEditingZoneId(null);
    }
  };

  return (
    <section className="border border-ink/15 bg-paper p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-ink/10 pb-3">
        <div className="flex items-center gap-2.5">
          <Truck className="size-5 text-cochinilla" aria-hidden />
          <div>
            <h2 className="font-display text-xl text-ink">
              Tarifas de Envío Configurables por Zona (Perú)
            </h2>
            <p className="text-xs text-taupe-500">
              El servidor consulta estas tarifas para calcular el envío y las zonas sin cobertura antes de confirmar cada pedido.
              Las tarifas iniciales precargadas son valores referenciales de configuración que la empresa debe validar o ajustar antes del lanzamiento comercial en producción.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 border-l-2 border-cochinilla bg-cochinilla/10 p-3 text-xs text-cochinilla">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="flex items-center gap-2 border border-emerald-400 bg-emerald-50 p-3 text-xs text-emerald-950">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-700" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="divide-y divide-ink/10">
        {zones.map((z) => (
          <form
            key={z.id}
            onSubmit={(e) => void handleSaveZone(e, z.id)}
            className="grid grid-cols-1 items-end gap-3 py-4 md:grid-cols-12"
          >
            <div className="md:col-span-4">
              <p className="font-mono text-xs font-bold uppercase text-ink">
                {z.code} — {z.name}
              </p>
              <p className="font-mono text-[0.68rem] text-taupe-500">
                Depto: {z.department} · Prov: {z.province ?? "*"} · Dist:{" "}
                {z.district ?? "*"}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block font-mono text-[0.62rem] uppercase text-taupe-600">
                Tarifa (S/)
              </label>
              <input
                name="rateAmountSoles"
                type="text"
                defaultValue={(z.rateAmount / 100).toFixed(2)}
                className="mt-1 h-9 w-full border border-ink/25 bg-[#fbfaf7] px-2.5 font-mono text-xs text-ink"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-mono text-[0.62rem] uppercase text-taupe-600">
                Gratis desde (S/)
              </label>
              <input
                name="freeShippingMinSoles"
                type="text"
                defaultValue={
                  z.freeShippingMinSubtotal
                    ? (z.freeShippingMinSubtotal / 100).toFixed(2)
                    : ""
                }
                placeholder="Sin mínimo"
                className="mt-1 h-9 w-full border border-ink/25 bg-[#fbfaf7] px-2.5 font-mono text-xs text-ink"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-mono text-[0.62rem] uppercase text-taupe-600">
                Plazo estimado
              </label>
              <input
                name="estimatedDaysLabel"
                type="text"
                defaultValue={z.estimatedDaysLabel}
                className="mt-1 h-9 w-full border border-ink/25 bg-[#fbfaf7] px-2.5 text-xs text-ink"
              />
            </div>

            <div className="flex items-center justify-between gap-2 md:col-span-2">
              <label className="flex items-center gap-1.5 font-mono text-xs text-ink">
                <input
                  name="isAvailable"
                  type="checkbox"
                  defaultChecked={z.isAvailable}
                  className="accent-ink"
                />
                <span>Habilitada</span>
              </label>
              <input
                type="hidden"
                name="unavailableReason"
                value={z.unavailableReason ?? ""}
              />
              <button
                type="submit"
                disabled={editingZoneId === z.id}
                className="inline-flex h-9 items-center justify-center gap-1 bg-ink px-3 font-mono text-[0.65rem] uppercase text-paper hover:bg-cochinilla disabled:opacity-50"
              >
                {editingZoneId === z.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span>Guardar</span>
              </button>
            </div>
          </form>
        ))}
      </div>
    </section>
  );
}

