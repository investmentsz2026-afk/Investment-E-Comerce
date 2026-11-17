import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { verifyEmailAction } from "@/server/actions/auth";
import { FaCircleCheck, FaCircleExclamation, FaArrowRight } from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Verificar correo electrónico | American Colt JEANS™",
  description: "Confirmación de dirección de correo electrónico en American Colt JEANS™.",
  robots: { index: false, follow: false },
};

export const instant = false;

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;

  const result = token
    ? await verifyEmailAction(token)
    : { success: false, error: "No se proporcionó ningún token de confirmación" };

  return (
    <AuthCard
      eyebrow="Confirmación de cuenta"
      title={result.success ? "¡Correo verificado!" : "No pudimos confirmar tu correo"}
    >
      {result.success ? (
        <div className="space-y-6 text-center text-white">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <FaCircleCheck className="size-7" aria-hidden />
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            Tu dirección de correo electrónico ha sido confirmada exitosamente. Tu cuenta en American Colt JEANS™ se encuentra plenamente activa y protegida.
          </p>
          <Link
            href="/cuenta"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#EF233C] px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/30 transition-all hover:brightness-110 active:scale-[0.99]"
          >
            <span>Ir a mi cuenta</span>
            <FaArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="space-y-5 text-center text-white">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-500/20 text-[#EF233C] border border-red-500/30">
            <FaCircleExclamation className="size-7" aria-hidden />
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            {result.error ?? "El enlace de confirmación es inválido o ha expirado."}
          </p>
          <p className="text-xs text-slate-400">
            Si ya tienes una cuenta, puedes solicitar un nuevo enlace desde tu perfil de usuario.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/iniciar-sesion"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0055FF] to-[#2563EB] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-110"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Volver a la portada
            </Link>
          </div>
        </div>
      )}
    </AuthCard>
  );
}
