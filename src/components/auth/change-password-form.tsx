"use client";

import { useActionState, useRef, useState } from "react";
import { changePasswordAction } from "@/server/actions/account";
import type { ActionResult } from "@/server/actions/auth";
import { PasswordRequirementsGuide } from "@/components/auth/password-requirements-guide";
import {
  FaLock,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaShieldHalved,
  FaCircleCheck,
  FaCircleExclamation,
  FaSpinner,
} from "react-icons/fa6";

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (prev, formData) => {
      const res = await changePasswordAction(prev, formData);
      if (res.success) {
        formRef.current?.reset();
        setNewPassword("");
        setConfirmPassword("");
      }
      return res;
    },
    { success: false },
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6 text-slate-900"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-[#0055FF] border border-blue-100">
          <FaKey className="size-4" aria-hidden />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
            Actualizar Contraseña de Acceso
          </h3>
          <p className="text-xs text-slate-500">
            Protege tu cuenta con una credencial de alta seguridad criptográfica (scrypt 32B).
          </p>
        </div>
      </div>

      {state.success && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 font-medium">
          <FaCircleCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
          <span>
            {typeof state.data === "string" ? state.data : "Contraseña actualizada exitosamente en todos tus dispositivos."}
          </span>
        </div>
      )}

      {state.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 font-medium">
          <FaCircleExclamation className="size-4 shrink-0 mt-0.5 text-[#EF233C]" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      {/* Contraseña Actual */}
      <div>
        <label
          htmlFor="cp-current"
          className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Contraseña Actual
        </label>
        <div className="relative">
          <FaLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            id="cp-current"
            name="currentPassword"
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Introduce tu contraseña vigente"
            disabled={isPending}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-12 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            tabIndex={-1}
            aria-label={showCurrent ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
          >
            {showCurrent ? <FaEyeSlash className="size-4" /> : <FaEye className="size-4" />}
          </button>
        </div>
      </div>

      {/* Grid: Nueva Contraseña y Confirmar */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="cp-new"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Nueva Contraseña
          </label>
          <div className="relative">
            <FaKey className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              id="cp-new"
              name="newPassword"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Crea una contraseña segura"
              disabled={isPending}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-12 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              tabIndex={-1}
              aria-label={showNew ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
            >
              {showNew ? <FaEyeSlash className="size-4" /> : <FaEye className="size-4" />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="cp-confirm"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Confirmar Nueva Contraseña
          </label>
          <div className="relative">
            <FaShieldHalved className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              id="cp-confirm"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu nueva contraseña"
              disabled={isPending}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-12 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0055FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0055FF] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              tabIndex={-1}
              aria-label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
            >
              {showConfirm ? <FaEyeSlash className="size-4" /> : <FaEye className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Guía interactiva de validación en tiempo real con checkmarks claros */}
      <PasswordRequirementsGuide
        password={newPassword}
        confirmPassword={confirmPassword}
        showMatchStatus={true}
        variant="light"
      />

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0055FF] hover:bg-blue-700 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {isPending ? (
            <>
              <FaSpinner className="size-3.5 animate-spin" aria-hidden />
              <span>Actualizando credenciales...</span>
            </>
          ) : (
            <>
              <FaKey className="size-3.5" aria-hidden />
              <span>Guardar Nueva Contraseña</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
