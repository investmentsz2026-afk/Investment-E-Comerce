"use client";

import type { ReactNode } from "react";
import { Heart, House, Search, ShoppingBag, Warehouse } from "lucide-react";
import { useNotice } from "@/components/feedback/notice-provider";
import { useCart } from "@/components/cart/cart-provider";

/** Barra inferior tipo app para móviles: accesos de una mano, áreas táctiles de 48px. */
export function MobileTabBar({ onSearch }: { onSearch: () => void }) {
  const { announcePending } = useNotice();
  const { cart, openDrawer } = useCart();

  return (
    <nav
      aria-label="Accesos rápidos"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 backdrop-blur-sm lg:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        <li>
          <TabLink href="/catalogo" label="Catálogo" icon={<House className="size-5" aria-hidden />} />
        </li>
        <li>
          <TabButton label="Buscar" onClick={onSearch} icon={<Search className="size-5" aria-hidden />} />
        </li>
        <li>
          <TabLink
            href="/mayorista/cotizaciones"
            label="Por mayor"
            accent
            icon={<Warehouse className="size-5" aria-hidden />}
          />
        </li>
        <li>
          <TabButton label="Favoritos" onClick={() => announcePending("favorites")} icon={<Heart className="size-5" aria-hidden />} />
        </li>
        <li>
          <TabButton
            label={`Bolsa (${cart.totalUnits})`}
            onClick={openDrawer}
            icon={<ShoppingBag className="size-5" aria-hidden />}
          />
        </li>
      </ul>
    </nav>
  );
}

const itemClass =
  "flex h-full w-full flex-col items-center justify-center gap-1 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-ink/70 transition-transform active:scale-90";

function TabLink({ href, label, icon, accent = false }: { href: string; label: string; icon: ReactNode; accent?: boolean }) {
  return (
    <a href={href} className={itemClass}>
      <span className="relative">
        {icon}
        {accent ? <span className="absolute -right-1 -top-0.5 size-1.5 rounded-full bg-cochinilla" aria-hidden /> : null}
      </span>
      {label}
    </a>
  );
}

function TabButton({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={itemClass}>
      {icon}
      {label}
    </button>
  );
}
