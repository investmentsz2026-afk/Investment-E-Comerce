"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction, type ActionResult } from "@/server/actions/auth";
import { PasswordRequirementsGuide } from "@/components/auth/password-requirements-guide";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaSpinner,
  FaCircleExclamation,
} from "react-icons/fa6";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    <form action={formAction} className="space-y-4 text-white">
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/50 bg-red-950/70 p-3.5 text-xs text-red-200" role="alert">
          <FaCircleExclamation className="size-4 shrink-0 text-red-400 mt-0.5" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label htmlFor="new-password" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
          <FaLock className="size-3 text-[#0055FF]" aria-hidden />
          <span>Nueva contraseña</span>
        </label>
        <div className="relative mt-2">
          <input
            id="new-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            disabled={isPending}
            className="block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 pl-4 pr-11 py-3.5 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            {showPassword ? <FaEyeSlash className="size-4" /> : <FaEye className="size-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirm-new-password" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
          <FaLock className="size-3 text-[#0055FF]" aria-hidden />
          <span>Confirmar nueva contraseña</span>
        </label>
        <div className="relative mt-2">
          <input
            id="confirm-new-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            disabled={isPending}
            className="block w-full rounded-xl border border-slate-700 bg-[#0F172A]/90 pl-4 pr-11 py-3.5 text-sm text-white placeholder-slate-500 focus:border-[#0055FF] focus:bg-[#0B1325] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/40 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex={-1}
            aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            {showConfirmPassword ? <FaEyeSlash className="size-4" /> : <FaEye className="size-4" />}
          </button>
        </div>
      </div>

      {/* Guía en vivo e interactiva con checks dinámicos de contraseña */}
      <PasswordRequirementsGuide
        password={password}
        confirmPassword={confirmPassword}
      />

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#EF233C] px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/30 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        >
          {isPending ? (
            <>
              <FaSpinner className="size-4 animate-spin" aria-hidden />
              <span>Guardando nueva clave...</span>
            </>
          ) : (
            <>
              <span>Actualizar contraseña y entrar</span>
              <FaArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
