import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Restablecer contraseña | INVESTMENTS",
  description: "Define tu nueva contraseña segura en INVESTMENTS.",
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
          <p className="text-sm text-taupe-600 leading-relaxed">
            El enlace de recuperación no contiene un token válido o está incompleto.
          </p>
          <Link
            href="/recuperar-contrasena"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-ink underline underline-offset-4 hover:text-cochinilla"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Solicitar un nuevo enlace
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
