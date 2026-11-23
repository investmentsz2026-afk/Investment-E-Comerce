"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  reviewApplicationAction,
  type AllowedReviewStatus,
} from "@/server/actions/admin";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  MessageSquareText,
} from "lucide-react";

interface ReviewActionFormProps {
  applicationId: number;
  currentStatus: string;
  defaultInternalNotes?: string | null;
}

const OPTIONS: {
  value: AllowedReviewStatus;
  label: string;
  desc: string;
  confirmLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}[] = [
  {
    value: "approved",
    label: "Aprobar",
    desc: "Otorga rol mayorista B2B y tarifas escalonadas.",
    confirmLabel: "APROBAR acceso mayorista B2B",
    icon: CheckCircle2,
    activeClass: "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20",
  },
  {
    value: "under_review",
    label: "En Evaluación",
    desc: "Marca el expediente en verificación comercial.",
    confirmLabel: "marcar EN EVALUACIÓN",
    icon: Clock,
    activeClass: "border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20",
  },
  {
    value: "rejected",
    label: "Rechazar",
    desc: "Deniega la postulación (exige motivo claro).",
    confirmLabel: "RECHAZAR esta solicitud",
    icon: XCircle,
    activeClass: "border-[#DC2626] bg-red-50 text-red-950 ring-2 ring-[#DC2626]/20",
  },
  {
    value: "suspended",
    label: "Suspender",
    desc: "Revoca privilegios mayoristas a cuenta minorista.",
    confirmLabel: "SUSPENDER acceso mayorista B2B",
    icon: Ban,
    activeClass: "border-rose-600 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20",
  },
];

export function ReviewActionForm({
  applicationId,
  currentStatus,
  defaultInternalNotes = "",
}: ReviewActionFormProps) {
  const router = useRouter();
  const initialStatus: AllowedReviewStatus =
    currentStatus === "rejected" ||
    currentStatus === "suspended" ||
    currentStatus === "under_review"
      ? (currentStatus as AllowedReviewStatus)
      : "approved";

  const [selectedStatus, setSelectedStatus] =
    useState<AllowedReviewStatus>(initialStatus);
  const [internalNotes, setInternalNotes] = useState(
    defaultInternalNotes ?? "",
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (selectedStatus === "rejected" && rejectionReason.trim().length < 5) {
      setErrorMsg(
        "Debes indicar un motivo de rechazo claro (mínimo 5 caracteres).",
      );
      return;
    }

    setConfirmOpen(true);
  };

  const executeConfirm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await reviewApplicationAction({
        applicationId,
        newStatus: selectedStatus,
        internalNotes,
        rejectionReason,
      });

      setConfirmOpen(false);

      if (!res.success) {
        setErrorMsg(res.error ?? "No se pudo actualizar la solicitud.");
        return;
      }

      setSuccessMsg(
        typeof res.data === "string"
          ? res.data
          : "Resolución guardada exitosamente.",
      );
      router.refresh();
    });
  };

  const activeOpt = OPTIONS.find((o) => o.value === selectedStatus);

  return (
    <>
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleOpenConfirm}
        className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 font-sans shadow-[0_16px_38px_-16px_rgba(15,23,42,0.16)] sm:p-8"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-[#DC2626]">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h3 className="font-sans text-2xl font-black tracking-tight text-slate-900">
              Dictamen Administrativo B2B
            </h3>
            <p className="text-xs font-medium text-slate-500">
              Selecciona la resolución comercial para esta empresa. Se aplicará
              de forma atómica en PostgreSQL con notificación y registro de
              auditoría.
            </p>
          </div>
        </div>

        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-950"
            >
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 p-4 text-xs font-bold text-red-900"
            >
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#DC2626]" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selector de resolución 3D */}
        <div>
          <label className="mb-2.5 block text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Acción a Tomar *
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = selectedStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    selected
                      ? opt.activeClass
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      {opt.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.68rem] font-medium leading-snug text-slate-600">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Motivo rechazo / suspensión */}
        {(selectedStatus === "rejected" || selectedStatus === "suspended") && (
          <div className="space-y-2 rounded-2xl border border-red-300 bg-red-50/60 p-4">
            <label
              htmlFor="rejectionReason"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#991B1B]"
            >
              {selectedStatus === "rejected"
                ? "Motivo de Rechazo (Se notificará al solicitante) *"
                : "Motivo de Suspensión Comercial (Opcional)"}
            </label>
            <textarea
              id="rejectionReason"
              name="rejectionReason"
              required={selectedStatus === "rejected"}
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Indica la razón comercial (ej: RUC inactivo ante SUNAT, volumen insuficiente)..."
              className="block w-full rounded-2xl border border-red-200 bg-white p-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#DC2626]"
            />
          </div>
        )}

        {/* Notas internas */}
        <div>
          <label
            htmlFor="internalNotes"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700"
          >
            <MessageSquareText className="size-3.5 text-blue-700" />
            <span>Notas Internas de Auditoría (Confidencial)</span>
          </label>
          <textarea
            id="internalNotes"
            name="internalNotes"
            rows={3}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Anotaciones sobre solvencia, verificación telefónica, referencias comerciales..."
            className="block w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
          />
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-7 py-3.5 text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_5px_0_#7F1D1D,0_12px_24px_rgba(220,38,38,0.28)] transition hover:brightness-110 disabled:opacity-50"
          >
            <ShieldCheck className="size-4" />
            <span>Confirmar y Guardar Dictamen</span>
          </motion.button>
        </div>
      </motion.form>

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
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
                    selectedStatus === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : selectedStatus === "under_review"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-[#DC2626]"
                  }`}
                >
                  {selectedStatus === "rejected" ||
                  selectedStatus === "suspended" ? (
                    <ShieldAlert className="size-6" />
                  ) : (
                    <ShieldCheck className="size-6" />
                  )}
                </span>
                <div>
                  <h4 className="font-sans text-lg font-black text-slate-900">
                    ¿Confirmar Resolución?
                  </h4>
                  <p className="text-xs font-bold text-slate-500">
                    Expediente B2B #{applicationId}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                ¿Estás seguro de{" "}
                <strong className="font-black text-[#DC2626]">
                  {activeOpt?.confirmLabel ?? selectedStatus}
                </strong>{" "}
                para esta empresa?
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
                  onClick={executeConfirm}
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
