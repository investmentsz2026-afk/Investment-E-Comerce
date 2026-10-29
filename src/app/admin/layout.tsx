import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { AdminHeader } from "@/components/admin/admin-header";

export const instant = false;

export const metadata: Metadata = {
  title: "Panel Administrativo Comercial | INVESTMENTS",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfa] text-ink selection:bg-cochinilla selection:text-paper">
      {/* Cabecera moderna exclusiva del panel de administración */}
      <AdminHeader
        user={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        }}
      />

      {/* Contenido principal del panel */}
      <main className="flex-1">{children}</main>

      {/* Footer minimalista de control interno */}
      <footer className="border-t border-ink/10 bg-paper py-4 text-center font-mono text-[0.68rem] text-taupe-500">
        <div className="shell flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>INVESTMENTS Enterprise Admin · Panel de Control Interno</span>
          <span>Base de datos Neon PostgreSQL · Cifrado TLS 1.3 · Sesión Segura</span>
        </div>
      </footer>
    </div>
  );
}
