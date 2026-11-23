"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
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
  Award,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type {
  EcommerceShowcaseConfig,
  LookbookSlideItem,
} from "@/server/queries/lookbook";

const FALLBACK_BRAND_CONFIG: EcommerceShowcaseConfig = {
  centerBadge: "Marca Oficial Peruana",
  centerTitle: "AUTÉNTICO DENIM AMERICANO CON EL",
  centerHighlight: "MEJOR ALGODÓN PERUANO",
  centerSubtitle:
    "Prendas en Denim Ring y Drill de exportación con acabados de primera para compra por unidad y distribuidores B2B.",
  leftLabel: "CALIDAD DENIM EXPORTACIÓN",
  rightLabel: "100% Confección Peruana",
};

const FALLBACK_BRAND_SLIDES: LookbookSlideItem[] = [
  {
    id: 901,
    title: "Campaña Oficial American Colt 2026",
    subtitle: "Algodón Peruano · Alta Resistencia",
    badge: "CALIDAD EXPORTACIÓN",
    priceTag: "Tallas 28 - 46",
    imageUrl: "/catalogo-colt/02-campana-bolsas.png",
    linkHref: "/catalogo",
    slot: "brand",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 902,
    title: "Colección Denim 2026",
    subtitle: "Cortes Relaxed, Comfort & Slim Fit",
    badge: "DENIM RING",
    priceTag: "Unidad & Mayor",
    imageUrl: "/catalogo-colt/16-portada-jeans-2026.png",
    linkHref: "/catalogo/denim?audiencia=hombre",
    slot: "brand",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 903,
    title: "Edición Estudio Indigo",
    subtitle: "Acabado Enzimático y Elastano Premium",
    badge: "TALLER PERUANO",
    priceTag: "Stock Permanente",
    imageUrl: "/catalogo-colt/01-estudio-azul.png",
    linkHref: "/catalogo/camisas?audiencia=hombre",
    slot: "brand",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 904,
    title: "Línea Drill & Urbano B2B",
    subtitle: "Precios de Fábrica desde 12 Unidades",
    badge: "VENTA B2B",
    priceTag: "Envío Nacional",
    imageUrl: "/catalogo-colt/08-linea-drill-premium.png",
    linkHref: "/mayorista",
    slot: "brand",
    sortOrder: 4,
    isActive: true,
  },
];

interface ManifestoProps {
  brandSlides?: LookbookSlideItem[];
  brandConfig?: EcommerceShowcaseConfig;
}

/**
 * Sección Marca Oficial Peruana sobre el fondo limpio de la página:
 * - Texto flotante sobre panel translúcido borroso + sombra suave para lectura cristalina.
 * - Galería en Cuadro Tecnológico 3D interactivo con inclinación al mouse, escáner y cortina cinética.
 */
export function Manifesto({ brandSlides, brandConfig }: ManifestoProps) {
  const cfg = brandConfig ?? FALLBACK_BRAND_CONFIG;
  const slides =
    brandSlides && brandSlides.length > 0 ? brandSlides : FALLBACK_BRAND_SLIDES;

  const [activeIdx, setActiveIdx] = useState(0);
  const safeIdx = activeIdx % slides.length;
  const activeSlide = slides[safeIdx];
  const nextSlide = slides[(safeIdx + 1) % slides.length];

  const handleNext = useCallback(() => {
    setActiveIdx((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(handleNext, 5200);
    return () => window.clearInterval(timer);
  }, [handleNext, slides.length, safeIdx]);

  // Física 3D interactiva al mover el mouse sobre el cuadro tecnológico
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), {
    stiffness: 200,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 24,
  });
  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [15, 85]), {
    stiffness: 180,
    damping: 24,
  });
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, 85]), {
    stiffness: 180,
    damping: 24,
  });
  const techSheen = useTransform(
    [glowX, glowY],
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.22) 0%, rgba(56,189,248,0.06) 34%, transparent 65%)`,
  );

  const handleFrameMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleFrameLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      id="manifiesto-marca"
      aria-labelledby="manifiesto-title"
      className="relative overflow-hidden bg-paper py-12 lg:py-16"
    >
      {/* Resplandores ambientales muy suaves sobre el fondo claro */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/4 top-8 size-80 rounded-full bg-red-500/[0.06] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-1/4 size-80 rounded-full bg-sky-500/[0.07] blur-3xl"
      />

      <div className="shell relative z-10 grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
        {/* COLUMNA IZQUIERDA: CUADRO TECNOLÓGICO 3D PROFESIONAL */}
        <div
          onMouseMove={handleFrameMove}
          onMouseLeave={handleFrameLeave}
          className="lg:col-span-6 [perspective:1400px]"
        >
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative overflow-hidden rounded-[1.85rem] border border-slate-800/80 bg-gradient-to-br from-[#070B14] via-[#0F172A] to-[#111827] p-2.5 shadow-[0_32px_70px_-18px_rgba(15,23,42,0.42)]"
          >
            {/* Esquinas HUD tecnológicas */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-3 z-30 size-5 rounded-tl-xl border-l-2 border-t-2 border-cyan-400/75"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-3 top-3 z-30 size-5 rounded-tr-xl border-r-2 border-t-2 border-red-400/75"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-12 left-3 z-30 size-5 rounded-bl-xl border-b-2 border-l-2 border-cyan-400/60"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-12 right-3 z-30 size-5 rounded-br-xl border-b-2 border-r-2 border-red-400/60"
            />

            {/* Contenedor de imagen con revelado cinético */}
            <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl bg-slate-950">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={activeSlide.id}
                  initial={{
                    opacity: 0,
                    clipPath: "inset(0 100% 0 0 round 12px)",
                    scale: 1.07,
                  }}
                  animate={{
                    opacity: 1,
                    clipPath: "inset(0 0% 0 0 round 12px)",
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    clipPath: "inset(0 0 0 100% round 12px)",
                    scale: 0.98,
                  }}
                  transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <Link
                    href={activeSlide.linkHref || "/catalogo"}
                    className="group/brand relative block size-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeSlide.imageUrl}
                      alt={activeSlide.title}
                      className="size-full object-cover object-top transition-transform duration-700 group-hover/brand:scale-105"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/15 to-transparent"
                    />

                    {/* Etiqueta tecnológica superior */}
                    <div className="absolute left-3.5 top-3.5 z-20 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/35 bg-slate-950/75 px-3 py-1 font-mono text-[0.58rem] font-black uppercase tracking-wider text-cyan-200 backdrop-blur-md">
                        <Cpu className="size-3 text-cyan-400" aria-hidden />
                        <span>{activeSlide.badge}</span>
                      </span>
                    </div>

                    {/* Pie informativo de la toma */}
                    <div className="absolute inset-x-0 bottom-0 p-4 pr-24 sm:p-5 sm:pr-28">
                      <p className="font-sans text-sm font-black uppercase tracking-tight text-white drop-shadow-sm sm:text-base">
                        {activeSlide.title}
                      </p>
                      {activeSlide.subtitle && (
                        <p className="mt-0.5 truncate text-[0.7rem] font-medium text-slate-300">
                          {activeSlide.subtitle}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              </AnimatePresence>

              {/* Brillo holográfico que sigue el mouse */}
              <motion.div
                aria-hidden
                style={{ background: techSheen }}
                className="pointer-events-none absolute inset-0 z-10"
              />

              {/* Controles Prev / Next */}
              {slides.length > 1 && (
                <div className="absolute right-3.5 top-3.5 z-20 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Foto anterior de marca"
                    className="flex size-8 items-center justify-center rounded-full border border-white/25 bg-slate-950/70 text-white backdrop-blur-md transition hover:scale-110 hover:bg-[#DC2626]"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Siguiente foto de marca"
                    className="flex size-8 items-center justify-center rounded-full border border-white/25 bg-slate-950/70 text-white backdrop-blur-md transition hover:scale-110 hover:bg-[#DC2626]"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}

              {/* Miniatura flotante 3D de la siguiente toma */}
              {slides.length > 1 && (
                <motion.button
                  type="button"
                  onClick={handleNext}
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 3.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  title={`Siguiente: ${nextSlide.title}`}
                  className="group/mini absolute bottom-3 right-3 z-20 hidden w-20 overflow-hidden rounded-xl border-2 border-white/80 bg-slate-900 shadow-2xl transition hover:scale-105 sm:block"
                >
                  <div className="relative aspect-[4/3] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={nextSlide.imageUrl}
                      alt={nextSlide.title}
                      className="size-full object-cover object-top brightness-90 group-hover/mini:brightness-100"
                    />
                  </div>
                </motion.button>
              )}

              {/* Barra láser de progreso */}
              {slides.length > 1 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-0.5 bg-white/15">
                  <motion.div
                    key={`brand-prog-${activeSlide.id}-${safeIdx}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 5.2, ease: "linear" }}
                    style={{ transformOrigin: "left" }}
                    className="h-full w-full bg-gradient-to-r from-[#EF233C] via-white to-[#38BDF8]"
                  />
                </div>
              )}
            </div>

            {/* Telemetría inferior editable */}
            <div className="mt-2 flex items-center justify-between rounded-xl bg-white/[0.06] px-3.5 py-2 backdrop-blur-md">
              <span className="inline-flex items-center gap-1.5 font-mono text-[0.64rem] font-extrabold uppercase tracking-wider text-red-400">
                <ShieldCheck className="size-3.5" aria-hidden />
                <span>{cfg.leftLabel}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[0.62rem] font-bold text-slate-300">
                <Sparkles className="size-3 text-cyan-300" aria-hidden />
                <span>{cfg.rightLabel}</span>
              </span>
            </div>
          </motion.div>

          {/* Miniaturas debajo del cuadro */}
          {slides.length > 1 && (
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  title={s.title}
                  className={`h-9 w-12 overflow-hidden rounded-xl border-2 transition-all ${
                    idx === safeIdx
                      ? "scale-105 border-slate-900 ring-2 ring-[#DC2626] shadow-md"
                      : "border-slate-200 opacity-65 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.imageUrl}
                    alt={s.title}
                    className="size-full object-cover object-top"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: TEXTOS CON SOMBRA SUAVE Y VIDRIO BORROSO DETRÁS SIN CAJA AZUL */}
        <div className="relative lg:col-span-6">
          {/* Halos difuminados detrás del vidrio borroso */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-slate-200/70 via-blue-100/50 to-red-100/45 opacity-80 blur-2xl"
          />

          <div className="relative rounded-3xl border border-slate-200/80 bg-white/75 p-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Logo size="sm" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3.5 py-1 font-mono text-[0.62rem] font-extrabold uppercase tracking-widest text-[#1E40AF] shadow-xs">
                <Award className="size-3.5 text-[#DC2626]" aria-hidden />
                <span>{cfg.centerBadge}</span>
              </span>
            </div>

            <h2
              id="manifiesto-title"
              className="mt-4 font-sans text-2xl font-black uppercase leading-tight tracking-tight text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] sm:text-3xl"
            >
              {cfg.centerTitle}{" "}
              <span className="bg-flow mt-1 inline-block rounded-xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-3 py-0.5 text-white shadow-md">
                {cfg.centerHighlight}
              </span>
            </h2>

            {cfg.centerSubtitle && (
              <p className="mt-3 max-w-lg text-xs font-semibold leading-relaxed text-slate-700 sm:text-sm">
                {cfg.centerSubtitle}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="bg-flow inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-6 text-xs font-extrabold uppercase tracking-widest text-white shadow-lg shadow-red-600/20 transition-all hover:scale-105 hover:brightness-110"
              >
                <span>Comprar por Unidad</span>
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/mayorista"
                className="inline-flex h-11 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white/85 px-6 text-xs font-extrabold uppercase tracking-widest text-slate-900 shadow-xs transition-colors hover:bg-slate-900 hover:text-white"
              >
                <span>Programa Mayorista B2B</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
