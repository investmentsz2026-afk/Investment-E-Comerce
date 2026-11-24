"use client";

import { useActionState, useState, useTransition } from "react";
import { updateProfileAction } from "@/server/actions/account";
import { resendVerificationEmailAction, type ActionResult } from "@/server/actions/auth";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCircleCheck,
  FaCircleExclamation,
  FaSpinner,
  FaPaperPlane,
} from "react-icons/fa6";

interface ProfileFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    emailVerifiedAt: Date | null;
    createdAt: Date;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [updateState, formAction, isUpdating] = useActionState<ActionResult, FormData>(
    updateProfileAction,
    { success: false },
  );

  const [resendPending, startResend] = useTransition();
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleResend = () => {
    startResend(async () => {
      const res = await resendVerificationEmailAction();
      setResendMessage(
        res.success
          ? (typeof res.data === "string" ? res.data : "Enlace de verificación enviado.")
          : (res.error ?? "No se pudo reenviar."),
      );
    });
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Estado de verificación del correo */}
      {!initialData.emailVerifiedAt ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 text-amber-950 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <FaEnvelope className="size-5 shrink-0 text-amber-600 mt-0.5" aria-hidden />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Verificación de correo pendiente
                </p>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  Confirma tu dirección para proteger tu cuenta y recibir avisos de tus pedidos.
                </p>
                {resendMessage && (
                  <p className="mt-2 rounded-lg border border-amber-300 bg-amber-100 p-2 text-xs font-medium text-amber-900">
                    {resendMessage}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendPending}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-400 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50 shadow-xs"
            >
              {resendPending ? (
                <>
                  <FaSpinner className="size-3.5 animate-spin" aria-hidden />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane className="size-3" aria-hidden />
                  <span>Reenviar enlace</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 shadow-xs">
          <FaCircleCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
          <span className="font-semibold">Dirección de correo electrónico confirmada y protegida</span>
        </div>
      )}

      {/* Formulario de actualización de datos */}
      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:space-y-6 sm:p-8"
      >
        <div className="border-b border-slate-100 pb-3 sm:pb-4">
          <h2 className="text-base font-black uppercase tracking-tight text-slate-900 sm:text-xl">
            Información Personal y Contacto
          </h2>
          <p className="mt-0.5 text-[0.7rem] text-slate-500 sm:mt-1 sm:text-xs">
            Actualiza tus nombres y celular para despachos a todo el Perú.
          </p>
        </div>

        {updateState.success && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 font-medium">
            <FaCircleCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
            <span>
              {typeof updateState.data === "string"
                ? updateState.data
                : "Tus datos han sido actualizados correctamente"}
            </span>
          </div>
        )}

        {updateState.error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 font-medium">
            <FaCircleExclamation className="size-4 shrink-0 text-[#EF233C] mt-0.5" aria-hidden />
            <span>{updateState.error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="pf-first-name"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              <FaUser className="size-3 text-[#0055FF]" aria-hidden />
              <span>Nombres</span>
            </label>
            <input
              id="pf-first-name"
              name="firstName"
              type="text"
              required
              defaultValue={initialData.firstName}
              disabled={isUpdating}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="pf-last-name"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              <FaUser className="size-3 text-[#0055FF]" aria-hidden />
              <span>Apellidos</span>
            </label>
            <input
              id="pf-last-name"
              name="lastName"
              type="text"
              required
              defaultValue={initialData.lastName}
              disabled={isUpdating}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="pf-email"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              <FaEnvelope className="size-3 text-[#0055FF]" aria-hidden />
              <span>Correo electrónico</span>
            </label>
            <input
              id="pf-email"
              type="email"
              disabled
              value={initialData.email}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 font-mono text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="mt-1 text-[0.68rem] text-slate-500">
              Para cambiar tu correo registrado, contáctanos por soporte oficial.
            </p>
          </div>

          <div>
            <label
              htmlFor="pf-phone"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              <FaPhone className="size-3 text-[#0055FF]" aria-hidden />
              <span>Teléfono móvil (Perú)</span>
            </label>
            <input
              id="pf-phone"
              name="phone"
              type="tel"
              defaultValue={initialData.phone ?? ""}
              placeholder="Ej: 926922583"
              disabled={isUpdating}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
            />
            <p className="mt-1 text-[0.68rem] text-slate-500">
              9 dígitos peruanos para notificaciones de seguimiento de paquetes.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isUpdating}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0055FF] hover:bg-blue-700 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isUpdating ? (
              <>
                <FaSpinner className="size-3.5 animate-spin" aria-hidden />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <span>Guardar Información</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
