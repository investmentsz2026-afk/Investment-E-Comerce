"use client";

import { useActionState, useState, useTransition } from "react";
import { updateProfileAction } from "@/server/actions/account";
import { resendVerificationEmailAction, type ActionResult } from "@/server/actions/auth";
import { Loader2, CheckCircle2, AlertCircle, Mail, Send } from "lucide-react";

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
    <div className="space-y-8">
      {/* Estado de verificación del correo */}
      {!initialData.emailVerifiedAt ? (
        <div className="border border-amber-300 bg-amber-50/70 p-5 text-amber-950">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <Mail className="size-5 shrink-0 text-amber-700 mt-0.5" aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-900">
                  Verificación de correo pendiente
                </p>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  Confirma tu dirección para proteger tu cuenta y recibir avisos de tus pedidos.
                </p>
                {resendMessage && (
                  <p className="mt-2 text-xs font-medium text-amber-900 bg-amber-100/80 p-2 border border-amber-200">
                    {resendMessage}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendPending}
              className="inline-flex shrink-0 items-center justify-center gap-2 border border-amber-900/30 bg-amber-100 px-4 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-amber-950 transition-colors hover:bg-amber-200 disabled:opacity-50"
            >
              {resendPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="size-3" aria-hidden />
                  Reenviar enlace
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50/70 border border-emerald-200 p-3">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-700" aria-hidden />
          <span>Dirección de correo electrónico verificada</span>
        </div>
      )}

      {/* Formulario de actualización de datos */}
      <form action={formAction} className="border border-ink/10 bg-paper p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-display text-xl text-ink">Información personal</h2>
          <p className="mt-1 text-xs text-taupe-500">
            Actualiza tu nombre y teléfono de contacto para tus futuras compras y entregas.
          </p>
        </div>

        {updateState.success && (
          <div className="flex items-center gap-2 border-l-2 border-emerald-600 bg-emerald-50/60 p-3.5 text-xs text-emerald-900">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-700" aria-hidden />
            <span>{typeof updateState.data === "string" ? updateState.data : "Datos actualizados correctamente"}</span>
          </div>
        )}

        {updateState.error && (
          <div className="flex items-start gap-2 border-l-2 border-cochinilla bg-cochinilla/5 p-3.5 text-xs text-cochinilla">
            <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
            <span>{updateState.error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-first-name" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Nombres
            </label>
            <input
              id="pf-first-name"
              name="firstName"
              type="text"
              required
              defaultValue={initialData.firstName}
              disabled={isUpdating}
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="pf-last-name" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Apellidos
            </label>
            <input
              id="pf-last-name"
              name="lastName"
              type="text"
              required
              defaultValue={initialData.lastName}
              disabled={isUpdating}
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-email" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Correo electrónico
            </label>
            <input
              id="pf-email"
              type="email"
              disabled
              value={initialData.email}
              className="mt-2 block w-full border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-taupe-700 cursor-not-allowed"
            />
            <p className="mt-1 text-[0.65rem] text-taupe-400">
              El correo no se puede modificar directamente por seguridad.
            </p>
          </div>

          <div>
            <label htmlFor="pf-phone" className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink">
              Teléfono de contacto
            </label>
            <input
              id="pf-phone"
              name="phone"
              type="tel"
              placeholder="987 654 321"
              defaultValue={initialData.phone ?? ""}
              disabled={isUpdating}
              className="mt-2 block w-full border border-ink/20 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-taupe-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla disabled:opacity-60"
          >
            {isUpdating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Guardando cambios...
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
