"use client";

import { useActionState, useState } from "react";
import { reviewApplicationAction, type AllowedReviewStatus } from "@/server/actions/admin";
import type { ActionResult } from "@/server/actions/auth";
import { CheckCircle2, XCircle, Clock, Ban, Loader2, AlertCircle } from "lucide-react";

interface ReviewActionFormProps {
  applicationId: number;
  currentStatus: string;
  defaultInternalNotes?: string | null;
}

export function ReviewActionForm({
  applicationId,
  currentStatus,
  defaultInternalNotes = "",
}: ReviewActionFormProps) {
  const initialStatus: AllowedReviewStatus =
    currentStatus === "rejected" || currentStatus === "suspended" || currentStatus === "under_review"
      ? (currentStatus as AllowedReviewStatus)
      : "approved";
  const [selectedStatus, setSelectedStatus] = useState<AllowedReviewStatus>(initialStatus);

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      const newStatus = (formData.get("newStatus") as AllowedReviewStatus) ?? selectedStatus;
      const internalNotes = (formData.get("internalNotes") as string) ?? "";
      const rejectionReason = (formData.get("rejectionReason") as string) ?? "";

      return reviewApplicationAction({
        applicationId,
        newStatus,
        internalNotes,
        rejectionReason,
      });
    },
    { success: false },
  );

  return (
    <form action={formAction} className="border border-ink/15 bg-paper p-6 sm:p-8 space-y-6">
      <div className="border-b border-ink/10 pb-3">
        <h3 className="font-display text-xl text-ink">Dictamen administrativo</h3>
        <p className="mt-1 text-xs text-taupe-500">
          Selecciona la resolución comercial para esta empresa. Esta acción modificará los permisos en la base de datos de manera atómica.
        </p>
      </div>

      {state.success && (
        <div className="flex items-center gap-2 border-l-2 border-emerald-600 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-700" aria-hidden />
          <span>{typeof state.data === "string" ? state.data : "Resolución guardada exitosamente."}</span>
        </div>
      )}

      {state.error && (
        <div className="flex items-start gap-2 border-l-2 border-cochinilla bg-cochinilla/5 p-3.5 text-xs text-cochinilla">
          <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      {/* Selector de resolución */}
      <div>
        <label className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink mb-2">
          Acción a tomar *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedStatus("approved")}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 border text-xs font-semibold uppercase tracking-wider transition-colors ${
              selectedStatus === "approved"
                ? "border-emerald-700 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-700"
                : "border-ink/15 text-taupe-700 hover:border-ink/40"
            }`}
          >
            <CheckCircle2 className="size-4 text-emerald-700" />
            <span>Aprobar</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("under_review")}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 border text-xs font-semibold uppercase tracking-wider transition-colors ${
              selectedStatus === "under_review"
                ? "border-blue-700 bg-blue-50 text-blue-900 ring-1 ring-blue-700"
                : "border-ink/15 text-taupe-700 hover:border-ink/40"
            }`}
          >
            <Clock className="size-4 text-blue-700" />
            <span>En evaluación</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("rejected")}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 border text-xs font-semibold uppercase tracking-wider transition-colors ${
              selectedStatus === "rejected"
                ? "border-cochinilla bg-cochinilla/10 text-cochinilla ring-1 ring-cochinilla"
                : "border-ink/15 text-taupe-700 hover:border-ink/40"
            }`}
          >
            <XCircle className="size-4 text-cochinilla" />
            <span>Rechazar</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus("suspended")}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 border text-xs font-semibold uppercase tracking-wider transition-colors ${
              selectedStatus === "suspended"
                ? "border-rose-700 bg-rose-50 text-rose-900 ring-1 ring-rose-700"
                : "border-ink/15 text-taupe-700 hover:border-ink/40"
            }`}
          >
            <Ban className="size-4 text-rose-700" />
            <span>Suspender</span>
          </button>
        </div>
        <input type="hidden" name="newStatus" value={selectedStatus} />
      </div>

      {/* Motivo de rechazo (obligatorio si es rejected) */}
      {selectedStatus === "rejected" && (
        <div className="border-l-2 border-cochinilla bg-cochinilla/5 p-4 space-y-2">
          <label htmlFor="rejectionReason" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-cochinilla">
            Motivo de rechazo (Se notificará al solicitante) *
          </label>
          <textarea
            id="rejectionReason"
            name="rejectionReason"
            required
            rows={3}
            placeholder="Indica la razón por la que no se autoriza la cuenta (ej: RUC inactivo ante SUNAT, volumen insuficiente, rubro no afín)..."
            className="block w-full border border-cochinilla/30 bg-paper px-3 py-2 text-xs text-ink placeholder:text-taupe-400 focus:border-cochinilla focus:outline-none"
          />
        </div>
      )}

      {/* Motivo de suspensión */}
      {selectedStatus === "suspended" && (
        <div className="border-l-2 border-rose-600 bg-rose-50/70 p-4 space-y-2">
          <label htmlFor="rejectionReason" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-rose-900">
            Motivo de suspensión comercial
          </label>
          <textarea
            id="rejectionReason"
            name="rejectionReason"
            rows={2}
            placeholder="Motivo interno o comunicado para la suspensión del acceso..."
            className="block w-full border border-rose-300 bg-paper px-3 py-2 text-xs text-ink placeholder:text-taupe-400 focus:border-rose-600 focus:outline-none"
          />
        </div>
      )}

      {/* Notas internas del administrador */}
      <div>
        <label htmlFor="internalNotes" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
          Notas internas de auditoría (Confidencial para administradores)
        </label>
        <textarea
          id="internalNotes"
          name="internalNotes"
          rows={3}
          defaultValue={defaultInternalNotes ?? ""}
          placeholder="Anotaciones sobre solvencia, verificación telefónica, referencias comerciales..."
          className="mt-1.5 block w-full border border-ink/20 bg-transparent px-3 py-2 text-xs text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Guardando resolución...
            </>
          ) : (
            "Ejecutar resolución"
          )}
        </button>
      </div>
    </form>
  );
}
