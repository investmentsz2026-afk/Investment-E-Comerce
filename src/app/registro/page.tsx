import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/server/auth/session";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta de cliente | INVESTMENTS",
  description: "Regístrate para comprar piezas exclusivas y gestionar tus pedidos en INVESTMENTS.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function RegisterPage() {
  const { session } = await getCurrentSession();
  if (session) {
    redirect("/cuenta");
  }

  return (
    <AuthCard
      eyebrow="Registro B2C"
      title="Crear cuenta"
      subtitle="Completa tus datos para disfrutar de una experiencia personalizada"
      footer={
        <div className="space-y-3">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <Link href="/iniciar-sesion" className="font-medium text-ink underline underline-offset-4 hover:text-cochinilla">
              Iniciar sesión
            </Link>
          </p>
          <p className="border-t border-ink/10 pt-3">
            ¿Representas a una empresa o distribuidor?{" "}
            <Link href="/mayorista/registro" className="font-medium text-cochinilla underline underline-offset-4 hover:text-ink">
              Solicitar cuenta mayorista B2B
            </Link>
          </p>
        </div>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
