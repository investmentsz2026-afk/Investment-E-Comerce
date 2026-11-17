import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export const instant = false;

export const metadata: Metadata = {
  title: "Panel Administrativo Comercial | American Colt JEANS™",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAdmin();

  const userPayload = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF8F5] text-neutral-900 selection:bg-[#801323] selection:text-white">
      {/* Barra lateral izquierda con navegación categorizada */}
      <AdminSidebar user={userPayload} />

      {/* Área de contenido y barra superior */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar user={userPayload} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Footer interno */}
        <footer className="border-t border-neutral-200/80 bg-white py-4 px-6 text-[0.7rem] font-mono text-neutral-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>AMERICAN COLT JEANS™ · Sistema de Gestión Comercial y Logística</span>
            <span>Neon PostgreSQL · Cifrado TLS 1.3 · Sesión Verificada</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
