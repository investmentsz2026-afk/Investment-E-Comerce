"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, MapPin, ShoppingBag, Warehouse } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

/**
 * Barra inferior compacta para móviles con los 5 accesos esenciales (incluyendo mapa de tiendas)
 * sin duplicar los botones que ya están en el encabezado superior (Buscar, Favoritos, Rastreo, Cuenta).
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { cart, openDrawer } = useCart();

  return (
    <nav
      aria-label="Accesos rápidos"
      data-testid="mobile-tab-bar"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 shadow-[0_-8px_24px_-10px_rgba(15,23,42,0.16)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid h-14 grid-cols-5">
        <li>
          <TabLink
            href="/"
            label="Inicio"
            active={pathname === "/"}
            icon={<Home className="size-4" aria-hidden />}
          />
        </li>
        <li>
          <TabLink
            href="/catalogo"
            label="Catálogo"
            active={pathname.startsWith("/catalogo")}
            icon={<LayoutGrid className="size-4" aria-hidden />}
          />
        </li>
        <li>
          <TabLink
            href="/tiendas"
            label="Tiendas"
            active={pathname.startsWith("/tiendas")}
            icon={<MapPin className="size-4" aria-hidden />}
          />
        </li>
        <li>
          <TabLink
            href="/mayorista"
            label="Mayorista"
            active={pathname.startsWith("/mayorista")}
            accent
            icon={<Warehouse className="size-4" aria-hidden />}
          />
        </li>
        <li>
          <button
            type="button"
            onClick={openDrawer}
            className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-0.5 text-[0.54rem] font-extrabold uppercase tracking-wide text-slate-700 transition-transform active:scale-95"
          >
            <span className="relative">
              <ShoppingBag className="size-4 text-[#DC2626]" aria-hidden />
              {cart.totalUnits > 0 && (
                <span className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 font-mono text-[0.52rem] font-black text-white">
                  {cart.totalUnits}
                </span>
              )}
            </span>
            <span className="whitespace-nowrap">Bolsa</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

function TabLink({
  href,
  label,
  icon,
  active = false,
  accent = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-0.5 px-0.5 text-[0.54rem] font-extrabold uppercase tracking-wide transition-transform active:scale-95",
        active ? "text-[#DC2626]" : "text-slate-600",
      )}
    >
      <span className="relative">
        {icon}
        {accent ? (
          <span className="absolute -right-1 -top-0.5 size-1.5 rounded-full bg-[#2563EB]" aria-hidden />
        ) : null}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
