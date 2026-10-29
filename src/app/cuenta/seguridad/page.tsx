import { requireAuth } from "@/server/auth/session";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Shield } from "lucide-react";

export const instant = false;

export default async function SecurityPage() {
  const { session } = await requireAuth("/cuenta/seguridad");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl text-ink">Seguridad y credenciales</h2>
        <p className="mt-1 text-xs text-taupe-500">
          Administra la seguridad de tu cuenta y la sesión activa en este dispositivo.
        </p>
      </div>

      <ChangePasswordForm />

      {/* Información de la sesión activa */}
      <div className="border border-ink/10 bg-paper p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="size-5 text-taupe-500" aria-hidden />
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
            Sesión actual protegida
          </h3>
        </div>
        <p className="text-xs text-taupe-600 leading-relaxed">
          Tu sesión está autenticada en el servidor mediante cookies cifradas con atributos <code className="bg-ink/5 px-1.5 py-0.5 text-[0.68rem] text-ink">HttpOnly</code> y <code className="bg-ink/5 px-1.5 py-0.5 text-[0.68rem] text-ink">SameSite=Lax</code>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-ink/10 text-xs">
          <div>
            <p className="text-taupe-400 text-[0.65rem] uppercase tracking-wider">Iniciada el</p>
            <p className="font-mono text-ink mt-0.5">
              {new Date(session.createdAt).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-taupe-400 text-[0.65rem] uppercase tracking-wider">Última actividad</p>
            <p className="font-mono text-ink mt-0.5">
              {new Date(session.lastActiveAt).toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <p className="text-taupe-400 text-[0.65rem] uppercase tracking-wider">Algoritmo de credenciales</p>
            <p className="font-mono text-ink mt-0.5">scrypt + sal 32B</p>
          </div>
        </div>
      </div>
    </div>
  );
}
