"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import {
  FaArrowRight,
  FaBagShopping,
  FaBars,
  FaBoxesStacked,
  FaChevronDown,
  FaHeadset,
  FaHeart,
  FaLayerGroup,
  FaLocationDot,
  FaMagnifyingGlass,
  FaPercent,
  FaTag,
  FaTruckFast,
  FaUser,
  FaXmark,
} from "react-icons/fa6";
import { Logo } from "@/components/brand/logo";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { useCart } from "@/components/cart/cart-provider";
import { useEscapeKey, useLockBodyScroll } from "@/hooks/use-overlay";
import { cn } from "@/lib/utils";
import type { PublicPromotionItem } from "@/lib/promo-display";
import { DRAWER_CATEGORIES } from "./header-categories";
import { SearchOverlay } from "./search-overlay";
import { MobileMenu } from "./mobile-menu";
import { MobileTabBar } from "./mobile-tab-bar";

interface SiteHeaderProps {
  promotions?: PublicPromotionItem[];
}

export function SiteHeader({ promotions = [] }: SiteHeaderProps) {
  const [drawerCategoryId, setDrawerCategoryId] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerHidden, setHeaderHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollYRef = useRef(0);
  const pathname = usePathname();
  const router = useRouter();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 30,
    restDelta: 0.001,
  });

  const isSideDrawerOpen = drawerCategoryId !== null;

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const currentY = Math.max(0, window.scrollY);
        const delta = currentY - lastScrollYRef.current;

        setIsScrolled(currentY > 24);

        if (isSideDrawerOpen || searchOpen || mobileOpen || currentY < 80) {
          setHeaderHidden(false);
        } else if (delta > 8 && currentY > 120) {
          setHeaderHidden(true);
        } else if (delta < -6) {
          setHeaderHidden(false);
        }

        lastScrollYRef.current = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSideDrawerOpen, searchOpen, mobileOpen]);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setHeaderHidden(false);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [pathname]);

  const isAuthOrAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/iniciar-sesion") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/mayorista/registro") ||
    pathname.startsWith("/recuperar-contrasena") ||
    pathname.startsWith("/restablecer-contrasena") ||
    pathname.startsWith("/verificar-correo");

  const { count: favoritesCount, snapshot: favSnapshot } = useFavorites();
  const { cart, openDrawer } = useCart();
  const favoritesHref = favSnapshot.isAuthenticated ? "/cuenta/favoritos" : "/favoritos";

  useLockBodyScroll(isSideDrawerOpen);
  useEscapeKey(isSideDrawerOpen, () => setDrawerCategoryId(null));

  const activeCategoryConfig =
    DRAWER_CATEGORIES.find((c) => c.id === drawerCategoryId) ?? DRAWER_CATEGORIES[0];

  const handleOpenCategoryDrawer = (id: string) => {
    const found = DRAWER_CATEGORIES.find((c) => c.id === id);
    if (found) {
      const initialOpen: Record<string, boolean> = {};
      found.groups.forEach((g) => {
        initialOpen[g.id] = true;
      });
      setOpenAccordions(initialOpen);
    }
    setDrawerCategoryId(id);
  };

  const toggleAccordion = (groupId: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [groupId]: !(prev[groupId] ?? true),
    }));
  };

  // Promoción activa para el Cintillo Superior (configurada desde /admin/promociones)
  const topBarPromos = promotions.filter((p) => p.showInTopBar);
  const activeTopPromo = topBarPromos[0] ?? null;
  const rawTopBaseHref = activeTopPromo?.ctaHref || "/catalogo";
  const topPromoHref = activeTopPromo
    ? rawTopBaseHref.includes("oferta=")
      ? rawTopBaseHref
      : `${rawTopBaseHref}${rawTopBaseHref.includes("?") ? "&" : "?"}oferta=${activeTopPromo.discountPercent}`
    : "/catalogo";

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/buscar?q=${encodeURIComponent(q)}`);
    } else {
      setSearchOpen(true);
    }
  };

  if (isAuthOrAdmin) {
    return null;
  }

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          y: headerHidden ? "-108%" : "0%",
          opacity: headerHidden ? 0.92 : 1,
        }}
        transition={{
          duration: 0.34,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 will-change-transform transition-shadow duration-300",
          isScrolled
            ? "shadow-[0_18px_42px_-12px_rgba(15,10,12,0.58)]"
            : "shadow-[0_12px_32px_-10px_rgba(15,10,12,0.42)]",
        )}
      >
        {/* FILA 1: Cintillo Promocional Superior en Negro Carbón / Obsidiana Ejecutivo y Serio */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#090C12] via-[#131924] to-[#090C12] text-slate-100 border-b border-white/12">
          {/* Brillo satinado platino muy sutil */}
          <div
            aria-hidden
            className="animate-silk-ribbon pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07)_0%,transparent_70%)]"
          />
          <div className="shell relative z-10 flex min-h-7 items-center justify-center py-1 text-center sm:h-8 sm:py-0.5">
            {activeTopPromo ? (
              <Link
                href={topPromoHref}
                className="flex min-w-0 max-w-full items-center justify-center gap-1.5 text-[0.53rem] font-semibold leading-[1.15] tracking-wide text-slate-100 hover:text-white sm:gap-2.5 sm:text-xs"
              >
                <FaTag className="size-2.5 shrink-0 text-[#C81E2B] sm:size-3" aria-hidden />
                <span className="line-clamp-2 text-left sm:truncate sm:whitespace-nowrap sm:text-center">
                  {activeTopPromo.cleanDescription}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-white/25 bg-[#6E0D16] px-2 py-0.5 font-mono text-[0.5rem] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#85111C] sm:px-2.5 sm:text-[0.6rem]">
                  <FaPercent className="size-2 text-slate-200 sm:size-2.5" aria-hidden />
                  <span className="sm:hidden">-{activeTopPromo.discountPercent}% VER</span>
                  <span className="hidden sm:inline">OFERTA -{activeTopPromo.discountPercent}% · VER PRENDAS</span>
                </span>
              </Link>
            ) : (
              <Link
                href="/catalogo"
                className="flex min-w-0 max-w-full items-center justify-center gap-1.5 text-[0.53rem] font-semibold leading-[1.15] tracking-wide text-slate-100 hover:underline sm:gap-2 sm:text-xs"
              >
                <FaTag className="size-2.5 shrink-0 text-[#C81E2B] sm:size-3" aria-hidden />
                <span className="line-clamp-2 text-center sm:truncate sm:whitespace-nowrap">
                  AMERICAN COLT JEANS™ · Confección Peruana · Envíos a todo el Perú
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* FILA 2: Barra Principal en Rojo Granate / Vino Oscuro Corporativo y Serio */}
        <div className="relative z-20 bg-gradient-to-r from-[#45060B] via-[#680C14] to-[#42050A] text-white border-b border-black/30">
          {/* CAPAS DE OLAS DE TELA SUTILES EN TONOS VINO PROFUNDO (sin aclarar el header) */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Ola 1: Vino profundo oscuro */}
            <svg
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              className="animate-silk-wave absolute -left-[10%] top-0 h-full w-[145%] opacity-75"
            >
              <defs>
                <linearGradient id="coltSilkDeep" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#320408" />
                  <stop offset="45%" stopColor="#5C0A12" />
                  <stop offset="100%" stopColor="#3A0509" />
                </linearGradient>
              </defs>
              <path
                fill="url(#coltSilkDeep)"
                d="M0,25 C280,105 520,-25 840,55 C1120,120 1290,10 1440,60 L1440,120 L0,120 Z"
              />
            </svg>

            {/* Ola 2: Granate intermedio sobrio */}
            <svg
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              className="animate-silk-wave-reverse absolute -left-[15%] top-0 h-full w-[150%] opacity-65"
            >
              <defs>
                <linearGradient id="coltSilkVivid" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4D080E" />
                  <stop offset="50%" stopColor="#750E18" />
                  <stop offset="100%" stopColor="#42060B" />
                </linearGradient>
              </defs>
              <path
                fill="url(#coltSilkVivid)"
                d="M0,75 C320,-15 640,115 980,25 C1210,-25 1350,85 1440,40 L1440,120 L0,120 Z"
              />
            </svg>

            {/* Ola 3: Reflejo satinado discreto */}
            <svg
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              className="animate-silk-ribbon absolute -left-[8%] top-0 h-full w-[135%] opacity-35"
            >
              <defs>
                <linearGradient id="coltSilkLight" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#3A0509" stopOpacity="0" />
                  <stop offset="40%" stopColor="#8C1420" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#991824" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3A0509" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                fill="url(#coltSilkLight)"
                d="M0,45 C360,115 700,-20 1080,65 C1260,105 1360,25 1440,50 L1440,0 L0,0 Z"
              />
            </svg>
          </div>

          <div className="shell relative z-10 flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-3 lg:h-[4.5rem] lg:gap-6">
            {/* Izquierda: Menú móvil + Logo Oficial con Marco 3D (Rectángulo -> Rombo en hover) */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full text-white hover:bg-white/15 sm:size-10 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
                aria-expanded={mobileOpen}
              >
                <FaBars className="size-4" aria-hidden />
              </button>

              <Link
                href="/"
                aria-label="American Colt JEANS — Inicio"
                className="flex items-center focus-visible:outline-none"
              >
                <span className="sm:hidden">
                  <Logo size="sm" />
                </span>
                <span className="hidden sm:inline-flex">
                  <Logo size="md" />
                </span>
              </Link>
            </div>

            {/* Centro: Buscador ancho en forma de píldora blanca con botón en Granate Oscuro */}
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="hidden md:flex flex-1 min-w-0 max-w-xl items-center"
            >
              <div className="relative flex w-full items-center overflow-hidden rounded-full border border-white/85 bg-white shadow-[0_8px_24px_rgba(15,5,8,0.42)] transition-all focus-within:border-white focus-within:ring-2 focus-within:ring-white/35">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="¿Qué prenda buscas? (Ej: King 767, Camisa Zair, Comfort 762, Polo Mark)"
                  aria-label="¿Qué producto estás buscando?"
                  className="h-10 w-full bg-transparent pl-5 pr-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none lg:h-11 lg:text-sm"
                />
                <button
                  type="submit"
                  aria-label="Buscar productos"
                  className="mr-1 flex h-9 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#4A070D] via-[#6E0D16] to-[#54080F] text-white shadow-sm transition-all duration-300 hover:scale-105 hover:from-[#0F172A] hover:to-[#1E293B] lg:w-16"
                >
                  <FaMagnifyingGlass className="size-3.5" aria-hidden />
                </button>
              </div>
            </form>

            {/* Derecha: Seguir Pedido + Nuestras Tiendas + Favoritos + Cuenta + Bolsa de Compras */}
            <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
              <Link
                href="/seguir-pedido"
                data-testid="header-track-order-link"
                className="hidden lg:flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-left text-white backdrop-blur-xs transition-all hover:border-white/45 hover:bg-black/35 xl:px-3.5"
              >
                <FaTruckFast className="size-4 shrink-0 text-slate-200" aria-hidden />
                <span className="flex flex-col leading-tight">
                  <span className="text-[0.58rem] font-medium text-white/80">Rastreo en Vivo</span>
                  <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-extrabold text-white">
                    Seguir Pedido
                  </span>
                </span>
              </Link>

              <Link
                href="/tiendas"
                className="hidden lg:flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-left text-white backdrop-blur-xs transition-all hover:border-white/45 hover:bg-black/35 xl:px-3.5"
              >
                <FaLocationDot className="size-4 shrink-0 text-slate-200" aria-hidden />
                <span className="flex flex-col leading-tight">
                  <span className="text-[0.58rem] font-medium text-white/80">Nuestras Tiendas</span>
                  <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-extrabold text-white">
                    Recojo y Mapa
                  </span>
                </span>
              </Link>

              <Link
                href="/seguir-pedido"
                aria-label="Seguir mi pedido"
                title="Seguir mi pedido"
                className="flex lg:hidden size-9 items-center justify-center rounded-full text-slate-100 transition-colors hover:bg-white/15"
              >
                <FaTruckFast className="size-4" aria-hidden />
              </Link>

              <button
                type="button"
                aria-label="Buscar"
                title="Buscar"
                onClick={() => setSearchOpen(true)}
                className="flex md:hidden size-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
              >
                <FaMagnifyingGlass className="size-4" aria-hidden />
              </button>

              <Link
                href={favoritesHref}
                data-testid="header-favorites-link"
                aria-label={`Favoritos, ${favoritesCount} ${favoritesCount === 1 ? "prenda" : "prendas"}`}
                title={`Favoritos (${favoritesCount})`}
                className="flex size-9 sm:size-11 items-center justify-center rounded-full text-white transition-transform duration-200 hover:bg-white/15 active:scale-95"
              >
                <span className="relative">
                  <FaHeart
                    className={cn("size-4 sm:size-5", favoritesCount > 0 && "text-rose-200")}
                    aria-hidden
                  />
                  <span
                    data-testid="header-favorites-count"
                    className="absolute -right-2 -top-1.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-white px-1 font-mono text-[0.6rem] font-black text-[#5A0A12] tabular-nums shadow-xs"
                  >
                    {favoritesCount}
                  </span>
                </span>
              </Link>

              <Link
                href="/cuenta"
                aria-label="Mi cuenta"
                title="Mi cuenta"
                className="flex size-9 sm:size-11 items-center justify-center rounded-full text-white transition-transform duration-200 hover:bg-white/15 active:scale-95"
              >
                <FaUser className="size-4 sm:size-5" aria-hidden />
              </Link>

              <button
                type="button"
                aria-label={`Bolsa de compras, ${cart.totalUnits} ${cart.totalUnits === 1 ? "producto" : "productos"}`}
                title="Bolsa de compras"
                onClick={openDrawer}
                className="hidden lg:flex size-11 items-center justify-center rounded-full text-white transition-transform duration-200 hover:bg-white/15 active:scale-95"
              >
                <span className="relative">
                  <FaBagShopping className="size-4 sm:size-5" aria-hidden />
                  <span
                    data-testid="header-cart-count"
                    className="absolute -right-2 -top-1.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-white px-1 font-mono text-[0.6rem] font-black text-[#5A0A12] tabular-nums shadow-xs"
                  >
                    {cart.totalUnits}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* FILA 3: Sub-barra Blanca Ejecutiva con Botones Sobrios en Granate Oscuro y Carbón */}
        <div className="relative z-10 hidden border-b border-slate-200/90 bg-white/95 backdrop-blur-md text-slate-900 lg:block">
          <nav
            aria-label="Categorías principales"
            className="shell flex h-12 items-center justify-between gap-4"
          >
            <Link
              href="/atencion-al-cliente"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-wider text-[#680C14] transition-all duration-300 hover:border-transparent hover:bg-[#5A0A12] hover:text-white hover:shadow-sm"
            >
              <span className="leading-tight">
                ATENCIÓN
                <br />
                AL CLIENTE
              </span>
              <FaHeadset className="size-4" aria-hidden />
            </Link>

            {/* Al hacer CLICK en cualquiera de estas opciones se despliega del costado el panel profesional con fondo nublado */}
            <ul className="flex items-center gap-1.5 xl:gap-2.5">
              {DRAWER_CATEGORIES.map((item) => {
                const isSelected = drawerCategoryId === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryDrawer(item.id)}
                      aria-expanded={isSelected}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.8rem] font-extrabold tracking-wide transition-all duration-200",
                        isSelected
                          ? "bg-[#5A0A12] text-white shadow-md shadow-black/20 scale-105"
                          : item.highlight
                            ? "border border-slate-200 bg-slate-50 text-[#680C14] hover:border-transparent hover:bg-[#5A0A12] hover:text-white hover:shadow-sm"
                            : "text-slate-800 hover:bg-slate-100 hover:text-[#680C14]",
                      )}
                    >
                      <span>{item.label}</span>
                      <FaChevronDown
                        className={cn(
                          "size-3 opacity-70 transition-transform duration-200",
                          isSelected && "-rotate-90 opacity-100",
                        )}
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Botones Derecha con Tonos Corporativos Serios (Granate Vino y Negro Carbón) */}
            <div className="flex items-center gap-2">
              <Link
                href="/mayorista/cotizaciones"
                className="inline-flex items-center gap-2 rounded-full bg-[#5A0A12] px-4 py-1.5 text-xs font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-[#750E18] hover:shadow-md"
              >
                <FaBoxesStacked className="size-3.5" aria-hidden />
                <span>Mayorista B2B</span>
              </Link>
              <Link
                href="/catalogo?novedades=1&oferta=50"
                className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-4 py-1.5 text-xs font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-[#1E293B] hover:shadow-md"
              >
                <FaPercent className="size-3" aria-hidden />
                <span>Liquidación 3x2</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Barra de progreso de lectura / scroll sobria en la base del header */}
        <motion.div
          aria-hidden
          style={{ scaleX }}
          className="h-[2.5px] w-full origin-left bg-gradient-to-r from-[#0F172A] via-[#680C14] to-[#0F172A]"
        />
      </motion.header>

      {/* Cápsula flotante sutil cuando el header se oculta al bajar, para reabrir menú con un clic */}
      <AnimatePresence>
        {headerHidden && !isSideDrawerOpen && !searchOpen && !mobileOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setHeaderHidden(false)}
            aria-label="Mostrar barra de navegación"
            className="fixed left-1/2 top-2.5 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/25 bg-[#121722]/95 px-4 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_10px_28px_-6px_rgba(9,12,18,0.65)] backdrop-blur-md transition hover:bg-[#5A0A12]"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-[#C81E2B]" />
            <span>Menú · American Colt</span>
            <FaChevronDown className="size-2.5 opacity-90" aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>

      {/* PANEL LATERAL DESPLEGABLE AL HACER CLICK (Con fondo nublado que al hacer click vuelve a la página) */}
      <AnimatePresence>
        {isSideDrawerOpen && (
          <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Menú de ${activeCategoryConfig.label}`}>
            {/* Fondo Nublado (Backdrop Blur): Al dar click aquí se cierra y vuelve a la página */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerCategoryId(null)}
              className="fixed inset-0 cursor-pointer bg-slate-950/50 backdrop-blur-md"
              aria-label="Cerrar menú lateral y volver a la página"
            />

            {/* Panel Lateral Izquierdo con Esquinas Redondeadas y Diseño Moderno */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-10 flex w-full max-w-md flex-col overflow-hidden rounded-r-3xl border-r border-white/25 bg-white shadow-[25px_0_60px_-15px_rgba(15,10,12,0.5)]"
            >
              {/* Cabecera del Drawer en Granate Oscuro Corporativo */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#45060B] via-[#680C14] to-[#42050A] px-6 py-4 text-white border-b border-black/25">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Logo size="sm" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#C8101E] shadow-md">
                      <FaLayerGroup className="size-3 text-[#DC2626]" aria-hidden />
                      <span>{activeCategoryConfig.label}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerCategoryId(null)}
                    aria-label="Cerrar panel"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white transition-transform hover:scale-110 hover:bg-white hover:text-[#C8101E]"
                  >
                    <FaXmark className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              {/* Contenido Desplegable del Panel Lateral */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-red-50/60 px-4 py-3 border border-red-100">
                  <div>
                    <span className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-[#C8101E]">
                      EXPLORANDO SECCIÓN
                    </span>
                    <h2 className="font-sans text-xl font-black uppercase tracking-tight text-slate-900">
                      {activeCategoryConfig.label}
                    </h2>
                    <p className="text-xs text-slate-600">{activeCategoryConfig.subtitle}</p>
                  </div>
                  <Link
                    href={activeCategoryConfig.allHref}
                    onClick={() => setDrawerCategoryId(null)}
                    className="bg-flow inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-3.5 py-2 text-[0.7rem] font-extrabold uppercase tracking-wider text-white shadow-sm transition-transform hover:scale-105"
                  >
                    <span>Ver Todo</span>
                    <FaArrowRight className="size-3" aria-hidden />
                  </Link>
                </div>

                {/* Acordeones Desplegables con las Sub-opciones */}
                <div className="space-y-3">
                  {activeCategoryConfig.groups.map((group) => {
                    const isOpen = openAccordions[group.id] ?? true;
                    return (
                      <div
                        key={group.id}
                        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:border-red-300"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAccordion(group.id)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between bg-slate-50/80 px-4 py-3.5 text-left transition-colors hover:bg-red-50/50"
                        >
                          <div className="flex items-center gap-2">
                            <FaLayerGroup className="size-3.5 text-[#DC2626]" aria-hidden />
                            <span className="font-sans text-xs font-black uppercase tracking-wide text-slate-900 sm:text-sm">
                              {group.title}
                            </span>
                            {group.badge && (
                              <span className="rounded-full bg-gradient-to-r from-[#B91C1C] to-[#DC2626] px-2 py-0.5 font-mono text-[0.58rem] font-extrabold uppercase text-white">
                                {group.badge}
                              </span>
                            )}
                          </div>
                          <FaChevronDown
                            className={cn(
                              "size-3.5 text-slate-500 transition-transform duration-200",
                              isOpen && "rotate-180 text-[#DC2626]",
                            )}
                            aria-hidden
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              className="divide-y divide-slate-100 px-3 py-1"
                            >
                              {group.items.map((subItem) => (
                                <li key={subItem.label}>
                                  <Link
                                    href={subItem.href}
                                    onClick={() => setDrawerCategoryId(null)}
                                    className="group/link flex items-center justify-between rounded-xl px-2.5 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-red-50/80 hover:pl-4 hover:text-[#C8101E] sm:text-sm"
                                  >
                                    <span>{subItem.label}</span>
                                    <div className="flex items-center gap-2">
                                      {subItem.tag && (
                                        <span className="rounded-full bg-red-50 px-2 py-0.5 font-mono text-[0.58rem] font-extrabold uppercase text-[#C8101E]">
                                          {subItem.tag}
                                        </span>
                                      )}
                                      <FaArrowRight
                                        className="size-3 text-slate-400 transition-transform group-hover/link:translate-x-1 group-hover/link:text-[#C8101E]"
                                        aria-hidden
                                      />
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* Tarjeta Visual de Campaña dentro del Drawer */}
                <Link
                  href={activeCategoryConfig.banner.href}
                  onClick={() => setDrawerCategoryId(null)}
                  className="group relative block overflow-hidden rounded-2xl border border-red-200 bg-[#991B1B] p-5 text-white shadow-lg"
                >
                  <Image
                    src={activeCategoryConfig.banner.image.src}
                    alt={activeCategoryConfig.banner.title}
                    fill
                    sizes="380px"
                    placeholder={
                      typeof activeCategoryConfig.banner.image.src === "string" ? "empty" : "blur"
                    }
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-r from-[#991B1B]/90 via-[#DC2626]/70 to-transparent"
                  />
                  <div className="relative z-10 max-w-[85%]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 font-mono text-[0.58rem] font-extrabold uppercase text-[#C8101E]">
                      <FaTag className="size-2.5" aria-hidden />
                      {activeCategoryConfig.banner.tag}
                    </span>
                    <p className="mt-2 font-sans text-base font-black uppercase leading-tight">
                      {activeCategoryConfig.banner.title}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-[0.68rem] font-extrabold uppercase text-[#C8101E]">
                      <span>Entrar a la Oferta</span>
                      <FaArrowRight className="size-3" aria-hidden />
                    </span>
                  </div>
                </Link>
              </div>

              {/* Pie del Drawer */}
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                <Link
                  href={activeCategoryConfig.allHref}
                  onClick={() => setDrawerCategoryId(null)}
                  className="bg-flow flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] text-xs font-extrabold uppercase tracking-widest text-white shadow-md transition-transform hover:scale-[1.02]"
                >
                  <span>Entrar a {activeCategoryConfig.label} Completo</span>
                  <FaArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <MobileTabBar />
    </>
  );
}
