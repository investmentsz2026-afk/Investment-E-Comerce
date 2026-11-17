import type { MainNavItem, NavLink } from "@/types/navigation";

const men = (label: string, slug?: string): NavLink => ({
  label,
  target: slug
    ? { kind: "href", href: `/catalogo/${slug}?audiencia=hombre` }
    : { kind: "href", href: "/catalogo?audiencia=hombre" },
});

export const mainNav: readonly MainNavItem[] = [
  {
    id: "hombre",
    label: "Hombre",
    target: { kind: "href", href: "/catalogo?audiencia=hombre" },
    megaMenu: {
      columns: [
        {
          title: "Categorías del Catálogo",
          links: [
            { label: "Ver Todo el Catálogo Hombre", target: { kind: "href", href: "/catalogo?audiencia=hombre" } },
            men("Jeans Denim (Relaxed, Comfort, Parker, Bull)", "denim"),
            men("Pantalones & Bermudas Drill", "pantalones"),
            men("Camisas (Zair Denim & Kendall)", "camisas"),
            men("Polos Piqué Clásicos (Mark)", "polos"),
          ],
        },
        {
          title: "Modelos Oficiales 2026",
          links: [
            { label: "Pantalón Drill King 767 — Skinny Fit", target: { kind: "href", href: "/producto/pantalon-drill-king-767" } },
            { label: "Pantalón Drill Fendy 769 — Slim Fit", target: { kind: "href", href: "/producto/pantalon-drill-fendy-769" } },
            { label: "Pantalón Drill Rolex 770 — Straight Fit", target: { kind: "href", href: "/producto/pantalon-drill-rolex-770" } },
            { label: "Bermuda Drill Balance 770 — Straight Fit", target: { kind: "href", href: "/producto/bermuda-drill-balance-770" } },
            { label: "Jean Denim Comfort 762 — Classic Fit", target: { kind: "href", href: "/producto/jean-denim-comfort-762" } },
            { label: "Jean Denim Relaxed 750 — Classic Fit", target: { kind: "href", href: "/producto/jean-denim-relaxed-750" } },
            { label: "Camisa Denim Zair — Slim Fit", target: { kind: "href", href: "/producto/camisa-denim-zair-slim-fit" } },
            { label: "Camisa Clásica Kendall — Slim Fit", target: { kind: "href", href: "/producto/camisa-clasica-kendall-slim-fit" } },
            { label: "Polo Piqué Clásico Mark — Classic Fit", target: { kind: "href", href: "/producto/polo-pique-clasico-mark" } },
          ],
        },
      ],
      feature: {
        eyebrow: "Catálogo Oficial 2026",
        title: "Colección Hombre American Colt JEANS™",
        image: {
          src: "/catalogo-colt/16-portada-jeans-2026.png",
          alt: "Catálogo Hombre American Colt JEANS 2026",
        },
        target: { kind: "href", href: "/catalogo?audiencia=hombre" },
      },
    },
  },
  {
    id: "jeans-drill",
    label: "Jeans & Drill",
    target: { kind: "href", href: "/catalogo/denim?audiencia=hombre" },
    megaMenu: {
      columns: [
        {
          title: "Línea Jeans Denim",
          links: [
            { label: "Jean Denim Relaxed 750 — Classic Fit", target: { kind: "href", href: "/producto/jean-denim-relaxed-750" } },
            { label: "Jean Denim Comfort 762 — Classic Fit", target: { kind: "href", href: "/producto/jean-denim-comfort-762" } },
            { label: "Jean Clásico Parker 769 — Slim Fit", target: { kind: "href", href: "/producto/jean-clasico-parker-769" } },
            { label: "Jean Bull Denim 750 — Classic Fit", target: { kind: "href", href: "/producto/jean-bull-denim-750" } },
          ],
        },
        {
          title: "Línea Drill Premium",
          links: [
            { label: "Pantalón Drill King 767 — Skinny Fit", target: { kind: "href", href: "/producto/pantalon-drill-king-767" } },
            { label: "Pantalón Drill Fendy 769 — Slim Fit", target: { kind: "href", href: "/producto/pantalon-drill-fendy-769" } },
            { label: "Pantalón Drill Rolex 770 — Straight Fit", target: { kind: "href", href: "/producto/pantalon-drill-rolex-770" } },
            { label: "Bermuda Drill Balance 770 — Straight Fit", target: { kind: "href", href: "/producto/bermuda-drill-balance-770" } },
          ],
        },
      ],
      feature: {
        eyebrow: "Línea Drill & Clásica",
        title: "Calce perfecto y máxima durabilidad",
        image: {
          src: "/catalogo-colt/08-linea-drill-premium.png",
          alt: "Línea Drill Premium American Colt",
        },
        target: { kind: "href", href: "/catalogo/pantalones?audiencia=hombre" },
      },
    },
  },
  {
    id: "camisas-polos",
    label: "Camisas & Polos",
    target: { kind: "href", href: "/catalogo/camisas?audiencia=hombre" },
    megaMenu: {
      columns: [
        {
          title: "Camisas & Polos del Catálogo",
          links: [
            { label: "Camisa Denim Zair — Slim Fit", target: { kind: "href", href: "/producto/camisa-denim-zair-slim-fit" } },
            { label: "Camisa Clásica Kendall — Slim Fit", target: { kind: "href", href: "/producto/camisa-clasica-kendall-slim-fit" } },
            { label: "Polo Piqué Clásico Mark — Classic Fit", target: { kind: "href", href: "/producto/polo-pique-clasico-mark" } },
          ],
        },
      ],
      feature: {
        eyebrow: "Algodón Peruano",
        title: "Camisas Zair, Kendall y Polo Mark",
        image: {
          src: "/catalogo-colt/01-estudio-azul.png",
          alt: "Camisas y Polos American Colt",
        },
        target: { kind: "href", href: "/catalogo/camisas?audiencia=hombre" },
      },
    },
  },
  {
    id: "novedades",
    label: "Ofertas",
    target: { kind: "href", href: "/catalogo?novedades=1&oferta=50" },
  },
];

export const wholesaleNav: NavLink = {
  label: "Venta por mayor",
  target: { kind: "href", href: "/mayorista" },
};

export const trendingSearches = [
  "King 767",
  "Camisa Zair",
  "Jean Comfort 762",
  "Fendy 769",
  "Polo Mark",
  "Bermuda Balance 770",
] as const;
