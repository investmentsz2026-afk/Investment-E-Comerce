import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FaArrowLeft } from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Restablecer contraseña | American Colt JEANS™",
  description: "Define tu nueva contraseña segura en American Colt JEANS™.",
  robots: { index: false, follow: false },
};

export const instant = false;

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <AuthCard
      eyebrow="Nueva credencial"
      title="Restablecer contraseña"
      subtitle="Ingresa una nueva contraseña segura para tu cuenta"
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-300 leading-relaxed">
            El enlace de recuperación no contiene un token válido o está incompleto.
          </p>
          <Link
            href="/recuperar-contrasena"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0055FF] hover:underline"
          >
            <FaArrowLeft className="size-3" aria-hidden />
            Solicitar un nuevo enlace
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
