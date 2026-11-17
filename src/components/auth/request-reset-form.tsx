"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type ActionResult } from "@/server/actions/auth";
import {
  FaArrowLeft,
  FaArrowRight,
  FaSpinner,
  FaCircleExclamation,
  FaCircleCheck,
  FaEnvelope,
} from "react-icons/fa6";

export function RequestResetForm() {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    requestPasswordResetAction,
    { success: false },
  );

  return (
    <div className="space-y-5 text-white">
      {state.success ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-4 text-xs text-emerald-200">
            <FaCircleCheck className="size-4 shrink-0 text-emerald-400 mt-0.5" aria-hidden />
            <div>
              <p className="font-bold text-white">Solicitud procesada con éxito</p>
              <p className="mt-1 leading-relaxed text-emerald-200">
                {typeof state.data === "string"
                  ? state.data
                  : "Si el correo está registrado en American Colt JEANS™, te hemos enviado un enlace para restablecer tu contraseña."}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed text-center">
            Revisa tu bandeja de entrada o la carpeta de spam. El enlace de seguridad tiene una vigencia de 1 hora.
          </p>
          <div className="pt-2 text-center">
            <Link
              href="/iniciar-sesion"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0055FF] hover:underline"
            >
              <FaArrowLeft className="size-3" aria-hidden />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      ) : (
        <form action={formAction} className="space-y-5">
          {state.error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/50 bg-red-950/70 p-3.5 text-xs text-red-200" role="alert">
              <FaCircleExclamation className="size-4 shrink-0 text-red-400 mt-0.5" aria-hidden />
              <span>{state.error}</span>
            </div>
          )}

          <p className="text-xs leading-relaxed text-slate-300">
            Ingresa tu correo registrado y te despacharemos un enlace protegido para redefinir tu contraseña de acceso.
          </p>

          <div>
            <label htmlFor="reset-email" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <FaEnvelope className="size-3 text-[#0055FF]" aria-hidden />
              <span>Correo electrónico</span>
            </label>
            <div className="mt-2">
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu-correo@ejemplo.com"
                disabled={isPending}
                className="block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#EF233C] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/30 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <FaSpinner className="size-4 animate-spin" aria-hidden />
                  <span>Enviando enlace seguro...</span>
                </>
              ) : (
                <>
                  <span>Enviar enlace de recuperación</span>
                  <FaArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-1">
            <Link
              href="/iniciar-sesion"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
            >
              <FaArrowLeft className="size-3" aria-hidden />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
