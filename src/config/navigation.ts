import type { MainNavItem, NavLink } from "@/types/navigation";
import { media } from "./media";
import { demoCollections } from "@/data/demo/collections";

const women = (label: string, slug?: string): NavLink => ({
  label,
  target: slug ? { kind: "href", href: `/catalogo/${slug}` } : { kind: "href", href: "/catalogo?audiencia=mujer" },
});
const men = (label: string, slug?: string): NavLink => ({
  label,
  target: slug ? { kind: "href", href: `/catalogo/${slug}` } : { kind: "href", href: "/catalogo?audiencia=hombre" },
});
const collection = (label: string, slug: string): NavLink => ({
  label,
  target: { kind: "href", href: `/catalogo/${slug}` },
});

export const mainNav: readonly MainNavItem[] = [
  {
    id: "mujer",
    label: "Mujer",
    target: { kind: "href", href: "/catalogo?audiencia=mujer" },
    megaMenu: {
      columns: [
        {
          title: "Prendas",
          links: [
            women("Blusas y camisas", "blusas"),
            women("Polos y tops", "polos"),
            women("Vestidos", "vestidos"),
            women("Pantalones", "pantalones"),
            women("Casacas y abrigos", "casacas"),
            women("Tejidos de punto", "tejidos-de-punto"),
          ],
        },
        {
          title: "Destacados",
          links: [
            { label: "Novedades", target: { kind: "href", href: "/catalogo?novedades=1&audiencia=mujer" } },
            women("Sastrería", "sastreria"),
            { label: "Esenciales", target: { kind: "href", href: "/catalogo?audiencia=mujer" } },
            women("Denim", "denim"),
          ],
        },
      ],
      feature: {
        eyebrow: "Campaña 26/27",
        title: "Abrigos que definen la temporada",
        image: media.heroMain,
        target: { kind: "href", href: "/catalogo?audiencia=mujer" },
      },
    },
  },
  {
    id: "hombre",
    label: "Hombre",
    target: { kind: "href", href: "/catalogo?audiencia=hombre" },
    megaMenu: {
      columns: [
        {
          title: "Prendas",
          links: [
            men("Camisas", "camisas"),
            men("Polos", "polos"),
            men("Pantalones", "pantalones"),
            men("Casacas", "casacas"),
            men("Blazers", "blazers"),
            men("Tejidos de punto", "tejidos-de-punto"),
          ],
        },
        {
          title: "Destacados",
          links: [
            { label: "Novedades", target: { kind: "href", href: "/catalogo?novedades=1&audiencia=hombre" } },
            men("Sastrería moderna", "sastreria"),
            { label: "Esenciales", target: { kind: "href", href: "/catalogo?audiencia=hombre" } },
            men("Denim", "denim"),
          ],
        },
      ],
      feature: {
        eyebrow: "Sastrería moderna",
        title: "El nuevo traje es relajado",
        image: demoCollections[0].image,
        target: { kind: "href", href: "/catalogo/sastreria" },
      },
    },
  },
  {
    id: "colecciones",
    label: "Colecciones",
    target: { kind: "href", href: "/catalogo" },
    megaMenu: {
      columns: [
        {
          title: "Colecciones",
          links: [
            collection("Sastrería moderna", "sastreria"),
            collection("Esenciales", "polos"),
            collection("Denim", "denim"),
            collection("Tejidos de punto", "tejidos-de-punto"),
          ],
        },
        {
          title: "Explorar",
          links: [
            { label: "Ver todo el catálogo", target: { kind: "href", href: "/catalogo" } },
            { label: "Novedades", target: { kind: "href", href: "/catalogo?novedades=1" } },
          ],
        },
      ],
      feature: {
        eyebrow: "Editorial",
        title: "Esenciales que perduran",
        image: demoCollections[1].image,
        target: { kind: "href", href: "/catalogo" },
      },
    },
  },
  {
    id: "novedades",
    label: "Novedades",
    target: { kind: "href", href: "/catalogo?novedades=1" },
  },
];

export const wholesaleNav: NavLink = {
  label: "Venta por mayor",
  target: { kind: "href", href: "/mayorista/registro" },
};

export const trendingSearches = ["Blazer sastre", "Polo esencial", "Denim", "Camisa de popelina", "Tejidos de punto", "Uniformes corporativos"] as const;
