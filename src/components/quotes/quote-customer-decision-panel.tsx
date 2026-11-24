"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { respondToWholesaleQuoteAction } from "@/server/actions/quotes";
import type { QuoteStatus } from "@/server/queries/quotes";
import {
  CheckCircle2,
  XCircle,
  Ban,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

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
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/70 p-6 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">
                Propuesta Económica Aceptada
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {convertedOrderId
                  ? `Esta cotización ya fue convertida exitosamente en el pedido formal ${convertedOrderNumber ?? `#${convertedOrderId}`}.`
                  : "Tus precios unitarios y cantidades aprobadas están garantizados e inmutables. Puedes convertir esta cotización en un pedido formal ahora mismo."}
              </p>
            </div>
          </div>

          {convertedOrderId ? (
            <Link
              href={`/cuenta/pedidos/${convertedOrderId}`}
              data-testid="quote-view-converted-order-btn"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#EF233C]"
            >
              <ShoppingBag className="size-4" aria-hidden />
              Ver Pedido {convertedOrderNumber ?? `#${convertedOrderId}`}
            </Link>
          ) : (
            <Link
              href={`/checkout?quoteId=${quoteId}`}
              data-testid="quote-convert-to-order-btn"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <span>Convertir en Pedido</span>
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (status === "expired" || (status === "quoted" && isExpiredNow)) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-100/80 p-6 text-slate-800">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-[#EF233C]">
            <AlertCircle className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-900">
              Propuesta Económica Vencida
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
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
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="font-sans text-xl font-black uppercase tracking-tight text-slate-900">
        {status === "quoted"
          ? "Responder a la Propuesta Económica"
          : "Gestionar Solicitud"}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        {status === "quoted"
          ? "Revisa los precios unitarios y cantidades aprobadas por nuestro equipo. Al aceptar, se registrará tu conformidad comercial con las condiciones ofrecidas."
          : "Tu solicitud se encuentra en evaluación por el equipo comercial. Si ya no requieres esta cotización, puedes cancelarla."}
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-[#D90429]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-900">
          {feedback}
        </div>
      )}

      <div className="mt-4">
        <label
          htmlFor="decision-notes"
          className="block text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-slate-700"
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
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {status === "quoted" && !isExpiredNow && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => void handleDecision("accepted")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" aria-hidden />
              )}
              Aceptar propuesta
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => void handleDecision("rejected")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 text-xs font-bold uppercase tracking-wider text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900 disabled:opacity-50"
          >
            <Ban className="size-3.5" aria-hidden />
            Cancelar solicitud
          </button>
        )}
      </div>
    </div>
  );
}
