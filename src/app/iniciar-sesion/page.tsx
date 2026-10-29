import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/server/auth/session";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | INVESTMENTS",
  description: "Accede a tu cuenta de cliente o empresa mayorista en INVESTMENTS.",
  robots: { index: false, follow: false },
};

export const instant = false;

interface LoginPageProps {
  searchParams: Promise<{ next?: string; verificado?: string; restablecida?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { session } = await getCurrentSession();
  const sp = await searchParams;

  if (session) {
    redirect(sp.next ?? "/cuenta");
  }

  return (
    <AuthCard
      eyebrow="Acceso a la plataforma"
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta de cliente minorista o empresa mayorista"
      footer={
        <div className="space-y-2 text-xs">
          <p>
            ¿Aún no tienes cuenta personal?{" "}
            <Link href="/registro" className="font-medium text-ink underline underline-offset-4 hover:text-cochinilla">
              Crear cuenta de cliente
            </Link>
          </p>
          <p className="text-taupe-500">
            ¿Representas a una tienda o distribuidor?{" "}
            <Link href="/mayorista/registro" className="font-semibold text-cochinilla underline underline-offset-4 hover:text-ink">
              Registrar empresa mayorista
            </Link>
          </p>
        </div>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
