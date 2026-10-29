"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type ActionResult } from "@/server/actions/auth";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function RequestResetForm() {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    requestPasswordResetAction,
    { success: false },
  );

  return (
    <div className="space-y-6">
      {state.success ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 border-l-2 border-emerald-600 bg-emerald-50/70 p-4 text-xs text-emerald-950">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-700 mt-0.5" aria-hidden />
            <div>
              <p className="font-medium text-emerald-900">Solicitud procesada</p>
              <p className="mt-1 leading-relaxed text-emerald-800">
                {typeof state.data === "string"
                  ? state.data
                  : "Si el correo está registrado en INVESTMENTS, te hemos enviado un enlace para restablecer tu contraseña."}
              </p>
            </div>
          </div>
          <p className="text-xs text-taupe-500 leading-relaxed">
            Revisa tu bandeja de entrada o la carpeta de correo no deseado. El enlace será válido durante 1 hora.
          </p>
          <div className="pt-2 text-center">
            <Link
              href="/iniciar-sesion"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-ink hover:text-cochinilla"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      ) : (
        <form action={formAction} className="space-y-6">
          {state.error && (
            <div className="flex items-start gap-2.5 border-l-2 border-cochinilla bg-cochinilla/5 p-4 text-xs text-cochinilla" role="alert">
              <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
              <span>{state.error}</span>
            </div>
          )}

          <p className="text-xs leading-relaxed text-taupe-600">
            Ingresa el correo electrónico asociado a tu cuenta y te enviaremos las instrucciones para restablecer tu contraseña.
          </p>

          <div>
            <label htmlFor="reset-email" className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink">
              Correo electrónico
            </label>
            <div className="mt-2">
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="ejemplo@correo.com"
                disabled={isPending}
                className="block w-full border border-ink/20 bg-transparent px-3.5 py-3 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group flex w-full items-center justify-center gap-2 bg-ink px-4 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Enviando enlace...
                </>
              ) : (
                <>
                  Enviar enlace de recuperación
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/iniciar-sesion"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-taupe-600 hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
