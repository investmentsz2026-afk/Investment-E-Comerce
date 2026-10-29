"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { respondToWholesaleQuoteAction } from "@/server/actions/quotes";
import type { QuoteStatus } from "@/server/queries/quotes";
import { CheckCircle2, XCircle, Ban, Loader2, AlertCircle, ArrowRight, ShoppingBag } from "lucide-react";

interface QuoteCustomerDecisionPanelProps {
  quoteId: number;
  status: QuoteStatus;
  isExpiredNow: boolean;
  convertedOrderId?: number | null;
  convertedOrderNumber?: string | null;
}

export function QuoteCustomerDecisionPanel({
  quoteId,
  status: initialStatus,
  isExpiredNow,
  convertedOrderId,
  convertedOrderNumber,
}: QuoteCustomerDecisionPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState<QuoteStatus>(initialStatus);
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDecision = async (decision: "accepted" | "rejected" | "cancelled") => {
    setError(null);
    setFeedback(null);
    setIsPending(true);

    try {
      const res = await respondToWholesaleQuoteAction({
        quoteId,
        decision,
        notes,
      });

      if (!res.success) {
        setError(res.error ?? "No se pudo registrar tu decisión.");
        return;
      }

      if (res.data?.status) {
        setStatus(res.data.status);
      }

      setFeedback(
        decision === "accepted"
          ? "¡Propuesta aceptada! Nuestro equipo comercial se pondrá en contacto para el cierre del pedido."
          : decision === "rejected"
            ? "Has rechazado la propuesta económica."
            : "La solicitud de cotización ha sido cancelada.",
      );
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  if (status === "accepted") {
    return (
      <div className="border border-emerald-400 bg-emerald-50/80 p-6 text-emerald-950">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden />
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">
                Propuesta Económica Aceptada por tu Empresa
              </p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                {convertedOrderId
                  ? `Esta cotización ya fue convertida exitosamente en el pedido formal ${convertedOrderNumber ?? `#${convertedOrderId}`}.`
                  : "Tus precios unitarios y cantidades aprobadas están garantizados e inmutables. Puedes convertir esta cotización aceptada en un pedido formal en el checkout."}
              </p>
            </div>
          </div>

          {convertedOrderId ? (
            <Link
              href={`/cuenta/pedidos/${convertedOrderId}`}
              data-testid="quote-view-converted-order-btn"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 bg-ink px-6 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-cochinilla"
            >
              <ShoppingBag className="size-4" aria-hidden />
              Ver Pedido {convertedOrderNumber ?? `#${convertedOrderId}`}
            </Link>
          ) : (
            <Link
              href={`/checkout?quoteId=${quoteId}`}
              data-testid="quote-convert-to-order-btn"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 bg-emerald-900 px-6 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-emerald-950"
            >
              <span>Convertir Cotización en Pedido</span>
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (status === "expired" || (status === "quoted" && isExpiredNow)) {
    return (
      <div className="border border-taupe-300 bg-taupe-100/80 p-6 text-taupe-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-cochinilla" aria-hidden />
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink">
              Propuesta Económica Vencida
            </p>
            <p className="mt-1 text-sm leading-relaxed text-taupe-600">
              La fecha límite de validez de esta cotización ha expirado, por lo que ya no puede ser aceptada. Puedes generar una nueva solicitud desde tu panel de cotizaciones.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "rejected" || status === "cancelled") {
    return null;
  }

  return (
    <div className="border border-ink/15 bg-[#fbfaf7] p-6 sm:p-8">
      <h3 className="font-display text-2xl text-ink">
        {status === "quoted"
          ? "Responder a la Propuesta Económica"
          : "Gestionar Solicitud"}
      </h3>
      <p className="mt-1 text-xs text-taupe-600">
        {status === "quoted"
          ? "Revisa los precios unitarios y cantidades aprobadas por nuestro equipo. Al aceptar, se registrará tu conformidad comercial con las condiciones ofrecidas."
          : "Tu solicitud se encuentra en evaluación por el equipo comercial. Si ya no requieres esta cotización, puedes cancelarla."}
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 border-l-2 border-cochinilla bg-cochinilla/10 p-3.5 text-xs text-cochinilla"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="mt-4 border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-900">
          {feedback}
        </div>
      )}

      <div className="mt-4">
        <label
          htmlFor="decision-notes"
          className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink"
        >
          Observación o comentario sobre tu decisión (opcional)
        </label>
        <textarea
          id="decision-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isPending}
          placeholder="Ej: Aceptamos la propuesta, requerimos coordinación de entrega para el lunes..."
          className="mt-2 block w-full border border-ink/20 bg-paper p-3 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {status === "quoted" && !isExpiredNow && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => void handleDecision("accepted")}
              className="inline-flex h-11 items-center justify-center gap-2 bg-emerald-900 px-6 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-emerald-950 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" aria-hidden />
              )}
              Aceptar propuesta económica
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => void handleDecision("rejected")}
              className="inline-flex h-11 items-center justify-center gap-2 border border-rose-300 bg-rose-50 px-5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-rose-900 transition-colors hover:bg-rose-100 disabled:opacity-50"
            >
              <XCircle className="size-4" aria-hidden />
              Rechazar propuesta
            </button>
          </>
        )}

        {(status === "submitted" || status === "under_review" || status === "quoted") && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => void handleDecision("cancelled")}
            className="inline-flex h-11 items-center justify-center gap-2 border border-ink/20 bg-paper px-5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-taupe-700 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
          >
            <Ban className="size-3.5" aria-hidden />
            Cancelar solicitud
          </button>
        )}
      </div>
    </div>
  );
}

