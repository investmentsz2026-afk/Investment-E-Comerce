import type { Transition, Variants } from "motion/react";

/**
 * Sistema de movimiento de INVESTMENTS.
 * Todas las animaciones usan transform/opacity para mantener 60 FPS.
 * El respeto a prefers-reduced-motion se aplica globalmente con <MotionConfig reducedMotion="user">.
 */

export const ease = {
  /** Desaceleración larga, sensación editorial. */
  luxe: [0.16, 1, 0.3, 1],
  /** Cortinas y revelados de imagen. */
  curtain: [0.76, 0, 0.24, 1],
  /** Microinteracciones. */
  soft: [0.22, 1, 0.36, 1],
} as const;

export const duration = {
  fast: 0.35,
  base: 0.7,
  slow: 1.1,
  cinematic: 1.6,
} as const;

export const transitions = {
  luxe: { duration: duration.slow, ease: ease.luxe },
  curtain: { duration: duration.cinematic, ease: ease.curtain },
  soft: { duration: duration.fast, ease: ease.soft },
} satisfies Record<string, Transition>;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: transitions.luxe },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base, ease: ease.soft } },
};

/** Texto que emerge desde una máscara (la línea padre debe tener overflow-hidden). */
export const maskUp: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: duration.slow, ease: ease.luxe } },
};

export function stagger(staggerChildren = 0.08, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren, delayChildren } },
  };
}
