"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Heart, House, Search, ShoppingBag, Warehouse } from "lucide-react";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { useCart } from "@/components/cart/cart-provider";

/** Barra inferior tipo app para móviles: accesos de una mano, áreas táctiles de 48px. */
export function MobileTabBar({ onSearch }: { onSearch: () => void }) {
  const { count: favoritesCount, snapshot: favSnapshot } = useFavorites();
  const { cart, openDrawer } = useCart();
  const favoritesHref = favSnapshot.isAuthenticated ? "/cuenta/favoritos" : "/favoritos";

  return (
    <nav
      aria-label="Accesos rápidos"
      data-testid="mobile-tab-bar"
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
            href="/mayorista"
            label="Por mayor"
            accent
            icon={<Warehouse className="size-5" aria-hidden />}
          />
        </li>
        <li>
          <TabLink
            href={favoritesHref}
            label={`Favoritos (${favoritesCount})`}
            icon={<Heart className="size-5" aria-hidden />}
          />
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
    <Link href={href} className={itemClass}>
      <span className="relative">
        {icon}
        {accent ? <span className="absolute -right-1 -top-0.5 size-1.5 rounded-full bg-cochinilla" aria-hidden /> : null}
      </span>
      {label}
    </Link>
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
