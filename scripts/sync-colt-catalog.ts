import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, inArray } from "drizzle-orm";
import * as schema from "../src/server/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no definida.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle({ client: sql, schema });

interface ColtCatalogProduct {
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  audience: "hombre";
  categorySlug: "camisas" | "pantalones" | "denim" | "polos";
  badgeLabel: string | null;
  sortOrder: number;
  images: { url: string; alt: string; isPrimary: boolean }[];
  sizes: string[];
  colors: { name: string; swatch: string; code: string }[];
  retailPrice: number;
  compareAtPrice: number;
  wholesalePrice: { amount: number; minQuantity: number };
}

export const COLT_MEN_PRODUCTS: ColtCatalogProduct[] = [
  {
    name: "Pantalón Drill King 767 — Skinny Fit",
    slug: "pantalon-drill-king-767",
    shortDescription:
      "Pantalón King 767 de la Línea Drill Premium, corte Skinny Fit (entalle pitillo) en tela Stretch de alta recuperación.",
    fullDescription:
      "Pantalón modelo King 767 perteneciente a la Línea Drill Premium de American Colt JEANS™ (Edición 2026). Confeccionado en tela Stretch de primera calidad con entalle pitillo (Skinny Fit), bolsillo posterior con tapa abotonada, costuras reforzadas e insignia metálica oficial American Colt.",
    audience: "hombre",
    categorySlug: "pantalones",
    badgeLabel: "edicion-limitada",
    sortOrder: 1,
    images: [
      {
        url: "/catalogo-colt/pantalon-king-767-model.png",
        alt: "Pantalón Drill King 767 Skinny Fit color Camello — American Colt JEANS",
        isPrimary: true,
      },
      {
        url: "/catalogo-colt/pantalon-king-767-closeup.png",
        alt: "Detalle cercano Pantalón Drill King 767 — Solo prenda",
        isPrimary: false,
      },
      {
        url: "/catalogo-colt/05-pantalon-king-767-ficha.png",
        alt: "Ficha oficial de catálogo Pantalón King 767 — Colores y tallas American Colt JEANS",
        isPrimary: false,
      },
    ],
    sizes: ["28", "30", "32", "34", "36"],
    colors: [
      { name: "Camello", swatch: "#755233", code: "CAM" },
      { name: "Khaki", swatch: "#9DA8A3", code: "KHK" },
      { name: "Azul Marino", swatch: "#153875", code: "AZM" },
      { name: "Verde Militar", swatch: "#445749", code: "VMI" },
      { name: "Cocoa", swatch: "#7F6F74", code: "COC" },
      { name: "Arena", swatch: "#E6D6CE", code: "ARE" },
      { name: "Negro", swatch: "#0D1421", code: "NEG" },
    ],
    retailPrice: 14000,
    compareAtPrice: 17500,
    wholesalePrice: { amount: 10200, minQuantity: 12 },
  },
  {
    name: "Camisa Denim Zair — Slim Fit",
    slug: "camisa-denim-zair-slim-fit",
    shortDescription:
      "Camisa Denim Zair de entalle Slim Fit en 100% algodón peruano con doble bolsillo pectoral y puños en contraste.",
    fullDescription:
      "Camisa modelo Zair del catálogo oficial American Colt JEANS™ 2026. Confeccionada en tela 100% algodón de tacto suave y alta resistencia, corte Slim Fit (entallado) que estiliza la silueta masculina, doble bolsillo con solapa abotonada y acabado denim lavable.",
    audience: "hombre",
    categorySlug: "camisas",
    badgeLabel: null,
    sortOrder: 2,
    images: [
      {
        url: "/catalogo-colt/camisa-zair-model.png",
        alt: "Camisa Denim Zair Slim Fit color Sky — American Colt JEANS",
        isPrimary: true,
      },
      {
        url: "/catalogo-colt/camisa-zair-closeup.png",
        alt: "Detalle cercano Camisa Denim Zair — Solo prenda",
        isPrimary: false,
      },
      {
        url: "/catalogo-colt/03-camisa-zair-ficha.png",
        alt: "Ficha oficial de catálogo Camisa Zair — Colores Sky, Blackie y Stone",
        isPrimary: false,
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Sky", swatch: "#0066FF", code: "SKY" },
      { name: "Blackie", swatch: "#374151", code: "BLK" },
      { name: "Stone", swatch: "#4F7DF3", code: "STO" },
    ],
    retailPrice: 13000,
    compareAtPrice: 16500,
    wholesalePrice: { amount: 9500, minQuantity: 12 },
  },
  {
    name: "Pantalón Drill Fendy 769 — Slim Fit",
    slug: "pantalon-drill-fendy-769",
    shortDescription:
      "Pantalón Fendy 769 de la Línea Drill Premium, corte Slim Fit (entalle semipitillo) en tela Stretch y 9 colores.",
    fullDescription:
      "Pantalón modelo Fendy 769 de la Línea Drill Premium de American Colt JEANS™. Entalle semipitillo (Slim Fit) en tela Stretch que brinda libertad de movimiento y calce impecable, disponible en 9 tonos elegantes desde la talla 28 hasta la 46.",
    audience: "hombre",
    categorySlug: "pantalones",
    badgeLabel: null,
    sortOrder: 3,
    images: [
      {
        url: "/catalogo-colt/pantalon-fendy-769-model.png",
        alt: "Pantalón Drill Fendy 769 Slim Fit color Verde Militar — American Colt JEANS",
        isPrimary: true,
      },
      {
        url: "/catalogo-colt/pantalon-fendy-769-closeup.png",
        alt: "Detalle cercano Pantalón Drill Fendy 769 — Solo prenda",
        isPrimary: false,
      },
      {
        url: "/catalogo-colt/06-pantalon-fendy-769-ficha.png",
        alt: "Ficha oficial de catálogo Pantalón Fendy 769 — Línea Drill Premium",
        isPrimary: false,
      },
    ],
    sizes: ["28", "30", "32", "34", "36", "38", "40", "42", "44", "46"],
    colors: [
      { name: "Verde Militar", swatch: "#485948", code: "VMI" },
      { name: "Arena", swatch: "#98A0A4", code: "ARE" },
      { name: "Negro", swatch: "#101726", code: "NEG" },
      { name: "Camello", swatch: "#6D4E35", code: "CAM" },
      { name: "Plomo", swatch: "#2B4159", code: "PLO" },
      { name: "Cocoa", swatch: "#836F73", code: "COC" },
      { name: "Khaki", swatch: "#9AA69F", code: "KHK" },
      { name: "Azul Marino", swatch: "#1A427A", code: "AZM" },
      { name: "Plata", swatch: "#4B7577", code: "PLA" },
    ],
    retailPrice: 13000,
    compareAtPrice: 16500,
    wholesalePrice: { amount: 9500, minQuantity: 12 },
  },
  {
    name: "Jean Denim Relaxed 750 — Classic Fit",
    slug: "jean-denim-relaxed-750",
    shortDescription:
      "Jean Relaxed 750 de la Línea Clásica, corte Classic Fit en denim rígido tradicional con lavados Stone y Celeste Laser.",
    fullDescription:
      "Jean modelo Relaxed 750 de la Línea Clásica de American Colt JEANS™. El auténtico jean americano en tela rígida de alta resistencia con entalle clásico (Classic Fit), cinco bolsillos reforzados con remaches metálicos y costuras de doble pespunte.",
    audience: "hombre",
    categorySlug: "denim",
    badgeLabel: "esencial",
    sortOrder: 4,
    images: [
      {
        url: "/catalogo-colt/jean-relaxed-750-model.png",
        alt: "Jean Denim Relaxed 750 Classic Fit color Stone — American Colt JEANS",
        isPrimary: true,
      },
      {
        url: "/catalogo-colt/jean-relaxed-750-closeup.png",
        alt: "Detalle cercano Jean Denim Relaxed 750 — Solo prenda",
        isPrimary: false,
      },
      {
        url: "/catalogo-colt/14-jean-relaxed-750-ficha.png",
        alt: "Ficha oficial de catálogo Jean Relaxed 750 — Línea Clásica",
        isPrimary: false,
      },
    ],
    sizes: ["28", "30", "32", "34", "36", "38", "40", "44", "46"],
    colors: [
      { name: "Stone", swatch: "#1558B0", code: "STO" },
      { name: "Negro", swatch: "#050708", code: "NEG" },
      { name: "Grafito", swatch: "#07213C", code: "GRA" },
      { name: "Marengo", swatch: "#101B37", code: "MAR" },
      { name: "Humo", swatch: "#2B5B7C", code: "HUM" },
      { name: "Celeste Laser", swatch: "#1E78B4", code: "CEL" },
      { name: "Blue", swatch: "#06253F", code: "BLU" },
    ],
    retailPrice: 12000,
    compareAtPrice: 15000,
    wholesalePrice: { amount: 8800, minQuantity: 12 },
  },
  {
    name: "Polo Piqué Clásico Mark — Classic Fit",
    slug: "polo-pique-clasico-mark",
    shortDescription:
      "Polo con cuello camisero modelo Mark de la Línea Clásica, entalle clásico en 100% algodón peruano.",
    fullDescription:
      "Polo modelo Mark de la Línea Clásica de American Colt JEANS™. Confeccionado en 100% algodón peruano de fibra selecta, cuello tejido resistente, pechera de dos botones y bolsillo pectoral con detalle de marca. Disponible en 10 colores de temporada.",
    audience: "hombre",
    categorySlug: "polos",
    badgeLabel: "esencial",
    sortOrder: 5,
    images: [
      {
        url: "/catalogo-colt/polo-mark-model.png",
        alt: "Polo Clásico Mark color Rojo — American Colt JEANS",
        isPrimary: true,
      },
      {
        url: "/catalogo-colt/polo-mark-closeup.png",
        alt: "Detalle cercano Polo Clásico Mark — Solo prenda",
        isPrimary: false,
      },
      {
        url: "/catalogo-colt/10-polo-mark-ficha.png",
        alt: "Ficha oficial de catálogo Polo Mark — 10 colores disponibles",
        isPrimary: false,
      },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Rojo", swatch: "#7D091D", code: "ROJ" },
      { name: "Acero", swatch: "#376598", code: "ACE" },
      { name: "Blanco", swatch: "#FFFFFF", code: "BLA" },
      { name: "Negro", swatch: "#070809", code: "NEG" },
      { name: "Beige", swatch: "#DFC5C8", code: "BEI" },
      { name: "Plata", swatch: "#7A7D82", code: "PLA" },
      { name: "Uva", swatch: "#7B4A83", code: "UVA" },
      { name: "Verde Olivo", swatch: "#6D7765", code: "VOL" },
      { name: "Aqua Green", swatch: "#14A86B", code: "AQG" },
      { name: "Coral", swatch: "#ED1118", code: "COR" },
    ],
    retailPrice: 8900,
    compareAtPrice: 11500,
    wholesalePrice: { amount: 6200, minQuantity: 12 },
  },
  {
    name: "Pantalón Drill Rolex 770 — Straight Fit",
    slug: "pantalon-drill-rolex-770",
    shortDescription:
      "Pantalón Rolex 770 de la Línea Drill Premium, corte Straight Fit (entalle bota recta) en tela Stretch.",
    fullDescription:
      "Pantalón modelo Rolex 770 de la Línea Drill Premium de American Colt JEANS™. Corte bota recta (Straight Fit) en tela Stretch de alta durabilidad, bolsillos de vivo con acabados de sastrería y calce clásico confortable.",
    audience: "hombre",
    categorySlug: "pantalones",
    badgeLabel: null,
    sortOrder: 6,
    images: [
      {
        url: "/catalogo-colt/pantalon-rolex-770-model.png",
        alt: "Pantalón Drill Rolex 770 Straight Fit color Cocoa — American Colt JEANS",
        isPrimary: true,
      },
      {
        url: "/catalogo-colt/pantalon-rolex-770-closeup.png",
        alt: "Detalle cercano Pantalón Drill Rolex 770 — Solo prenda",
        isPrimary: false,
      },
      {
        url: "/catalogo-colt/07-pantalon-rolex-770-ficha.png",
        alt: "Ficha oficial de catálogo Pantalón Rolex 770 — Línea Drill Premium",
        isPrimary: false,
      },
    ],
    sizes: ["28", "30", "32", "34", "36", "38", "40"],
    colors: [
      { name: "Cocoa", swatch: "#857074", code: "COC" },
      { name: "Plomo", swatch: "#324456", code: "PLO" },
      { name: "Khaki", swatch: "#9FA9A3", code: "KHK" },
      { name: "Azul Marino", swatch: "#1E4583", code: "AZM" },
      { name: "Negro", swatch: "#0F1724", code: "NEG" },
      { name: "Verde Militar", swatch: "#47584B", code: "VMI" },
    ],
    retailPrice: 13000,
    compareAtPrice: 16500,
    wholesalePrice: { amount: 9500, minQuantity: 12 },
  },
  {
    name: "Jean Denim Comfort 762 — Classic Fit",
    slug: "jean-denim-comfort-762",
    shortDescription:
      "Jean Comfort 762 de la Línea Clásica, corte Classic Fit (entalle clásico) en denim stretch de lavados intensos.",
    fullDescription:
      "Jean modelo Comfort 762 de la Línea Clásica de American Colt JEANS™. Diseñado con entalle clásico (Classic Fit) en tela Denim Stretch para brindar comodidad durante todo el día, costuras en hilo contraste y herrajes grabados.",
    audience: "hombre",
    categorySlug: "denim",
    badgeLabel: null,
    sortOrder: 7,
    images: [
      {
        url: "/catalogo-colt/jean-comfort-762-model.png",
        alt: "Jean Denim Comfort 762 Classic Fit color Grafito — American Colt JEANS",
        isPrimary: true,
      },
      {
        url: "/catalogo-colt/jean-comfort-762-closeup.png",
        alt: "Detalle cercano Jean Denim Comfort 762 — Solo prenda",
        isPrimary: false,
      },
      {
        url: "/catalogo-colt/12-jean-comfort-762-ficha.png",
        alt: "Ficha oficial de catálogo Jean Comfort 762 — Línea Clásica",
        isPrimary: false,
      },
    ],
    sizes: ["28", "30", "32", "34", "36", "38", "40", "42", "44", "46"],
    colors: [
      { name: "Grafito", swatch: "#0D2440", code: "GRA" },
      { name: "Azul", swatch: "#00338D", code: "AZU" },
      { name: "Ash", swatch: "#2B6CB0", code: "ASH" },
      { name: "Negro", swatch: "#1E293B", code: "NEG" },
      { name: "Blue", swatch: "#062E63", code: "BLU" },
      { name: "Dakar", swatch: "#13232C", code: "DAK" },
    ],
    retailPrice: 13000,
    compareAtPrice: 16500,
    wholesalePrice: { amount: 9500, minQuantity: 12 },
  },
  {
    name: "Camisa Clásica Kendall — Slim Fit",
    slug: "camisa-clasica-kendall-slim-fit",
    shortDescription:
      "Camisa Kendall de la Línea Clásica, corte Slim Fit en algodón con 3% elastano y doble bolsillo con solapa.",
    fullDescription:
      "Camisa modelo Kendall de la Línea Clásica de American Colt JEANS™. Elaborada en algodón premium con 3% de elastano para un ajuste cómodo y flexible. Cuenta con bolsillos frontales con botón, bordado en el pecho y mangas con trabilla.",
    audience: "hombre",
    categorySlug: "camisas",
    badgeLabel: null,
    sortOrder: 8,
    images: [
      {
        url: "/catalogo-colt/camisa-kendall-model.png",
        alt: "Camisa Clásica Kendall Slim Fit color Verde Militar — American Colt JEANS",
        isPrimary: true,
      },
      {
        url: "/catalogo-colt/camisa-kendall-closeup.png",
        alt: "Detalle cercano Camisa Clásica Kendall — Solo prenda",
        isPrimary: false,
      },
      {
        url: "/catalogo-colt/09-camisa-kendall-ficha.png",
        alt: "Ficha oficial de catálogo Camisa Kendall — 8 colores disponibles",
        isPrimary: false,
      },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Verde Militar", swatch: "#52644D", code: "VMI" },
      { name: "Acero", swatch: "#0E356B", code: "ACE" },
      { name: "Vinotinto", swatch: "#320824", code: "VIN" },
      { name: "Beige", swatch: "#C6A7A3", code: "BEI" },
      { name: "Negro", swatch: "#090A0C", code: "NEG" },
      { name: "Charcol", swatch: "#1D242B", code: "CHA" },
      { name: "Blanco", swatch: "#FFFFFF", code: "BLA" },
      { name: "Azul Marino", swatch: "#0B1F36", code: "AZM" },
    ],
    retailPrice: 12500,
    compareAtPrice: 15500,
    wholesalePrice: { amount: 9000, minQuantity: 12 },
  },
  {
    name: "Bermuda Drill Balance 770 — Straight Fit",
    slug: "bermuda-drill-balance-770",
    shortDescription:
      "Bermuda Balance 770 de la Línea Drill Premium, entalle recto (Straight Fit) en tela Stretch de máxima frescura.",
    fullDescription:
      "Bermuda modelo Balance 770 perteneciente a la Línea Drill Premium de American Colt JEANS™. Confeccionada en tela Drill Stretch con costuras reforzadas, bolsillo relojero frontal y bolsillos traseros de vivo doble.",
    audience: "hombre",
    categorySlug: "pantalones",
    badgeLabel: null,
    sortOrder: 9,
    images: [
      {
        url: "/catalogo-colt/bermuda-balance-770-model.png",
        alt: "Bermuda Drill Balance 770 Straight Fit color Arena — American Colt JEANS",
        isPrimary: true,
      },
      {
        url: "/catalogo-colt/bermuda-balance-770-closeup.png",
        alt: "Detalle cercano Bermuda Drill Balance 770 — Solo prenda",
        isPrimary: false,
      },
      {
        url: "/catalogo-colt/04-bermuda-balance-770-ficha.png",
        alt: "Ficha oficial de catálogo Bermuda Balance 770 — Línea Drill Premium",
        isPrimary: false,
      },
    ],
    sizes: ["28", "30", "32", "34", "36", "38", "40", "42", "44", "46"],
    colors: [
      { name: "Arena", swatch: "#E6D7C8", code: "ARE" },
      { name: "Camello", swatch: "#6E5438", code: "CAM" },
      { name: "Negro", swatch: "#111317", code: "NEG" },
      { name: "Plomo", swatch: "#2A3235", code: "PLO" },
      { name: "Cocoa", swatch: "#7A726E", code: "COC" },
      { name: "Azul Marino", swatch: "#0B1942", code: "AZM" },
    ],
    retailPrice: 12000,
    compareAtPrice: 15000,
    wholesalePrice: { amount: 8800, minQuantity: 12 },
  },
  {
    name: "Jean Clásico Parker 769 — Slim Fit",
    slug: "jean-clasico-parker-769",
    shortDescription:
      "Jean Parker 769 de la Línea Clásica, corte Slim Fit (entalle semipitillo) en tela Stretch con remaches de cobre.",
    fullDescription:
      "Jean modelo Parker 769 de la Línea Clásica de American Colt JEANS™. Entalle semipitillo (Slim Fit) en tela Stretch de alta resistencia, cinco bolsillos con remaches metálicos antioxidantes y bordado icónico en bolsillos traseros.",
    audience: "hombre",
    categorySlug: "denim",
    badgeLabel: null,
    sortOrder: 10,
    images: [
      {
        url: "/catalogo-colt/jean-parker-769-model.png",
        alt: "Jean Clásico Parker 769 Slim Fit color Camello — American Colt JEANS",
        isPrimary: true,
      },
      {
        url: "/catalogo-colt/jean-parker-769-closeup.png",
        alt: "Detalle cercano Jean Clásico Parker 769 — Solo prenda",
        isPrimary: false,
      },
      {
        url: "/catalogo-colt/11-jean-parker-769-ficha.png",
        alt: "Ficha oficial de catálogo Jean Parker 769 — Línea Clásica",
        isPrimary: false,
      },
    ],
    sizes: ["28", "30", "32", "34", "36", "38", "40", "42", "44", "46"],
    colors: [
      { name: "Camello", swatch: "#63676A", code: "CAM" },
      { name: "Navy", swatch: "#004E9A", code: "NAV" },
      { name: "Coffee", swatch: "#473137", code: "COF" },
      { name: "Negro", swatch: "#19232E", code: "NEG" },
      { name: "Beige", swatch: "#C1C4BD", code: "BEI" },
      { name: "Plomo", swatch: "#324D5C", code: "PLO" },
      { name: "Verde Musgo", swatch: "#26795B", code: "VMU" },
      { name: "Azul Marino", swatch: "#164996", code: "AZM" },
    ],
    retailPrice: 13000,
    compareAtPrice: 16500,
    wholesalePrice: { amount: 9500, minQuantity: 12 },
  },
  {
    name: "Jean Bull Denim 750 — Classic Fit",
    slug: "jean-bull-denim-750",
    shortDescription:
      "Jean Bull Denim 750 de la Línea Clásica, corte Classic Fit en tela rígida de alta densidad en tonos tierra y minerales.",
    fullDescription:
      "Jean modelo Bull Denim 750 de la Línea Clásica de American Colt JEANS™. Confeccionado en tela Denim Rígida de máxima durabilidad con entalle clásico (Classic Fit), ideal para uso diario intensivo sin perder su estructura.",
    audience: "hombre",
    categorySlug: "denim",
    badgeLabel: null,
    sortOrder: 11,
    images: [
      {
        url: "/catalogo-colt/jean-bull-denim-750-model.png",
        alt: "Jean Bull Denim 750 Classic Fit color Beige — American Colt JEANS",
        isPrimary: true,
      },
      {
        url: "/catalogo-colt/jean-bull-denim-750-closeup.png",
        alt: "Detalle cercano Jean Bull Denim 750 — Solo prenda",
        isPrimary: false,
      },
      {
        url: "/catalogo-colt/13-jean-bull-denim-750-ficha.png",
        alt: "Ficha oficial de catálogo Jean Bull Denim 750 — Línea Clásica",
        isPrimary: false,
      },
    ],
    sizes: ["28", "30", "32", "34", "36"],
    colors: [
      { name: "Beige", swatch: "#97A797", code: "BEI" },
      { name: "Plata", swatch: "#4F7F8E", code: "PLA" },
      { name: "Marrón", swatch: "#262038", code: "MAR" },
      { name: "Plomo", swatch: "#17394C", code: "PLO" },
      { name: "Azul Marino", swatch: "#002073", code: "AZM" },
      { name: "Arena", swatch: "#4B5B6B", code: "ARE" },
      { name: "Verde Musgo", swatch: "#2E5341", code: "VMU" },
    ],
    retailPrice: 12000,
    compareAtPrice: 15000,
    wholesalePrice: { amount: 8800, minQuantity: 12 },
  },
];

async function syncColtCatalog() {
  console.log("🚀 Sincronizando el catálogo oficial American Colt JEANS™ 2026 (Hombre)...");

  const oldGenericMenSlugs = [
    "polo-esencial-algodon",
    "blazer-camel-relajado",
    "camisa-popelina-blanca",
    "casaca-denim-indigo",
  ];
  await db
    .update(schema.products)
    .set({ status: "archived", sortOrder: 99 })
    .where(inArray(schema.products.slug, oldGenericMenSlugs));

  // Archivar productos demo de mujer ya que la línea femenina se encuentra en desarrollo
  const womenSlugs = [
    "conjunto-sastre-negro",
    "blusa-lazo-satinada",
    "casaca-utilitaria-oliva",
    "casaca-biker-negra",
  ];
  await db
    .update(schema.products)
    .set({ status: "archived", sortOrder: 99 })
    .where(inArray(schema.products.slug, womenSlugs));

  const allCategories = await db.select().from(schema.categories);
  const catMap = new Map(allCategories.map((c) => [c.slug, c.id]));

  for (const prod of COLT_MEN_PRODUCTS) {
    const categoryId = catMap.get(prod.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoría no encontrada: ${prod.categorySlug}`);
    }

    const existing = await db.query.products.findFirst({
      where: eq(schema.products.slug, prod.slug),
    });

    let productId: number;
    if (existing) {
      productId = existing.id;
      await db
        .update(schema.products)
        .set({
          name: prod.name,
          shortDescription: prod.shortDescription,
          fullDescription: prod.fullDescription,
          audience: prod.audience,
          categoryId,
          status: "active",
          isNew: true,
          isWholesale: true,
          badgeLabel: prod.badgeLabel,
          sortOrder: prod.sortOrder,
          isDemo: false,
        })
        .where(eq(schema.products.id, productId));

      await db.delete(schema.productImages).where(eq(schema.productImages.productId, productId));
      await db.delete(schema.productPrices).where(eq(schema.productPrices.productId, productId));
    } else {
      const [inserted] = await db
        .insert(schema.products)
        .values({
          slug: prod.slug,
          name: prod.name,
          shortDescription: prod.shortDescription,
          fullDescription: prod.fullDescription,
          audience: prod.audience,
          categoryId,
          status: "active",
          isNew: true,
          isWholesale: true,
          badgeLabel: prod.badgeLabel,
          sortOrder: prod.sortOrder,
          isDemo: false,
        })
        .returning({ id: schema.products.id });
      productId = inserted.id;
    }

    await db.insert(schema.productImages).values(
      prod.images.map((img, idx) => ({
        productId,
        url: img.url,
        alt: img.alt,
        sortOrder: idx,
        isPrimary: img.isPrimary,
      }))
    );

    await db.insert(schema.productPrices).values([
      {
        productId,
        type: "retail" as const,
        amount: prod.retailPrice,
        compareAtAmount: prod.compareAtPrice,
        minQuantity: 1,
      },
      {
        productId,
        type: "wholesale" as const,
        amount: prod.wholesalePrice.amount,
        minQuantity: prod.wholesalePrice.minQuantity,
      },
    ]);

    const existingVariants = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, productId));

    if (existingVariants.length === 0) {
      const variantRows = [];
      for (const color of prod.colors) {
        for (const size of prod.sizes) {
          const sku = `AC-P${productId}-${color.code}-${size}`;
          variantRows.push({
            productId,
            sku,
            size,
            colorName: color.name,
            colorSwatch: color.swatch,
            stock: 25,
            isActive: true,
          });
        }
      }
      await db.insert(schema.productVariants).values(variantRows);
    }

    console.log(
      `✅ Sincronizado: ${prod.name} (id: ${productId}, ${prod.colors.length} colores × ${prod.sizes.length} tallas)`
    );
  }

  console.log("\n🎉 ¡Los 11 productos oficiales de Hombre del catálogo PDF están activos en Neon PostgreSQL!");
}

syncColtCatalog()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
