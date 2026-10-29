"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminSetCustomerActiveStateAction } from "@/server/actions/admin-commerce";
import { reviewApplicationAction } from "@/server/actions/admin";
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Power,
  Building2,
} from "lucide-react";

interface AdminCustomerStatusControlsProps {
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  latestApplication?: {
    id: number;
    legalName: string;
    taxId: string;
    status: string;
  } | null;
}

export function AdminCustomerStatusControls({
  customer,
  latestApplication,
}: AdminCustomerStatusControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleToggleAccountActive = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await adminSetCustomerActiveStateAction({
        userId: customer.id,
        isActive: !customer.isActive,
        reason,
      });

      if (!res.success) {
        setFeedback({ type: "error", text: res.error ?? "No se pudo actualizar." });
        return;
      }

      setFeedback({
        type: "success",
        text: res.message ?? "Estado de cuenta actualizado.",
      });
      setReason("");
      router.refresh();
    });
  };

  const handleReviewCompany = (
    decision: "approved" | "rejected" | "suspended",
  ) => {
    if (!latestApplication) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await reviewApplicationAction({
        applicationId: latestApplication.id,
        newStatus: decision,
        internalNotes:
          reason.trim() ||
          `Revisión ejecutada desde ficha integral de cliente #${customer.id}`,
        rejectionReason:
          decision === "rejected" || decision === "suspended"
            ? reason.trim() ||
              "Actualización administrativa de permisos mayoristas."
            : undefined,
      });

      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "No se pudo actualizar la solicitud B2B.",
        });
        return;
      }

      setFeedback({
        type: "success",
        text: "Estado mayorista B2B actualizado correctamente.",
      });
      router.refresh();
    });
  };

  return (
    <div className="border border-ink/10 bg-paper p-5 space-y-4">
      <div className="border-b border-ink/10 pb-3">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-cochinilla">
          SEGURIDAD Y PERMISOS COMERCIALES
        </p>
        <h2 className="font-display text-lg text-ink">
          Control de Cuenta y Estado Mayorista B2B
        </h2>
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-start gap-2 border p-3 text-xs ${
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
          <span>{feedback.text}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="cust-reason"
          className="block font-mono text-[0.65rem] uppercase tracking-widest text-taupe-700"
        >
          Nota Interna / Motivo de Auditoría
        </label>
        <input
          id="cust-reason"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Opcional para activación, recomendado al suspender o rechazar..."
          className="mt-1 w-full border border-ink/20 bg-sand-50 px-3 py-2 text-xs text-ink"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {customer.role !== "admin" && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleToggleAccountActive}
            className={`inline-flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
              customer.isActive
                ? "border border-rose-600/40 bg-rose-500/10 text-rose-900 hover:bg-rose-500/20"
                : "bg-emerald-700 text-paper hover:bg-emerald-800"
            }`}
          >
            <Power className="size-3.5" aria-hidden />
            <span>
              {customer.isActive
                ? "Suspender Acceso de Cuenta"
                : "Reactivar Acceso de Cuenta"}
            </span>
          </button>
        )}

        {latestApplication && (
          <div className="flex flex-wrap items-center gap-2 border-l border-ink/15 pl-3">
            <span className="inline-flex items-center gap-1 font-mono text-[0.68rem] text-taupe-700">
              <Building2 className="size-3.5 text-cochinilla" aria-hidden />
              RUC {latestApplication.taxId}:
            </span>

            {latestApplication.status !== "approved" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleReviewCompany("approved")}
                className="bg-ink px-3 py-1.5 font-mono text-[0.68rem] font-bold uppercase text-paper hover:bg-cochinilla disabled:opacity-50"
              >
                Aprobar Mayorista B2B
              </button>
            )}

            {latestApplication.status === "approved" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleReviewCompany("suspended")}
                className="border border-amber-600/40 bg-amber-500/10 px-3 py-1.5 font-mono text-[0.68rem] font-bold uppercase text-amber-900 hover:bg-amber-500/20 disabled:opacity-50"
              >
                Suspender Beneficio B2B
              </button>
            )}

            {latestApplication.status !== "rejected" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleReviewCompany("rejected")}
                className="border border-rose-500/40 px-3 py-1.5 font-mono text-[0.68rem] uppercase text-rose-800 hover:bg-rose-500/10 disabled:opacity-50"
              >
                Rechazar Solicitud
              </button>
            )}
          </div>
        )}
      </div>

      {customer.role === "admin" && (
        <p className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] text-taupe-600">
          <ShieldAlert className="size-3.5 text-cochinilla" aria-hidden />
          <span>Cuenta con privilegios administrativos protegidos en el servidor.</span>
        </p>
      )}
    </div>
  );
}
