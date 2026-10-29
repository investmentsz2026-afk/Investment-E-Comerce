import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/server/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";
import { User, MapPin, ShieldCheck, ShoppingBag, Building2, ShieldAlert, FileText, Heart } from "lucide-react";
import { AccountNavTab } from "./account-nav-tab";

export const metadata: Metadata = {
  title: "Mi Cuenta | INVESTMENTS",
  description: "Gestiona tus datos personales, direcciones de entrega y accesos comerciales en INVESTMENTS.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAuth();

  const roleLabels: Record<string, { label: string; badgeClass: string }> = {
    customer: { label: "Cliente Minorista", badgeClass: "bg-taupe-200 text-taupe-800" },
    business_pending: { label: "Solicitud B2B en Revisión", badgeClass: "bg-amber-100 text-amber-900 border border-amber-300" },
    business_approved: { label: "Empresa Mayorista Aprobada", badgeClass: "bg-emerald-100 text-emerald-900 border border-emerald-300" },
    admin: { label: "Administrador", badgeClass: "bg-ink text-paper" },
  };

  const currentRole = roleLabels[user.role] ?? roleLabels.customer;

  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell">
        {/* Cabecera del perfil */}
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.14em] ${currentRole.badgeClass}`}>
                {currentRole.label}
              </span>
              {user.role === "admin" && (
                <Link
                  href="/admin/solicitudes"
                  className="inline-flex items-center gap-1 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-cochinilla hover:underline"
                >
                  <ShieldAlert className="size-3" aria-hidden />
                  Ir al panel admin
                </Link>
              )}
            </div>
            <h1 className="mt-2 font-display text-display-md text-ink">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-1 text-xs text-taupe-500 font-mono">{user.email}</p>
          </div>

          <div className="flex items-center gap-4">
            <LogoutButton />
          </div>
        </div>

        {/* Estructura con menú lateral y contenido */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Navegación lateral */}
          <aside className="lg:col-span-3">
            <nav aria-label="Navegación de cuenta" className="flex flex-row overflow-x-auto border-b border-ink/10 pb-2 lg:flex-col lg:border-b-0 lg:border-r lg:pr-6 lg:pb-0 gap-1">
              <AccountNavTab href="/cuenta" icon={<User className="size-4" />} label="Mi Perfil" />
              <AccountNavTab href="/cuenta/favoritos" icon={<Heart className="size-4" />} label="Mis Favoritos" />
              <AccountNavTab href="/carrito" icon={<ShoppingBag className="size-4" />} label="Mi Bolsa Actual" />
              <AccountNavTab href="/cuenta/direcciones" icon={<MapPin className="size-4" />} label="Direcciones" />
              <AccountNavTab href="/cuenta/seguridad" icon={<ShieldCheck className="size-4" />} label="Seguridad" />
              <AccountNavTab href="/cuenta/pedidos" icon={<ShoppingBag className="size-4" />} label="Mis Pedidos" />
              {(user.role === "business_approved" || user.role === "admin") && (
                <AccountNavTab href="/mayorista/cotizaciones" icon={<FileText className="size-4" />} label="Cotizaciones B2B" />
              )}
              {user.role === "customer" ? (
                <AccountNavTab href="/mayorista/registro" icon={<Building2 className="size-4" />} label="Solicitar cuenta B2B" />
              ) : (
                <AccountNavTab href="/mayorista/solicitud" icon={<Building2 className="size-4" />} label="Estado de cuenta B2B" />
              )}
            </nav>
          </aside>

          {/* Área principal de contenido */}
          <main className="lg:col-span-9 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
