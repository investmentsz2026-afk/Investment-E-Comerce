"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { adminUpdateWholesaleQuoteAction } from "@/server/actions/quotes";
import type { QuoteDetail, QuoteStatus } from "@/server/queries/quotes";
import { formatPEN } from "@/lib/format";
import { parseSolesToCents } from "@/lib/catalog-params";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Save,
  AlertTriangle,
} from "lucide-react";

interface AdminQuoteProposalFormProps {
  quote: QuoteDetail;
}

export function AdminQuoteProposalForm({ quote }: AdminQuoteProposalFormProps) {
  const router = useRouter();
  const isImmutable = ["accepted", "rejected", "cancelled"].includes(quote.status);

  const [nextStatus, setNextStatus] = useState<QuoteStatus>(
    quote.status === "submitted" ? "quoted" : quote.status,
  );
  const [validUntilDate, setValidUntilDate] = useState(() => {
    if (quote.validUntil) {
      return new Date(quote.validUntil).toISOString().slice(0, 10);
    }
    const baseTime = new Date(quote.createdAt).getTime();
    const d = new Date(baseTime + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [paymentTermsProposal, setPaymentTermsProposal] = useState(
    quote.paymentTermsProposal ?? "50% adelanto a la orden de compra, 50% contra entrega con Factura Electrónica",
  );
  const [adminProposalNotes, setAdminProposalNotes] = useState(
    quote.adminProposalNotes ?? "",
  );
  const [internalNotes, setInternalNotes] = useState(quote.internalNotes ?? "");

  const [itemEdits, setItemEdits] = useState<
    Array<{
      itemId: number;
      approvedQuantity: number;
      quotedUnitPriceSoles: string;
    }>
  >(() =>
    quote.items.map((it) => ({
      itemId: it.id,
      approvedQuantity: it.approvedQuantity ?? it.requestedQuantity,
      quotedUnitPriceSoles: (
        (it.quotedUnitPrice ?? it.referenceUnitPriceSnapshot) / 100
      ).toFixed(2),
    })),
  );

  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updateItemField = (
    itemId: number,
    field: "approvedQuantity" | "quotedUnitPriceSoles",
    value: number | string,
  ) => {
    setItemEdits((prev) =>
      prev.map((row) =>
        row.itemId === itemId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const calculatedTotalCents = useMemo(() => {
    let sum = 0;
    for (const edit of itemEdits) {
      const cents = parseSolesToCents(String(edit.quotedUnitPriceSoles).replace(",", ".")) ?? 0;
      const qty = Math.max(0, Math.trunc(Number(edit.approvedQuantity) || 0));
      sum += cents * qty;
    }
    return sum;
  }, [itemEdits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      const res = await adminUpdateWholesaleQuoteAction({
        quoteId: quote.id,
        nextStatus,
        validUntilDate,
        paymentTermsProposal,
        adminProposalNotes,
        internalNotes,
        items: itemEdits,
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "Error al actualizar la cotización.");
        return;
      }

      setSuccessMessage(
        `Cotización ${quote.quoteNumber} actualizada correctamente al estado "${res.data?.status}".`,
      );
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 border-l-2 border-cochinilla bg-cochinilla/10 p-4 text-xs text-cochinilla"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-2.5 border border-emerald-400 bg-emerald-50 p-4 text-xs text-emerald-950"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
          <span>{successMessage}</span>
        </div>
      )}

      {isImmutable && (
        <div
          role="status"
          className="flex items-start gap-2.5 border border-amber-400 bg-amber-50 p-4 text-xs text-amber-950"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
          <span>
            Esta cotización se encuentra en estado definitivo (<strong>{quote.status}</strong>). Las condiciones comerciales emitidas y aceptadas/cerradas son inmutables como respaldo de auditoría.
          </span>
        </div>
      )}

      {/* Tabla editable de precios unitarios y cantidades válidas */}
      <div className="border border-ink/15 bg-paper p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-4">
          <div>
            <h2 className="font-display text-2xl text-ink">
              1. Propuesta Económica por Variante
            </h2>
            <p className="text-xs text-taupe-600">
              Define las cantidades válidas y los precios unitarios especiales ofrecidos a la empresa. Estos valores quedarán congelados en el expediente.
            </p>
          </div>
          <div className="text-right">
            <span className="block font-mono text-[0.65rem] uppercase text-taupe-500">
              Total Propuesta Calculado
            </span>
            <span
              data-testid="admin-quote-calculated-total"
              className="font-display text-2xl font-bold tabular-nums text-emerald-900"
            >
              {formatPEN(calculatedTotalCents)}
            </span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-[#fbfaf7] font-mono text-[0.65rem] uppercase tracking-[0.14em] text-taupe-600">
              <tr>
                <th className="px-4 py-3">Prenda / SKU</th>
                <th className="px-4 py-3">Stock Actual</th>
                <th className="px-4 py-3">Cant. Solicitada</th>
                <th className="px-4 py-3">Precio Ref. Catálogo</th>
                <th className="px-4 py-3">Cant. Aprobada *</th>
                <th className="px-4 py-3">Precio Unit. Propuesto (S/) *</th>
                <th className="px-4 py-3 text-right">Subtotal Línea</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {quote.items.map((item) => {
                const edit = itemEdits.find((e) => e.itemId === item.id)!;
                const unitCents =
                  parseSolesToCents(String(edit.quotedUnitPriceSoles).replace(",", ".")) ?? 0;
                const subCents = unitCents * (Number(edit.approvedQuantity) || 0);
                const exceedsLiveStock =
                  item.liveStock !== null && edit.approvedQuantity > item.liveStock;

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative aspect-[3/4] w-11 shrink-0 overflow-hidden bg-taupe-100">
                          <Image
                            src={item.imageUrlSnapshot ?? "/placeholder.jpg"}
                            alt={item.productNameSnapshot}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-ink">{item.productNameSnapshot}</p>
                          <p className="font-mono text-xs text-taupe-500">
                            {item.skuSnapshot} · {item.colorNameSnapshot ?? "Único"} · Talla{" "}
                            {item.sizeSnapshot ?? "Única"}
                          </p>
                          {item.itemNotes && (
                            <p className="mt-0.5 text-xs italic text-taupe-600">
                              Nota cliente: {item.itemNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">
                      {item.liveStock !== null ? (
                        <span
                          className={
                            exceedsLiveStock
                              ? "inline-flex items-center gap-1 font-semibold text-amber-800"
                              : "text-emerald-800"
                          }
                        >
                          {exceedsLiveStock && <AlertTriangle className="size-3" />}
                          {item.liveStock} uds.
                        </span>
                      ) : (
                        "N/D"
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs tabular-nums text-taupe-700">
                      {item.requestedQuantity} uds.
                    </td>
                    <td className="px-4 py-4 font-mono text-xs tabular-nums text-taupe-600">
                      {formatPEN(item.referenceUnitPriceSnapshot)}
                      <span className="block text-[0.62rem] text-taupe-400">
                        Retail: {formatPEN(item.retailUnitPriceSnapshot)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min={1}
                        max={50000}
                        aria-label={`Cantidad aprobada para ${item.skuSnapshot}`}
                        value={edit.approvedQuantity}
                        onChange={(e) =>
                          updateItemField(item.id, "approvedQuantity", Number(e.target.value))
                        }
                        className="h-9 w-24 border border-ink/25 bg-[#fbfaf7] px-2.5 font-mono text-xs tabular-nums text-ink focus:border-ink focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label={`Precio unitario propuesto para ${item.skuSnapshot}`}
                        value={edit.quotedUnitPriceSoles}
                        onChange={(e) =>
                          updateItemField(item.id, "quotedUnitPriceSoles", e.target.value)
                        }
                        className="h-9 w-28 border border-ink/25 bg-[#fbfaf7] px-2.5 font-mono text-xs tabular-nums text-ink focus:border-ink focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                      {formatPEN(subCents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estado, vigencia, condiciones y notas internas */}
      <div className="border border-ink/15 bg-paper p-6 space-y-5">
        <h2 className="font-display text-2xl text-ink">
          2. Dictamen, Vigencia y Observaciones
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="admin-quote-status"
              className="block font-mono text-xs uppercase tracking-wider text-ink"
            >
              Estado de la Cotización *
            </label>
            <select
              id="admin-quote-status"
              name="nextStatus"
              disabled={isImmutable}
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as QuoteStatus)}
              className="mt-2 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-sm font-medium text-ink focus:border-ink focus:outline-none disabled:opacity-60"
            >
              <option value="submitted">Enviada (submitted)</option>
              <option value="under_review">En revisión (under_review)</option>
              <option value="quoted">Publicar propuesta económica (quoted)</option>
              {quote.status === "accepted" && (
                <option value="accepted">Aceptada por cliente (accepted)</option>
              )}
              <option value="rejected">Rechazar solicitud (rejected)</option>
              <option value="expired">Marcar como vencida (expired)</option>
              <option value="cancelled">Cancelada (cancelled)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-quote-valid-until"
              className="block font-mono text-xs uppercase tracking-wider text-ink"
            >
              Fecha de Vencimiento de la Oferta *
            </label>
            <input
              id="admin-quote-valid-until"
              name="validUntilDate"
              type="date"
              value={validUntilDate}
              onChange={(e) => setValidUntilDate(e.target.value)}
              className="mt-2 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 font-mono text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="admin-quote-payment-terms"
              className="block font-mono text-xs uppercase tracking-wider text-ink"
            >
              Condiciones de Pago Ofrecidas
            </label>
            <input
              id="admin-quote-payment-terms"
              name="paymentTermsProposal"
              type="text"
              value={paymentTermsProposal}
              onChange={(e) => setPaymentTermsProposal(e.target.value)}
              className="mt-2 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="admin-proposal-notes"
              className="block font-mono text-xs uppercase tracking-wider text-ink"
            >
              Mensaje Comercial / Propuesta visible para la Empresa
            </label>
            <textarea
              id="admin-proposal-notes"
              name="adminProposalNotes"
              rows={3}
              value={adminProposalNotes}
              onChange={(e) => setAdminProposalNotes(e.target.value)}
              placeholder="Detalla plazos de despacho, bonificaciones por volumen o condiciones garantizadas para el cliente..."
              className="mt-2 block w-full border border-ink/25 bg-[#fbfaf7] p-3 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="admin-internal-notes"
              className="block font-mono text-xs uppercase tracking-wider text-cochinilla"
            >
              Observaciones Internas (Confidencial — Solo Admin)
            </label>
            <textarea
              id="admin-internal-notes"
              name="internalNotes"
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notas internas de margen, evaluación crediticia o disponibilidad en taller..."
              className="mt-2 block w-full border border-ink/25 bg-[#fbfaf7] p-3 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-ink/10 pt-4">
          <button
            type="submit"
            disabled={isPending || isImmutable}
            className="inline-flex h-12 items-center justify-center gap-2 bg-ink px-8 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Guardando propuesta...
              </>
            ) : nextStatus === "quoted" ? (
              <>
                <Send className="size-4" aria-hidden />
                Publicar y enviar propuesta económica
              </>
            ) : (
              <>
                <Save className="size-4" aria-hidden />
                Guardar cambios de cotización
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
