"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  Package,
  LayoutGrid,
  Percent,
  Layers,
  ShoppingCart,
  Truck,
  Store,
  RefreshCw,
  Users,
  FileText,
  Mail,
  UserCheck,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

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
  items: NavItem[];
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Inicio", icon: Home, exact: true },
      { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
    ],
  },
  {
    title: "GESTIÓN DE CATÁLOGO",
    items: [
      { href: "/admin/productos", label: "Productos", icon: Package },
      { href: "/admin/categorias", label: "Categorías", icon: LayoutGrid },
      { href: "/admin/promociones", label: "Promociones", icon: Percent },
      { href: "/admin/inventario", label: "Inventario", icon: Layers },
    ],
  },
  {
    title: "OPERACIONES",
    items: [
      { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
      { href: "/admin/envios", label: "Tarifas de envío", icon: Truck },
      { href: "/admin/tiendas", label: "Tiendas y recojo", icon: Store },
      { href: "/admin/cambios", label: "Cambios y tallas", icon: RefreshCw },
    ],
  },
  {
    title: "COMERCIAL B2B",
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

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between">
      {/* ─── Encabezado de la barra lateral con Identidad Oficial ─── */}
      <div className="space-y-4">
        <div className="px-5 pt-6 pb-2">
          <Link
            href="/admin"
            className="group block transition-transform duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-neutral-900 group-hover:text-[#801323] transition-colors">
                AMERICAN COLT<span className="text-[#801323]">®</span>
              </span>
            </div>
            <span className="block mt-0.5 text-[0.62rem] font-extrabold uppercase tracking-widest text-[#801323]">
              ADMINISTRACIÓN COMERCIAL
            </span>
          </Link>
        </div>

        {/* ─── Lista de Grupos y Módulos de Navegación ─── */}
        <nav className="space-y-4 px-3" aria-label="Menú principal de administración">
          {ADMIN_NAV_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.title && (
                <div className="px-3 pt-2 pb-1 text-[0.62rem] font-black uppercase tracking-wider text-neutral-400">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group relative flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                        active
                          ? "bg-[#F8EFEF] text-[#801323] font-bold shadow-xs ring-1 ring-[#801323]/15"
                          : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900 hover:translate-x-0.5"
                      }`}
                    >
                      {/* Indicador visual activo en el extremo izquierdo */}
                      {active && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#801323]" />
                      )}

                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`size-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                            active
                              ? "text-[#801323]"
                              : "text-neutral-400 group-hover:text-neutral-700"
                          }`}
                          aria-hidden
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {active ? (
                        <ChevronRight className="size-3.5 text-[#801323] opacity-80 shrink-0" />
                      ) : item.badge ? (
                        <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[0.6rem] font-bold text-neutral-600">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* ─── Footer inferior de la barra lateral ─── */}
      <div className="p-3 border-t border-neutral-200/70 space-y-2">
        <Link
          href="/catalogo"
          target="_blank"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100/80 hover:text-neutral-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="size-3.5 text-neutral-400" />
            <span>Tienda pública</span>
          </div>
          <span className="text-[0.62rem] font-mono text-neutral-400">colt.pe</span>
        </Link>

        <div className="rounded-xl bg-neutral-50 p-2.5 border border-neutral-200/60 flex items-center gap-2.5">
          <div className="size-7 rounded-full bg-[#801323] text-white flex items-center justify-center font-bold text-[0.65rem] shrink-0">
            {user.firstName?.charAt(0) || "A"}
            {user.lastName?.charAt(0) || "P"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.72rem] font-bold text-neutral-800 leading-tight">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-[0.62rem] text-emerald-700 font-medium">
              Sesión Admin Activa
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── Botón flotante móvil para abrir sidebar ─── */}
      <div className="lg:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-neutral-200/80 bg-white px-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="size-5" />
          </button>
          <div>
            <span className="text-sm font-black tracking-tight text-neutral-900">
              AMERICAN COLT<span className="text-[#801323]">®</span>
            </span>
            <span className="block text-[0.58rem] font-bold uppercase tracking-wider text-[#801323]">
              PANEL ADMIN
            </span>
          </div>
        </div>

        <Link
          href="/catalogo"
          target="_blank"
          className="text-xs font-bold text-[#801323] flex items-center gap-1 hover:underline"
        >
          <span>Tienda</span>
          <ExternalLink className="size-3" />
        </Link>
      </div>

      {/* ─── Drawer Móvil desplegable ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop oscurecido */}
          <div
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col z-50">
            <div className="absolute right-3 top-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="size-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200"
                aria-label="Cerrar menú"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">{navContent}</div>
          </div>
        </div>
      )}

      {/* ─── Sidebar Fija Desktop (pantallas grandes) ─── */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-neutral-200/80 bg-white">
        <div className="sticky top-0 h-screen overflow-y-auto no-scrollbar">
          {navContent}
        </div>
      </aside>
    </>
  );
}
