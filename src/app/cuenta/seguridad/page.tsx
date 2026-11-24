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
    <div className="space-y-4 text-slate-900 sm:space-y-6">
      <div>
        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 sm:text-2xl">
          Seguridad y Credenciales
        </h2>
        <p className="mt-0.5 text-[0.7rem] text-slate-500 sm:mt-1 sm:text-xs">
          Administra tu contraseña y la sesión activa en American Colt JEANS™.
        </p>
      </div>

      <ChangePasswordForm />

      {/* Información de la sesión activa */}
      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:space-y-5 sm:p-8">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#0055FF] sm:size-9">
            <FaShieldHalved className="size-3.5 sm:size-4" aria-hidden />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 sm:text-sm">
              Sesión Criptográfica Activa
            </h3>
            <p className="text-[0.66rem] text-slate-500 sm:text-[0.72rem]">
              Cookies cifradas <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.62rem] text-blue-700 sm:text-[0.68rem]">HttpOnly</code> y <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.62rem] text-blue-700 sm:text-[0.68rem]">SameSite=Lax</code>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-3 sm:grid-cols-3 sm:gap-4 sm:pt-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-wider text-slate-400 sm:gap-2 sm:text-[0.65rem]">
              <FaCalendarCheck className="size-2.5 text-[#0055FF] sm:size-3" />
              <span>Iniciada</span>
            </div>
            <p className="mt-1 font-mono text-xs font-bold text-slate-900 sm:text-sm">
              {new Date(session.createdAt).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-wider text-slate-400 sm:gap-2 sm:text-[0.65rem]">
              <FaClock className="size-2.5 text-emerald-600 sm:size-3" />
              <span>Actividad</span>
            </div>
            <p className="mt-1 font-mono text-xs font-bold text-slate-900 sm:text-sm">
              {new Date(session.lastActiveAt).toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:col-span-1 sm:p-4">
            <div className="flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-wider text-slate-400 sm:gap-2 sm:text-[0.65rem]">
              <FaFingerprint className="size-2.5 text-purple-600 sm:size-3" />
              <span>Cifrado</span>
            </div>
            <p className="mt-1 font-mono text-xs font-bold text-blue-700 sm:text-sm">
              scrypt + sal 32B
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
