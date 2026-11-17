import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { Auth3DExperience } from "@/components/auth/auth-3d-experience";

export const metadata: Metadata = {
  title: "Crear cuenta de cliente | American Colt JEANS™",
  description: "Regístrate para comprar prendas exclusivas y gestionar tus pedidos en American Colt JEANS™.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function RegisterPage() {
  const { session } = await getCurrentSession();
  if (session) {
    redirect("/cuenta");
  }

  return <Auth3DExperience initialMode="register" />;
}
