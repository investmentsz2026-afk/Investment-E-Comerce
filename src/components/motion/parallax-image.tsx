"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { ImageAsset } from "@/types/catalog";
import { cn } from "@/lib/utils";

interface ParallaxImageProps {
  image: ImageAsset;
  sizes: string;
  className?: string;
  imageClassName?: string;
  /** Intensidad del parallax como % de la altura del contenedor (moderado por defecto). */
  strength?: number;
  preload?: boolean;
}

/**
 * Imagen con parallax moderado ligado al scroll.
 * El contenedor recorta y la imagen interior se desplaza con transform (GPU).
 */
export function ParallaxImage({
  image,
  sizes,
  className,
  imageClassName,
  strength = 8,
  preload = false,
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // El lienzo interior mide (100 + 2·strength)% del contenedor; convertimos al % de su propia altura.
  const range = (strength / (100 + 2 * strength)) * 100;
  const y = useTransform(scrollYProgress, [0, 1], [`-${range}%`, `${range}%`]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute inset-x-0 will-change-transform"
        style={{ top: `-${strength}%`, bottom: `-${strength}%`, y: reduceMotion ? 0 : y }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          preload={preload}
          placeholder={typeof image.src === "string" ? "empty" : "blur"}
          className={cn("object-cover", imageClassName)}
        />
      </motion.div>
    </div>
  );
}
