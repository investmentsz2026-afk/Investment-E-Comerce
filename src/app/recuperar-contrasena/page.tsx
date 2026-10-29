import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RequestResetForm } from "@/components/auth/request-reset-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | INVESTMENTS",
  description: "Solicita un enlace para restablecer el acceso a tu cuenta en INVESTMENTS.",
  robots: { index: false, follow: false },
};

export default function RequestResetPage() {
  return (
    <AuthCard
      eyebrow="Seguridad"
      title="Recuperar contraseña"
      subtitle="Te ayudaremos a restablecer el acceso a tu cuenta de manera protegida"
      backHref="/iniciar-sesion"
      backLabel="Volver al inicio de sesión"
    >
      <RequestResetForm />
    </AuthCard>
  );
}
