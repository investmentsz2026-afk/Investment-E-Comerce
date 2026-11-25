"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Expand, Images, Sparkles, X } from "lucide-react";
import CircularCarousel, {
  type CircularCarouselItem,
} from "@/components/ui/circular-carousel";
import { useEscapeKey, useLockBodyScroll } from "@/hooks/use-overlay";
import type { CircularGalleryItem } from "@/server/queries/lookbook";

const FALLBACK_GALLERY: readonly CircularGalleryItem[] = [
  {
    id: 1,
    title: "Pantalón Drill King 767",
    subtitle: "Skinny Fit · Tela Drill Stretch",
    imageUrl: "/catalogo-colt/pantalon-king-767-model.png",
    secondaryImageUrl: "/catalogo-colt/pantalon-king-767-closeup.png",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 2,
    title: "Camisa Denim Zair",
    subtitle: "Slim Fit · 100% Algodón Peruano",
    imageUrl: "/catalogo-colt/camisa-zair-model.png",
    secondaryImageUrl: "/catalogo-colt/camisa-zair-closeup.png",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 3,
    title: "Jean Denim Comfort 762",
    subtitle: "Classic Fit · Denim de Alto Gramaje",
    imageUrl: "/catalogo-colt/jean-comfort-762-model.png",
    secondaryImageUrl: "/catalogo-colt/jean-comfort-762-closeup.png",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 4,
    title: "Camisa Clásica Kendall",
    subtitle: "Slim Fit · Acabado Ejecutivo",
    imageUrl: "/catalogo-colt/camisa-kendall-model.png",
    secondaryImageUrl: "/catalogo-colt/camisa-kendall-closeup.png",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 5,
    title: "Pantalón Drill Fendy 769",
    subtitle: "Slim Fit Semipitillo · 9 Colores",
    imageUrl: "/catalogo-colt/pantalon-fendy-769-model.png",
    secondaryImageUrl: "/catalogo-colt/pantalon-fendy-769-closeup.png",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 6,
    title: "Polo Piqué Clásico Mark",
    subtitle: "Cuello Camisero · Algodón Peruano",
    imageUrl: "/catalogo-colt/polo-mark-model.png",
    secondaryImageUrl: "/catalogo-colt/polo-mark-closeup.png",
    sortOrder: 6,
    isActive: true,
  },
  {
    id: 7,
    title: "Jean Denim Relaxed 750",
    subtitle: "Relaxed Fit · Lavado Tradicional",
    imageUrl: "/catalogo-colt/jean-relaxed-750-model.png",
    secondaryImageUrl: "/catalogo-colt/jean-relaxed-750-closeup.png",
    sortOrder: 7,
    isActive: true,
  },
  {
    id: 8,
    title: "Pantalón Drill Rolex 770",
    subtitle: "Straight Fit · Bota Recta",
    imageUrl: "/catalogo-colt/pantalon-rolex-770-model.png",
    secondaryImageUrl: "/catalogo-colt/pantalon-rolex-770-closeup.png",
    sortOrder: 8,
    isActive: true,
  },
  {
    id: 9,
    title: "Bermuda Drill Balance 770",
    subtitle: "Straight Fit · Temporada 2026",
    imageUrl: "/catalogo-colt/bermuda-balance-770-model.png",
    secondaryImageUrl: "/catalogo-colt/bermuda-balance-770-closeup.png",
    sortOrder: 9,
    isActive: true,
  },
  {
    id: 10,
    title: "Jean Bull Denim 750",
    subtitle: "Línea Clásica · Alta Resistencia",
    imageUrl: "/catalogo-colt/jean-bull-denim-750-model.png",
    secondaryImageUrl: "/catalogo-colt/jean-bull-denim-750-closeup.png",
    sortOrder: 10,
    isActive: true,
  },
];

interface CircularGalleryShowcaseProps {
  items?: CircularGalleryItem[];
}

export function CircularGalleryShowcase({ items }: CircularGalleryShowcaseProps) {
  const galleryList = useMemo(
    () => (items && items.length > 0 ? items : [...FALLBACK_GALLERY]),
    [items],
  );

  // En el cilindro 3D SOLO se muestran las imágenes principales (sin enlaces externos)
  const carouselItems = useMemo<CircularCarouselItem[]>(
    () =>
      galleryList.map((g) => ({
        src: g.imageUrl,
        alt: g.title,
        title: g.title,
        subtitle: g.subtitle ?? undefined,
      })),
    [galleryList],
  );

  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [photoSlot, setPhotoSlot] = useState<0 | 1>(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const zoomTimerRef = useRef<number | null>(null);

  // Inclinación 3D magnética suave en el cuadro del modal
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [tilt3D, setTilt3D] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const zoomedItem = zoomIndex !== null ? galleryList[zoomIndex] ?? null : null;
  const isModalOpen = zoomedItem !== null;

  const modalPhotos = useMemo(() => {
    if (!zoomedItem) return [];
    const second = zoomedItem.secondaryImageUrl?.trim();
    return second ? [zoomedItem.imageUrl, second] : [zoomedItem.imageUrl];
  }, [zoomedItem]);

  const hasSecondPhoto = modalPhotos.length > 1;
  const activePhotoSrc = modalPhotos[photoSlot] ?? modalPhotos[0] ?? "";

  const closeModal = useCallback(() => {
    setZoomIndex(null);
    setPhotoSlot(0);
    setTilt3D({ rx: 0, ry: 0, gx: 50, gy: 50 });
  }, []);

  useLockBodyScroll(isModalOpen);
  useEscapeKey(isModalOpen, closeModal);

  useEffect(() => {
    return () => {
      if (zoomTimerRef.current !== null) {
        window.clearTimeout(zoomTimerRef.current);
      }
    };
  }, []);

  const handleCarouselItemClick = useCallback(
    (_item: CircularCarouselItem, index: number) => {
      if (zoomTimerRef.current !== null) {
        window.clearTimeout(zoomTimerRef.current);
      }
      // Dejamos que el cilindro centre suavemente la tarjeta seleccionada y abrimos el zoom 3D
      zoomTimerRef.current = window.setTimeout(() => {
        setPhotoSlot(0);
        setSlideDir(1);
        setZoomIndex(index);
      }, 240);
    },
    [],
  );

  const handleToggleSecondPhoto = useCallback(
    (dir: 1 | -1) => {
      if (!hasSecondPhoto) return;
      setSlideDir(dir);
      setPhotoSlot((prev) => (prev === 0 ? 1 : 0));
    },
    [hasSecondPhoto],
  );

  // Soporte de teclado Izquierda / Derecha cuando hay 2da imagen opcional
  useEffect(() => {
    if (!isModalOpen || !hasSecondPhoto) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleToggleSecondPhoto(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleToggleSecondPhoto(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen, hasSecondPhoto, handleToggleSecondPhoto]);

  const handleFramePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setTilt3D({
      rx: (0.5 - ny) * 8,
      ry: (nx - 0.5) * 10,
      gx: nx * 100,
      gy: ny * 100,
    });
  };

  const handleFramePointerLeave = () => {
    setTilt3D({ rx: 0, ry: 0, gx: 50, gy: 50 });
  };

  return (
    <div id="galeria-circular" className="space-y-4 sm:space-y-6">
      {/* Encabezado Editorial Sobrio (solo exhibición, sin botones de compra) */}
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-[#0F172A] px-3.5 py-1 font-mono text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-slate-100 shadow-xs sm:text-[0.65rem]">
          <Sparkles className="size-3 text-[#C81E2B]" aria-hidden />
          <span>GALERÍA CIRCULAR 3D · EXHIBICIÓN OFICIAL</span>
        </span>
        <h3 className="mt-2 font-sans text-xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
          NUESTRAS PRENDAS EN{" "}
          <span className="text-[#680C14]">MOVIMIENTO 360°</span>
        </h3>
        <p className="mt-1 max-w-xl text-[0.7rem] font-medium text-slate-600 sm:text-xs">
          Arrastra para girar la galería circular o toca cualquier imagen para centrarla y abrir su vista detallada en 3D.
        </p>
      </div>

      {/* Escenario Oscuro de Estudio para el Cilindro 3D */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-[#070B12] shadow-[0_26px_65px_-18px_rgba(7,11,18,0.65)]">
        {/* Luces ambientales sutiles */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[70%] -translate-x-1/2 rounded-full bg-[#680C14]/22 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[65%] -translate-x-1/2 rounded-full bg-slate-500/10 blur-3xl"
        />

        <div className="relative h-[340px] w-full sm:h-[460px] lg:h-[560px]">
          <CircularCarousel
            items={carouselItems}
            preset="cylinder"
            intro="rise"
            cardWidth={220}
            aspectRatio={1}
            speed={14}
            captions={false}
            gap={25}
            tilt={-5}
            curve={1}
            perspective={2500}
            autoplay="drift"
            interval={3}
            direction="left"
            momentum={0.6}
            snap
            pauseOnHover
            focusOnClick
            draggable
            parallax={0.3}
            stretch={0.5}
            fadeColor="#070B12"
            depthFade={0.55}
            innerShade={0.6}
            cornerRadius={12}
            onItemClick={handleCarouselItemClick}
          />
        </div>

        {/* Indicador inferior discreto */}
        <div className="pointer-events-none relative z-10 flex items-center justify-center gap-2 border-t border-white/10 bg-black/35 px-4 py-2.5 text-[0.65rem] font-semibold tracking-wide text-slate-300 sm:text-xs">
          <Expand className="size-3.5 text-slate-400" aria-hidden />
          <span>Toca una prenda para centrarla y hacer zoom en cuadro 3D</span>
        </div>
      </div>

      {/* MODAL DE ZOOM CON CUADRO 3D (activa flechas laterales SOLO si tiene 2.ª imagen opcional) */}
      <AnimatePresence>
        {isModalOpen && zoomedItem && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={zoomedItem.title}
            className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6"
          >
            {/* Fondo difuminado oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeModal}
              className="fixed inset-0 cursor-pointer bg-slate-950/85 backdrop-blur-xl"
            />

            {/* Contenedor con perspectiva 3D */}
            <motion.div
              initial={{ opacity: 0, scale: 0.84, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 18 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative z-10 flex w-full max-w-xl items-center justify-center [perspective:1500px]"
            >
              {/* Flecha Izquierda: SOLO se muestra si esta prenda tiene 2.ª imagen opcional */}
              {hasSecondPhoto && (
                <button
                  type="button"
                  onClick={() => handleToggleSecondPhoto(-1)}
                  aria-label="Ver foto anterior de esta prenda"
                  className="absolute -left-1 z-30 flex size-10 items-center justify-center rounded-full border border-white/30 bg-[#0B111E]/90 text-white shadow-[0_10px_25px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all hover:scale-110 hover:border-white/60 hover:bg-[#680C14] sm:-left-6 sm:size-12"
                >
                  <ChevronLeft className="size-5 sm:size-6" />
                </button>
              )}

              {/* CUADRO 3D BISELADO CON PROFUNDIDAD Y BRILLO ESPECULAR */}
              <div
                ref={frameRef}
                onPointerMove={handleFramePointerMove}
                onPointerLeave={handleFramePointerLeave}
                style={{
                  transform: `rotateX(${tilt3D.rx}deg) rotateY(${tilt3D.ry}deg)`,
                  transformStyle: "preserve-3d",
                  transition: "transform 0.16s ease-out",
                }}
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/25 bg-gradient-to-b from-[#161E2E] via-[#0D1320] to-[#080C14] p-2.5 shadow-[0_30px_80px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.35)] sm:p-4"
              >
                {/* Reflejo especular reactivo */}
                <div
                  aria-hidden
                  style={{
                    background: `radial-gradient(circle at ${tilt3D.gx}% ${tilt3D.gy}%, rgba(255,255,255,0.14), transparent 60%)`,
                  }}
                  className="pointer-events-none absolute inset-0 z-20"
                />

                {/* Botón Cerrar */}
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Cerrar zoom"
                  className="absolute right-4 top-4 z-30 flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-md transition hover:scale-105 hover:bg-[#680C14]"
                >
                  <X className="size-4" />
                </button>

                {/* Etiqueta de conteo cuando hay 2 fotos */}
                {hasSecondPhoto && (
                  <div className="absolute left-4 top-4 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1 font-mono text-[0.65rem] font-bold text-white backdrop-blur-md">
                    <Images className="size-3 text-slate-300" aria-hidden />
                    <span>
                      Foto {photoSlot + 1} / 2
                    </span>
                  </div>
                )}

                {/* Lienzo interior 3D de la fotografía */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 shadow-inner">
                  <AnimatePresence mode="wait" custom={slideDir}>
                    <motion.div
                      key={activePhotoSrc}
                      custom={slideDir}
                      initial={{ opacity: 0, x: slideDir * 36, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -slideDir * 36, scale: 0.97 }}
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                      className="relative h-full w-full"
                    >
                      <Image
                        src={activePhotoSrc}
                        alt={zoomedItem.title}
                        fill
                        unoptimized={activePhotoSrc.startsWith("/api/media/")}
                        sizes="(min-width: 640px) 460px, 92vw"
                        className="object-contain p-2 sm:p-3"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Pie informativo limpio dentro del cuadro 3D (sin enlaces externos) */}
                <div className="relative z-20 mt-3 flex items-center justify-between gap-3 px-1.5 pb-1 text-white">
                  <div className="min-w-0">
                    <h4 className="truncate font-sans text-sm font-black uppercase tracking-tight sm:text-base">
                      {zoomedItem.title}
                    </h4>
                    {zoomedItem.subtitle && (
                      <p className="truncate text-[0.7rem] text-slate-300 sm:text-xs">
                        {zoomedItem.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Mini selector rápido si existe la 2.ª foto opcional */}
                  {hasSecondPhoto && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {[0, 1].map((idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (photoSlot !== idx) {
                              setSlideDir(idx > photoSlot ? 1 : -1);
                              setPhotoSlot(idx as 0 | 1);
                            }
                          }}
                          aria-label={`Ver imagen ${idx + 1}`}
                          className={`h-2 rounded-full transition-all ${
                            photoSlot === idx
                              ? "w-6 bg-white"
                              : "w-2 bg-white/35 hover:bg-white/60"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Flecha Derecha: SOLO se muestra si esta prenda tiene 2.ª imagen opcional */}
              {hasSecondPhoto && (
                <button
                  type="button"
                  onClick={() => handleToggleSecondPhoto(1)}
                  aria-label="Ver siguiente foto de esta prenda"
                  className="absolute -right-1 z-30 flex size-10 items-center justify-center rounded-full border border-white/30 bg-[#0B111E]/90 text-white shadow-[0_10px_25px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all hover:scale-110 hover:border-white/60 hover:bg-[#680C14] sm:-right-6 sm:size-12"
                >
                  <ChevronRight className="size-5 sm:size-6" />
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
