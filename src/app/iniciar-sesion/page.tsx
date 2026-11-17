import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { Auth3DExperience } from "@/components/auth/auth-3d-experience";

export const metadata: Metadata = {
  title: "Iniciar sesión | American Colt JEANS™",
  description: "Accede a tu cuenta de cliente minorista o empresa mayorista en American Colt JEANS™.",
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
    <Auth3DExperience
      initialMode="login"
      nextParam={sp.next}
      verifiedParam={Boolean(sp.verificado)}
      resetParam={Boolean(sp.restablecida)}
    />
  );
}
