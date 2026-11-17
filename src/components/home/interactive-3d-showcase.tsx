"use client";

import { useState, useRef, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Eye,
  Layers,
  MoveHorizontal,
  Ruler,
  ScanEye,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { FaLayerGroup } from "react-icons/fa6";
import { cn } from "@/lib/utils";

interface ShowcaseItem {
  id: string;
  code: string;
  name: string;
  fitLabel: string;
  categoryLabel: string;
  fabricLabel: string;
  sizesLabel: string;
  retailPrice: string;
  wholesalePrice: string;
  href: string;
  modelImage: string;
  closeupImage: string;
  fichaImage: string;
  colors: readonly { name: string; hex: string }[];
  hotspots: readonly { x: number; y: number; title: string; detail: string }[];
}

const SHOWCASE_ITEMS: readonly ShowcaseItem[] = [
  {
    id: "king-767",
    code: "MOD. KING 767",
    name: "Pantalón Drill King 767",
    fitLabel: "Skinny Fit (Entalle Pitillo)",
    categoryLabel: "Línea Drill Premium",
    fabricLabel: "Drill Stretch de Alta Recuperación",
    sizesLabel: "Tallas 28 · 30 · 32 · 34 · 36",
    retailPrice: "S/ 140.00",
    wholesalePrice: "S/ 102.00",
    href: "/producto/pantalon-drill-king-767",
    modelImage: "/catalogo-colt/pantalon-king-767-model.png",
    closeupImage: "/catalogo-colt/pantalon-king-767-closeup.png",
    fichaImage: "/catalogo-colt/05-pantalon-king-767-ficha.png",
    colors: [
      { name: "Camello", hex: "#755233" },
      { name: "Khaki", hex: "#9DA8A3" },
      { name: "Azul Marino", hex: "#153875" },
      { name: "Verde Militar", hex: "#445749" },
      { name: "Cocoa", hex: "#7F6F74" },
      { name: "Negro", hex: "#0D1421" },
    ],
    hotspots: [
      { x: 46, y: 28, title: "Pretina Anatómica", detail: "Botón metálico antioxidante y presillas reforzadas" },
      { x: 62, y: 52, title: "Tela Drill Stretch", detail: "Elastano bidireccional que mantiene el calce todo el día" },
      { x: 42, y: 74, title: "Corte Skinny Fit", detail: "Entalle pitillo moderno con costuras de seguridad" },
    ],
  },
  {
    id: "camisa-zair",
    code: "MOD. ZAIR",
    name: "Camisa Denim Zair",
    fitLabel: "Slim Fit (Entallado)",
    categoryLabel: "Camisas Denim Hombre",
    fabricLabel: "100% Algodón Peruano",
    sizesLabel: "Tallas S · M · L · XL",
    retailPrice: "S/ 130.00",
    wholesalePrice: "S/ 95.00",
    href: "/producto/camisa-denim-zair-slim-fit",
    modelImage: "/catalogo-colt/camisa-zair-model.png",
    closeupImage: "/catalogo-colt/camisa-zair-closeup.png",
    fichaImage: "/catalogo-colt/03-camisa-zair-ficha.png",
    colors: [
      { name: "Sky", hex: "#0066FF" },
      { name: "Blackie", hex: "#374151" },
      { name: "Stone", hex: "#4F7DF3" },
    ],
    hotspots: [
      { x: 56, y: 34, title: "Bolsillo Pectoral Doble", detail: "Solapa con broches nacarados e insignia American Colt" },
      { x: 76, y: 58, title: "Puño en Contraste", detail: "Interior en tono celeste denim para doblar con estilo" },
      { x: 48, y: 75, title: "100% Algodón", detail: "Tejido transpirable y suave con lavado enzimático" },
    ],
  },
  {
    id: "comfort-762",
    code: "MOD. COMFORT 762",
    name: "Jean Denim Comfort 762",
    fitLabel: "Classic Fit (Entalle Clásico)",
    categoryLabel: "Línea Clásica Denim",
    fabricLabel: "Denim Stretch Premium",
    sizesLabel: "Tallas 28 a la 46",
    retailPrice: "S/ 130.00",
    wholesalePrice: "S/ 95.00",
    href: "/producto/jean-denim-comfort-762",
    modelImage: "/catalogo-colt/jean-comfort-762-model.png",
    closeupImage: "/catalogo-colt/jean-comfort-762-closeup.png",
    fichaImage: "/catalogo-colt/12-jean-comfort-762-ficha.png",
    colors: [
      { name: "Grafito", hex: "#0D2440" },
      { name: "Azul", hex: "#00338D" },
      { name: "Ash", hex: "#2B6CB0" },
      { name: "Negro", hex: "#1E293B" },
      { name: "Dakar", hex: "#13232C" },
    ],
    hotspots: [
      { x: 54, y: 30, title: "Cinco Bolsillos", detail: "Remaches de cobre grabados en puntos de tensión" },
      { x: 40, y: 56, title: "Denim Stretch", detail: "Máxima comodidad desde la talla 28 hasta la talla 46" },
      { x: 58, y: 78, title: "Pespunte Contraste", detail: "Costura doble con hilo de alta tenacidad" },
    ],
  },
  {
    id: "polo-mark",
    code: "MOD. MARK",
    name: "Polo Piqué Clásico Mark",
    fitLabel: "Classic Fit (Entalle Clásico)",
    categoryLabel: "Polos Algodón Peruano",
    fabricLabel: "100% Algodón Piqué",
    sizesLabel: "Tallas S · M · L · XL · XXL",
    retailPrice: "S/ 89.00",
    wholesalePrice: "S/ 62.00",
    href: "/producto/polo-pique-clasico-mark",
    modelImage: "/catalogo-colt/polo-mark-model.png",
    closeupImage: "/catalogo-colt/polo-mark-closeup.png",
    fichaImage: "/catalogo-colt/10-polo-mark-ficha.png",
    colors: [
      { name: "Rojo", hex: "#7D091D" },
      { name: "Acero", hex: "#376598" },
      { name: "Blanco", hex: "#FFFFFF" },
      { name: "Negro", hex: "#070809" },
      { name: "Aqua Green", hex: "#14A86B" },
    ],
    hotspots: [
      { x: 50, y: 22, title: "Cuello Tejido", detail: "Cuello camisero indeformable con pechera de 2 botones" },
      { x: 64, y: 38, title: "Bolsillo con Insignia", detail: "Detalle oficial American Colt en el pecho" },
      { x: 48, y: 68, title: "Algodón Peruano", detail: "Tejido piqué fresco disponible en 10 colores" },
    ],
  },
  {
    id: "fendy-769",
    code: "MOD. FENDY 769",
    name: "Pantalón Drill Fendy 769",
    fitLabel: "Slim Fit (Entalle Semipitillo)",
    categoryLabel: "Línea Drill Premium",
    fabricLabel: "Tela Stretch 9 Colores",
    sizesLabel: "Tallas 28 a la 46",
    retailPrice: "S/ 130.00",
    wholesalePrice: "S/ 95.00",
    href: "/producto/pantalon-drill-fendy-769",
    modelImage: "/catalogo-colt/pantalon-fendy-769-model.png",
    closeupImage: "/catalogo-colt/pantalon-fendy-769-closeup.png",
    fichaImage: "/catalogo-colt/06-pantalon-fendy-769-ficha.png",
    colors: [
      { name: "Verde Militar", hex: "#485948" },
      { name: "Arena", hex: "#98A0A4" },
      { name: "Negro", hex: "#101726" },
      { name: "Camello", hex: "#6D4E35" },
      { name: "Azul Marino", hex: "#1A427A" },
    ],
    hotspots: [
      { x: 48, y: 28, title: "Entalle Semipitillo", detail: "Equilibrio ideal entre elegancia sastre y confort" },
      { x: 60, y: 54, title: "9 Tonos Oficiales", detail: "Colores reactivos que no destiñen con el lavado" },
      { x: 45, y: 78, title: "Acabado Sastre", detail: "Bolsillos traseros con vivo doble y botón" },
    ],
  },
  {
    id: "balance-770",
    code: "MOD. BALANCE 770",
    name: "Bermuda Drill Balance 770",
    fitLabel: "Straight Fit (Corte Recto)",
    categoryLabel: "Bermudas Drill Stretch",
    fabricLabel: "Drill Stretch Ligero",
    sizesLabel: "Tallas 28 a la 46",
    retailPrice: "S/ 120.00",
    wholesalePrice: "S/ 88.00",
    href: "/producto/bermuda-drill-balance-770",
    modelImage: "/catalogo-colt/bermuda-balance-770-model.png",
    closeupImage: "/catalogo-colt/bermuda-balance-770-closeup.png",
    fichaImage: "/catalogo-colt/04-bermuda-balance-770-ficha.png",
    colors: [
      { name: "Arena", hex: "#E6D7C8" },
      { name: "Camello", hex: "#6E5438" },
      { name: "Negro", hex: "#111317" },
      { name: "Azul Marino", hex: "#0B1942" },
    ],
    hotspots: [
      { x: 48, y: 26, title: "Tiro Confortable", detail: "Ajuste seguro en cintura con bolsillo relojero" },
      { x: 56, y: 55, title: "Largo sobre Rodilla", detail: "Corte recto fresco para clima cálido y urbano" },
      { x: 44, y: 76, title: "Basta Reforzada", detail: "Doble costura interior de alta durabilidad" },
    ],
  },
];

/** Tarjeta individual compacta con efecto 3D magnético al mover el cursor + cambio de Modelo a Solo Prenda */
function Tilt3DProductCard({
  item,
  isSelected,
  onSelect,
}: {
  item: ShowcaseItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 16;
    const rotateX = (0.5 - py) * 16;
    setTilt({ rotateX, rotateY, glareX: px * 100, glareY: py * 100 });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "group/tilt relative flex flex-col overflow-hidden rounded-xl border-2 p-1.5 text-left transition-all duration-300 will-change-transform",
        isSelected
          ? "border-[#EF233C] bg-gradient-to-b from-blue-50 via-white to-blue-50 shadow-[0_10px_25px_-5px_rgba(239,35,60,0.5)] ring-2 ring-[#EF233C]/40"
          : "border-white/25 bg-white/95 shadow-sm hover:border-cyan-300 hover:bg-white hover:shadow-lg",
      )}
    >
      {/* Brillo especular dinámico 3D */}
      <div
        aria-hidden
        style={{
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.55) 0%, transparent 65%)`,
        }}
        className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
      />

      <div className="relative h-24 w-full overflow-hidden rounded-lg bg-slate-100 sm:h-26 lg:h-28">
        {/* Vista 1: Modelo */}
        <Image
          src={item.modelImage}
          alt={item.name}
          fill
          sizes="140px"
          className="object-cover object-top transition-all duration-500 group-hover/tilt:scale-105 group-hover/tilt:opacity-0"
        />
        {/* Vista 2 (Hover): Solo Prenda de Cerca */}
        <Image
          src={item.closeupImage}
          alt={`Solo prenda ${item.name}`}
          fill
          sizes="140px"
          className="scale-105 object-cover opacity-0 transition-all duration-500 group-hover/tilt:scale-100 group-hover/tilt:opacity-100"
        />

        <span
          style={{ transform: "translateZ(18px)" }}
          className={cn(
            "absolute left-1.5 top-1.5 z-10 rounded-full px-1.5 py-0.5 font-mono text-[0.46rem] font-extrabold uppercase tracking-wider text-white shadow-xs",
            isSelected ? "bg-[#EF233C]" : "bg-[#0055FF]",
          )}
        >
          {item.code.replace("MOD. ", "")}
        </span>

        <span className="absolute bottom-1 right-1 z-10 inline-flex items-center gap-0.5 rounded-full bg-slate-950/75 px-1.5 py-0.5 font-mono text-[0.45rem] font-bold text-white backdrop-blur-xs">
          <Eye className="size-2 text-amber-300" aria-hidden />
          <span className="group-hover/tilt:hidden">Modelo</span>
          <span className="hidden text-amber-300 group-hover/tilt:inline">Prenda</span>
        </span>
      </div>

      <div className="mt-1.5 px-0.5">
        <p className="truncate font-sans text-[0.62rem] font-black uppercase leading-tight text-slate-900 group-hover/tilt:text-[#0055FF]">
          {item.name}
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <span className="font-mono text-[0.62rem] font-black text-[#0055FF]">{item.retailPrice}</span>
          <span className="truncate rounded bg-red-50 px-1 py-0.2 font-mono text-[0.48rem] font-extrabold text-[#B91C24]">
            M: {item.wholesalePrice}
          </span>
        </div>
      </div>
    </button>
  );
}

export function Interactive3DShowcase() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [splitPercent, setSplitPercent] = useState(50);
  const [viewMode, setViewMode] = useState<"scanner" | "closeup" | "ficha">("scanner");
  const [activeHotspot, setActiveHotspot] = useState<number>(0);
  const scannerRef = useRef<HTMLDivElement>(null);

  const current = SHOWCASE_ITEMS[selectedIdx] ?? SHOWCASE_ITEMS[0];

  const handleScannerMove = (clientX: number) => {
    const el = scannerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100));
    setSplitPercent(pct);
  };

  return (
    <section
      aria-labelledby="showcase-3d-title"
      className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#041C4A] to-slate-950 py-5 text-white lg:py-6"
    >
      {/* Luces ambientales de estudio 3D */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-4 size-72 rounded-full bg-[#0055FF]/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-4 size-72 rounded-full bg-[#EF233C]/25 blur-3xl"
      />

      <div className="shell relative z-10">
        {/* Encabezado Compacto para que toda la sección entre en 1 solo pantallazo */}
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-[#0055FF]/40 px-3 py-0.5 font-mono text-[0.56rem] font-extrabold uppercase tracking-widest text-cyan-200 backdrop-blur-md">
            <Box className="size-3 text-amber-300" aria-hidden />
            <span>EXPERIENCIA INTERACTIVA 3D · ESCÁNER DE PRENDAS EN VIVO</span>
          </span>
          <h2
            id="showcase-3d-title"
            className="mt-1 font-sans text-lg font-black uppercase tracking-tight text-white sm:text-xl lg:text-2xl"
          >
            EXPLORA EL CALCE EN <span className="text-cyan-300">3D</span> Y{" "}
            <span className="inline-block rounded-lg bg-gradient-to-r from-[#EF233C] to-[#B91C24] px-2.5 py-0.5 text-white">
              RAYOS-X DE DETALLE
            </span>
          </h2>
          <p className="mt-1 max-w-2xl text-[0.68rem] text-blue-100/85 sm:text-xs">
            Desliza el escáner sobre la imagen para comparar el outfit en el modelo frente al zoom exclusivo de la prenda sola, o selecciona cualquiera de las 6 tarjetas 3D sin hacer scroll.
          </p>
        </div>

        {/* Escenario Principal Compacto: Todo visible en 1 solo pantallazo */}
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-12 lg:gap-5">
          {/* COLUMNA IZQUIERDA (4 cols): Cuadro del Escáner un poco más pequeño para verse completo en el pantallazo */}
          <div className="mx-auto w-full max-w-[310px] sm:max-w-[330px] lg:col-span-4 lg:max-w-none">
            <div className="overflow-hidden rounded-2xl border-2 border-white/25 bg-slate-900/85 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md">
              {/* Selector de Modo del Visor */}
              <div className="mb-2 flex items-center justify-between gap-1 rounded-xl bg-slate-950/80 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("scanner")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[0.58rem] font-extrabold uppercase tracking-wider transition-all",
                    viewMode === "scanner"
                      ? "bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] text-white shadow-sm"
                      : "text-slate-300 hover:text-white",
                  )}
                >
                  <ScanEye className="size-3" aria-hidden />
                  <span>Escáner 50/50</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("closeup")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[0.58rem] font-extrabold uppercase tracking-wider transition-all",
                    viewMode === "closeup"
                      ? "bg-gradient-to-r from-[#EF233C] to-[#B91C24] text-white shadow-sm"
                      : "text-slate-300 hover:text-white",
                  )}
                >
                  <Eye className="size-3" aria-hidden />
                  <span>Solo Prenda</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("ficha")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[0.58rem] font-extrabold uppercase tracking-wider transition-all",
                    viewMode === "ficha"
                      ? "bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] text-white shadow-sm"
                      : "text-slate-300 hover:text-white",
                  )}
                >
                  <Layers className="size-3" aria-hidden />
                  <span>Ficha Oficial</span>
                </button>
              </div>

              {/* Visor Principal Compacto para encajar completo en pantalla */}
              <div
                ref={scannerRef}
                onMouseMove={(e) => {
                  if (viewMode === "scanner") handleScannerMove(e.clientX);
                }}
                onTouchMove={(e) => {
                  if (viewMode === "scanner" && e.touches[0]) {
                    handleScannerMove(e.touches[0].clientX);
                  }
                }}
                className="relative h-[310px] w-full cursor-ew-resize select-none overflow-hidden rounded-xl bg-slate-100 sm:h-[335px] lg:h-[350px]"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${current.id}-${viewMode}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0"
                  >
                    {viewMode === "scanner" ? (
                      <>
                        {/* Capa de Fondo (Derecha): Zoom cercano de SOLO LA PRENDA */}
                        <Image
                          src={current.closeupImage}
                          alt={`Zoom de prenda ${current.name}`}
                          fill
                          sizes="(min-width: 1024px) 32vw, 90vw"
                          className="object-cover"
                        />

                        {/* Capa Recortada (Izquierda): Vista con el MODELO */}
                        <div
                          style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                          className="absolute inset-0"
                        >
                          <Image
                            src={current.modelImage}
                            alt={`Modelo con ${current.name}`}
                            fill
                            sizes="(min-width: 1024px) 32vw, 90vw"
                            className="object-cover object-top"
                          />
                        </div>

                        {/* Línea divisoria láser interactiva */}
                        <div
                          style={{ left: `${splitPercent}%` }}
                          className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-gradient-to-b from-cyan-300 via-[#0055FF] to-[#EF233C] shadow-[0_0_14px_rgba(0,85,255,0.9)]"
                        >
                          <span className="absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#0055FF] text-white shadow-xl">
                            <MoveHorizontal className="size-3.5" aria-hidden />
                          </span>
                        </div>

                        {/* Etiquetas flotantes Izquierda / Derecha */}
                        <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-slate-950/75 px-2.5 py-0.5 font-mono text-[0.52rem] font-extrabold uppercase text-white backdrop-blur-xs">
                          Vista Modelo
                        </span>
                        <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-[#EF233C] px-2.5 py-0.5 font-mono text-[0.52rem] font-extrabold uppercase text-white shadow-md">
                          Zoom Solo Prenda
                        </span>
                      </>
                    ) : viewMode === "closeup" ? (
                      <>
                        <Image
                          src={current.closeupImage}
                          alt={`Solo prenda ${current.name}`}
                          fill
                          sizes="(min-width: 1024px) 32vw, 90vw"
                          className="object-cover"
                        />
                        {/* Puntos Interactivos (Hotspots) sobre la Prenda Sola */}
                        {current.hotspots.map((spot, idx) => (
                          <button
                            key={spot.title}
                            type="button"
                            onClick={() => setActiveHotspot(idx)}
                            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                            className={cn(
                              "absolute z-20 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white font-mono text-[0.65rem] font-black text-white shadow-xl transition-transform hover:scale-125",
                              activeHotspot === idx ? "bg-[#EF233C] scale-115" : "bg-[#0055FF]",
                            )}
                            aria-label={`Ver detalle: ${spot.title}`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </>
                    ) : (
                      <Image
                        src={current.fichaImage}
                        alt={`Ficha oficial de catálogo ${current.name}`}
                        fill
                        sizes="(min-width: 1024px) 32vw, 90vw"
                        className="object-cover"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Pie del Escáner: Deslizador manual accesible */}
              {viewMode === "scanner" && (
                <div className="mt-2 flex items-center gap-2 px-1.5">
                  <span className="font-mono text-[0.55rem] font-bold uppercase text-cyan-300">
                    Modelo
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={Math.round(splitPercent)}
                    onChange={(e) => setSplitPercent(Number(e.target.value))}
                    aria-label="Comparar vista con modelo y vista de solo la prenda"
                    className="h-1 flex-1 cursor-pointer accent-[#EF233C]"
                  />
                  <span className="font-mono text-[0.55rem] font-bold uppercase text-amber-300">
                    Solo Prenda
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA (8 cols): Selector de 6 Cuadritos Arriba + Ficha Técnica Compacta Abajo */}
          <div className="space-y-3 lg:col-span-8">
            {/* 1. Selector de los 6 Productos en Cuadritos Pequeños (6 en fila sin hacer scroll) */}
            <div className="rounded-2xl border border-white/15 bg-white/5 p-2.5 backdrop-blur-md">
              <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
                <span className="font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-cyan-300">
                  Selecciona qué prenda escanear (pasa el mouse para zoom 3D):
                </span>
                <span className="hidden font-mono text-[0.56rem] text-blue-200 sm:inline">
                  6 modelos destacados
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {SHOWCASE_ITEMS.map((item, idx) => (
                  <Tilt3DProductCard
                    key={item.id}
                    item={item}
                    isSelected={idx === selectedIdx}
                    onSelect={() => setSelectedIdx(idx)}
                  />
                ))}
              </div>
            </div>

            {/* 2. Panel Compacto de Información del Modelo Seleccionado */}
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-md sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EF233C] px-2.5 py-0.5 font-mono text-[0.58rem] font-black uppercase tracking-wider text-white">
                    {current.code}
                  </span>
                  <span className="rounded-full bg-[#0055FF] px-2.5 py-0.5 font-mono text-[0.58rem] font-extrabold uppercase tracking-wider text-white">
                    {current.categoryLabel}
                  </span>
                  <h3 className="font-sans text-base font-black uppercase tracking-tight text-white sm:text-lg">
                    {current.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-lg font-black text-white sm:text-xl">
                    {current.retailPrice}
                  </span>
                  <span className="rounded-full bg-amber-300 px-2.5 py-0.5 font-mono text-[0.6rem] font-black text-slate-950">
                    Mayorista: {current.wholesalePrice}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-xl bg-slate-950/55 px-2.5 py-2">
                  <Ruler className="size-4 shrink-0 text-cyan-300" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-mono text-[0.52rem] uppercase text-slate-400">Entalle / Fit</p>
                    <p className="truncate text-[0.68rem] font-extrabold text-white">{current.fitLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-950/55 px-2.5 py-2">
                  <ShieldCheck className="size-4 shrink-0 text-amber-300" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-mono text-[0.52rem] uppercase text-slate-400">Tela Oficial</p>
                    <p className="truncate text-[0.68rem] font-extrabold text-white">{current.fabricLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-950/55 px-2.5 py-2">
                  <Tag className="size-4 shrink-0 text-[#EF233C]" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-mono text-[0.52rem] uppercase text-slate-400">Rango de Tallas</p>
                    <p className="truncate text-[0.68rem] font-extrabold text-white">{current.sizesLabel}</p>
                  </div>
                </div>
              </div>

              {/* Puntos de Inspección Técnica de la Prenda */}
              <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
                {current.hotspots.map((spot, idx) => (
                  <button
                    key={spot.title}
                    type="button"
                    onClick={() => {
                      setActiveHotspot(idx);
                      setViewMode("closeup");
                    }}
                    className={cn(
                      "flex flex-col items-start rounded-xl border p-2 text-left transition-all",
                      activeHotspot === idx
                        ? "border-cyan-300 bg-[#0055FF]/40 shadow-sm"
                        : "border-white/15 bg-slate-950/40 hover:border-white/35",
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-amber-300" aria-hidden />
                      <span className="font-sans text-[0.65rem] font-black uppercase text-white">
                        {spot.title}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[0.6rem] leading-snug text-blue-100/85">
                      {spot.detail}
                    </p>
                  </button>
                ))}
              </div>

              {/* Colores y CTA directo al producto */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[0.58rem] font-bold uppercase text-blue-200">
                    Colores:
                  </span>
                  <div className="flex items-center gap-1">
                    {current.colors.map((c) => (
                      <span
                        key={c.name}
                        title={c.name}
                        className="size-4 rounded-full border border-white/70 shadow-2xs"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={current.href}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#EF233C] to-[#B91C24] px-4 text-[0.65rem] font-black uppercase tracking-wider text-white shadow-md transition-transform hover:scale-105"
                  >
                    <span>Comprar {current.code}</span>
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                  <Link
                    href="/catalogo?audiencia=hombre"
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-[#0055FF]"
                  >
                    <FaLayerGroup className="size-3 text-cyan-300" aria-hidden />
                    <span>Ver Catálogo</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
