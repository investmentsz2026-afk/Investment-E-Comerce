"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminAdjustInventoryAction } from "@/server/actions/admin-commerce";
import type { AdminInventoryOperationKind } from "@/server/inventory/service";
import {
  Boxes,
  CheckCircle2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Sliders,
} from "lucide-react";

interface VariantSelectorItem {
  variant: {
    id: number;
    sku: string;
    size: string | null;
    colorName: string | null;
    stock: number;
  };
  productName: string;
}

interface AdminInventoryAdjustmentFormProps {
  variants: VariantSelectorItem[];
}

export function AdminInventoryAdjustmentForm({
  variants,
}: AdminInventoryAdjustmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [variantId, setVariantId] = useState<string>(
    variants[0] ? String(variants[0].variant.id) : "",
  );
  const [operationKind, setOperationKind] =
    useState<AdminInventoryOperationKind>("entry");
  const [quantity, setQuantity] = useState<string>("10");
  const [reason, setReason] = useState<string>("");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedVariant = variants.find(
    (v) => String(v.variant.id) === variantId,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!variantId) {
      setFeedback({ type: "error", text: "Selecciona una variante SKU." });
      return;
    }

    startTransition(async () => {
      const res = await adminAdjustInventoryAction({
        variantId: Number(variantId),
        operationKind,
        quantity: Number(quantity),
        reason,
      });

      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "No se pudo registrar el movimiento.",
        });
        return;
      }

      setFeedback({
        type: "success",
        text: res.message ?? "Movimiento registrado en el kardex.",
      });
      setReason("");
      router.refresh();
    });
  };

  return (
    <div className="border border-ink/10 bg-paper p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-ink/10 pb-3">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
            OPERACIÓN DE ALMACÉN Y KARDEX
          </p>
          <h2 className="font-display text-xl text-ink">
            Registrar Entrada, Ajuste o Merma de Stock
          </h2>
        </div>
        <Boxes className="size-5 text-cochinilla" aria-hidden />
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-start gap-2 border p-3.5 text-xs ${
            feedback.type === "success"
              ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-950"
              : "border-rose-500/30 bg-rose-500/10 text-rose-950"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-700" aria-hidden />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <label
            htmlFor="inv-variant"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Variante / SKU *
          </label>
          <select
            id="inv-variant"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 font-mono text-xs text-ink"
          >
            {variants.map((item) => (
              <option key={item.variant.id} value={item.variant.id}>
                [{item.variant.sku}] {item.productName} ({item.variant.size ?? "U"} /{" "}
                {item.variant.colorName ?? "-"}) — Disp: {item.variant.stock} uds.
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="inv-op"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Tipo de Operación *
          </label>
          <select
            id="inv-op"
            value={operationKind}
            onChange={(e) =>
              setOperationKind(e.target.value as AdminInventoryOperationKind)
            }
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
          >
            <option value="entry">Entrada de Lote (+ Stock)</option>
            <option value="shrinkage">Baja por Merma / Pérdida (- Stock)</option>
            <option value="adjustment">Ajuste de Conteo (+/- Delta)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="inv-qty"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Cantidad (uds.) *
          </label>
          <input
            id="inv-qty"
            type="number"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 font-mono text-xs font-bold text-ink"
          />
          {selectedVariant && (
            <span className="mt-0.5 block font-mono text-[0.62rem] text-taupe-600">
              Disponible actual: {selectedVariant.variant.stock} uds.
            </span>
          )}
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <label
            htmlFor="inv-reason"
            className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
          >
            Motivo Obligatorio de Almacén / Guía de Remisión *
          </label>
          <input
            id="inv-reason"
            type="text"
            required
            minLength={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Ingreso de taller Lote #2026-10 / Control de calidad / Ajuste por inventario físico..."
            className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-1.5 bg-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-paper transition-colors hover:bg-cochinilla disabled:opacity-50"
          >
            {operationKind === "entry" ? (
              <ArrowUpCircle className="size-3.5" aria-hidden />
            ) : operationKind === "shrinkage" ? (
              <ArrowDownCircle className="size-3.5" aria-hidden />
            ) : (
              <Sliders className="size-3.5" aria-hidden />
            )}
            <span>{isPending ? "Registrando..." : "Aplicar en Kardex"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

