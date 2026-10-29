"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, type ActionResult } from "@/server/actions/auth";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? "";
  const verifiedParam = searchParams.get("verificado");
  const resetParam = searchParams.get("restablecida");

  const [state, formAction, isPending] = useActionState<ActionResult<{ role: string; redirect: string }>, FormData>(
    loginAction,
    { success: false },
  );

  useEffect(() => {
    if (state.success && state.data?.redirect) {
      router.push(state.data.redirect);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="next" value={nextParam} />

      {verifiedParam && (
        <div className="border-l-2 border-emerald-600 bg-emerald-50/60 p-4 text-xs text-emerald-900" role="status">
          Tu correo electrónico ha sido verificado exitosamente. Ya puedes iniciar sesión.
        </div>
      )}

      {resetParam && (
        <div className="border-l-2 border-emerald-600 bg-emerald-50/60 p-4 text-xs text-emerald-900" role="status">
          Tu contraseña ha sido restablecida. Ingresa con tu nueva clave.
        </div>
      )}

      {state.error && (
        <div className="flex items-start gap-2.5 border-l-2 border-cochinilla bg-cochinilla/5 p-4 text-xs text-cochinilla" role="alert">
          <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label htmlFor="login-email" className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink">
          Correo electrónico
        </label>
        <div className="mt-2">
          <input
            id="login-email"
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
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink">
            Contraseña
          </label>
          <Link
            href="/recuperar-contrasena"
            className="text-[0.72rem] text-taupe-600 underline-offset-4 hover:underline hover:text-ink"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="mt-2">
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
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
              Iniciando sesión...
            </>
          ) : (
            <>
              Ingresar a mi cuenta
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
