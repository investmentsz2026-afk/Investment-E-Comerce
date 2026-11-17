"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  FaArrowRight,
  FaBagShopping,
  FaBoxesStacked,
  FaChevronLeft,
  FaChevronRight,
  FaCircleCheck,
  FaMagnifyingGlass,
  FaShieldHalved,
  FaTag,
  FaTruckFast,
} from "react-icons/fa6";
import { cn } from "@/lib/utils";

interface HeroFeaturedCard {
  title: string;
  subtitle: string;
  tag: string;
  priceText: string;
  href: string;
  imageSrc: string;
  hoverImageSrc: string;
}

interface HeroSlide {
  id: string;
  tabLabel: string;
  tabSub: string;
  badge: string;
  promoPill: string;
  eyebrow: string;
  titleLine1: string;
  titleHighlight: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  bgImageSrc: string;
  featuredCard: HeroFeaturedCard;
}

const SLIDES: readonly HeroSlide[] = [
  {
    id: "jeans-hombre-2026",
    tabLabel: "Jeans & Denim 2026",
    tabSub: "Relaxed 750, Comfort 762, Parker 769",
    badge: "CATÁLOGO OFICIAL 2026",
    promoPill: "3x2 Y HASTA -50% DSCTO",
    eyebrow: "AMERICAN COLT JEANS™ · LÍNEA HOMBRE",
    titleLine1: "¡TUS PREFERIDOS EN",
    titleHighlight: "JEANS & DENIM!",
    description:
      "Colección masculina American Colt: Jean Relaxed 750, Comfort 762, Bull Denim 750 y Camisa Denim Zair.",
    primaryCta: { label: "Ver más aquí >>", href: "/catalogo?audiencia=hombre" },
    secondaryCta: { label: "Ofertas -50%", href: "/catalogo?audiencia=hombre&novedades=1&oferta=50" },
    bgImageSrc: "/catalogo-colt/hero-colt-1.png",
    featuredCard: {
      title: "Camisa Denim Zair",
      subtitle: "Slim Fit · Pasa el mouse para zoom",
      tag: "Catálogo 2026",
      priceText: "S/ 130.00",
      href: "/producto/camisa-denim-zair-slim-fit",
      imageSrc: "/catalogo-colt/camisa-zair-model.png",
      hoverImageSrc: "/catalogo-colt/camisa-zair-closeup.png",
    },
  },
  {
    id: "linea-drill-premium",
    tabLabel: "Línea Drill Premium",
    tabSub: "King 767, Fendy 769, Rolex 770",
    badge: "LÍNEA DRILL PREMIUM",
    promoPill: "TALLAS 28 A 40 · STRETCH",
    eyebrow: "PANTALONES & BERMUDAS DRILL",
    titleLine1: "ELEGANCIA Y CONFORT",
    titleHighlight: "DRILL PREMIUM",
    description:
      "Pantalones Drill King 767 (Skinny Fit), Fendy 769 (Slim Fit), Rolex 770 (Straight Fit) y Bermuda Balance 770.",
    primaryCta: { label: "Ver más aquí >>", href: "/catalogo/pantalones?audiencia=hombre" },
    secondaryCta: { label: "Ver King 767", href: "/producto/pantalon-drill-king-767" },
    bgImageSrc: "/catalogo-colt/hero-colt-2.png",
    featuredCard: {
      title: "Pantalón Drill King 767",
      subtitle: "Skinny Fit · 7 Colores",
      tag: "Top Ventas",
      priceText: "S/ 140.00",
      href: "/producto/pantalon-drill-king-767",
      imageSrc: "/catalogo-colt/pantalon-king-767-model.png",
      hoverImageSrc: "/catalogo-colt/pantalon-king-767-closeup.png",
    },
  },
  {
    id: "linea-clasica-hombre",
    tabLabel: "Línea Clásica",
    tabSub: "Comfort 762 & Bull Denim 750",
    badge: "LÍNEA CLÁSICA AMERICAN COLT",
    promoPill: "TALLAS HASTA 46",
    eyebrow: "CALCE CLÁSICO Y RESISTENCIA SUPERIOR",
    titleLine1: "TRADICIÓN Y ESTILO",
    titleHighlight: "LÍNEA CLÁSICA",
    description:
      "Jeans Comfort 762, Bull Denim 750 y Parker 769 confeccionados con mezclilla de alto gramaje.",
    primaryCta: { label: "Ver más aquí >>", href: "/catalogo/denim?audiencia=hombre" },
    secondaryCta: { label: "Comfort 762", href: "/producto/jean-denim-comfort-762" },
    bgImageSrc: "/catalogo-colt/hero-colt-3.png",
    featuredCard: {
      title: "Jean Comfort 762",
      subtitle: "Classic Fit · Tallas 28 a 46",
      tag: "Línea Clásica",
      priceText: "S/ 130.00",
      href: "/producto/jean-denim-comfort-762",
      imageSrc: "/catalogo-colt/jean-comfort-762-model.png",
      hoverImageSrc: "/catalogo-colt/jean-comfort-762-closeup.png",
    },
  },
  {
    id: "camisas-y-polos",
    tabLabel: "Camisas & Polos",
    tabSub: "Camisa Kendall, Zair & Polo Mark",
    badge: "NUEVA TEMPORADA",
    promoPill: "ALGODÓN PERUANO",
    eyebrow: "CAMISAS MANGA LARGA & POLOS PIQUÉ",
    titleLine1: "CAMISAS KENDALL &",
    titleHighlight: "POLOS CLÁSICOS MARK",
    description:
      "Combina tus Jeans y Pantalones Drill con nuestras Camisas Kendall Slim Fit y Polos Piqué Mark.",
    primaryCta: { label: "Ver más aquí >>", href: "/catalogo/camisas?audiencia=hombre" },
    secondaryCta: { label: "Ver Polos", href: "/catalogo/polos?audiencia=hombre" },
    bgImageSrc: "/catalogo-colt/hero-colt-4.png",
    featuredCard: {
      title: "Polo Piqué Clásico Mark",
      subtitle: "10 Colores · Tallas S a XXL",
      tag: "Algodón Peruano",
      priceText: "S/ 89.00",
      href: "/producto/polo-pique-clasico-mark",
      imageSrc: "/catalogo-colt/polo-mark-model.png",
      hoverImageSrc: "/catalogo-colt/polo-mark-closeup.png",
    },
  },
  {
    id: "ventas-por-mayor",
    tabLabel: "Ventas por Mayor",
    tabSub: "Lotes B2B y Distribuidores",
    badge: "CANAL MAYORISTA B2B",
    promoPill: "PRECIOS DE FÁBRICA",
    eyebrow: "ABASTECE TU TIENDA, BOUTIQUE O EMPRESA",
    titleLine1: "VENTAS POR MAYOR",
    titleHighlight: "Y POR UNIDAD",
    description:
      "Precios escalonados automáticos desde 12, 50 y 200+ unidades en toda la colección American Colt JEANS™.",
    primaryCta: { label: "Ver más aquí >>", href: "/mayorista" },
    secondaryCta: { label: "Cotizar Lote", href: "/mayorista/cotizaciones" },
    bgImageSrc: "/catalogo-colt/hero-colt-1.png",
    featuredCard: {
      title: "Jean Relaxed 750",
      subtitle: "Lotes desde 12 Unidades",
      tag: "Tarifa Mayorista",
      priceText: "Por Mayor S/ 88.00",
      href: "/producto/jean-denim-relaxed-750",
      imageSrc: "/catalogo-colt/jean-relaxed-750-model.png",
      hoverImageSrc: "/catalogo-colt/jean-relaxed-750-closeup.png",
    },
  },
];

const TRUST_STRIP = [
  { icon: FaTruckFast, label: "Envío Rápido 24Hrs", sub: "Lima y todo el Perú", href: "/atencion-al-cliente#envios" },
  { icon: FaBagShopping, label: "Ventas por Unidad", sub: "Sin mínimo de compra", href: "/catalogo" },
  { icon: FaBoxesStacked, label: "Ventas por Mayor B2B", sub: "Precios escalonados", href: "/mayorista" },
  { icon: FaShieldHalved, label: "Pagos 100% Seguros", sub: "Tarjetas, Yape, Plin y RUC", href: "/politicas" },
] as const;

export function Hero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(nextSlide, 5500);
    return () => window.clearInterval(timer);
  }, [paused, nextSlide]);

  const slide = SLIDES[current];

  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative bg-white pt-[6rem] lg:pt-[9.25rem]"
    >
      {/* Portada Full-Imagen: Fondo fotográfico 100% visible en el primer pantallazo + Cuadro de texto con misma transparencia y letras más grandes */}
      <div className="relative min-h-[410px] w-full overflow-hidden bg-slate-900 sm:min-h-[440px] lg:min-h-[465px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex min-h-[410px] w-full items-center sm:min-h-[440px] lg:min-h-[465px]"
          >
            {/* Imagen de fondo completa de lado a lado */}
            <motion.div
              initial={{ scale: 1.04 }}
              animate={{ scale: 1 }}
              transition={{ duration: 5.5, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image
                src={slide.bgImageSrc}
                alt={slide.titleLine1}
                fill
                priority
                sizes="100vw"
                className="object-cover object-top"
              />
            </motion.div>

            {/* Sombra ligera inferior para contraste sin tapar a los modelos */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent"
            />

            {/* Contenido del Slide ubicado un poquito más abajo del centro pero 100% visible en el primer pantallazo */}
            <div className="shell relative z-10 flex w-full flex-col items-start justify-between gap-5 pb-4 pt-12 lg:flex-row lg:items-center lg:pb-3 lg:pt-16">
              {/* Cuadro de Texto con la Misma Transparencia (`bg-slate-950/18 backdrop-blur-[2px]`) y Letras Más Grandes */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 }}
                className="w-full max-w-[22.5rem] rounded-2xl border border-white/25 bg-slate-950/18 p-4 text-white shadow-[0_14px_36px_rgba(0,0,0,0.4)] backdrop-blur-[2px] sm:max-w-[25rem] sm:p-5 lg:ml-8 lg:mt-6 lg:max-w-[26.5rem]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EF233C]/85 px-2.5 py-1 font-mono text-[0.6rem] font-black uppercase tracking-wider text-white shadow-xs sm:text-[0.64rem]">
                    <FaTag className="size-3 text-white" aria-hidden />
                    {slide.badge}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-[#0055FF]/70 px-2.5 py-1 font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-white sm:text-[0.64rem]">
                    <FaCircleCheck className="size-3 text-white" aria-hidden />
                    {slide.promoPill}
                  </span>
                </div>

                <p className="mt-2 font-mono text-[0.64rem] font-extrabold uppercase tracking-[0.14em] text-cyan-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] sm:text-[0.68rem]">
                  {slide.eyebrow}
                </p>

                <h1
                  id="hero-title"
                  className="mt-1.5 font-sans text-xl font-black uppercase leading-[1.1] tracking-tight text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] sm:text-2xl lg:text-[1.72rem]"
                >
                  <span className="block">{slide.titleLine1}</span>
                  <span className="mt-1 inline-block rounded-lg bg-[#EF233C]/85 px-2.5 py-0.5 text-white shadow-sm">
                    {slide.titleHighlight}
                  </span>
                </h1>

                <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-white/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] sm:text-[0.8rem]">
                  {slide.description}
                </p>

                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <Link
                    href={slide.primaryCta.href}
                    className="group/btn inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/85 bg-slate-950/30 px-4 text-xs font-black uppercase tracking-wider text-white shadow-md backdrop-blur-xs transition-all duration-300 hover:scale-105 hover:border-[#0055FF] hover:bg-[#0055FF] sm:h-10 sm:text-[0.75rem]"
                  >
                    <FaMagnifyingGlass className="size-3.5 text-white transition-transform group-hover/btn:scale-110" aria-hidden />
                    <span>{slide.primaryCta.label}</span>
                  </Link>
                  <Link
                    href={slide.secondaryCta.href}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#EF233C]/85 px-4 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-[#0055FF] sm:h-10 sm:text-[0.75rem]"
                  >
                    <span>{slide.secondaryCta.label}</span>
                    <FaArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </motion.div>

              {/* UN SOLO Cuadradito de Imagen al Costado (Cambia de Modelo -> Solo Prenda al pasar el mouse) */}
              <motion.div
                initial={{ opacity: 0, x: 24, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.14 }}
                className="hidden sm:block lg:mr-8"
              >
                <Link
                  href={slide.featuredCard.href}
                  className="group/card relative block w-44 overflow-hidden rounded-3xl border-3 border-white bg-white p-2 shadow-[0_24px_55px_rgba(0,0,0,0.55)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#0055FF] xl:w-48"
                >
                  <div className="relative aspect-[3/3.7] w-full overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={slide.featuredCard.imageSrc}
                      alt={slide.featuredCard.title}
                      fill
                      sizes="210px"
                      className="object-cover transition-all duration-500 group-hover/card:scale-105 group-hover/card:opacity-0"
                    />
                    <Image
                      src={slide.featuredCard.hoverImageSrc}
                      alt={`Vista cercana ${slide.featuredCard.title}`}
                      fill
                      sizes="210px"
                      className="scale-105 object-cover opacity-0 transition-all duration-500 group-hover/card:scale-100 group-hover/card:opacity-100"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#EF233C] to-[#B91C24] px-2 py-0.5 font-mono text-[0.52rem] font-extrabold uppercase text-white shadow-sm">
                      {slide.featuredCard.tag}
                    </span>
                  </div>
                  <div className="mt-1.5 px-1 pb-0.5">
                    <p className="truncate font-sans text-[0.7rem] font-black uppercase text-slate-900 group-hover/card:text-[#0055FF]">
                      {slide.featuredCard.title}
                    </p>
                    <p className="truncate text-[0.6rem] font-medium text-slate-500">
                      {slide.featuredCard.subtitle}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-[0.7rem] font-black text-[#0055FF]">
                        {slide.featuredCard.priceText}
                      </span>
                      <span className="flex size-5.5 items-center justify-center rounded-full bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] text-white shadow-xs transition-all group-hover/card:scale-110 group-hover/card:from-[#EF233C] group-hover/card:to-[#B91C24]">
                        <FaArrowRight className="size-2.5" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Flechas Laterales Redondeadas con Font Awesome */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Banner anterior"
          className="absolute left-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-950/55 text-white shadow-xl backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#0055FF] sm:size-11"
        >
          <FaChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Siguiente banner"
          className="absolute right-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-950/55 text-white shadow-xl backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#0055FF] sm:size-11"
        >
          <FaChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {/* Pestañas Interactivas Redondeadas (`rounded-2xl`) de los 5 Sliders */}
      <div className="border-b border-blue-100 bg-white">
        <div className="shell">
          <div
            role="tablist"
            aria-label="Categorías del slider principal"
            className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3"
          >
            {SLIDES.map((s, idx) => {
              const isActive = idx === current;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setCurrent(idx)}
                  className={cn(
                    "relative flex flex-col items-start overflow-hidden rounded-2xl border px-4 py-2.5 text-left transition-all duration-300",
                    isActive
                      ? "border-[#0055FF] bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] text-white shadow-lg shadow-blue-500/20 scale-[1.02]"
                      : "border-blue-100 bg-blue-50/50 text-slate-900 hover:border-[#0055FF]/50 hover:bg-blue-50",
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span
                      className={cn(
                        "font-mono text-[0.6rem] font-black uppercase tracking-wider",
                        isActive ? "text-amber-300" : "text-[#EF233C]",
                      )}
                    >
                      0{idx + 1}
                    </span>
                    <FaArrowRight
                      className={cn(
                        "size-3 transition-transform",
                        isActive ? "translate-x-0.5 text-white" : "text-[#0055FF]",
                      )}
                      aria-hidden
                    />
                  </div>
                  <span className="mt-0.5 font-sans text-xs font-black uppercase tracking-tight sm:text-[0.82rem]">
                    {s.tabLabel}
                  </span>
                  <span
                    className={cn(
                      "line-clamp-1 text-[0.66rem]",
                      isActive ? "text-blue-100" : "text-slate-500",
                    )}
                  >
                    {s.tabSub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cinta de Confianza Rápida con Tarjetas Redondeadas Relucientes */}
      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50/60 via-white to-blue-50/60">
        <div className="shell grid grid-cols-2 gap-2.5 py-3.5 lg:grid-cols-4 lg:gap-4">
          {TRUST_STRIP.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-2.5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0055FF] hover:shadow-md"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0055FF] to-[#1D4ED8] text-white shadow-sm transition-transform group-hover:scale-110 group-hover:from-[#EF233C] group-hover:to-[#B91C24]">
                <item.icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-black uppercase tracking-tight text-slate-900 group-hover:text-[#0055FF]">
                  {item.label}
                </p>
                <p className="truncate text-[0.68rem] font-medium text-slate-500">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
