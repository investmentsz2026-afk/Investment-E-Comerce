"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfiniteCardSliderProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  /** Intervalo de avance automático uno por uno en milisegundos (por defecto 3400ms) */
  autoPlayMs?: number;
  /** Cantidad de tarjetas visibles en escritorio (4 por defecto, como Pionier.pe) */
  desktopCols?: 3 | 4 | 5;
  className?: string;
}

/**
 * Carrusel infinito que avanza UNA tarjeta a la vez (uno por uno) en bucle continuo
 * sin rebobinar hacia atrás al llegar al final, y con flechas laterales manuales (< y >).
 */
export function InfiniteCardSlider<T>({
  items,
  renderItem,
  keyExtractor,
  autoPlayMs = 3400,
  desktopCols = 4,
  className,
}: InfiniteCardSliderProps<T>) {
  const count = items.length;
  // Triplicamos la lista para que después de la última tarjeta aparezca inmediatamente la primera
  const extendedItems = count > 0 ? [...items, ...items, ...items] : [];

  const [currentIndex, setCurrentIndex] = useState(count);
  const [enableTransition, setEnableTransition] = useState(true);
  const [paused, setPaused] = useState(false);
  const [visibleCols, setVisibleCols] = useState<number>(desktopCols);
  const isAnimatingRef = useRef(false);

  // Detectar columnas visibles según ancho de pantalla (2 en móvil, 3 en tablet, desktopCols en desktop)
  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      if (w < 640) setVisibleCols(2);
      else if (w < 1024) setVisibleCols(3);
      else setVisibleCols(desktopCols);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, [desktopCols]);

  const stepNext = () => {
    if (count <= 1 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setEnableTransition(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const stepPrev = () => {
    if (count <= 1 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setEnableTransition(true);
    setCurrentIndex((prev) => prev - 1);
  };

  // Al terminar la transición de 1 tarjeta, si salimos del bloque central [count, 2*count - 1],
  // reposicionamos silenciosamente sin animación al índice equivalente del bloque central.
  const handleTransitionEnd = () => {
    isAnimatingRef.current = false;
    if (count <= 1) return;
    if (currentIndex >= count * 2) {
      setEnableTransition(false);
      setCurrentIndex((prev) => prev - count);
    } else if (currentIndex < count) {
      setEnableTransition(false);
      setCurrentIndex((prev) => prev + count);
    }
  };

  // Seguridad: liberar bloqueo si una pestaña estuvo en segundo plano
  useEffect(() => {
    const unlockTimer = window.setTimeout(() => {
      isAnimatingRef.current = false;
    }, 600);
    return () => window.clearTimeout(unlockTimer);
  }, [currentIndex]);

  // Avance automático uno por uno
  useEffect(() => {
    if (paused || count <= 1 || autoPlayMs <= 0) return;
    const timer = window.setInterval(() => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      setEnableTransition(true);
      setCurrentIndex((prev) => prev + 1);
    }, autoPlayMs);
    return () => window.clearInterval(timer);
  }, [paused, count, autoPlayMs]);

  if (count === 0) return null;

  const slideWidthPercent = 100 / visibleCols;
  const translateXPercent = -(currentIndex * slideWidthPercent);
  const activeDotIndex = ((currentIndex % count) + count) % count;

  return (
    <div
      className={cn("relative group/slider", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Botón Lateral Izquierdo (<) reluciente */}
      <button
        type="button"
        onClick={stepPrev}
        aria-label="Anterior"
        className="absolute -left-2 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-2xl border border-blue-200 bg-paper text-[#0055FF] shadow-lg transition-all duration-200 hover:scale-110 hover:bg-[#0055FF] hover:text-paper sm:-left-4 sm:size-11"
      >
        <ChevronLeft className="size-5 sm:size-6 stroke-[2.5]" aria-hidden />
      </button>

      {/* Botón Lateral Derecho (>) reluciente */}
      <button
        type="button"
        onClick={stepNext}
        aria-label="Siguiente"
        className="absolute -right-2 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-2xl border border-blue-200 bg-paper text-[#0055FF] shadow-lg transition-all duration-200 hover:scale-110 hover:bg-[#0055FF] hover:text-paper sm:-right-4 sm:size-11"
      >
        <ChevronRight className="size-5 sm:size-6 stroke-[2.5]" aria-hidden />
      </button>

      {/* Ventana del Carrusel */}
      <div className="overflow-hidden px-1 py-2">
        <div
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translate3d(${translateXPercent}%, 0, 0)`,
            transition: enableTransition
              ? "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
          }}
          className="flex -mx-2"
        >
          {extendedItems.map((item, idx) => (
            <div
              key={`${keyExtractor(item, idx % count)}-clone-${idx}`}
              style={{ width: `${slideWidthPercent}%` }}
              className="shrink-0 px-2"
            >
              {renderItem(item, idx % count)}
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores de posición inferior */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        {items.map((item, idx) => (
          <button
            key={keyExtractor(item, idx)}
            type="button"
            aria-label={`Ir al elemento ${idx + 1}`}
            onClick={() => {
              setEnableTransition(true);
              setCurrentIndex(count + idx);
            }}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              activeDotIndex === idx
                ? "w-8 bg-gradient-to-r from-[#0055FF] to-[#EF233C]"
                : "w-2 bg-blue-200 hover:bg-[#0055FF]/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
