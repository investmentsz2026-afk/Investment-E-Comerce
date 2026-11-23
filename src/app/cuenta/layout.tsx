import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requireAuth } from "@/server/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";
import { AdminPortalButton } from "@/components/account/admin-portal-button";
import { AccountNavTab } from "./account-nav-tab";
import { AccountBreadcrumb } from "./account-breadcrumb";
import {
  FaUser,
  FaHeart,
  FaBagShopping,
  FaLocationDot,
  FaShieldHalved,
  FaBoxArchive,
  FaBuilding,
  FaFileInvoice,
  FaWhatsapp,
} from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Mi Perfil de Cliente | American Colt JEANS™",
  description: "Gestiona tus datos personales, direcciones de entrega y pedidos en American Colt JEANS™.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAuth();

  const roleLabels: Record<
    string,
    { label: string; badgeClass: string }
  > = {
    customer: {
      label: "Cuenta Minorista",
      badgeClass: "text-[#0055FF]",
    },
    business_pending: {
      label: "Solicitud B2B en Revisión",
      badgeClass: "text-amber-600",
    },
    business_approved: {
      label: "Empresa Mayorista B2B",
      badgeClass: "text-emerald-600",
    },
    admin: {
      label: "Administrador General",
      badgeClass: "text-[#EF233C]",
    },
  };

  const currentRole = roleLabels[user.role] ?? roleLabels.customer;
  const userInitials = `${user.firstName?.charAt(0) ?? "A"}${user.lastName?.charAt(0) ?? "C"}`.toUpperCase();

  return (
    <div className="relative min-h-screen bg-[#F4F7FB] text-slate-900 pt-36 sm:pt-40 lg:pt-44 pb-20">
      {/* Sutil gradiente azulejo de fondo */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,85,255,0.06),transparent)]" />

      <div className="shell max-w-7xl">
        {/* Ruta de navegación (Breadcrumb) */}
        <AccountBreadcrumb />

        {/* Tarjeta Superior del Nombre de Usuario (con separación limpia y sin chocar) */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm border-l-4 border-l-[#0055FF]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Avatar & Nombres */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Cuadro azul con iniciales */}
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[#0055FF] text-white shadow-md shadow-blue-500/20 font-black text-xl tracking-wider">
                {userInitials}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <span className={`block text-[0.68rem] font-bold uppercase tracking-wider ${currentRole.badgeClass}`}>
                  {currentRole.label}
                </span>

                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-slate-900 truncate">
                  {user.firstName} {user.lastName}
                </h1>

                <p className="text-xs text-slate-500 font-mono">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Acciones del Perfil */}
            <div className="flex items-center gap-3 shrink-0">
              {user.role === "admin" && <AdminPortalButton />}

              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Estructura con menú lateral y contenido principal */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 min-w-0">
          {/* Navegación lateral */}
          <aside className="min-w-0 w-full overflow-hidden lg:col-span-3 space-y-5">
            <nav
              aria-label="Navegación de cuenta"
              className="no-scrollbar flex flex-row overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm lg:flex-col gap-1"
            >
              <AccountNavTab href="/cuenta" icon={<FaUser className="size-3.5" />} label="Mi perfil" />
              <AccountNavTab href="/cuenta/favoritos" icon={<FaHeart className="size-3.5" />} label="Mis favoritos" />
              <AccountNavTab href="/cuenta/bolsa" icon={<FaBagShopping className="size-3.5" />} label="Mi bolsa actual" />
              <AccountNavTab href="/cuenta/direcciones" icon={<FaLocationDot className="size-3.5" />} label="Direcciones" />
              <AccountNavTab href="/cuenta/seguridad" icon={<FaShieldHalved className="size-3.5" />} label="Seguridad" />
              <AccountNavTab href="/cuenta/pedidos" icon={<FaBoxArchive className="size-3.5" />} label="Mis pedidos" />

              {(user.role === "business_approved" || user.role === "admin") && (
                <AccountNavTab
                  href="/mayorista/cotizaciones"
                  icon={<FaFileInvoice className="size-3.5" />}
                  label="Cotizaciones B2B"
                />
              )}

              {user.role === "customer" ? (
                <AccountNavTab
                  href="/mayorista/registro"
                  icon={<FaBuilding className="size-3.5" />}
                  label="Cuenta mayorista B2B"
                  badge="Hasta -50%"
                />
              ) : (
                <AccountNavTab
                  href="/mayorista/solicitud"
                  icon={<FaBuilding className="size-3.5" />}
                  label="Estado Mayorista"
                />
              )}
            </nav>

            {/* Tarjeta de soporte rápido por WhatsApp */}
            <div className="hidden lg:block rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-sm text-xs">
              <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-wider text-[0.72rem]">
                <FaWhatsapp className="size-4 text-emerald-500" />
                <span>Atención WhatsApp</span>
              </div>
              <p className="mt-1.5 text-slate-600 leading-relaxed text-[0.72rem]">
                ¿Consultas sobre un pedido o cambio de talla? Nuestro equipo te atiende de inmediato.
              </p>
              <a
                href="https://wa.me/51926922583?text=Hola%20American%20Colt%20JEANS,%20necesito%20ayuda%20con%20mi%20cuenta"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3.5 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500 text-emerald-600 hover:bg-emerald-50 py-2 px-3 text-xs font-bold transition-colors text-center w-full"
              >
                <span>Escribir por WhatsApp ↗</span>
              </a>
            </div>
          </aside>

          {/* Área principal de contenido */}
          <main className="lg:col-span-9 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
