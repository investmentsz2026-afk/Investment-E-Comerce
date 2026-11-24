"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  ChevronLeft,
  ChevronRight,
  FileText,
  Headset,
  Shirt,
  Sparkles,
} from "lucide-react";
import { FaBoxesStacked } from "react-icons/fa6";
import { media } from "@/config/media";
import { demoCollections } from "@/data/demo/collections";
import { InfiniteCardSlider } from "@/components/ui/infinite-card-slider";
import { WebThreads } from "@/components/ui/web-threads";
import { cn } from "@/lib/utils";
import type {
  EcommerceShowcaseConfig,
  LookbookSlideItem,
} from "@/server/queries/lookbook";

const DEFAULT_CONFIG: EcommerceShowcaseConfig = {
  centerBadge: "AMERICAN COLT JEANS™ · 2026",
  centerTitle: "VESTIMOS NEGOCIOS QUE",
  centerHighlight: "CRECEN.",
  centerSubtitle:
    "Prendas oficiales en Denim, Drill y Algodón Peruano por unidad y mayor.",
  leftLabel: "CAMISAS & POLOS",
  rightLabel: "JEANS & DRILL",
};

const FALLBACK_LEFT: LookbookSlideItem[] = [
  {
    id: 101,
    title: "Camisa Denim Zair",
    subtitle: "Slim Fit · Algodón Denim Premium",
    badge: "CAMISAS",
    priceTag: "S/ 130.00",
    imageUrl: "/catalogo-colt/camisa-zair-model.png",
    linkHref: "/producto/camisa-denim-zair-slim-fit",
    slot: "left",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 102,
    title: "Camisa Clásica Kendall",
    subtitle: "Slim Fit · Acabado Ejecutivo",
    badge: "NUEVA TEMPORADA",
    priceTag: "S/ 125.00",
    imageUrl: "/catalogo-colt/camisa-kendall-model.png",
    linkHref: "/producto/camisa-clasica-kendall-slim-fit",
    slot: "left",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 103,
    title: "Polo Piqué Clásico Mark",
    subtitle: "10 Colores · Algodón Peruano",
    badge: "POLOS PIQUÉ",
    priceTag: "S/ 89.00",
    imageUrl: "/catalogo-colt/polo-mark-model.png",
    linkHref: "/producto/polo-pique-clasico-mark",
    slot: "left",
    sortOrder: 3,
    isActive: true,
  },
];

const FALLBACK_RIGHT: LookbookSlideItem[] = [
  {
    id: 201,
    title: "Look Ejecutivo Denim Zair",
    subtitle: "Jean Slim + Sobrecamisa Indigo 2026",
    badge: "EDICIÓN 2026",
    priceTag: "S/ 130.00",
    imageUrl: "/lookbook-denim-ejecutivo.jpg",
    linkHref: "/producto/camisa-denim-zair-slim-fit",
    slot: "right",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 202,
    title: "Pantalón Drill King 767",
    subtitle: "Skinny Fit Stretch · 7 Colores",
    badge: "TOP VENTAS",
    priceTag: "S/ 140.00",
    imageUrl: "/catalogo-colt/pantalon-king-767-model.png",
    linkHref: "/producto/pantalon-drill-king-767",
    slot: "right",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 203,
    title: "Jean Denim Comfort 762",
    subtitle: "Classic Fit · Tallas 28 a 46",
    badge: "CLÁSICO",
    priceTag: "S/ 130.00",
    imageUrl: "/catalogo-colt/jean-comfort-762-model.png",
    linkHref: "/producto/jean-denim-comfort-762",
    slot: "right",
    sortOrder: 3,
    isActive: true,
  },
];

const WHOLESALE_CARDS = [
  {
    id: "w-1",
    badge: "BENEFICIO 01",
    title: "Compras por Volumen",
    subtitle: "Combina tallas y colores en una sola orden mayorista.",
    cta: "Armar Pedido →",
    href: "/mayorista/cotizaciones",
    image: media.wholesale,
    icon: Boxes,
  },
  {
    id: "w-2",
    badge: "BENEFICIO 02",
    title: "Precios de Fábrica",
    subtitle: "Tarifas escalonadas exclusivas para negocios con RUC.",
    cta: "Ver Escalas →",
    href: "/mayorista",
    image: demoCollections[2]?.image ?? media.heroMain,
    icon: BadgePercent,
  },
  {
    id: "w-3",
    badge: "BENEFICIO 03",
    title: "Cotizaciones a Medida",
    subtitle: "Recibe atención personalizada de nuestro equipo B2B.",
    cta: "Solicitar Cotización →",
    href: "/mayorista/cotizaciones",
    image: media.atelier,
    icon: FileText,
  },
  {
    id: "w-4",
    badge: "BENEFICIO 04",
    title: "Surtido Completo",
    subtitle: "Jeans, polos, camisas y casacas de alta rotación comercial.",
    cta: "Ver Catálogo Mayorista →",
    href: "/catalogo?mayorista=1",
    image: demoCollections[0]?.image ?? media.heroMain,
    icon: Shirt,
  },
  {
    id: "w-5",
    badge: "BENEFICIO 05",
    title: "Despacho Nacional",
    subtitle: "Envíos asegurados a Lima y todas las provincias del Perú.",
    cta: "Registrar Empresa →",
    href: "/mayorista/registro",
    image: media.retail,
    icon: Headset,
  },
] as const;

interface OrbitalLookbookDeckProps {
  label: string;
  slides: LookbookSlideItem[];
  accentColor: "crimson" | "cobalt";
  initialDelayMs?: number;
}

function OrbitalLookbookDeck({
  label,
  slides,
  accentColor,
  initialDelayMs = 0,
}: OrbitalLookbookDeckProps) {
  const [{ activeIdx, direction }, setDeckState] = useState({
    activeIdx: 0,
    direction: 1,
  });

  const safeIdx = activeIdx % slides.length;
  const prevIdx = (safeIdx - 1 + slides.length) % slides.length;
  const nextIdx = (safeIdx + 1) % slides.length;
  const currentLook = slides[safeIdx];
  const prevLook = slides.length > 1 ? slides[prevIdx] : null;
  const nextLook = slides.length > 1 ? slides[nextIdx] : null;

  const handleNext = useCallback(() => {
    setDeckState((prev) => ({
      activeIdx: (prev.activeIdx + 1) % slides.length,
      direction: 1,
    }));
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setDeckState((prev) => ({
      activeIdx: (prev.activeIdx - 1 + slides.length) % slides.length,
      direction: -1,
    }));
  }, [slides.length]);

  const handleJump = (idx: number) => {
    setDeckState((prev) => ({
      activeIdx: idx,
      direction: idx >= prev.activeIdx ? 1 : -1,
    }));
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    let intervalId: number | null = null;
    const delayId = window.setTimeout(() => {
      intervalId = window.setInterval(handleNext, 4500);
    }, initialDelayMs);

    return () => {
      window.clearTimeout(delayId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [handleNext, slides.length, safeIdx, initialDelayMs]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 230,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-11, 11]), {
    stiffness: 230,
    damping: 22,
  });
  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [12, 88]), {
    stiffness: 200,
    damping: 24,
  });
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, 88]), {
    stiffness: 200,
    damping: 24,
  });
  const spotlight = useTransform(
    [glowX, glowY],
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 58%)`,
  );

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Encabezado de Sección Editable */}
      <div className="flex w-full max-w-[290px] items-center justify-between px-1">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.65rem] font-black uppercase tracking-wider shadow-xs backdrop-blur-md",
            accentColor === "crimson"
              ? "border-red-200 bg-white/90 text-[#B91C1C]"
              : "border-blue-200 bg-white/90 text-[#1E40AF]",
          )}
        >
          <Sparkles
            className={cn(
              "size-3",
              accentColor === "crimson" ? "text-[#DC2626]" : "text-[#2563EB]",
            )}
            aria-hidden
          />
          <span>{label}</span>
        </span>

        {slides.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              aria-label={`Anterior en ${label}`}
              className="flex size-7 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-xs backdrop-blur-md transition hover:scale-110 hover:border-transparent hover:bg-[#DC2626] hover:text-white"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label={`Siguiente en ${label}`}
              className="flex size-7 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-xs backdrop-blur-md transition hover:scale-110 hover:border-transparent hover:bg-[#DC2626] hover:text-white"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Escenario Simétrico 3D de 3 Tarjetas (limpio y sin solaparse en móvil) */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex h-[215px] w-full max-w-[390px] items-center justify-center [perspective:1400px] sm:h-[320px]"
      >
        {/* Tarjeta izquierda inclinada en profundidad 3D (solo sm+) */}
        {prevLook && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label={`Anterior: ${prevLook.title}`}
            className="hidden sm:block absolute left-2 z-10 h-[240px] w-[162px] overflow-hidden rounded-3xl border border-white/80 bg-white opacity-80 shadow-lg transition-all duration-300 hover:-translate-x-1.5 hover:opacity-100 [transform:perspective(900px)_rotateY(18deg)_rotateZ(-7deg)_scale(0.86)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={prevLook.imageUrl}
              alt={prevLook.title}
              className="size-full object-cover object-top brightness-95 transition hover:brightness-100"
            />
          </button>
        )}

        {/* Tarjeta derecha inclinada en profundidad 3D (solo sm+) */}
        {nextLook && (
          <button
            type="button"
            onClick={handleNext}
            aria-label={`Siguiente: ${nextLook.title}`}
            className="hidden sm:block absolute right-2 z-10 h-[240px] w-[162px] overflow-hidden rounded-3xl border border-white/80 bg-white opacity-80 shadow-lg transition-all duration-300 hover:translate-x-1.5 hover:opacity-100 [transform:perspective(900px)_rotateY(-18deg)_rotateZ(7deg)_scale(0.86)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nextLook.imageUrl}
              alt={nextLook.title}
              className="size-full object-cover object-top brightness-90 transition hover:brightness-100"
            />
          </button>
        )}

        {/* Tarjeta Frontal Activa en 3D */}
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          <motion.div
            key={currentLook.id}
            custom={direction}
            initial={{
              opacity: 0,
              x: direction >= 0 ? 60 : -60,
              rotateY: direction >= 0 ? 18 : -18,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              x: 0,
              rotateY: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: direction >= 0 ? -60 : 60,
              rotateY: direction >= 0 ? -18 : 18,
              scale: 0.9,
            }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }}
            className="relative z-20 h-[210px] w-full sm:h-[302px] sm:w-[216px]"
          >
            <Link
              href={currentLook.linkHref || "/catalogo"}
              className="group/deck relative block size-full overflow-hidden rounded-2xl border-2 border-white bg-slate-950 shadow-[0_24px_52px_-14px_rgba(15,23,42,0.28)] sm:rounded-[1.6rem] sm:border-[2.5px]"
            >
              <motion.div
                initial={{ scale: 1.07 }}
                animate={{ scale: 1 }}
                transition={{ duration: 4.5, ease: "easeOut" }}
                className="absolute inset-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentLook.imageUrl}
                  alt={currentLook.title}
                  className="size-full object-cover object-top transition-transform duration-700 group-hover/deck:scale-105"
                />
              </motion.div>

              <motion.div
                aria-hidden
                style={{ background: spotlight }}
                className="pointer-events-none absolute inset-0 z-10"
              />

              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"
              />

              <span className="bg-flow absolute left-2 top-2 z-20 inline-flex rounded-full border border-white/60 bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-2 py-0.5 font-mono text-[0.46rem] font-black uppercase tracking-wider text-white shadow-md sm:left-3 sm:top-3 sm:px-2.5 sm:text-[0.58rem]">
                {currentLook.badge}
              </span>

              <div className="absolute inset-x-0 bottom-0 z-20 p-2 text-left text-white sm:p-3.5">
                <h3 className="truncate font-sans text-[0.68rem] font-black uppercase tracking-tight sm:text-sm">
                  {currentLook.title}
                </h3>
                {currentLook.subtitle && (
                  <p className="mt-0.5 hidden truncate text-[0.68rem] font-medium text-blue-100 sm:block">
                    {currentLook.subtitle}
                  </p>
                )}
                <div className="mt-1.5 flex items-center justify-between border-t border-white/20 pt-1.5 sm:mt-2 sm:pt-2">
                  <span className="font-mono text-[0.62rem] font-black text-amber-300 sm:text-xs">
                    {currentLook.priceTag || "Ver Precio"}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-white px-2 py-0.5 text-[0.5rem] font-black uppercase text-[#991B1B] shadow-md transition group-hover/deck:bg-[#DC2626] group-hover/deck:text-white sm:gap-1 sm:px-2.5 sm:py-1 sm:text-[0.6rem]">
                    <span>Ver Look</span>
                    <ArrowRight className="size-2 sm:size-2.5" />
                  </span>
                </div>
              </div>

              {/* Barra láser 4.5s */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-1 bg-white/15">
                <motion.div
                  key={`prog-${label}-${currentLook.id}-${safeIdx}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 4.5, ease: "linear" }}
                  style={{ transformOrigin: "left" }}
                  className="h-full w-full bg-gradient-to-r from-[#EF233C] via-white to-[#38BDF8]"
                />
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Miniaturas rápidas */}
      {slides.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
          {slides.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleJump(idx)}
              title={item.title}
              className={cn(
                "size-7 overflow-hidden rounded-lg border-2 transition-all sm:size-9 sm:rounded-xl",
                idx === safeIdx
                  ? "scale-110 border-white ring-2 ring-[#EF233C] shadow-md"
                  : "border-white/75 opacity-80 hover:scale-105 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.title}
                className="size-full object-cover object-top"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface WholesaleSectionProps {
  lookbookSlides?: LookbookSlideItem[];
  showcaseConfig?: EcommerceShowcaseConfig;
}

export function WholesaleSection({
  lookbookSlides,
  showcaseConfig,
}: WholesaleSectionProps) {
  const cfg = showcaseConfig ?? DEFAULT_CONFIG;
  const allSlides = lookbookSlides ?? [];

  const leftSlides = allSlides.filter((s) => s.slot === "left");
  const rightSlides = allSlides.filter((s) => s.slot === "right");

  const resolvedLeft = leftSlides.length > 0 ? leftSlides : FALLBACK_LEFT;
  const resolvedRight = rightSlides.length > 0 ? rightSlides : FALLBACK_RIGHT;

  return (
    <section
      id="mayorista"
      aria-labelledby="mayorista-title"
      className="overflow-hidden bg-gradient-to-b from-bone via-paper to-bone py-14 text-ink lg:py-20"
    >
      <div className="shell space-y-12">
        {/* ESCENARIO SIMÉTRICO 3D EN TONO AZUL DENIM SUAVE (DISTINGUIBLE DEL FONDO, SIN OSCURECER) + HILOS WEB A TODO COLOR */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-300/60 bg-gradient-to-br from-[#BDCEF0] via-[#D1DFF5] to-[#B6C8EB] px-4 py-8 text-slate-900 shadow-[0_24px_60px_-20px_rgba(30,58,138,0.22)] sm:px-6 sm:py-10 lg:px-8">
          {/* Hilos Web WebGL2 en modo color puro (sin destello blanco que opaque los colores) */}
          <div aria-hidden className="absolute inset-0 z-0">
            <WebThreads
              colors={["#1D4ED8", "#DC2626", "#2563EB"]}
              coreColor="#1E3A8A"
              lightMode
              threadCount={6}
              spread={0.18}
              speed={0.2}
              frequency={5}
              taper={1}
              position={0.5}
              pinch={0.5}
              nodes={1}
              angle={0}
              glow={0.026}
              falloff={0.62}
              thickness={1.45}
              brightness={0.75}
              opacity={0.95}
              depth={0}
              pulses={0}
              mirror
              shimmer={false}
              fade={0}
              grain={0.04}
              intro
              mouseInteraction
              mouseStrength={0.5}
              pulseOnClick
              paused={false}
            />
          </div>

          <div className="relative z-10 grid grid-cols-2 items-start gap-2.5 lg:grid-cols-[minmax(0,1.25fr)_minmax(220px,0.75fr)_minmax(0,1.25fr)] lg:items-center lg:gap-4">
            {/* COLUMNA CENTRAL ARRIBA EN MÓVIL: PANEL CRISTALINO CLARO CON LECTURA NÍTIDA */}
            <div className="order-first col-span-2 mx-auto flex w-full max-w-sm flex-col items-center rounded-2xl border border-white/85 bg-white/85 px-4 py-4 text-center shadow-[0_14px_36px_-12px_rgba(15,23,42,0.16)] backdrop-blur-md lg:order-2 lg:col-span-1 lg:max-w-[245px] lg:rounded-3xl lg:py-5">
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-[0.52rem] font-extrabold uppercase tracking-wider text-slate-800 shadow-xs sm:px-3 sm:py-1 sm:text-[0.55rem]"
              >
                <FaBoxesStacked className="size-2.5 text-[#DC2626] sm:size-3" aria-hidden />
                <span>{cfg.centerBadge}</span>
              </motion.div>

              <h2
                id="mayorista-title"
                className="mt-2 font-sans text-base font-black uppercase leading-snug tracking-tight text-slate-900 sm:mt-3 sm:text-xl"
              >
                {cfg.centerTitle}{" "}
                <span className="bg-flow mt-0.5 inline-block rounded-lg bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-2 py-0.5 text-white shadow-md sm:mt-1 sm:px-2.5">
                  {cfg.centerHighlight}
                </span>
              </h2>

              {cfg.centerSubtitle && (
                <p className="mt-1.5 text-[0.65rem] font-semibold leading-relaxed text-slate-600 sm:mt-2.5 sm:text-[0.7rem]">
                  {cfg.centerSubtitle}
                </p>
              )}

              <div className="mt-3 grid w-full grid-cols-2 gap-2 lg:mt-4 lg:grid-cols-1">
                <Link
                  href="/mayorista"
                  className="bg-flow inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-2.5 text-[0.58rem] font-extrabold uppercase tracking-wider text-white shadow-md shadow-red-600/20 transition-all hover:scale-105 hover:brightness-110 sm:h-9 sm:gap-1.5 sm:px-4 sm:text-[0.65rem]"
                >
                  <span>Mayorista B2B</span>
                  <ArrowRight className="size-3 sm:size-3.5" aria-hidden />
                </Link>
                <Link
                  href="/mayorista/cotizaciones"
                  className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-300 bg-white px-2.5 text-[0.58rem] font-extrabold uppercase tracking-wider text-slate-800 shadow-xs transition-colors hover:border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white sm:h-9 sm:px-4 sm:text-[0.65rem]"
                >
                  <span>Cotizar Lote</span>
                </Link>
              </div>
            </div>

            {/* COLUMNA IZQUIERDA EN 2 COLUMNAS EN MÓVIL (CAMISAS & POLOS) */}
            <div className="order-2 min-w-0 lg:order-1">
              <OrbitalLookbookDeck
                label={cfg.leftLabel}
                slides={resolvedLeft}
                accentColor="cobalt"
                initialDelayMs={0}
              />
            </div>

            {/* COLUMNA DERECHA EN 2 COLUMNAS EN MÓVIL (JEANS & PANTALONES DRILL) */}
            <div className="order-3 min-w-0 lg:order-3">
              <OrbitalLookbookDeck
                label={cfg.rightLabel}
                slides={resolvedRight}
                accentColor="crimson"
                initialDelayMs={2200}
              />
            </div>
          </div>
        </div>

        {/* Carrusel 1 por 1 de Tarjetas Redondeadas con Fotos de Ventajas Mayoristas */}
        <div>
          <div className="flex flex-col items-center text-center">
            <span className="bg-flow inline-block rounded-full bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB] px-4 py-1 font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-paper shadow-sm">
              SOLUCIONES TEXTILES CON IMÁGENES EN MOVIMIENTO
            </span>
            <h3 className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
              ¿POR QUÉ COMPRAR POR MAYOR EN{" "}
              <span className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] bg-clip-text text-transparent">
                AMERICAN COLT?
              </span>
            </h3>
          </div>

          <div className="mt-5 px-2 sm:px-5">
            <InfiniteCardSlider
              items={WHOLESALE_CARDS}
              desktopCols={4}
              autoPlayMs={3300}
              keyExtractor={(item) => item.id}
              renderItem={(card) => (
                <Link
                  href={card.href}
                  className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#0F172A] shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                >
                  <Image
                    src={card.image.src}
                    alt={card.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    placeholder={
                      typeof card.image.src === "string" ? "empty" : "blur"
                    }
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#1E3A8A]/45 to-transparent"
                  />

                  <span className="bg-flow absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-2 py-0.5 font-mono text-[0.48rem] font-extrabold uppercase tracking-wider text-paper shadow-md sm:left-3.5 sm:top-3.5 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[0.6rem]">
                    <card.icon className="size-2.5 sm:size-3" aria-hidden />
                    {card.badge}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-2.5 text-left text-paper sm:p-5">
                    <h4 className="font-sans text-xs font-black uppercase leading-tight drop-shadow-xs sm:text-lg">
                      {card.title}
                    </h4>
                    <p className="mt-1 hidden line-clamp-2 text-xs text-white/90 sm:block">
                      {card.subtitle}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-xl bg-paper px-2.5 py-1 text-[0.54rem] font-extrabold uppercase tracking-wider text-[#1E40AF] shadow-md transition-all group-hover:bg-gradient-to-r group-hover:from-[#DC2626] group-hover:to-[#B91C1C] group-hover:text-paper sm:mt-3 sm:px-3.5 sm:py-1.5 sm:text-[0.68rem]">
                      {card.cta}
                    </span>
                  </div>
                </Link>
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
