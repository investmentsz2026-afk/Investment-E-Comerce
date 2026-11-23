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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F6F8FC] font-sans text-slate-900 antialiased selection:bg-[#DC2626] selection:text-white">
      {/* Barra lateral izquierda 3D con scroll completo y navegación categorizada */}
      <AdminSidebar user={userPayload} />

      {/* Área de contenido y barra superior */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar user={userPayload} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer interno moderno */}
        <footer className="border-t border-slate-200/90 bg-white/90 py-4 px-6 text-xs font-bold text-slate-600 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-extrabold text-slate-800">
              AMERICAN COLT JEANS™ · Sistema de Gestión Comercial y Logística
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.68rem] font-extrabold text-emerald-800">
              Neon PostgreSQL · Cifrado TLS 1.3 · Sesión Verificada
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
