"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  retryOrderPaymentAction,
  customerCancelPendingOrderAction,
} from "@/server/actions/orders";
import {
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Ban,
} from "lucide-react";

interface OrderCustomerActionsProps {
  orderId: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
}

export function OrderCustomerActions({
  orderId,
  orderNumber,
  status,
  paymentStatus,
}: OrderCustomerActionsProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [scenario, setScenario] = useState<"sandbox_approve" | "sandbox_reject">(
    "sandbox_approve",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canRetryOrCancel =
    paymentStatus !== "approved" &&
    ["pending_payment", "payment_failed", "payment_processing"].includes(status);

  if (!canRetryOrCancel) {
    return null;
  }

  const handleRetryPayment = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      const res = await retryOrderPaymentAction({
        orderId,
        idempotencyKey: `retry_${orderId}_${Date.now()}`,
        paymentProvider: "sandbox",
        paymentToken: scenario,
        maskedCardLast4: "4242",
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "No se pudo completar el reintento de pago.");
        router.refresh();
        return;
      }

      setSuccessMessage(
        res.data?.message ?? `Pago del pedido ${orderNumber} verificado exitosamente.`,
      );
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  const handleCancelOrder = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    try {
      const res = await customerCancelPendingOrderAction({
        orderId,
        reason: "Cancelado por el cliente desde el detalle del pedido",
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "No se pudo cancelar el pedido.");
        return;
      }

      setSuccessMessage("El pedido ha sido cancelado y las unidades reservadas han sido liberadas.");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      data-testid="customer-order-payment-retry-panel"
      className="border border-amber-400 bg-amber-50/70 p-6 space-y-4"
    >
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-950">
          Gestión de Pago Pendiente / Reintento Seguro
        </p>
        <p className="mt-1 text-xs text-amber-900">
          Tu reserva de inventario se mantiene activa mientras confirmas el pago. Puedes reintentar la operación de forma idempotente sin duplicar tu pedido.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2 border-l-2 border-cochinilla bg-cochinilla/10 p-3 text-xs text-cochinilla"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2 border border-emerald-400 bg-emerald-50 p-3 text-xs text-emerald-950">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Resultado de reintento Sandbox"
          value={scenario}
          onChange={(e) =>
            setScenario(e.target.value as "sandbox_approve" | "sandbox_reject")
          }
          className="h-10 border border-ink/25 bg-paper px-3 font-mono text-xs text-ink"
        >
          <option value="sandbox_approve">Simular Pago Aprobado (Sandbox)</option>
          <option value="sandbox_reject">Simular Pago Rechazado (Sandbox)</option>
        </select>

        <button
          type="button"
          data-testid="retry-payment-btn"
          disabled={isPending}
          onClick={() => void handleRetryPayment()}
          className="inline-flex h-10 items-center justify-center gap-2 bg-ink px-5 font-mono text-xs font-semibold uppercase tracking-wider text-paper hover:bg-cochinilla disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <CreditCard className="size-4" aria-hidden />
          )}
          <span>Procesar / Reintentar Pago</span>
        </button>

        <button
          type="button"
          data-testid="customer-cancel-order-btn"
          disabled={isPending}
          onClick={() => void handleCancelOrder()}
          className="inline-flex h-10 items-center justify-center gap-1.5 border border-ink/25 bg-paper px-4 font-mono text-xs uppercase tracking-wider text-taupe-700 hover:border-ink hover:text-ink disabled:opacity-50"
        >
          <Ban className="size-3.5" aria-hidden />
          <span>Cancelar Pedido y Liberar Stock</span>
        </button>
      </div>
    </div>
  );
}

