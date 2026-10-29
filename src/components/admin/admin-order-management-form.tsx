"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminManageOrderAction,
  adminRetryOrSyncTaxDocumentAction,
  adminReconcileMercadoPagoPaymentAction,
} from "@/server/actions/orders";
import type { OrderStatus } from "@/server/queries/orders";
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Truck,
  FileText,
  RefreshCw,
} from "lucide-react";

interface AdminOrderManagementFormProps {
  orderId: number;
  orderNumber: string;
  currentStatus: OrderStatus;
  paymentStatus: string;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  paymentReference: string | null;
  adminNotes: string | null;
}

export function AdminOrderManagementForm({
  orderId,
  orderNumber,
  currentStatus,
  paymentStatus,
  carrierName: initialCarrier,
  trackingNumber: initialTracking,
  trackingUrl: initialTrackingUrl,
  paymentReference: initialPaymentRef,
  adminNotes: initialAdminNotes,
}: AdminOrderManagementFormProps) {
  const router = useRouter();
  const isTerminal = currentStatus === "cancelled" || currentStatus === "refunded";

  const [nextStatus, setNextStatus] = useState<OrderStatus>(currentStatus);
  const [carrierName, setCarrierName] = useState(initialCarrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(initialTracking ?? "");
  const [trackingUrl, setTrackingUrl] = useState(initialTrackingUrl ?? "");
  const [paymentReference, setPaymentReference] = useState(
    initialPaymentRef ?? "",
  );
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes ?? "");
  const [reason, setReason] = useState("");

  const [isPending, setIsPending] = useState(false);
  const [isSyncingTax, setIsSyncingTax] = useState(false);
  const [mpPaymentIdInput, setMpPaymentIdInput] = useState("");
  const [isSyncingMp, setIsSyncingMp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSyncTaxDocument = async (op: "emit_or_retry" | "query_status") => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSyncingTax(true);
    try {
      const res = await adminRetryOrSyncTaxDocumentAction({
        orderId,
        operation: op,
      });
      if (!res.success) {
        setErrorMessage(res.error ?? "No se pudo sincronizar el comprobante tributario.");
        return;
      }
      setSuccessMessage(
        res.data?.summary ??
          `Estado del comprobante tributario actualizado: ${res.data?.status}.`,
      );
      router.refresh();
    } finally {
      setIsSyncingTax(false);
    }
  };

  const handleReconcileMp = async () => {
    if (!mpPaymentIdInput.trim()) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSyncingMp(true);
    try {
      const res = await adminReconcileMercadoPagoPaymentAction({
        orderId,
        mpPaymentId: mpPaymentIdInput.trim(),
      });
      if (!res.success) {
        setErrorMessage(res.error ?? "No se pudo verificar el pago en Mercado Pago.");
        return;
      }
      setSuccessMessage(
        res.data?.message ?? "Pago verificado en la API oficial de Mercado Pago.",
      );
      router.refresh();
    } finally {
      setIsSyncingMp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      const res = await adminManageOrderAction({
        orderId,
        nextStatus,
        carrierName,
        trackingNumber,
        trackingUrl,
        paymentReference,
        adminNotes,
        reason,
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "No se pudo actualizar el pedido.");
        return;
      }

      setSuccessMessage(
        `Pedido ${orderNumber} actualizado al estado "${res.data?.status}" y registrado en el historial de auditoría.`,
      );
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-ink/15 bg-paper p-6 space-y-5"
    >
      <div className="flex items-center justify-between border-b border-ink/10 pb-3">
        <div className="flex items-center gap-2">
          <Truck className="size-5 text-cochinilla" aria-hidden />
          <div>
            <h2 className="font-display text-xl text-ink">
              Control Logístico, Conciliación y Reembolsos
            </h2>
            <p className="text-xs text-taupe-500">
              Los importes financieros del pedido son inmutables. Todo cambio de estado queda registrado en auditoría.
            </p>
          </div>
        </div>
      </div>

      {isTerminal && (
        <div className="flex items-start gap-2.5 border border-amber-400 bg-amber-50 p-4 text-xs text-amber-950">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <span>
            Este pedido se encuentra en estado definitivo (<strong>{currentStatus}</strong>). Su inventario ya fue liberado/repuesto y no admite nuevas transiciones.
          </span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 border-l-2 border-cochinilla bg-cochinilla/10 p-3.5 text-xs text-cochinilla"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2 border border-emerald-400 bg-emerald-50 p-3.5 text-xs text-emerald-950">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="admin-order-next-status"
            className="block font-mono text-xs uppercase tracking-wider text-ink"
          >
            Estado del Pedido *
          </label>
          <select
            id="admin-order-next-status"
            name="nextStatus"
            disabled={isTerminal}
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
            className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-sm font-medium text-ink disabled:opacity-60"
          >
            <option value="pending_payment">Pendiente de Pago (pending_payment)</option>
            <option value="payment_processing">Pago en Proceso (payment_processing)</option>
            <option value="paid">Pagado / Confirmado (paid)</option>
            <option value="preparing">Preparando Pedido en Almacén (preparing)</option>
            <option value="shipped">Enviado / Despachado (shipped)</option>
            <option value="delivered">Entregado al Cliente (delivered)</option>
            <option value="payment_failed">Pago Fallido (payment_failed)</option>
            <option value="cancelled">Cancelar Pedido No Pagado (cancelled)</option>
            <option value="refunded">Reembolsar Pedido Pagado y Reponer Stock (refunded)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="admin-payment-ref"
            className="block font-mono text-xs uppercase tracking-wider text-ink"
          >
            Referencia de Pago / Operación Bancaria
          </label>
          <input
            id="admin-payment-ref"
            name="paymentReference"
            type="text"
            disabled={isTerminal}
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Ej: N° operación BCP / ID cargo Culqi"
            className="mt-1.5 block h-11 w-full border border-ink/25 bg-[#fbfaf7] px-3 font-mono text-xs text-ink"
          />
          {paymentStatus !== "approved" && nextStatus === "paid" && (
            <p className="mt-1 text-[0.68rem] text-emerald-800">
              Al pasar a &ldquo;Pagado&rdquo;, se confirmará la salida de stock y se activará el comprobante tributario.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="admin-carrier-name"
            className="block font-mono text-xs uppercase tracking-wider text-ink"
          >
            Operador Logístico / Transportista
          </label>
          <input
            id="admin-carrier-name"
            name="carrierName"
            type="text"
            disabled={isTerminal}
            value={carrierName}
            onChange={(e) => setCarrierName(e.target.value)}
            placeholder="Ej: Olva Courier / Shalom / Urbano"
            className="mt-1.5 block h-10 w-full border border-ink/25 bg-[#fbfaf7] px-3 text-xs text-ink"
          />
        </div>

        <div>
          <label
            htmlFor="admin-tracking-number"
            className="block font-mono text-xs uppercase tracking-wider text-ink"
          >
            Código de Seguimiento (Tracking)
          </label>
          <input
            id="admin-tracking-number"
            name="trackingNumber"
            type="text"
            disabled={isTerminal}
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Código real de guía"
            className="mt-1.5 block h-10 w-full border border-ink/25 bg-[#fbfaf7] px-3 font-mono text-xs text-ink"
          />
        </div>

        <div>
          <label
            htmlFor="admin-tracking-url"
            className="block font-mono text-xs uppercase tracking-wider text-ink"
          >
            URL de Seguimiento (opcional)
          </label>
          <input
            id="admin-tracking-url"
            name="trackingUrl"
            type="url"
            disabled={isTerminal}
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1.5 block h-10 w-full border border-ink/25 bg-[#fbfaf7] px-3 font-mono text-xs text-ink"
          />
        </div>
      </div>

      {(nextStatus === "cancelled" || nextStatus === "refunded") && (
        <div>
          <label
            htmlFor="admin-cancel-refund-reason"
            className="block font-mono text-xs font-semibold uppercase tracking-wider text-cochinilla"
          >
            Motivo Obligatorio de Cancelación o Reembolso (Auditable) *
          </label>
          <input
            id="admin-cancel-refund-reason"
            name="reason"
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explica el motivo del reembolso o cancelación para el registro de auditoría e inventario..."
            className="mt-1.5 block h-10 w-full border border-cochinilla/50 bg-[#fbfaf7] px-3 text-xs text-ink"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="admin-order-notes"
          className="block font-mono text-xs uppercase tracking-wider text-cochinilla"
        >
          Notas Internas de Administración (Confidencial — No visible para el cliente)
        </label>
        <textarea
          id="admin-order-notes"
          name="adminNotes"
          rows={2}
          disabled={isTerminal}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Observaciones internas de despacho o verificación contable..."
          className="mt-1.5 block w-full border border-ink/25 bg-[#fbfaf7] p-3 text-xs text-ink"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isSyncingTax}
            onClick={() => void handleSyncTaxDocument("emit_or_retry")}
            className="inline-flex h-10 items-center justify-center gap-1.5 border border-ink/25 bg-[#fbfaf7] px-3.5 font-mono text-[0.68rem] uppercase text-ink hover:border-ink disabled:opacity-50"
          >
            {isSyncingTax ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5 text-cochinilla" />
            )}
            <span>Emitir / Reintentar Comprobante PSE</span>
          </button>

          <button
            type="button"
            disabled={isSyncingTax}
            onClick={() => void handleSyncTaxDocument("query_status")}
            className="inline-flex h-10 items-center justify-center gap-1.5 border border-ink/25 bg-[#fbfaf7] px-3.5 font-mono text-[0.68rem] uppercase text-ink hover:border-ink disabled:opacity-50"
          >
            <RefreshCw className="size-3.5" />
            <span>Consultar Estado SUNAT</span>
          </button>
        </div>

        <button
          type="submit"
          data-testid="admin-save-order-btn"
          disabled={isPending || isTerminal}
          className="inline-flex h-11 items-center justify-center gap-2 bg-ink px-7 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-paper hover:bg-cochinilla disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Actualizar Estado y Registrar Auditoría
            </>
          )}
        </button>
      </div>

      {/* Herramienta de conciliación directa con API Mercado Pago ante incidencias de red */}
      {paymentStatus !== "approved" && !isTerminal && (
        <div className="border-t border-ink/10 pt-4 text-xs">
          <p className="font-mono text-[0.68rem] uppercase text-taupe-600">
            Conciliación / Recuperación por ID de Pago en Mercado Pago API (Opcional):
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={mpPaymentIdInput}
              onChange={(e) => setMpPaymentIdInput(e.target.value)}
              placeholder="ID de pago Mercado Pago (ej. 8899112233)"
              className="h-9 w-64 border border-ink/25 bg-[#fbfaf7] px-3 font-mono text-xs text-ink"
            />
            <button
              type="button"
              disabled={isSyncingMp || !mpPaymentIdInput.trim()}
              onClick={() => void handleReconcileMp()}
              className="inline-flex h-9 items-center gap-1.5 border border-ink bg-paper px-3.5 font-mono text-[0.68rem] uppercase text-ink hover:bg-ink hover:text-paper disabled:opacity-50"
            >
              {isSyncingMp ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              <span>Verificar en API Mercado Pago</span>
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

