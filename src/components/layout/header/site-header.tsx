"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
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
  FaUser,
  FaXmark,
} from "react-icons/fa6";
import type { ImageAsset } from "@/types/catalog";
import { Logo } from "@/components/brand/logo";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { useCart } from "@/components/cart/cart-provider";
import { useEscapeKey, useLockBodyScroll } from "@/hooks/use-overlay";
import { cn } from "@/lib/utils";
import type { PublicPromotionItem } from "@/lib/promo-display";
import { SearchOverlay } from "./search-overlay";
import { MobileMenu } from "./mobile-menu";
import { MobileTabBar } from "./mobile-tab-bar";

interface SiteHeaderProps {
  promotions?: PublicPromotionItem[];
}

interface DrawerSubGroup {
  id: string;
  title: string;
  badge?: string;
  items: readonly { label: string; href: string; tag?: string }[];
}

interface DrawerCategoryConfig {
  id: string;
  label: string;
  subtitle: string;
  allHref: string;
  highlight?: boolean;
  banner: {
    tag: string;
    title: string;
    href: string;
    image: ImageAsset;
  };
  groups: readonly DrawerSubGroup[];
}

const DRAWER_CATEGORIES: readonly DrawerCategoryConfig[] = [
  {
    id: "hombre",
    label: "Catálogo Hombre",
    subtitle: "Los 11 modelos oficiales American Colt JEANS™ 2026",
    allHref: "/catalogo?audiencia=hombre",
    banner: {
      tag: "CATÁLOGO OFICIAL 2026",
      title: "Toda la Colección Masculina por Unidad y Mayor",
      href: "/catalogo?audiencia=hombre",
      image: {
        src: "/catalogo-colt/16-portada-jeans-2026.png",
        alt: "Catálogo Hombre American Colt JEANS 2026",
      },
    },
    groups: [
      {
        id: "h-drill",
        title: "Línea Drill Premium (Pantalones y Bermudas)",
        badge: "Stretch",
        items: [
          { label: "Pantalón Drill King 767 — Skinny Fit", href: "/producto/pantalon-drill-king-767", tag: "S/ 140" },
          { label: "Pantalón Drill Fendy 769 — Slim Fit", href: "/producto/pantalon-drill-fendy-769", tag: "S/ 130" },
          { label: "Pantalón Drill Rolex 770 — Straight Fit", href: "/producto/pantalon-drill-rolex-770", tag: "S/ 130" },
          { label: "Bermuda Drill Balance 770 — Straight Fit", href: "/producto/bermuda-drill-balance-770", tag: "S/ 120" },
          { label: "Ver toda la Línea Drill", href: "/catalogo/pantalones?audiencia=hombre" },
        ],
      },
      {
        id: "h-jeans",
        title: "Línea Clásica Jeans Denim",
        badge: "Tallas 28-46",
        items: [
          { label: "Jean Denim Comfort 762 — Classic Fit", href: "/producto/jean-denim-comfort-762", tag: "S/ 130" },
          { label: "Jean Denim Relaxed 750 — Classic Fit", href: "/producto/jean-denim-relaxed-750", tag: "S/ 120" },
          { label: "Jean Clásico Parker 769 — Slim Fit", href: "/producto/jean-clasico-parker-769", tag: "S/ 130" },
          { label: "Jean Bull Denim 750 — Classic Fit", href: "/producto/jean-bull-denim-750", tag: "S/ 120" },
          { label: "Ver todos los Jeans Denim", href: "/catalogo/denim?audiencia=hombre" },
        ],
      },
      {
        id: "h-camisas-polos",
        title: "Camisas y Polos de Algodón Peruano",
        badge: "S a XXL",
        items: [
          { label: "Camisa Denim Zair — Slim Fit", href: "/producto/camisa-denim-zair-slim-fit", tag: "S/ 130" },
          { label: "Camisa Clásica Kendall — Slim Fit", href: "/producto/camisa-clasica-kendall-slim-fit", tag: "S/ 125" },
          { label: "Polo Piqué Clásico Mark — Classic Fit", href: "/producto/polo-pique-clasico-mark", tag: "S/ 89" },
        ],
      },
    ],
  },
  {
    id: "jeans",
    label: "Jeans Denim",
    subtitle: "Relaxed 750, Comfort 762, Parker 769 y Bull Denim 750",
    allHref: "/catalogo/denim?audiencia=hombre",
    banner: {
      tag: "LÍNEA CLÁSICA DENIM",
      title: "Jeans de Alta Resistencia desde la Talla 28 hasta la 46",
      href: "/catalogo/denim?audiencia=hombre",
      image: {
        src: "/catalogo-colt/15-linea-clasica.png",
        alt: "Jeans Denim American Colt",
      },
    },
    groups: [
      {
        id: "j-modelos",
        title: "Modelos Oficiales de Jeans",
        badge: "Denim",
        items: [
          { label: "Jean Denim Relaxed 750 — Tela Rígida Classic Fit", href: "/producto/jean-denim-relaxed-750", tag: "7 Colores" },
          { label: "Jean Denim Comfort 762 — Tela Stretch Classic Fit", href: "/producto/jean-denim-comfort-762", tag: "6 Colores" },
          { label: "Jean Clásico Parker 769 — Tela Stretch Slim Fit", href: "/producto/jean-clasico-parker-769", tag: "8 Colores" },
          { label: "Jean Bull Denim 750 — Tela Rígida Classic Fit", href: "/producto/jean-bull-denim-750", tag: "7 Colores" },
          { label: "Ver toda la categoría Jeans Denim", href: "/catalogo/denim?audiencia=hombre" },
        ],
      },
    ],
  },
  {
    id: "pantalones",
    label: "Pantalones Drill",
    subtitle: "King 767, Fendy 769, Rolex 770 y Bermuda Balance 770",
    allHref: "/catalogo/pantalones?audiencia=hombre",
    banner: {
      tag: "LÍNEA DRILL PREMIUM",
      title: "Entalle Pitillo, Semipitillo y Bota Recta en Tela Stretch",
      href: "/catalogo/pantalones?audiencia=hombre",
      image: {
        src: "/catalogo-colt/08-linea-drill-premium.png",
        alt: "Pantalones Drill American Colt",
      },
    },
    groups: [
      {
        id: "dr-modelos",
        title: "Pantalones y Bermudas Drill",
        badge: "Drill Stretch",
        items: [
          { label: "Pantalón Drill King 767 — Skinny Fit (Entalle Pitillo)", href: "/producto/pantalon-drill-king-767", tag: "7 Colores" },
          { label: "Pantalón Drill Fendy 769 — Slim Fit (Semipitillo)", href: "/producto/pantalon-drill-fendy-769", tag: "9 Colores" },
          { label: "Pantalón Drill Rolex 770 — Straight Fit (Bota Recta)", href: "/producto/pantalon-drill-rolex-770", tag: "6 Colores" },
          { label: "Bermuda Drill Balance 770 — Straight Fit", href: "/producto/bermuda-drill-balance-770", tag: "6 Colores" },
          { label: "Ver todos los Pantalones y Bermudas Drill", href: "/catalogo/pantalones?audiencia=hombre" },
        ],
      },
    ],
  },
  {
    id: "camisas",
    label: "Camisas",
    subtitle: "Camisa Denim Zair & Camisa Clásica Kendall",
    allHref: "/catalogo/camisas?audiencia=hombre",
    banner: {
      tag: "CAMISAS SLIM FIT",
      title: "Confección en Algodón Peruano y Acabados de Primera",
      href: "/catalogo/camisas?audiencia=hombre",
      image: {
        src: "/catalogo-colt/camisa-zair-model.png",
        alt: "Camisas American Colt",
      },
    },
    groups: [
      {
        id: "cam-modelos",
        title: "Modelos de Camisas Hombre",
        badge: "Slim Fit",
        items: [
          { label: "Camisa Denim Zair — Slim Fit (Sky, Blackie, Stone)", href: "/producto/camisa-denim-zair-slim-fit", tag: "100% Algodón" },
          { label: "Camisa Clásica Kendall — Slim Fit (8 Colores)", href: "/producto/camisa-clasica-kendall-slim-fit", tag: "Algodón + Elastano" },
          { label: "Ver todas las Camisas", href: "/catalogo/camisas?audiencia=hombre" },
        ],
      },
    ],
  },
  {
    id: "polos",
    label: "Polos Piqué",
    subtitle: "Polo Clásico Mark en 100% Algodón Peruano",
    allHref: "/catalogo/polos?audiencia=hombre",
    banner: {
      tag: "ALGODÓN PERUANO",
      title: "Polo Piqué Clásico Mark con Cuello Camisero en 10 Colores",
      href: "/catalogo/polos?audiencia=hombre",
      image: {
        src: "/catalogo-colt/01-estudio-azul.png",
        alt: "Polo Mark American Colt",
      },
    },
    groups: [
      {
        id: "p-lineas",
        title: "Polos Clásicos Hombre",
        badge: "10 Colores",
        items: [
          { label: "Polo Piqué Clásico Mark — Classic Fit (Tallas S a XXL)", href: "/producto/polo-pique-clasico-mark", tag: "S/ 89.00" },
          { label: "Ver categoría Polos", href: "/catalogo/polos?audiencia=hombre" },
        ],
      },
    ],
  },
  {
    id: "mayorista",
    label: "Venta por Mayor",
    subtitle: "Canal Corporativo B2B y Distribuidores",
    allHref: "/mayorista",
    banner: {
      tag: "PRECIOS DE FÁBRICA",
      title: "Abastece tu Tienda o Boutique desde 12 Unidades",
      href: "/mayorista/cotizaciones",
      image: {
        src: "/catalogo-colt/02-campana-bolsas.png",
        alt: "Ventas por Mayor American Colt",
      },
    },
    groups: [
      {
        id: "may-opciones",
        title: "Opciones de Compra por Mayor B2B",
        badge: "Empresas",
        items: [
          { label: "Información y Escalas Mayoristas", href: "/mayorista", tag: "Beneficios" },
          { label: "Armar Cotización por Volumen", href: "/mayorista/cotizaciones", tag: "Cotizador" },
          { label: "Registrar mi Empresa (RUC 20 / 10)", href: "/mayorista/registro", tag: "Gratis" },
          { label: "Ver Catálogo con Tarifas por Mayor", href: "/catalogo?mayorista=1" },
        ],
      },
    ],
  },
  {
    id: "sale",
    label: "Ofertas 3x2 / -50%",
    subtitle: "Prendas del Catálogo con Descuento Activo",
    allHref: "/catalogo?novedades=1&oferta=50",
    highlight: true,
    banner: {
      tag: "PROMOCIÓN ACTIVA",
      title: "Promoción 3x2 y hasta 50% de Descuento en el Catálogo",
      href: "/catalogo?novedades=1&oferta=50",
      image: {
        src: "/catalogo-colt/16-portada-jeans-2026.png",
        alt: "Ofertas American Colt",
      },
    },
    groups: [
      {
        id: "sale-opciones",
        title: "Ver Productos con Descuento",
        badge: "Oferta",
        items: [
          { label: "Todas las Prendas en Oferta (3x2 / -50%)", href: "/catalogo?novedades=1&oferta=50", tag: "-50% OFF" },
          { label: "Ofertas en Jeans Denim", href: "/catalogo/denim?oferta=50", tag: "Denim" },
          { label: "Ofertas en Pantalones y Bermudas Drill", href: "/catalogo/pantalones?oferta=50", tag: "Drill" },
          { label: "Ofertas en Camisas y Polos", href: "/catalogo/camisas?oferta=50" },
        ],
      },
    ],
  },
];

export function SiteHeader({ promotions = [] }: SiteHeaderProps) {
  const [drawerCategoryId, setDrawerCategoryId] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

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

  const isSideDrawerOpen = drawerCategoryId !== null;
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
  const activeTopPromo = topBarPromos[0] ?? promotions[0] ?? null;
  const topPromoHref = activeTopPromo
    ? `${activeTopPromo.ctaHref || "/catalogo"}${
        (activeTopPromo.ctaHref || "/catalogo").includes("?") ? "&" : "?"
      }oferta=${activeTopPromo.discountPercent}`
    : "/catalogo?novedades=1&oferta=50";

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
      <header className="fixed inset-x-0 top-0 z-50 shadow-md">
        {/* FILA 1: Cintillo Promocional Superior en Azul Eléctrico Reluciente con Icono Font Awesome */}
        <div className="bg-gradient-to-r from-[#0055FF] via-[#0077FF] to-[#0055FF] text-white border-b border-white/20">
          <div className="shell flex min-h-8 items-center justify-center py-1 text-center">
            {activeTopPromo ? (
              <Link
                href={topPromoHref}
                className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[0.68rem] font-extrabold tracking-wide text-white hover:underline sm:text-xs"
              >
                <FaTag className="size-3 shrink-0 text-white" aria-hidden />
                <span>{activeTopPromo.cleanDescription}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EF233C] px-2.5 py-0.5 font-mono text-[0.6rem] font-black uppercase tracking-wider text-white shadow-xs">
                  <FaPercent className="size-2.5" aria-hidden />
                  <span>OFERTA -{activeTopPromo.discountPercent}% · VER PRENDAS</span>
                </span>
              </Link>
            ) : (
              <Link
                href="/catalogo?novedades=1&oferta=50"
                className="inline-flex flex-wrap items-center justify-center gap-x-2 text-[0.68rem] font-extrabold tracking-wide text-white hover:underline sm:text-xs"
              >
                <FaTag className="size-3 shrink-0 text-white" aria-hidden />
                <span>
                  GRAN PROMOCIÓN 3x2 Y HASTA 50% DE DESCUENTO · Delivery Gratis en Lima por compras mayores a S/ 199.00
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* FILA 2: Barra Principal Roja Oficial Reluciente American Colt JEANS™ */}
        <div className="bg-gradient-to-r from-[#91151B] via-[#B91C24] to-[#91151B] text-white">
          <div className="shell flex h-16 items-center justify-between gap-3 lg:h-[4.5rem] lg:gap-6">
            {/* Izquierda: Menú móvil + Logo Oficial */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full text-white hover:bg-white/15 lg:hidden"
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
                <Logo size="md" />
              </Link>
            </div>

            {/* Centro: Buscador ancho en forma de píldora blanca con botón Azul Eléctrico */}
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="hidden md:flex flex-1 max-w-2xl items-center"
            >
              <div className="relative flex w-full items-center overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-lg">
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
                  className="mr-1 flex h-9 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] text-white shadow-sm transition-transform hover:scale-105 lg:w-16"
                >
                  <FaMagnifyingGlass className="size-3.5" aria-hidden />
                </button>
              </div>
            </form>

            {/* Derecha: Mi Ubicación + Favoritos + Cuenta + Bolsa de Compras */}
            <div className="flex items-center justify-end gap-1 sm:gap-2.5 shrink-0">
              <Link
                href="/atencion-al-cliente#envios"
                className="hidden xl:flex items-center gap-2 rounded-full px-3 py-1.5 text-left text-white transition-colors hover:bg-white/15"
              >
                <FaLocationDot className="size-4 shrink-0 text-white" aria-hidden />
                <span className="flex flex-col leading-tight">
                  <span className="text-[0.62rem] font-semibold text-white/85">Mi Ubicación</span>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white">
                    Lima, Lima
                    <FaChevronDown className="size-2.5 opacity-80" aria-hidden />
                  </span>
                </span>
              </Link>

              <button
                type="button"
                aria-label="Buscar"
                title="Buscar"
                onClick={() => setSearchOpen(true)}
                className="flex md:hidden size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
              >
                <FaMagnifyingGlass className="size-4" aria-hidden />
              </button>

              <Link
                href={favoritesHref}
                data-testid="header-favorites-link"
                aria-label={`Favoritos, ${favoritesCount} ${favoritesCount === 1 ? "prenda" : "prendas"}`}
                title={`Favoritos (${favoritesCount})`}
                className="flex size-10 sm:size-11 items-center justify-center rounded-full text-white transition-transform duration-200 hover:bg-white/15 active:scale-95"
              >
                <span className="relative">
                  <FaHeart
                    className={cn("size-4 sm:size-5", favoritesCount > 0 && "text-amber-300")}
                    aria-hidden
                  />
                  <span
                    data-testid="header-favorites-count"
                    className="absolute -right-2 -top-1.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-[#0055FF] px-1 font-mono text-[0.6rem] font-black text-white tabular-nums shadow-xs"
                  >
                    {favoritesCount}
                  </span>
                </span>
              </Link>

              <Link
                href="/cuenta"
                aria-label="Mi cuenta"
                title="Mi cuenta"
                className="flex size-10 sm:size-11 items-center justify-center rounded-full text-white transition-transform duration-200 hover:bg-white/15 active:scale-95"
              >
                <FaUser className="size-4 sm:size-5" aria-hidden />
              </Link>

              <button
                type="button"
                aria-label={`Bolsa de compras, ${cart.totalUnits} ${cart.totalUnits === 1 ? "producto" : "productos"}`}
                title="Bolsa de compras"
                onClick={openDrawer}
                className="flex size-10 sm:size-11 items-center justify-center rounded-full text-white transition-transform duration-200 hover:bg-white/15 active:scale-95"
              >
                <span className="relative">
                  <FaBagShopping className="size-4 sm:size-5" aria-hidden />
                  <span
                    data-testid="header-cart-count"
                    className="absolute -right-2 -top-1.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-[#0055FF] px-1 font-mono text-[0.6rem] font-black text-white tabular-nums shadow-xs"
                  >
                    {cart.totalUnits}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* FILA 3: Sub-barra Blanca con Botones que al hacer CLICK despliegan el Panel Lateral Profesional */}
        <div className="relative hidden border-b border-blue-100 bg-white text-slate-900 lg:block">
          <nav
            aria-label="Categorías principales"
            className="shell flex h-12 items-center justify-between gap-4"
          >
            <Link
              href="/atencion-al-cliente"
              className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-wider text-[#0055FF] transition-all hover:bg-[#0055FF] hover:text-white"
            >
              <span className="leading-tight">
                ATENCIÓN
                <br />
                AL CLIENTE
              </span>
              <FaHeadset className="size-4" aria-hidden />
            </Link>

            {/* Al hacer CLICK en cualquiera de estas opciones se despliega del costado el panel profesional con fondo nublado */}
            <ul className="flex items-center gap-2 xl:gap-3">
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
                          ? "bg-[#0055FF] text-white shadow-md scale-105"
                          : item.highlight
                            ? "bg-red-50 text-[#B91C24] hover:bg-[#B91C24] hover:text-white"
                            : "text-slate-800 hover:bg-blue-50 hover:text-[#0055FF]",
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

            {/* Botones Derecha Relucientes con Iconos Font Awesome */}
            <div className="flex items-center gap-2">
              <Link
                href="/mayorista/cotizaciones"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#B91C24] to-[#EF233C] px-4 py-1.5 text-xs font-extrabold text-white shadow-sm transition-transform duration-200 hover:scale-105"
              >
                <FaBoxesStacked className="size-3.5" aria-hidden />
                <span>Mayorista B2B</span>
              </Link>
              <Link
                href="/catalogo?novedades=1&oferta=50"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] px-4 py-1.5 text-xs font-extrabold text-white shadow-sm transition-transform duration-200 hover:scale-105"
              >
                <FaPercent className="size-3" aria-hidden />
                <span>Liquidación 3x2</span>
              </Link>
            </div>
          </nav>
        </div>
      </header>

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

            {/* Panel Lateral Izquierdo con Esquinas Redondeadas y Diseño Reluciente */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-10 flex w-full max-w-md flex-col overflow-hidden rounded-r-3xl border-r-2 border-white/40 bg-white shadow-[25px_0_60px_-15px_rgba(0,85,255,0.35)]"
            >
              {/* Cabecera del Drawer en Azul Eléctrico + Rojo American Colt mostrando únicamente la opción seleccionada */}
              <div className="relative bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#B91C24] px-6 py-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Logo size="sm" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#0055FF] shadow-md">
                      <FaLayerGroup className="size-3 text-[#EF233C]" aria-hidden />
                      <span>{activeCategoryConfig.label}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerCategoryId(null)}
                    aria-label="Cerrar panel"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white transition-transform hover:scale-110 hover:bg-white hover:text-[#B91C24]"
                  >
                    <FaXmark className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              {/* Contenido Desplegable del Panel Lateral */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-blue-50/80 px-4 py-3 border border-blue-100">
                  <div>
                    <span className="font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-[#0055FF]">
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
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0055FF] px-3.5 py-2 text-[0.7rem] font-extrabold uppercase tracking-wider text-white shadow-sm transition-transform hover:scale-105 hover:bg-[#B91C24]"
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
                        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:border-blue-300"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAccordion(group.id)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between bg-slate-50/80 px-4 py-3.5 text-left transition-colors hover:bg-blue-50/50"
                        >
                          <div className="flex items-center gap-2">
                            <FaLayerGroup className="size-3.5 text-[#0055FF]" aria-hidden />
                            <span className="font-sans text-xs font-black uppercase tracking-wide text-slate-900 sm:text-sm">
                              {group.title}
                            </span>
                            {group.badge && (
                              <span className="rounded-full bg-[#EF233C] px-2 py-0.5 font-mono text-[0.58rem] font-extrabold uppercase text-white">
                                {group.badge}
                              </span>
                            )}
                          </div>
                          <FaChevronDown
                            className={cn(
                              "size-3.5 text-slate-500 transition-transform duration-200",
                              isOpen && "rotate-180 text-[#0055FF]",
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
                                    className="group/link flex items-center justify-between rounded-xl px-2.5 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-blue-50 hover:pl-4 hover:text-[#0055FF] sm:text-sm"
                                  >
                                    <span>{subItem.label}</span>
                                    <div className="flex items-center gap-2">
                                      {subItem.tag && (
                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 font-mono text-[0.58rem] font-extrabold uppercase text-[#0055FF]">
                                          {subItem.tag}
                                        </span>
                                      )}
                                      <FaArrowRight
                                        className="size-3 text-slate-400 transition-transform group-hover/link:translate-x-1 group-hover/link:text-[#0055FF]"
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
                  className="group relative block overflow-hidden rounded-2xl border-2 border-blue-200 bg-[#0055FF] p-5 text-white shadow-lg"
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
                    className="absolute inset-0 bg-gradient-to-r from-[#0055FF]/90 via-[#0055FF]/65 to-transparent"
                  />
                  <div className="relative z-10 max-w-[85%]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EF233C] px-2.5 py-0.5 font-mono text-[0.58rem] font-extrabold uppercase text-white">
                      <FaTag className="size-2.5" aria-hidden />
                      {activeCategoryConfig.banner.tag}
                    </span>
                    <p className="mt-2 font-sans text-base font-black uppercase leading-tight">
                      {activeCategoryConfig.banner.title}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-[0.68rem] font-extrabold uppercase text-[#0055FF]">
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
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] text-xs font-extrabold uppercase tracking-widest text-white shadow-md transition-transform hover:scale-[1.02]"
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
      <MobileTabBar onSearch={() => setSearchOpen(true)} />
    </>
  );
}
