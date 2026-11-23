"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { adminSetCustomerActiveStateAction } from "@/server/actions/admin-commerce";
import { reviewApplicationAction } from "@/server/actions/admin";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Power,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  XCircle,
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

type PendingModalAction =
  | { kind: "account"; nextActive: boolean }
  | { kind: "b2b"; decision: "approved" | "rejected" | "suspended" };

export function AdminCustomerStatusControls({
  customer,
  latestApplication,
}: AdminCustomerStatusControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [modalAction, setModalAction] = useState<PendingModalAction | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const executeConfirmedAction = () => {
    if (!modalAction) return;
    setFeedback(null);

    if (modalAction.kind === "account") {
      const nextActive = modalAction.nextActive;
      startTransition(async () => {
        const res = await adminSetCustomerActiveStateAction({
          userId: customer.id,
          isActive: nextActive,
          reason,
        });

        setModalAction(null);

        if (!res.success) {
          setFeedback({
            type: "error",
            text: res.error ?? "No se pudo actualizar el estado de la cuenta.",
          });
          return;
        }

        setFeedback({
          type: "success",
          text:
            res.message ??
            (nextActive
              ? "Cuenta reactivada correctamente."
              : "Cuenta suspendida y sesiones cerradas."),
        });
        setReason("");
        router.refresh();
      });
      return;
    }

    if (!latestApplication) {
      setModalAction(null);
      return;
    }

    const decision = modalAction.decision;
    startTransition(async () => {
      const res = await reviewApplicationAction({
        applicationId: latestApplication.id,
        newStatus: decision,
        internalNotes:
          reason.trim() ||
          `Revisión ejecutada desde Ficha 360° de cliente #${customer.id}`,
        rejectionReason:
          decision === "rejected" || decision === "suspended"
            ? reason.trim() ||
              "Actualización administrativa de permisos mayoristas."
            : undefined,
      });

      setModalAction(null);

      if (!res.success) {
        setFeedback({
          type: "error",
          text: res.error ?? "No se pudo actualizar la solicitud B2B.",
        });
        return;
      }

      setFeedback({
        type: "success",
        text:
          decision === "approved"
            ? `Empresa RUC ${latestApplication.taxId} aprobada como Mayorista B2B.`
            : decision === "suspended"
              ? `Beneficio mayorista B2B suspendido para RUC ${latestApplication.taxId}.`
              : `Solicitud mayorista de RUC ${latestApplication.taxId} marcada como rechazada.`,
      });
      setReason("");
      router.refresh();
    });
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_16px_36px_-18px_rgba(15,23,42,0.16)] font-sans">
      <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-[#DC2626]">
            Seguridad y Permisos Comerciales
          </p>
          <h2 className="mt-0.5 text-lg font-black text-slate-900">
            Control de Cuenta y Estado Mayorista B2B
          </h2>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${
            customer.isActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              customer.isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"
            }`}
          />
          {customer.isActive ? "Acceso Activo" : "Acceso Suspendido"}
        </span>
      </div>

      <div className="p-6 space-y-4">
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              role="status"
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-bold ${
                feedback.type === "success"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                  : "border-red-300 bg-red-50 text-red-950"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-red-600" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="rounded-lg p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label
            htmlFor="cust-reason"
            className="block text-[0.7rem] font-extrabold uppercase tracking-wider text-slate-500"
          >
            Nota Interna / Motivo de Auditoría
          </label>
          <input
            id="cust-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Opcional al activar, recomendado al suspender o rechazar..."
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#DC2626] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {customer.role !== "admin" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                setModalAction({
                  kind: "account",
                  nextActive: !customer.isActive,
                })
              }
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-extrabold uppercase tracking-wider transition disabled:opacity-50 ${
                customer.isActive
                  ? "border border-red-200 bg-red-50 text-[#991B1B] hover:bg-red-100"
                  : "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-[0_5px_0_rgba(6,95,70,0.3)] hover:-translate-y-0.5"
              }`}
            >
              <Power className="size-4" />
              <span>
                {customer.isActive
                  ? "Suspender Acceso de Cuenta"
                  : "Reactivar Acceso de Cuenta"}
              </span>
            </button>
          )}

          {latestApplication && (
            <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                <Building2 className="size-4 text-blue-600" />
                RUC {latestApplication.taxId}:
              </span>

              {latestApplication.status !== "approved" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    setModalAction({ kind: "b2b", decision: "approved" })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
                >
                  <ShieldCheck className="size-3.5" />
                  <span>Aprobar Mayorista B2B</span>
                </button>
              )}

              {latestApplication.status === "approved" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    setModalAction({ kind: "b2b", decision: "suspended" })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-extrabold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  <ShieldAlert className="size-3.5" />
                  <span>Suspender Beneficio B2B</span>
                </button>
              )}

              {latestApplication.status !== "rejected" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    setModalAction({ kind: "b2b", decision: "rejected" })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-extrabold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="size-3.5" />
                  <span>Rechazar Solicitud</span>
                </button>
              )}
            </div>
          )}
        </div>

        {customer.role === "admin" && (
          <p className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600">
            <ShieldAlert className="size-4 text-[#DC2626]" />
            <span>
              Cuenta con privilegios administrativos protegidos en el servidor.
            </span>
          </p>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN 3D */}
      <AnimatePresence>
        {modalAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
            onClick={() => !isPending && setModalAction(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 18 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_32px_70px_-16px_rgba(15,23,42,0.5)]"
            >
              <div
                className={`p-6 text-white ${
                  modalAction.kind === "account"
                    ? modalAction.nextActive
                      ? "bg-gradient-to-r from-emerald-600 to-teal-700"
                      : "bg-gradient-to-r from-[#991B1B] to-[#DC2626]"
                    : modalAction.decision === "approved"
                      ? "bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]"
                      : modalAction.decision === "suspended"
                        ? "bg-gradient-to-r from-amber-600 to-orange-700"
                        : "bg-gradient-to-r from-[#991B1B] to-[#DC2626]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                    {modalAction.kind === "account" ? (
                      modalAction.nextActive ? (
                        <UserCheck className="size-5" />
                      ) : (
                        <UserX className="size-5" />
                      )
                    ) : modalAction.decision === "approved" ? (
                      <ShieldCheck className="size-5" />
                    ) : (
                      <ShieldAlert className="size-5" />
                    )}
                  </span>
                  <div>
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-white/85">
                      Confirmar Operación
                    </p>
                    <h3 className="text-lg font-black">
                      {modalAction.kind === "account"
                        ? modalAction.nextActive
                          ? "¿Reactivar cuenta del cliente?"
                          : "¿Suspender acceso de la cuenta?"
                        : modalAction.decision === "approved"
                          ? "¿Aprobar Mayorista B2B?"
                          : modalAction.decision === "suspended"
                            ? "¿Suspender Beneficio B2B?"
                            : "¿Rechazar Solicitud B2B?"}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm font-medium leading-relaxed text-slate-700">
                  {modalAction.kind === "account" ? (
                    modalAction.nextActive ? (
                      <>
                        Se restaurará el acceso de{" "}
                        <strong className="font-black text-slate-900">
                          {customer.firstName} {customer.lastName}
                        </strong>{" "}
                        a la tienda y su historial de compras.
                      </>
                    ) : (
                      <>
                        Se suspenderá la cuenta de{" "}
                        <strong className="font-black text-slate-900">
                          {customer.firstName} {customer.lastName}
                        </strong>{" "}
                        y se cerrarán todas sus sesiones activas en el servidor.
                      </>
                    )
                  ) : (
                    <>
                      Se actualizará la empresa{" "}
                      <strong className="font-black text-slate-900">
                        {latestApplication?.legalName}
                      </strong>{" "}
                      (RUC {latestApplication?.taxId}) al estado{" "}
                      <strong className="uppercase">{modalAction.decision}</strong>{" "}
                      y se notificará automáticamente por correo.
                    </>
                  )}
                </p>

                <div>
                  <label
                    htmlFor="confirm-modal-reason"
                    className="block text-[0.7rem] font-extrabold uppercase tracking-wider text-slate-500"
                  >
                    Motivo / Nota de auditoría
                  </label>
                  <input
                    id="confirm-modal-reason"
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Puedes escribir o ajustar la nota interna aquí..."
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#DC2626] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setModalAction(null)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={executeConfirmedAction}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:brightness-110 disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="size-3.5 animate-spin" />}
                    <span>Confirmar Cambio</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
