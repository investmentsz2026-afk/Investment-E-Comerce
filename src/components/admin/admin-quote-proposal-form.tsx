"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
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
  ShieldCheck,
  Calendar,
  CreditCard,
  Layers,
} from "lucide-react";

interface AdminQuoteProposalFormProps {
  quote: QuoteDetail;
}

export function AdminQuoteProposalForm({ quote }: AdminQuoteProposalFormProps) {
  const router = useRouter();
  const isImmutable = ["accepted", "rejected", "cancelled"].includes(
    quote.status,
  );

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
    quote.paymentTermsProposal ??
      "50% adelanto a la orden de compra, 50% contra entrega con Factura Electrónica",
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

  const [confirmOpen, setConfirmOpen] = useState(false);
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
      const cents =
        parseSolesToCents(
          String(edit.quotedUnitPriceSoles).replace(",", "."),
        ) ?? 0;
      const qty = Math.max(0, Math.trunc(Number(edit.approvedQuantity) || 0));
      sum += cents * qty;
    }
    return sum;
  }, [itemEdits]);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setConfirmOpen(true);
  };

  const executeSubmit = async () => {
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

      setConfirmOpen(false);

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
    <>
      <form onSubmit={handleRequestSubmit} className="space-y-6 font-sans">
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 p-4 text-xs font-bold text-red-900"
            >
              <AlertCircle
                className="mt-0.5 size-5 shrink-0 text-[#DC2626]"
                aria-hidden
              />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-950"
            >
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {isImmutable && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-950"
          >
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-amber-700"
              aria-hidden
            />
            <span>
              Esta cotización se encuentra en estado definitivo (
              <strong>{quote.status}</strong>). Las condiciones comerciales
              emitidas y aceptadas/cerradas son inmutables como respaldo de
              auditoría.
            </span>
          </div>
        )}

        {/* Tabla editable de precios unitarios y cantidades válidas */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
                <Layers className="size-5" />
              </span>
              <div>
                <h2 className="font-sans text-xl font-black tracking-tight text-slate-900">
                  1. Propuesta Económica por Variante
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  Define cantidades aprobadas y tarifas unitarias especiales
                  ofrecidas a la empresa.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-3 text-right">
              <span className="block text-[0.65rem] font-extrabold uppercase tracking-wider text-emerald-700">
                Total Propuesta Calculado
              </span>
              <span
                data-testid="admin-quote-calculated-total"
                className="font-sans text-2xl font-black tabular-nums text-emerald-800"
              >
                {formatPEN(calculatedTotalCents)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-4">Prenda / SKU</th>
                  <th className="px-4 py-4">Stock Actual</th>
                  <th className="px-4 py-4">Solicitada</th>
                  <th className="px-4 py-4">Ref. Catálogo</th>
                  <th className="px-4 py-4">Cant. Aprobada *</th>
                  <th className="px-4 py-4">Precio Propuesto (S/) *</th>
                  <th className="px-6 py-4 text-right">Subtotal Línea</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.items.map((item) => {
                  const edit = itemEdits.find((e) => e.itemId === item.id)!;
                  const unitCents =
                    parseSolesToCents(
                      String(edit.quotedUnitPriceSoles).replace(",", "."),
                    ) ?? 0;
                  const subCents =
                    unitCents * (Number(edit.approvedQuantity) || 0);
                  const exceedsLiveStock =
                    item.liveStock !== null &&
                    edit.approvedQuantity > item.liveStock;
                  const imgSrc = item.imageUrlSnapshot ?? "/placeholder.jpg";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative aspect-[3/4] w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            <Image
                              src={imgSrc}
                              alt={item.productNameSnapshot}
                              fill
                              sizes="44px"
                              unoptimized={imgSrc.startsWith("/api/media/")}
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">
                              {item.productNameSnapshot}
                            </p>
                            <p className="text-xs font-semibold text-slate-500">
                              {item.skuSnapshot} ·{" "}
                              {item.colorNameSnapshot ?? "Único"} · Talla{" "}
                              {item.sizeSnapshot ?? "Única"}
                            </p>
                            {item.itemNotes && (
                              <p className="mt-0.5 text-xs italic text-slate-500">
                                Nota cliente: {item.itemNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold">
                        {item.liveStock !== null ? (
                          <span
                            className={
                              exceedsLiveStock
                                ? "inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-amber-900"
                                : "inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800"
                            }
                          >
                            {exceedsLiveStock && (
                              <AlertTriangle className="size-3" />
                            )}
                            {item.liveStock} uds.
                          </span>
                        ) : (
                          "N/D"
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold tabular-nums text-slate-700">
                        {item.requestedQuantity} uds.
                      </td>
                      <td className="px-4 py-4 text-xs font-bold tabular-nums text-slate-700">
                        {formatPEN(item.referenceUnitPriceSnapshot)}
                        <span className="block text-[0.65rem] font-medium text-slate-400">
                          Retail: {formatPEN(item.retailUnitPriceSnapshot)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min={1}
                          max={50000}
                          disabled={isImmutable}
                          aria-label={`Cantidad aprobada para ${item.skuSnapshot}`}
                          value={edit.approvedQuantity}
                          onChange={(e) =>
                            updateItemField(
                              item.id,
                              "approvedQuantity",
                              Number(e.target.value),
                            )
                          }
                          className="h-10 w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black tabular-nums text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          inputMode="decimal"
                          disabled={isImmutable}
                          aria-label={`Precio unitario propuesto para ${item.skuSnapshot}`}
                          value={edit.quotedUnitPriceSoles}
                          onChange={(e) =>
                            updateItemField(
                              item.id,
                              "quotedUnitPriceSoles",
                              e.target.value,
                            )
                          }
                          className="h-10 w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black tabular-nums text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
                        />
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black tabular-nums text-slate-900">
                        {formatPEN(subCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Estado, vigencia, condiciones y notas internas */}
        <section className="space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)] sm:p-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldCheck className="size-5" />
            </span>
            <h2 className="font-sans text-xl font-black tracking-tight text-slate-900">
              2. Dictamen, Vigencia y Condiciones Comerciales
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label
                htmlFor="admin-quote-status"
                className="block text-xs font-extrabold uppercase tracking-wider text-slate-700"
              >
                Estado de la Cotización *
              </label>
              <select
                id="admin-quote-status"
                name="nextStatus"
                disabled={isImmutable}
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as QuoteStatus)}
                className="mt-2 block h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm font-bold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white disabled:opacity-60"
              >
                <option value="submitted">Enviada (submitted)</option>
                <option value="under_review">En revisión (under_review)</option>
                <option value="quoted">
                  Publicar propuesta económica (quoted)
                </option>
                {quote.status === "accepted" && (
                  <option value="accepted">
                    Aceptada por cliente (accepted)
                  </option>
                )}
                <option value="rejected">Rechazar solicitud (rejected)</option>
                <option value="expired">Marcar como vencida (expired)</option>
                <option value="cancelled">Cancelada (cancelled)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-quote-valid-until"
                className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700"
              >
                <Calendar className="size-3.5 text-[#DC2626]" />
                <span>Fecha de Vencimiento *</span>
              </label>
              <input
                id="admin-quote-valid-until"
                name="validUntilDate"
                type="date"
                disabled={isImmutable}
                value={validUntilDate}
                onChange={(e) => setValidUntilDate(e.target.value)}
                className="mt-2 block h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm font-bold tabular-nums text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="admin-quote-payment-terms"
                className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700"
              >
                <CreditCard className="size-3.5 text-blue-700" />
                <span>Condiciones de Pago</span>
              </label>
              <input
                id="admin-quote-payment-terms"
                name="paymentTermsProposal"
                type="text"
                disabled={isImmutable}
                value={paymentTermsProposal}
                onChange={(e) => setPaymentTermsProposal(e.target.value)}
                className="mt-2 block h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="admin-proposal-notes"
                className="block text-xs font-extrabold uppercase tracking-wider text-slate-700"
              >
                Mensaje Comercial (Visible para la Empresa)
              </label>
              <textarea
                id="admin-proposal-notes"
                name="adminProposalNotes"
                rows={3}
                disabled={isImmutable}
                value={adminProposalNotes}
                onChange={(e) => setAdminProposalNotes(e.target.value)}
                placeholder="Detalla plazos de despacho, bonificaciones por volumen o condiciones garantizadas..."
                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs font-medium text-slate-900 outline-none focus:border-[#DC2626] focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="admin-internal-notes"
                className="block text-xs font-extrabold uppercase tracking-wider text-[#DC2626]"
              >
                Observaciones Internas (Confidencial — Solo Admin)
              </label>
              <textarea
                id="admin-internal-notes"
                name="internalNotes"
                rows={3}
                disabled={isImmutable}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Notas internas de margen, evaluación crediticia o disponibilidad en taller..."
                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              disabled={isPending || isImmutable}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-8 text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_5px_0_#7F1D1D,0_12px_24px_rgba(220,38,38,0.28)] transition hover:brightness-110 disabled:opacity-50"
            >
              {nextStatus === "quoted" ? (
                <>
                  <Send className="size-4" aria-hidden />
                  Publicar y Enviar Propuesta
                </>
              ) : (
                <>
                  <Save className="size-4" aria-hidden />
                  Guardar Cambios de Cotización
                </>
              )}
            </motion.button>
          </div>
        </section>
      </form>

      {/* MODAL MODERNO DE CONFIRMACIÓN */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 font-sans shadow-2xl"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-[#DC2626]">
                  <ShieldCheck className="size-6" />
                </span>
                <div>
                  <h3 className="font-sans text-lg font-black text-slate-900">
                    ¿Confirmar Cotización B2B?
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    {quote.quoteNumber} · Total:{" "}
                    {formatPEN(calculatedTotalCents)}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                Se actualizará la cotización para{" "}
                <strong className="font-extrabold text-slate-900">
                  {quote.companyLegalName}
                </strong>{" "}
                al estado{" "}
                <strong className="font-black text-[#DC2626]">
                  {nextStatus}
                </strong>
                .
              </p>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => void executeSubmit()}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_#7F1D1D] hover:brightness-110 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  <span>Sí, Confirmar</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
