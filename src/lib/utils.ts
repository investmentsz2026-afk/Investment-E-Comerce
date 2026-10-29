import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Instancia personalizada de twMerge que reconoce los tokens tipográficos
 * fluidos definidos en @theme (globals.css) para evitar que sean eliminados
 * por colisión con utilidades de color de texto.
 */
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display-2xl",
        "text-display-xl",
        "text-display-lg",
        "text-display-md",
        "text-display-sm",
        "text-eyebrow",
      ],
    },
  },
});

/** Combina clases condicionales y resuelve conflictos de Tailwind de forma segura. */
export function cn(...inputs: ClassValue[]): string {
  return customTwMerge(clsx(inputs));
}

