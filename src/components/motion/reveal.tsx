"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { ease } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Desplazamiento vertical inicial en px. */
  y?: number;
  /** Fracción visible necesaria para activar la animación. */
  amount?: number;
}

/** Aparición suave al entrar en el viewport (opacidad + transform, una sola vez). */
export function Reveal({ children, className, delay = 0, y = 28, amount = 0.25 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 1, ease: ease.luxe, delay }}
    >
      {children}
    </motion.div>
  );
}
