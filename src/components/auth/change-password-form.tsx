"use client";

import { useActionState, useRef } from "react";
import { changePasswordAction } from "@/server/actions/account";
import type { ActionResult } from "@/server/actions/auth";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (prev, formData) => {
      const res = await changePasswordAction(prev, formData);
      if (res.success) formRef.current?.reset();
      return res;
    },
    { success: false },
  );

  return (
    <form ref={formRef} action={formAction} className="border border-ink/10 bg-paper p-6 sm:p-8 space-y-6">
      <div>
        <h3 className="font-display text-xl text-ink">Cambiar contraseña</h3>
        <p className="mt-1 text-xs text-taupe-500">
          Para proteger tu cuenta, te recomendamos no reutilizar contraseñas de otros sitios.
        </p>
      </div>

      {state.success && (
        <div className="flex items-center gap-2 border-l-2 border-emerald-600 bg-emerald-50/60 p-3.5 text-xs text-emerald-900">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-700" aria-hidden />
          <span>{typeof state.data === "string" ? state.data : "Contraseña actualizada exitosamente."}</span>
        </div>
      )}

      {state.error && (
        <div className="flex items-start gap-2 border-l-2 border-cochinilla bg-cochinilla/5 p-3.5 text-xs text-cochinilla">
          <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label htmlFor="cp-current" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
          Contraseña actual
        </label>
        <input
          id="cp-current"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          disabled={isPending}
          className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cp-new" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
            Nueva contraseña
          </label>
          <input
            id="cp-new"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            disabled={isPending}
            className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
          />
          <p className="mt-1 text-[0.65rem] text-taupe-500">
            Mínimo 8 caracteres, mayúscula, minúscula y número.
          </p>
        </div>

        <div>
          <label htmlFor="cp-confirm" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
            Confirmar nueva contraseña
          </label>
          <input
            id="cp-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            disabled={isPending}
            className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Actualizando...
            </>
          ) : (
            "Actualizar contraseña"
          )}
        </button>
      </div>
    </form>
  );
}
