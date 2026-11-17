import { requireAuth } from "@/server/auth/session";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import {
  FaShieldHalved,
  FaClock,
  FaCalendarCheck,
  FaFingerprint,
} from "react-icons/fa6";

export const instant = false;

export default async function SecurityPage() {
  const { session } = await requireAuth("/cuenta/seguridad");

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
          Seguridad y Credenciales
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Administra la seguridad de tu contraseña y la sesión activa en American Colt JEANS™.
        </p>
      </div>

      <ChangePasswordForm />

      {/* Información de la sesión activa */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#0055FF] border border-blue-100">
            <FaShieldHalved className="size-4" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Sesión Criptográfica Activa
            </h3>
            <p className="text-[0.72rem] text-slate-500">
              Autenticación segura mediante cookies cifradas <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.68rem] text-blue-700">HttpOnly</code> y <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.68rem] text-blue-700">SameSite=Lax</code>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-400 text-[0.65rem] uppercase font-bold tracking-wider">
              <FaCalendarCheck className="size-3 text-[#0055FF]" />
              <span>Iniciada el</span>
            </div>
            <p className="font-mono text-sm font-bold text-slate-900 mt-1">
              {new Date(session.createdAt).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-400 text-[0.65rem] uppercase font-bold tracking-wider">
              <FaClock className="size-3 text-emerald-600" />
              <span>Última actividad</span>
            </div>
            <p className="font-mono text-sm font-bold text-slate-900 mt-1">
              {new Date(session.lastActiveAt).toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-400 text-[0.65rem] uppercase font-bold tracking-wider">
              <FaFingerprint className="size-3 text-purple-600" />
              <span>Cifrado de Credenciales</span>
            </div>
            <p className="font-mono text-sm font-bold text-blue-700 mt-1">
              scrypt + sal 32B
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
