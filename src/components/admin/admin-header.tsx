import Link from "next/link";
import { AdminNavUser } from "./admin-nav-user";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  Percent,
  Boxes,
  Package,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  ExternalLink,
  Database,
} from "lucide-react";

interface AdminHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: ShoppingBag },
  { href: "/admin/categorias", label: "Categorías", icon: FolderTree },
  { href: "/admin/promociones", label: "Promociones", icon: Percent },
  { href: "/admin/inventario", label: "Inventario", icon: Boxes },
  { href: "/admin/pedidos", label: "Pedidos", icon: Package },
  { href: "/admin/cotizaciones", label: "Cotizaciones B2B", icon: FileSpreadsheet },
  { href: "/admin/clientes", label: "Clientes y B2B", icon: Users },
  { href: "/admin/solicitudes", label: "Solicitudes RUC", icon: ShieldCheck },
];

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f1115] text-paper">
      <div className="shell flex h-14 items-center justify-between">
        {/* Lado izquierdo: Marca */}
        <Link
          href="/admin"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <span className="font-sans text-lg font-bold tracking-tight text-paper">
            INVESTMENTS<span className="text-cochinilla">.</span>
          </span>
          <span className="rounded bg-cochinilla px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-widest text-paper">
            ADMIN COMERCIAL
          </span>
        </Link>

        {/* Lado derecho: Estado de Base de Datos, enlace a tienda y Menú de Usuario con 3 puntitos */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Status Neon DB */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[0.68rem] text-emerald-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <Database className="size-3 text-emerald-400" aria-hidden />
            <span className="font-mono">Neon PostgreSQL Activo</span>
          </div>

          {/* Enlace rápido a la tienda pública */}
          <Link
            href="/catalogo"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-[0.7rem] uppercase tracking-wider text-paper/70 hover:text-paper transition-colors"
            title="Abrir tienda pública en nueva pestaña"
          >
            <span>Tienda pública</span>
            <ExternalLink className="size-3" aria-hidden />
          </Link>

          {/* Menú de administrador con 3 puntitos */}
          <AdminNavUser user={user} />
        </div>
      </div>

      {/* Barra secundaria de navegación integral (Desktop y Móvil con scroll horizontal limpio) */}
      <div className="border-t border-white/10 bg-[#14171d]">
        <div className="shell flex items-center gap-1 overflow-x-auto py-2 font-mono text-[0.72rem] scrollbar-none">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-paper/85 transition-colors hover:bg-white/10 hover:text-paper"
              >
                <Icon className="size-3.5 text-cochinilla" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
