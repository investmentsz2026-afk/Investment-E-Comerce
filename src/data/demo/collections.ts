/**
 * ⚠️ DATOS DE DEMOSTRACIÓN — colecciones editoriales de ejemplo para la Fase 1.
 * Serán reemplazadas por datos de Neon PostgreSQL en la Fase 2 (mismo contrato `Collection`).
 */
import type { Collection } from "@/types/catalog";

import sastreria from "@/assets/images/collections/sastreria.jpg";
import esenciales from "@/assets/images/collections/esenciales.jpg";
import denim from "@/assets/images/collections/denim.jpg";
import punto from "@/assets/images/collections/punto.jpg";

export const demoCollections = [
  {
    id: "col-sastreria",
    slug: "sastreria-moderna",
    name: "Sastrería moderna",
    description: "Cortes precisos y caídas relajadas para la oficina y más allá.",
    image: { src: sastreria, alt: "Hombre abotonando un saco azul marino sobre camisa blanca y corbata" },
  },
  {
    id: "col-esenciales",
    slug: "esenciales",
    name: "Esenciales",
    description: "La base de todo guardarropa: polos, camisas y básicos impecables.",
    image: { src: esenciales, alt: "Polo blanco colgado en una percha frente a un muro de concreto" },
  },
  {
    id: "col-denim",
    slug: "denim",
    name: "Denim",
    description: "Índigos profundos y lavados honestos, hechos para acompañarte.",
    image: { src: denim, alt: "Pila de jeans doblados en distintos tonos de azul" },
  },
  {
    id: "col-punto",
    slug: "tejidos-de-punto",
    name: "Tejidos de punto",
    description: "Texturas suaves en tonos tierra para las noches frescas.",
    image: { src: punto, alt: "Prendas de punto en tonos crema y tierra colgadas en un perchero" },
  },
] as const satisfies readonly Collection[];
