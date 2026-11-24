"use client";

import { useCallback, useEffect, useState } from "react";
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

import type { HeroSlideItem } from "@/server/queries/lookbook";

const DEFAULT_HERO_FALLBACK: readonly HeroSlideItem[] = [
  {
    id: 1,
    badge: "CATÁLOGO OFICIAL 2026",
    promoPill: "3x2 Y HASTA -50% DSCTO",
    eyebrow: "AMERICAN COLT JEANS™ · LÍNEA HOMBRE",
    titleLine1: "¡TUS PREFERIDOS EN",
    titleHighlight: "JEANS & DENIM!",
    description:
      "Colección masculina American Colt: Jean Relaxed 750, Comfort 762, Bull Denim 750 y Camisa Denim Zair.",
    primaryCtaLabel: "Ver más aquí >>",
    primaryCtaHref: "/catalogo?audiencia=hombre",
    secondaryCtaLabel: "Ofertas -50%",
    secondaryCtaHref: "/catalogo?audiencia=hombre&novedades=1&oferta=50",
    bgImageUrl: "/catalogo-colt/hero-colt-1.png",
    productId: null,
    cardTag: "Catálogo 2026",
    cardTitle: "Camisa Denim Zair",
    cardSubtitle: "Slim Fit · Pasa el mouse para zoom",
    cardPriceText: "S/ 130.00",
    cardHref: "/producto/camisa-denim-zair-slim-fit",
    cardImageUrl: "/catalogo-colt/camisa-zair-model.png",
    cardHoverImageUrl: "/catalogo-colt/camisa-zair-closeup.png",
    sortOrder: 1,
    isActive: true,
  },
];

const TRUST_STRIP = [
  { icon: FaTruckFast, label: "Envío Rápido 24Hrs", shortLabel: "Envío 24h", sub: "Lima y todo el Perú", href: "/atencion-al-cliente#envios" },
  { icon: FaBagShopping, label: "Ventas por Unidad", shortLabel: "Por Unidad", sub: "Sin mínimo de compra", href: "/catalogo" },
  { icon: FaBoxesStacked, label: "Ventas por Mayor B2B", shortLabel: "Por Mayor", sub: "Precios escalonados", href: "/mayorista" },
  { icon: FaShieldHalved, label: "Pagos 100% Seguros", shortLabel: "Pago Seguro", sub: "Tarjetas, Yape, Plin y RUC", href: "/politicas" },
] as const;

const AUTOPLAY_INTERVAL_MS = 6000;

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({
    x: dir >= 0 ? "100%" : "-100%",
    rotateY: dir >= 0 ? 16 : -16,
    scale: 1.04,
    opacity: 1,
    zIndex: 2,
  }),
  center: {
    x: "0%",
    rotateY: 0,
    scale: 1,
    opacity: 1,
    zIndex: 2,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? "-34%" : "34%",
    rotateY: dir >= 0 ? -14 : 14,
    scale: 0.92,
    opacity: 0.2,
    zIndex: 1,
  }),
};

interface HeroProps {
  slides?: HeroSlideItem[];
}

export function Hero({ slides: externalSlides }: HeroProps) {
  const activeSlides =
    externalSlides && externalSlides.length > 0
      ? externalSlides
      : DEFAULT_HERO_FALLBACK;

  const [{ current, direction }, setSlideState] = useState({
    current: 0,
    direction: 1,
  });

  const safeCurrent = current % activeSlides.length;

  const nextSlide = useCallback(() => {
    setSlideState((prev) => ({
      current: (prev.current + 1) % activeSlides.length,
      direction: 1,
    }));
  }, [activeSlides.length]);

  const prevSlide = useCallback(() => {
    setSlideState((prev) => ({
      current: (prev.current - 1 + activeSlides.length) % activeSlides.length,
      direction: -1,
    }));
  }, [activeSlides.length]);

  // Avance automático fluido cada 6 segundos sin paralizarse al mover el mouse
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = window.setInterval(nextSlide, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [nextSlide, safeCurrent, activeSlides.length]);

  const slide = activeSlides[safeCurrent];

  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative bg-white pt-[6rem] sm:pt-[6.25rem] lg:pt-[9.5rem]"
    >
      {/* Portada Full-Imagen con Transición Cinematográfica 3D Tipo Libro / Video */}
      <div className="relative min-h-[265px] w-full overflow-hidden bg-slate-950 [perspective:1600px] sm:min-h-[430px] lg:min-h-[465px]">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex min-h-[265px] w-full items-end [transform-style:preserve-3d] sm:min-h-[430px] sm:items-center lg:min-h-[465px]"
          >
            {/* Imagen de fondo con efecto vivo Ken Burns */}
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.06 }}
              transition={{ duration: 6, ease: "linear" }}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.bgImageUrl}
                alt={slide.titleLine1}
                className="size-full object-cover object-top"
              />
            </motion.div>

            {/* Sombra ligera inferior para contraste sin tapar a los modelos */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/15 to-transparent sm:from-slate-950/35 sm:via-transparent"
            />

            {/* Contenido del Slide compacto en móvil para mostrar el modelo completo */}
            <div className="shell relative z-10 flex w-full flex-col items-start justify-end gap-4 pb-3 pt-4 sm:justify-between sm:pb-4 sm:pt-12 lg:flex-row lg:items-center lg:pb-3 lg:pt-16">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 }}
                className="w-full max-w-[16rem] rounded-xl border border-white/25 bg-slate-950/30 p-2.5 text-white shadow-[0_14px_36px_rgba(0,0,0,0.4)] backdrop-blur-[3px] sm:max-w-[25rem] sm:rounded-2xl sm:bg-slate-950/18 sm:p-5 sm:backdrop-blur-[2px] lg:ml-8 lg:mt-6 lg:max-w-[26.5rem]"
              >
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <span className="bg-flow inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-1.5 py-0.5 font-mono text-[0.48rem] font-black uppercase tracking-wider text-white shadow-xs sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[0.64rem]">
                    <FaTag className="size-2 text-white sm:size-3" aria-hidden />
                    {slide.badge}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/35 bg-[#1E3A8A]/75 px-1.5 py-0.5 font-mono text-[0.48rem] font-extrabold uppercase tracking-wider text-white sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[0.64rem]">
                    <FaCircleCheck className="size-2 text-cyan-300 sm:size-3" aria-hidden />
                    {slide.promoPill}
                  </span>
                </div>

                <p className="mt-1 truncate font-mono text-[0.5rem] font-extrabold uppercase tracking-[0.1em] text-cyan-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] sm:mt-2 sm:text-[0.68rem]">
                  {slide.eyebrow}
                </p>

                <h1
                  id="hero-title"
                  className="mt-0.5 font-sans text-xs font-black uppercase leading-[1.12] tracking-tight text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] sm:mt-1.5 sm:text-2xl lg:text-[1.72rem]"
                >
                  <span className="block">{slide.titleLine1}</span>
                  <span className="bg-flow mt-0.5 inline-block rounded-md bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-1.5 py-0.5 text-white shadow-sm sm:mt-1 sm:rounded-lg sm:px-2.5">
                    {slide.titleHighlight}
                  </span>
                </h1>

                <p className="mt-1 line-clamp-1 text-[0.6rem] font-medium leading-snug text-white/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] sm:mt-2 sm:line-clamp-2 sm:text-[0.8rem]">
                  {slide.description}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3.5 sm:gap-2">
                  <Link
                    href={slide.primaryCtaHref}
                    className="group/btn inline-flex h-7 items-center justify-center gap-1 rounded-full border border-white/85 bg-slate-950/45 px-2.5 text-[0.56rem] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-xs transition-all duration-300 hover:scale-105 hover:border-blue-300 hover:bg-gradient-to-r hover:from-[#1E3A8A] hover:to-[#2563EB] sm:h-10 sm:gap-1.5 sm:px-4 sm:text-[0.75rem]"
                  >
                    <FaMagnifyingGlass className="size-2.5 text-white transition-transform group-hover/btn:scale-110 sm:size-3.5" aria-hidden />
                    <span>{slide.primaryCtaLabel}</span>
                  </Link>
                  <Link
                    href={slide.secondaryCtaHref}
                    className="bg-flow inline-flex h-7 items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-2.5 text-[0.56rem] font-black uppercase tracking-wider text-white shadow-md shadow-red-600/30 transition-all duration-300 hover:scale-105 hover:from-[#1E3A8A] hover:to-[#2563EB] sm:h-10 sm:gap-1.5 sm:px-4 sm:text-[0.75rem]"
                  >
                    <span>{slide.secondaryCtaLabel}</span>
                    <FaArrowRight className="size-2.5 sm:size-3.5" aria-hidden />
                  </Link>
                </div>
              </motion.div>

              {/* UN SOLO Cuadradito de Imagen al Costado (Cambia de Modelo -> Solo Prenda al pasar el mouse; al tocar lleva directo al producto enlazado) */}
              <motion.div
                initial={{ opacity: 0, x: 24, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.14 }}
                className="hidden sm:block lg:mr-8"
              >
                <Link
                  href={slide.cardHref}
                  className="group/card relative block w-44 overflow-hidden rounded-3xl border-3 border-white bg-white p-2 shadow-[0_24px_55px_rgba(0,0,0,0.55)] transition-all duration-300 hover:-translate-y-1.5 hover:border-red-400 xl:w-48"
                >
                  <div className="relative aspect-[3/3.7] w-full overflow-hidden rounded-2xl bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.cardImageUrl}
                      alt={slide.cardTitle}
                      className="size-full object-cover object-top transition-all duration-500 group-hover/card:scale-105 group-hover/card:opacity-0"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.cardHoverImageUrl || slide.cardImageUrl}
                      alt={`Vista cercana ${slide.cardTitle}`}
                      className="absolute inset-0 size-full scale-105 object-cover object-top opacity-0 transition-all duration-500 group-hover/card:scale-100 group-hover/card:opacity-100"
                    />
                    <span className="bg-flow absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-2 py-0.5 font-mono text-[0.52rem] font-extrabold uppercase text-white shadow-sm">
                      {slide.cardTag}
                    </span>
                  </div>
                  <div className="mt-1.5 px-1 pb-0.5">
                    <p className="truncate font-sans text-[0.7rem] font-black uppercase text-slate-900 group-hover/card:text-[#DC2626]">
                      {slide.cardTitle}
                    </p>
                    <p className="truncate text-[0.6rem] font-medium text-slate-500">
                      {slide.cardSubtitle}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-[0.7rem] font-black text-[#1E40AF]">
                        {slide.cardPriceText}
                      </span>
                      <span className="flex size-5.5 items-center justify-center rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white shadow-xs transition-all group-hover/card:scale-110 group-hover/card:from-[#991B1B] group-hover/card:to-[#DC2626]">
                        <FaArrowRight className="size-2.5" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Flechas Laterales Redondeadas */}
        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Banner anterior"
              className="absolute left-1.5 top-[26%] z-20 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-slate-950/55 text-white shadow-xl backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#DC2626] sm:left-3 sm:top-1/2 sm:size-11 sm:border-2"
            >
              <FaChevronLeft className="size-3 sm:size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Siguiente banner"
              className="absolute right-1.5 top-[26%] z-20 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-slate-950/55 text-white shadow-xl backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#DC2626] sm:right-3 sm:top-1/2 sm:size-11 sm:border-2"
            >
              <FaChevronRight className="size-3 sm:size-4" aria-hidden />
            </button>
          </>
        )}

        {/* Barra de progreso en vivo de 6 segundos en la base de la portada */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-black/25">
          <motion.div
            key={`hero-progress-${slide.id}-${safeCurrent}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 6, ease: "linear" }}
            style={{ transformOrigin: "left" }}
            className="h-full w-full bg-gradient-to-r from-[#EF233C] via-amber-300 to-[#38BDF8] shadow-[0_0_10px_rgba(239,35,60,0.85)]"
          />
        </div>
      </div>

      {/* Cinta de Confianza Rápida: 4 en una sola fila compacta en móvil */}
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-red-50/40 via-white to-blue-50/40">
        <div className="shell grid grid-cols-4 gap-1.5 py-2 sm:gap-2.5 sm:py-3.5 lg:gap-4">
          {TRUST_STRIP.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex flex-col items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-1 py-2 text-center shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md sm:rounded-2xl sm:px-3 sm:py-2.5 lg:flex-row lg:items-center lg:gap-3 lg:px-4 lg:text-left"
            >
              <span className="bg-flow flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#EF233C] text-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:from-[#1E3A8A] group-hover:via-[#2563EB] group-hover:to-[#3B82F6] sm:size-9 sm:rounded-xl lg:size-10">
                <item.icon className="size-3 sm:size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[0.58rem] font-black uppercase leading-tight tracking-tight text-slate-900 group-hover:text-[#DC2626] lg:hidden">
                  {item.shortLabel}
                </p>
                <p className="hidden truncate text-xs font-black uppercase tracking-tight text-slate-900 group-hover:text-[#DC2626] lg:block">
                  {item.label}
                </p>
                <p className="hidden truncate text-[0.68rem] font-medium text-slate-500 lg:block">
                  {item.sub}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
