"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerCustomerAction, type ActionResult } from "@/server/actions/auth";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionResult<{ userId: number }>, FormData>(
    registerCustomerAction,
    { success: false },
  );

  useEffect(() => {
    if (state.success) {
      router.push("/cuenta?registro=exitoso");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="flex items-start gap-2.5 border-l-2 border-cochinilla bg-cochinilla/5 p-4 text-xs text-cochinilla" role="alert">
          <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-first-name" className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink">
            Nombres
          </label>
          <div className="mt-2">
            <input
              id="reg-first-name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              placeholder="María"
              disabled={isPending}
              className="block w-full border border-ink/20 bg-transparent px-3.5 py-3 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-last-name" className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink">
            Apellidos
          </label>
          <div className="mt-2">
            <input
              id="reg-last-name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              placeholder="García"
              disabled={isPending}
              className="block w-full border border-ink/20 bg-transparent px-3.5 py-3 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink">
          Correo electrónico
        </label>
        <div className="mt-2">
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="maria.garcia@correo.com"
            disabled={isPending}
            className="block w-full border border-ink/20 bg-transparent px-3.5 py-3 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink">
          Contraseña
        </label>
        <div className="mt-2">
          <input
            id="reg-password"
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
        <label htmlFor="reg-confirm-password" className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink">
          Confirmar contraseña
        </label>
        <div className="mt-2">
          <input
            id="reg-confirm-password"
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

      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="termsAccepted"
            required
            disabled={isPending}
            className="mt-1 size-4 rounded-none border-ink/30 text-ink focus:ring-ink"
          />
          <span className="text-xs leading-relaxed text-taupe-600">
            Acepto los{" "}
            <span className="text-ink underline underline-offset-4">Términos y Condiciones</span> y la{" "}
            <span className="text-ink underline underline-offset-4">Política de Privacidad</span> de INVESTMENTS, conforme a la Ley de Protección de Datos Personales del Perú.
          </span>
        </label>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="group flex w-full items-center justify-center gap-2 bg-ink px-4 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Creando cuenta...
            </>
          ) : (
            <>
              Crear mi cuenta
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
