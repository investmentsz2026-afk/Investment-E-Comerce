"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { mainNav, wholesaleNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/brand/logo";
import { ActionLink } from "@/components/ui/action-link";
import { Marquee } from "@/components/motion/marquee";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { useCart } from "@/components/cart/cart-provider";
import { useEscapeKey } from "@/hooks/use-overlay";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { MegaMenuPanel } from "./mega-menu-panel";
import { SearchOverlay } from "./search-overlay";
import { MobileMenu } from "./mobile-menu";
import { MobileTabBar } from "./mobile-tab-bar";

const ANNOUNCEMENT_HEIGHT = 36;
const HIDE_AFTER = 640;

const announcements = [
  siteConfig.season,
  "Compra por menor y por mayor en un solo lugar",
  "Cuentas empresariales para negocios y distribuidores",
  "Nueva colección de sastrería moderna",
] as const;

export function SiteHeader() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const pathname = usePathname();
  // No mostrar el header comercial en el panel administrativo ni en pantallas de login/registro
  const isAuthOrAdmin =
    pathname.startsWith("/admin") ||
    pathname === "/iniciar-sesion" ||
    pathname === "/registro" ||
    pathname === "/recuperar-contrasena" ||
    pathname === "/restablecer-contrasena" ||
    pathname === "/verificar-correo";

  // Solo la portada tiene un hero oscuro bajo el header; en el resto de rutas el header es sólido desde el inicio.
  const overHero = pathname === "/";
  const { count: favoritesCount, snapshot: favSnapshot } = useFavorites();
  const { cart, openDrawer } = useCart();
  const favoritesHref = favSnapshot.isAuthenticated ? "/cuenta/favoritos" : "/favoritos";

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    if (y > HIDE_AFTER && y > previous + 4) setHidden(true);
    else if (y < previous - 4 || y <= HIDE_AFTER) setHidden(false);
  });

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };
  const openMenu = (id: string) => {
    cancelClose();
    setActiveMenu(id);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setActiveMenu(null), 140);
  };
  const closeMenu = useCallback(() => setActiveMenu(null), []);
  useEscapeKey(activeMenu !== null, closeMenu);

  const activeItem = mainNav.find((item) => item.id === activeMenu && item.megaMenu);
  const solid = !overHero || scrolled || activeItem !== undefined;
  const offset = hidden && !activeItem ? -(ANNOUNCEMENT_HEIGHT + 96) : scrolled ? -ANNOUNCEMENT_HEIGHT : 0;

  if (isAuthOrAdmin) {
    return null;
  }

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        animate={{ y: offset }}
        transition={{ duration: 0.6, ease: ease.luxe }}
        onMouseLeave={scheduleClose}
      >
        {/* Barra de anuncios */}
        <div className="flex h-9 items-center overflow-hidden bg-ink text-paper/80">
          <Marquee items={announcements} className="w-full" itemClassName="eyebrow text-[0.62rem]" separator="●" />
        </div>

        {/* Navegación principal */}
        <div className={cn("relative transition-colors duration-500", solid ? "text-ink" : "text-paper")}>
          <motion.div
            aria-hidden
            className="absolute inset-0 border-b border-ink/10 bg-paper"
            initial={false}
            animate={{ opacity: solid ? 1 : 0 }}
            transition={{ duration: 0.45 }}
          />
          <nav aria-label="Principal" className="shell relative grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-20">
            {/* Izquierda */}
            <div className="flex items-center">
              <button
                type="button"
                className="-ml-2 flex size-11 items-center justify-center lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
                aria-expanded={mobileOpen}
              >
                <Menu className="size-5" aria-hidden />
              </button>
              <ul className="hidden items-center gap-8 lg:flex">
                {mainNav.map((item) => (
                  <li key={item.id} onMouseEnter={() => (item.megaMenu ? openMenu(item.id) : scheduleClose())}>
                    {item.megaMenu ? (
                      <button
                        type="button"
                        aria-expanded={activeMenu === item.id}
                        aria-controls="mega-menu"
                        onClick={() => setActiveMenu((cur) => (cur === item.id ? null : item.id))}
                        className="group/nav relative py-2 text-[0.72rem] font-medium uppercase tracking-[0.18em]"
                      >
                        {item.label}
                        <NavUnderline active={activeMenu === item.id} />
                      </button>
                    ) : (
                      <ActionLink
                        target={item.target}
                        className="group/nav relative py-2 text-[0.72rem] font-medium uppercase tracking-[0.18em]"
                      >
                        {item.label}
                        <NavUnderline active={false} />
                      </ActionLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Centro: logotipo */}
            <Link href="/" aria-label="INVESTMENTS — Inicio" className="justify-self-center">
              <Logo />
            </Link>

            {/* Derecha */}
            <div className="flex items-center justify-end gap-1 sm:gap-2" onMouseEnter={scheduleClose}>
              <ActionLink
                target={wholesaleNav.target}
                className={cn(
                  "mr-3 hidden h-9 items-center gap-2 rounded-full border px-4 text-[0.66rem] font-medium uppercase tracking-[0.18em] transition-colors duration-500 xl:inline-flex",
                  solid ? "border-ink/20 hover:border-ink" : "border-paper/30 hover:border-paper",
                )}
              >
                <span className="size-1.5 rounded-full bg-cochinilla-bright" aria-hidden />
                {wholesaleNav.label}
              </ActionLink>
              <HeaderIcon label="Buscar" onClick={() => setSearchOpen(true)}>
                <Search className="size-[1.15rem]" aria-hidden />
              </HeaderIcon>
              <Link
                href="/cuenta"
                aria-label="Mi cuenta"
                title="Mi cuenta"
                className="hidden lg:flex size-11 items-center justify-center rounded-full transition-[transform,opacity] duration-300 ease-luxe hover:opacity-70 active:scale-90"
              >
                <UserRound className="size-[1.15rem]" aria-hidden />
              </Link>
              <Link
                href={favoritesHref}
                data-testid="header-favorites-link"
                aria-label={`Favoritos, ${favoritesCount} ${favoritesCount === 1 ? "prenda" : "prendas"}`}
                title={`Favoritos (${favoritesCount})`}
                className="hidden lg:flex size-11 items-center justify-center rounded-full transition-[transform,opacity] duration-300 ease-luxe hover:opacity-70 active:scale-90"
              >
                <span className="relative">
                  <Heart
                    className={cn("size-[1.15rem]", favoritesCount > 0 && "fill-cochinilla text-cochinilla")}
                    aria-hidden
                  />
                  <span
                    data-testid="header-favorites-count"
                    className="absolute -right-1.5 -top-1 flex min-w-3.5 h-3.5 items-center justify-center rounded-full bg-cochinilla px-1 text-[0.5rem] font-semibold text-paper tabular-nums"
                  >
                    {favoritesCount}
                  </span>
                </span>
              </Link>
              <HeaderIcon
                label={`Bolsa de compras, ${cart.totalUnits} ${cart.totalUnits === 1 ? "producto" : "productos"}`}
                onClick={openDrawer}
                className="-mr-2 lg:mr-0"
              >
                <span className="relative">
                  <ShoppingBag className="size-[1.15rem]" aria-hidden />
                  <span
                    data-testid="header-cart-count"
                    className="absolute -right-1.5 -top-1 flex min-w-3.5 h-3.5 items-center justify-center rounded-full bg-cochinilla px-1 text-[0.5rem] font-semibold text-paper tabular-nums"
                  >
                    {cart.totalUnits}
                  </span>
                </span>
              </HeaderIcon>
            </div>
          </nav>

          {/* Mega menú */}
          <AnimatePresence>
            {activeItem ? (
              <motion.div
                id="mega-menu"
                key="mega"
                className="absolute inset-x-0 top-full hidden overflow-hidden border-b border-ink/10 bg-paper text-ink lg:block"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.25 } }}
                transition={{ duration: 0.5, ease: ease.luxe }}
                onMouseEnter={cancelClose}
              >
                <MegaMenuPanel item={activeItem} onNavigate={closeMenu} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Velo detrás del mega menú */}
        <AnimatePresence>
          {activeItem ? (
            <motion.div
              key="veil"
              aria-hidden
              className="fixed inset-0 -z-10 hidden bg-ink/30 lg:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={closeMenu}
            />
          ) : null}
        </AnimatePresence>
      </motion.header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <MobileTabBar onSearch={() => setSearchOpen(true)} />
    </>
  );
}

function NavUnderline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-x-0 bottom-0 h-px origin-left bg-current transition-transform duration-500 ease-luxe group-hover/nav:scale-x-100",
        active ? "scale-x-100" : "scale-x-0",
      )}
    />
  );
}

function HeaderIcon({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-11 items-center justify-center rounded-full transition-[transform,opacity] duration-300 ease-luxe hover:opacity-70 active:scale-90",
        className,
      )}
    >
      {children}
    </button>
  );
}
