"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Muestra el descriptor bajo el logotipo. */
  withDescriptor?: boolean;
  /** Tamaño del logo visual */
  size?: "sm" | "md" | "lg";
}

// Coordenadas normalizadas en viewBox="0 0 200 84" (8 vértices para transición limpia Rectángulo <-> Rombo)
const OUTER_RECT_POINTS = "9,42 9,6 100,6 191,6 191,42 191,78 100,78 9,78";
const INNER_RECT_POINTS = "12.5,42 12.5,9.5 100,9.5 187.5,9.5 187.5,42 187.5,74.5 100,74.5 12.5,74.5";

const OUTER_RHOMBUS_POINTS = "1,42 25,12 100,1.5 175,12 199,42 175,72 100,82.5 25,72";
const INNER_RHOMBUS_POINTS = "6.5,42 28,15.5 100,5.5 172,15.5 193.5,42 172,68.5 100,78.5 28,68.5";

/**
 * Logotipo oficial American Colt JEANS™ tal cual el arte original (1024×433)
 * con contorno fino de dos líneas que pasa de rectángulo a rombo al acercar el cursor.
 */
export function Logo({ className, withDescriptor = false, size = "md" }: LogoProps) {
  const [hovered, setHovered] = useState(false);
  const uid = useId().replace(/:/g, "");
  const outerGradId = `coltLogoFineOuter-${uid}`;
  const innerGradId = `coltLogoFineInner-${uid}`;

  const dimensions =
    size === "sm"
      ? "h-9 aspect-[1024/433] sm:h-10"
      : size === "lg"
        ? "h-12 aspect-[1024/433] sm:h-14"
        : "h-10 aspect-[1024/433] sm:h-11";

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group/logo relative inline-flex flex-col items-center leading-none select-none",
        className,
      )}
    >
      <span className="relative inline-flex items-center justify-center px-2 py-1">
        {/* Contorno arquitectónico FINO de dos líneas (Rectángulo en reposo -> Rombo en hover) */}
        <svg
          viewBox="0 0 200 84"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-1 -inset-y-1 h-[calc(100%+8px)] w-[calc(100%+8px)] overflow-visible drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
        >
          <defs>
            <linearGradient id={outerGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={hovered ? "0.85" : "0.52"} />
              <stop offset="50%" stopColor="#E2E8F0" stopOpacity={hovered ? "0.6" : "0.32"} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={hovered ? "0.85" : "0.52"} />
            </linearGradient>
            <linearGradient id={innerGradId} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" stopOpacity={hovered ? "0.52" : "0.28"} />
              <stop offset="50%" stopColor="#CBD5E1" stopOpacity={hovered ? "0.35" : "0.18"} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={hovered ? "0.52" : "0.28"} />
            </linearGradient>
          </defs>

          {/* Línea 1 exterior ultrafina */}
          <motion.polygon
            initial={false}
            animate={{ points: hovered ? OUTER_RHOMBUS_POINTS : OUTER_RECT_POINTS }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            fill="none"
            stroke={`url(#${outerGradId})`}
            strokeWidth={hovered ? "1.05" : "0.85"}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />

          {/* Línea 2 interior ultrafina */}
          <motion.polygon
            initial={false}
            animate={{ points: hovered ? INNER_RHOMBUS_POINTS : INNER_RECT_POINTS }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            fill="none"
            stroke={`url(#${innerGradId})`}
            strokeWidth={hovered ? "0.75" : "0.6"}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>

        {/* Logotipo oficial exacto 1024:433 tal cual la imagen original */}
        <motion.span
          initial={false}
          animate={{
            scale: hovered ? 0.87 : 1,
            y: hovered ? -0.5 : 0,
          }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative z-10 inline-block overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.42)]",
            dimensions,
          )}
        >
          <Image
            src="/logo-american-colt-oficial.jpg"
            alt="American Colt JEANS™"
            fill
            unoptimized
            sizes="200px"
            priority
            className="object-fill"
          />
          {/* Brillo satinado sutil al pasar el mouse */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/18 to-transparent transition-transform duration-500",
              hovered ? "translate-x-full" : "-translate-x-full",
            )}
          />
          <span className="sr-only">American Colt JEANS</span>
        </motion.span>
      </span>

      {withDescriptor ? (
        <span className="eyebrow mt-2 text-[0.55rem] tracking-[0.36em] opacity-75">
          Jeans &amp; Moda · Lima — Perú
        </span>
      ) : null}
    </span>
  );
}
