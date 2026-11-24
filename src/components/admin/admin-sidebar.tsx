"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  ExternalLink,
  FileText,
  Home,
  Layers,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  Package,
  Percent,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { AdminLogoutModal } from "./admin-logout-modal";

interface AdminSidebarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
}

interface NavGroup {
  title?: string;
  accent?: string;
  items: NavItem[];
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: "PANEL CENTRAL",
    accent: "bg-[#DC2626]",
    items: [
      { href: "/admin", label: "Inicio", icon: Home, exact: true },
      { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
    ],
  },
  {
    title: "GESTIÓN DE CATÁLOGO",
    accent: "bg-blue-600",
    items: [
      { href: "/admin/productos", label: "Productos", icon: Package },
      { href: "/admin/mayoristas", label: "Productos Mayoristas", icon: Boxes },
      { href: "/admin/categorias", label: "Categorías", icon: LayoutGrid },
      { href: "/admin/promociones", label: "Promociones", icon: Percent },
      { href: "/admin/contenido", label: "Contenido E-Commerce", icon: Sparkles },
      { href: "/admin/inventario", label: "Inventario", icon: Layers },
    ],
  },
  {
    title: "OPERACIONES",
    accent: "bg-amber-500",
    items: [
      { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
      { href: "/admin/envios", label: "Tarifas de envío", icon: Truck },
      { href: "/admin/tiendas", label: "Tiendas y recojo", icon: Store },
      { href: "/admin/cambios", label: "Cambios y tallas", icon: RefreshCw },
    ],
  },
  {
    title: "COMERCIAL B2B",
    accent: "bg-emerald-600",
    items: [
      { href: "/admin/solicitudes", label: "Solicitudes B2B", icon: Users },
      { href: "/admin/cotizaciones", label: "Cotizaciones", icon: FileText },
      { href: "/admin/suscripciones", label: "Suscripciones", icon: Mail },
      { href: "/admin/clientes", label: "Clientes", icon: UserCheck },
    ],
  },
];

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const initials =
    `${user.firstName?.charAt(0) || "A"}${user.lastName?.charAt(0) || "P"}`.toUpperCase();

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const navContent = (
    <div className="flex min-h-full flex-col justify-between font-sans antialiased">
      <div className="space-y-4">
        {/* ─── TARJETA LOGO + EMPRESA 3D CON ANIMACIÓN HOVER ─── */}
        <div className="px-4 pt-4 pb-1">
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="group relative block rounded-2xl bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#2563EB] p-[2px] shadow-[0_14px_28px_-12px_rgba(220,38,38,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_38px_-10px_rgba(220,38,38,0.55)] active:scale-[0.98]"
          >
            <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-white via-white to-red-50/70 px-3.5 py-3">
              {/* Efecto brillo diagonal en hover */}
              <span className="pointer-events-none absolute -left-full top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent transition-all duration-700 group-hover:left-[140%]" />

              <div className="relative flex items-center gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border-2 border-red-200/80 bg-[#91151B] shadow-[0_6px_14px_-4px_rgba(145,21,27,0.65)] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-2deg]">
                  <Image
                    src="/logo-american-colt.png"
                    alt="American Colt JEANS"
                    fill
                    sizes="48px"
                    className="object-contain p-0.5"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-[0.95rem] font-black tracking-tight text-slate-950 transition-colors group-hover:text-[#DC2626]">
                      AMERICAN COLT
                    </span>
                    <span className="text-xs font-black text-[#DC2626]">®</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="inline-flex size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="truncate text-[0.63rem] font-extrabold uppercase tracking-[0.14em] text-[#991B1B]">
                      Admin Comercial
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* ─── MÓDULOS DE NAVEGACIÓN 3D ─── */}
        <nav
          className="space-y-4 px-3.5"
          aria-label="Menú principal de administración"
        >
          {ADMIN_NAV_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              {group.title && (
                <div className="flex items-center gap-2 px-2.5 pt-1">
                  <span
                    className={`size-1.5 rounded-full ${group.accent ?? "bg-[#DC2626]"}`}
                  />
                  <span className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">
                    {group.title}
                  </span>
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group relative flex items-center justify-between rounded-2xl border px-3 py-2.5 text-[0.83rem] transition-all duration-200 ${
                        active
                          ? "border-[#991B1B]/30 bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] font-extrabold text-white shadow-[0_5px_0_rgba(127,29,29,0.28),0_12px_22px_-8px_rgba(220,38,38,0.5)] -translate-y-0.5"
                          : "border-transparent bg-white/50 font-bold text-slate-800 hover:-translate-y-0.5 hover:translate-x-1 hover:border-red-200/90 hover:bg-gradient-to-r hover:from-red-50 hover:via-white hover:to-blue-50/40 hover:text-[#991B1B] hover:shadow-[0_10px_22px_-10px_rgba(220,38,38,0.32)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                            active
                              ? "bg-white/20 text-white shadow-inner backdrop-blur-sm"
                              : "border border-slate-200/80 bg-slate-100/80 text-slate-700 group-hover:scale-110 group-hover:border-red-300 group-hover:bg-gradient-to-br group-hover:from-[#DC2626] group-hover:to-[#991B1B] group-hover:text-white group-hover:shadow-md"
                          }`}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="truncate tracking-tight">
                          {item.label}
                        </span>
                      </div>

                      {active ? (
                        <ChevronRight className="size-4 shrink-0 text-white" />
                      ) : item.badge ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-extrabold text-[#991B1B]">
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight className="size-3.5 shrink-0 -translate-x-1 text-[#DC2626] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* ─── PIE DEL SIDEBAR: TIENDA PÚBLICA 3D + TARJETA ADMIN MODERNA ─── */}
      <div className="mt-6 space-y-3 border-t border-slate-200/80 bg-slate-50/70 p-3.5">
        {/* Botón 3D Ver Tienda Pública */}
        <Link
          href="/catalogo"
          target="_blank"
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border-2 border-blue-200/90 bg-gradient-to-r from-white via-blue-50/40 to-white px-3.5 py-2.5 shadow-[0_6px_16px_-8px_rgba(37,99,235,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.4)]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
              <ExternalLink className="size-3.5" />
            </span>
            <div className="min-w-0">
              <span className="block truncate text-xs font-black text-slate-900 group-hover:text-blue-700">
                Ver Tienda Pública
              </span>
              <span className="block text-[0.65rem] font-bold text-slate-500">
                colt.pe · En vivo
              </span>
            </div>
          </div>
          <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-blue-800">
            Abrir
          </span>
        </Link>

        {/* Tarjeta 3D Administrador Abajo */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-[#1E293B] to-slate-950 p-3 text-white shadow-[0_14px_28px_-10px_rgba(15,23,42,0.55)]">
          <div className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-[#DC2626]/25 blur-xl" />

          <div className="relative flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="flex size-10 items-center justify-center rounded-full border-2 border-white/30 bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] text-xs font-black text-white shadow-md">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-slate-900 bg-emerald-400" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-white leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[0.64rem] font-extrabold text-emerald-400">
                <ShieldCheck className="size-3 shrink-0" />
                <span className="truncate">Sesión Admin Activa</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLogoutModalOpen(true)}
              title="Cerrar sesión"
              className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-red-200 transition hover:border-red-400/50 hover:bg-[#DC2626] hover:text-white"
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── HEADER MÓVIL MODERNO 3D ─── */}
      <div className="lg:hidden sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md shadow-sm font-sans">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 shadow-xs transition hover:border-[#DC2626] hover:bg-red-50 hover:text-[#DC2626]"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-[0.68rem] font-black text-white shadow-sm">
              AC
            </span>
            <div>
              <span className="block text-sm font-black tracking-tight text-slate-950">
                AMERICAN COLT<span className="text-[#DC2626]">®</span>
              </span>
              <span className="block text-[0.58rem] font-extrabold uppercase tracking-wider text-[#DC2626]">
                Panel Admin 3D
              </span>
            </div>
          </Link>
        </div>

        <Link
          href="/catalogo"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100"
        >
          <Sparkles className="size-3.5" />
          <span>Tienda</span>
          <ExternalLink className="size-3" />
        </Link>
      </div>

      {/* ─── DRAWER MÓVIL DESPLEGABLE CON SCROLL ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-red-50 hover:text-[#DC2626]"
                aria-label="Cerrar menú"
              >
                <X className="size-4" />
              </button>
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
                {navContent}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SIDEBAR FIJA DESKTOP CON SCROLL COMPLETO Y ESTILIZADO ─── */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-slate-200/90 bg-gradient-to-b from-white via-white to-slate-50/90 shadow-[8px_0_30px_-16px_rgba(15,23,42,0.12)]">
        <div className="sticky top-0 h-screen overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80 hover:[&::-webkit-scrollbar-thumb]:bg-[#DC2626]/70">
          {navContent}
        </div>
      </aside>

      {/* Modal de Confirmación y Animación de Cierre de Sesión */}
      <AdminLogoutModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        userName={`${user.firstName} ${user.lastName}`}
        userEmail={user.email}
      />
    </>
  );
}
