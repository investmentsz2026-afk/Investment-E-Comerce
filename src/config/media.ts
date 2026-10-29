/**
 * Registro central de fotografía editorial (campaña, modalidades y secciones).
 * Las importaciones estáticas permiten a Next.js conocer dimensiones y generar placeholders "blur".
 * Para reemplazar una fotografía basta con sustituir el archivo en src/assets/images
 * (ver docs/ASSETS.md para el origen y la licencia de cada imagen).
 */
import heroMain from "@/assets/images/campaign/hero-main.jpg";
import heroDetail from "@/assets/images/campaign/hero-detail.jpg";
import retail from "@/assets/images/modalities/retail.jpg";
import wholesale from "@/assets/images/modalities/wholesale.jpg";
import atelier from "@/assets/images/editorial/atelier.jpg";
import manifesto from "@/assets/images/editorial/manifesto.jpg";
import type { ImageAsset } from "@/types/catalog";

export const media = {
  heroMain: {
    src: heroMain,
    alt: "Modelo con abrigo largo de lana gris carbón y cuello alto crema entre arquitectura de concreto bañada por luz de tarde",
  },
  heroDetail: {
    src: heroDetail,
    alt: "Detalle de una mano ajustando la solapa de un abrigo de lana en espiga",
  },
  retail: {
    src: retail,
    alt: "Clienta caminando por una avenida de Lima con blazer de lino crema y bolsa de compras",
  },
  wholesale: {
    src: wholesale,
    alt: "Camisas dobladas en tonos azul, blanco y vino sobre una mesa de madera",
  },
  atelier: {
    src: atelier,
    alt: "Percha con prendas en tonos neutros: punto crema, camel y negro",
  },
  manifesto: {
    src: manifesto,
    alt: "Polos en tono salvia colgados en perchas de madera",
  },
} as const satisfies Record<string, ImageAsset>;
