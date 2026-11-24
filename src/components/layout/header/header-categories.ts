import type { ImageAsset } from "@/types/catalog";

export interface DrawerSubGroup {
  id: string;
  title: string;
  badge?: string;
  items: readonly { label: string; href: string; tag?: string }[];
}

export interface DrawerCategoryConfig {
  id: string;
  label: string;
  subtitle: string;
  allHref: string;
  highlight?: boolean;
  banner: {
    tag: string;
    title: string;
    href: string;
    image: ImageAsset;
  };
  groups: readonly DrawerSubGroup[];
}

export const DRAWER_CATEGORIES: readonly DrawerCategoryConfig[] = [
  {
    id: "hombre",
    label: "Catálogo Hombre",
    subtitle: "Los 11 modelos oficiales American Colt JEANS™ 2026",
    allHref: "/catalogo?audiencia=hombre",
    banner: {
      tag: "CATÁLOGO OFICIAL 2026",
      title: "Toda la Colección Masculina por Unidad y Mayor",
      href: "/catalogo?audiencia=hombre",
      image: {
        src: "/catalogo-colt/16-portada-jeans-2026.png",
        alt: "Catálogo Hombre American Colt JEANS 2026",
      },
    },
    groups: [
      {
        id: "h-drill",
        title: "Línea Drill Premium (Pantalones y Bermudas)",
        badge: "Stretch",
        items: [
          { label: "Pantalón Drill King 767 — Skinny Fit", href: "/producto/pantalon-drill-king-767", tag: "S/ 140" },
          { label: "Pantalón Drill Fendy 769 — Slim Fit", href: "/producto/pantalon-drill-fendy-769", tag: "S/ 130" },
          { label: "Pantalón Drill Rolex 770 — Straight Fit", href: "/producto/pantalon-drill-rolex-770", tag: "S/ 130" },
          { label: "Bermuda Drill Balance 770 — Straight Fit", href: "/producto/bermuda-drill-balance-770", tag: "S/ 120" },
          { label: "Ver toda la Línea Drill", href: "/catalogo/pantalones?audiencia=hombre" },
        ],
      },
      {
        id: "h-jeans",
        title: "Línea Clásica Jeans Denim",
        badge: "Tallas 28-46",
        items: [
          { label: "Jean Denim Comfort 762 — Classic Fit", href: "/producto/jean-denim-comfort-762", tag: "S/ 130" },
          { label: "Jean Denim Relaxed 750 — Classic Fit", href: "/producto/jean-denim-relaxed-750", tag: "S/ 120" },
          { label: "Jean Clásico Parker 769 — Slim Fit", href: "/producto/jean-clasico-parker-769", tag: "S/ 130" },
          { label: "Jean Bull Denim 750 — Classic Fit", href: "/producto/jean-bull-denim-750", tag: "S/ 120" },
          { label: "Ver todos los Jeans Denim", href: "/catalogo/denim?audiencia=hombre" },
        ],
      },
      {
        id: "h-camisas-polos",
        title: "Camisas y Polos de Algodón Peruano",
        badge: "S a XXL",
        items: [
          { label: "Camisa Denim Zair — Slim Fit", href: "/producto/camisa-denim-zair-slim-fit", tag: "S/ 130" },
          { label: "Camisa Clásica Kendall — Slim Fit", href: "/producto/camisa-clasica-kendall-slim-fit", tag: "S/ 125" },
          { label: "Polo Piqué Clásico Mark — Classic Fit", href: "/producto/polo-pique-clasico-mark", tag: "S/ 89" },
        ],
      },
    ],
  },
  {
    id: "jeans",
    label: "Jeans Denim",
    subtitle: "Relaxed 750, Comfort 762, Parker 769 y Bull Denim 750",
    allHref: "/catalogo/denim?audiencia=hombre",
    banner: {
      tag: "LÍNEA CLÁSICA DENIM",
      title: "Jeans de Alta Resistencia desde la Talla 28 hasta la 46",
      href: "/catalogo/denim?audiencia=hombre",
      image: {
        src: "/catalogo-colt/15-linea-clasica.png",
        alt: "Jeans Denim American Colt",
      },
    },
    groups: [
      {
        id: "j-modelos",
        title: "Modelos Oficiales de Jeans",
        badge: "Denim",
        items: [
          { label: "Jean Denim Relaxed 750 — Tela Rígida Classic Fit", href: "/producto/jean-denim-relaxed-750", tag: "7 Colores" },
          { label: "Jean Denim Comfort 762 — Tela Stretch Classic Fit", href: "/producto/jean-denim-comfort-762", tag: "6 Colores" },
          { label: "Jean Clásico Parker 769 — Tela Stretch Slim Fit", href: "/producto/jean-clasico-parker-769", tag: "8 Colores" },
          { label: "Jean Bull Denim 750 — Tela Rígida Classic Fit", href: "/producto/jean-bull-denim-750", tag: "7 Colores" },
          { label: "Ver toda la categoría Jeans Denim", href: "/catalogo/denim?audiencia=hombre" },
        ],
      },
    ],
  },
  {
    id: "pantalones",
    label: "Pantalones Drill",
    subtitle: "King 767, Fendy 769, Rolex 770 y Bermuda Balance 770",
    allHref: "/catalogo/pantalones?audiencia=hombre",
    banner: {
      tag: "LÍNEA DRILL PREMIUM",
      title: "Entalle Pitillo, Semipitillo y Bota Recta en Tela Stretch",
      href: "/catalogo/pantalones?audiencia=hombre",
      image: {
        src: "/catalogo-colt/08-linea-drill-premium.png",
        alt: "Pantalones Drill American Colt",
      },
    },
    groups: [
      {
        id: "dr-modelos",
        title: "Pantalones y Bermudas Drill",
        badge: "Drill Stretch",
        items: [
          { label: "Pantalón Drill King 767 — Skinny Fit (Entalle Pitillo)", href: "/producto/pantalon-drill-king-767", tag: "7 Colores" },
          { label: "Pantalón Drill Fendy 769 — Slim Fit (Semipitillo)", href: "/producto/pantalon-drill-fendy-769", tag: "9 Colores" },
          { label: "Pantalón Drill Rolex 770 — Straight Fit (Bota Recta)", href: "/producto/pantalon-drill-rolex-770", tag: "6 Colores" },
          { label: "Bermuda Drill Balance 770 — Straight Fit", href: "/producto/bermuda-drill-balance-770", tag: "6 Colores" },
          { label: "Ver todos los Pantalones y Bermudas Drill", href: "/catalogo/pantalones?audiencia=hombre" },
        ],
      },
    ],
  },
  {
    id: "camisas",
    label: "Camisas",
    subtitle: "Camisa Denim Zair & Camisa Clásica Kendall",
    allHref: "/catalogo/camisas?audiencia=hombre",
    banner: {
      tag: "CAMISAS SLIM FIT",
      title: "Confección en Algodón Peruano y Acabados de Primera",
      href: "/catalogo/camisas?audiencia=hombre",
      image: {
        src: "/catalogo-colt/camisa-zair-model.png",
        alt: "Camisas American Colt",
      },
    },
    groups: [
      {
        id: "cam-modelos",
        title: "Modelos de Camisas Hombre",
        badge: "Slim Fit",
        items: [
          { label: "Camisa Denim Zair — Slim Fit (Sky, Blackie, Stone)", href: "/producto/camisa-denim-zair-slim-fit", tag: "100% Algodón" },
          { label: "Camisa Clásica Kendall — Slim Fit (8 Colores)", href: "/producto/camisa-clasica-kendall-slim-fit", tag: "Algodón + Elastano" },
          { label: "Ver todas las Camisas", href: "/catalogo/camisas?audiencia=hombre" },
        ],
      },
    ],
  },
  {
    id: "polos",
    label: "Polos Piqué",
    subtitle: "Polo Clásico Mark en 100% Algodón Peruano",
    allHref: "/catalogo/polos?audiencia=hombre",
    banner: {
      tag: "ALGODÓN PERUANO",
      title: "Polo Piqué Clásico Mark con Cuello Camisero en 10 Colores",
      href: "/catalogo/polos?audiencia=hombre",
      image: {
        src: "/catalogo-colt/01-estudio-azul.png",
        alt: "Polo Mark American Colt",
      },
    },
    groups: [
      {
        id: "p-lineas",
        title: "Polos Clásicos Hombre",
        badge: "10 Colores",
        items: [
          { label: "Polo Piqué Clásico Mark — Classic Fit (Tallas S a XXL)", href: "/producto/polo-pique-clasico-mark", tag: "S/ 89.00" },
          { label: "Ver categoría Polos", href: "/catalogo/polos?audiencia=hombre" },
        ],
      },
    ],
  },
  {
    id: "mayorista",
    label: "Venta por Mayor",
    subtitle: "Canal Corporativo B2B y Distribuidores",
    allHref: "/mayorista",
    banner: {
      tag: "PRECIOS DE FÁBRICA",
      title: "Abastece tu Tienda o Boutique desde 12 Unidades",
      href: "/mayorista/cotizaciones",
      image: {
        src: "/catalogo-colt/02-campana-bolsas.png",
        alt: "Ventas por Mayor American Colt",
      },
    },
    groups: [
      {
        id: "may-opciones",
        title: "Opciones de Compra por Mayor B2B",
        badge: "Empresas",
        items: [
          { label: "Información y Escalas Mayoristas", href: "/mayorista", tag: "Beneficios" },
          { label: "Armar Cotización por Volumen", href: "/mayorista/cotizaciones", tag: "Cotizador" },
          { label: "Registrar mi Empresa (RUC 20 / 10)", href: "/mayorista/registro", tag: "Gratis" },
          { label: "Ver Catálogo con Tarifas por Mayor", href: "/catalogo?mayorista=1" },
        ],
      },
    ],
  },
  {
    id: "sale",
    label: "Ofertas 3x2 / -50%",
    subtitle: "Prendas del Catálogo con Descuento Activo",
    allHref: "/catalogo?novedades=1&oferta=50",
    highlight: true,
    banner: {
      tag: "PROMOCIÓN ACTIVA",
      title: "Promoción 3x2 y hasta 50% de Descuento en el Catálogo",
      href: "/catalogo?novedades=1&oferta=50",
      image: {
        src: "/catalogo-colt/16-portada-jeans-2026.png",
        alt: "Ofertas American Colt",
      },
    },
    groups: [
      {
        id: "sale-opciones",
        title: "Ver Productos con Descuento",
        badge: "Oferta",
        items: [
          { label: "Todas las Prendas en Oferta (3x2 / -50%)", href: "/catalogo?novedades=1&oferta=50", tag: "-50% OFF" },
          { label: "Ofertas en Jeans Denim", href: "/catalogo/denim?oferta=50", tag: "Denim" },
          { label: "Ofertas en Pantalones y Bermudas Drill", href: "/catalogo/pantalones?oferta=50", tag: "Drill" },
          { label: "Ofertas en Camisas y Polos", href: "/catalogo/camisas?oferta=50" },
        ],
      },
    ],
  },
];
