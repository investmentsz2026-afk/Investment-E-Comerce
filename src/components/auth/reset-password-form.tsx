"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction, type ActionResult } from "@/server/actions/auth";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    resetPasswordAction,
    { success: false },
  );

  useEffect(() => {
    if (state.success) {
      router.push("/iniciar-sesion?restablecida=1");
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <div className="flex items-start gap-2.5 border-l-2 border-cochinilla bg-cochinilla/5 p-4 text-xs text-cochinilla" role="alert">
          <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label htmlFor="new-password" className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink">
          Nueva contraseña
        </label>
        <div className="mt-2">
          <input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            disabled={isPending}
            className="block w-full border border-ink/20 bg-transparent px-3.5 py-3 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
          />
        </div>
        <p className="mt-1.5 text-[0.68rem] text-taupe-500">
          Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.
        </p>
      </div>

      <div>
        <label htmlFor="confirm-new-password" className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink">
          Confirmar nueva contraseña
        </label>
        <div className="mt-2">
          <input
            id="confirm-new-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
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
              Guardando contraseña...
            </>
          ) : (
            <>
              Guardar nueva contraseña
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
