import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { verifyEmailAction } from "@/server/actions/auth";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Verificar correo electrónico | INVESTMENTS",
  description: "Confirmación de dirección de correo electrónico en INVESTMENTS.",
  robots: { index: false, follow: false },
};

export const instant = false;

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;

  const result = token ? await verifyEmailAction(token) : { success: false, error: "No se proporcionó ningún token de confirmación" };

  return (
    <AuthCard
      eyebrow="Confirmación de cuenta"
      title={result.success ? "¡Correo verificado!" : "No pudimos confirmar tu correo"}
    >
      {result.success ? (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-6" aria-hidden />
          </div>
          <p className="text-sm leading-relaxed text-taupe-600">
            Tu dirección de correo electrónico ha sido confirmada exitosamente. Tu cuenta de INVESTMENTS se encuentra plenamente activa y protegida.
          </p>
          <Link
            href="/cuenta"
            className="group inline-flex w-full items-center justify-center gap-2 bg-ink px-4 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
          >
            Ir a mi cuenta
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-cochinilla/10 text-cochinilla">
            <AlertCircle className="size-6" aria-hidden />
          </div>
          <p className="text-sm leading-relaxed text-taupe-600">
            {result.error ?? "El enlace de confirmación es inválido o ha expirado."}
          </p>
          <p className="text-xs text-taupe-500">
            Si ya tienes una cuenta, puedes solicitar un nuevo enlace desde tu perfil de usuario.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/iniciar-sesion"
              className="inline-flex w-full items-center justify-center gap-2 bg-ink px-4 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-cochinilla"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center border border-ink/20 px-4 py-3 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-ink hover:border-ink"
            >
              Volver a la portada
            </Link>
          </div>
        </div>
      )}
    </AuthCard>
  );
}
