/**
 * INVESTMENTS — Seed de datos de demostración.
 *
 * Uso: npx tsx src/server/db/seed.ts
 *
 * ⚠️ Este script carga datos de demostración. Todos los productos se marcan con is_demo=true.
 * - Idempotente: verifica si ya existen datos antes de insertar.
 * - No borra datos existentes.
 * - Las imágenes usan las fotografías de Unsplash ya procesadas en src/assets/images/products/.
 *   En producción, se sustituirían por URLs de un CDN.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { count } from "drizzle-orm";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no definida. Copia .env.example a .env.local.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle({ client: sql, schema });

// ──────────────────────────────────────────────────────────────
// Datos de demostración
// ──────────────────────────────────────────────────────────────

const DEMO_CATEGORIES = [
  { name: "Sastrería", slug: "sastreria", description: "Cortes precisos y caídas relajadas para la oficina y más allá.", sortOrder: 1 },
  { name: "Polos", slug: "polos", description: "Algodón de calidad en cortes esenciales para tu día a día.", sortOrder: 2 },
  { name: "Blusas", slug: "blusas", description: "Blusas y camisas femeninas con telas premium.", sortOrder: 3, audience: "mujer" as const },
  { name: "Blazers", slug: "blazers", description: "Blazers con personalidad: del clásico al contemporáneo.", sortOrder: 4 },
  { name: "Casacas", slug: "casacas", description: "Casacas de temporada con siluetas modernas y materiales duraderos.", sortOrder: 5 },
  { name: "Camisas", slug: "camisas", description: "Camisas de popelina, oxford y lino para un vestir impecable.", sortOrder: 6 },
  { name: "Denim", slug: "denim", description: "Índigos profundos y lavados honestos, hechos para acompañarte.", sortOrder: 7 },
  { name: "Pantalones", slug: "pantalones", description: "Pantalones de vestir y casuales en cortes versátiles.", sortOrder: 8 },
  { name: "Vestidos", slug: "vestidos", description: "Vestidos elegantes para ocasiones especiales y el día a día.", sortOrder: 9, audience: "mujer" as const },
  { name: "Tejidos de punto", slug: "tejidos-de-punto", description: "Texturas suaves en tonos tierra para las noches frescas.", sortOrder: 10 },
];

interface DemoProduct {
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  audience: "mujer" | "hombre" | "unisex";
  categorySlug: string;
  isNew: boolean;
  isWholesale: boolean;
  badgeLabel: string | null;
  sortOrder: number;
  images: { url: string; alt: string; isPrimary: boolean }[];
  variants: { sku: string; size: string; colorName: string; colorSwatch: string; stock: number }[];
  retailPrice: number;
  compareAtPrice: number | null;
  wholesalePrice: { amount: number; minQuantity: number } | null;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    name: "Blazer sastre entallado",
    slug: "conjunto-sastre-negro",
    shortDescription: "Blazer de corte entallado con solapas de punta en lana fría, confección estructurada.",
    fullDescription: "Blazer de silueta entallada confeccionado en lana fría con un toque de elastano para comodidad. Solapas de punta, dos botones, bolsillos de vivo y forro interior en jacquard. Ideal para la oficina o eventos semiformales.",
    audience: "mujer",
    categorySlug: "sastreria",
    isNew: true,
    isWholesale: true,
    badgeLabel: null,
    sortOrder: 1,
    images: [
      { url: "/products/conjunto-sastre.jpg", alt: "Modelo con blazer sastre negro entallado y pantalón a juego en la calle", isPrimary: true },
    ],
    variants: [
      { sku: "BLZ-SASTRE-NEG-XS", size: "XS", colorName: "Negro", colorSwatch: "#141312", stock: 8 },
      { sku: "BLZ-SASTRE-NEG-S", size: "S", colorName: "Negro", colorSwatch: "#141312", stock: 15 },
      { sku: "BLZ-SASTRE-NEG-M", size: "M", colorName: "Negro", colorSwatch: "#141312", stock: 12 },
      { sku: "BLZ-SASTRE-NEG-L", size: "L", colorName: "Negro", colorSwatch: "#141312", stock: 6 },
      { sku: "BLZ-SASTRE-GC-XS", size: "XS", colorName: "Gris carbón", colorSwatch: "#3b3a38", stock: 5 },
      { sku: "BLZ-SASTRE-GC-S", size: "S", colorName: "Gris carbón", colorSwatch: "#3b3a38", stock: 10 },
      { sku: "BLZ-SASTRE-GC-M", size: "M", colorName: "Gris carbón", colorSwatch: "#3b3a38", stock: 8 },
      { sku: "BLZ-SASTRE-GC-L", size: "L", colorName: "Gris carbón", colorSwatch: "#3b3a38", stock: 4 },
    ],
    retailPrice: 34900,
    compareAtPrice: null,
    wholesalePrice: { amount: 27900, minQuantity: 12 },
  },
  {
    name: "Polo esencial de algodón",
    slug: "polo-esencial-algodon",
    shortDescription: "Polo de algodón pima peruano, corte regular con cuello redondo reforzado.",
    fullDescription: "Polo de algodón pima peruano 100% de fibra larga, suave al tacto y resistente al uso diario. Cuello redondo con costilla reforzada, costura de hombro caído y dobladillo recto. Un básico imprescindible disponible en colores neutros.",
    audience: "hombre",
    categorySlug: "polos",
    isNew: false,
    isWholesale: true,
    badgeLabel: "esencial",
    sortOrder: 2,
    images: [
      { url: "/products/polo-pima.jpg", alt: "Modelo con polo blanco de cuello redondo sobre fondo neutro", isPrimary: true },
    ],
    variants: [
      { sku: "POLO-ESS-BL-S", size: "S", colorName: "Blanco", colorSwatch: "#f4f2ed", stock: 30 },
      { sku: "POLO-ESS-BL-M", size: "M", colorName: "Blanco", colorSwatch: "#f4f2ed", stock: 45 },
      { sku: "POLO-ESS-BL-L", size: "L", colorName: "Blanco", colorSwatch: "#f4f2ed", stock: 35 },
      { sku: "POLO-ESS-BL-XL", size: "XL", colorName: "Blanco", colorSwatch: "#f4f2ed", stock: 20 },
      { sku: "POLO-ESS-BL-XXL", size: "XXL", colorName: "Blanco", colorSwatch: "#f4f2ed", stock: 10 },
      { sku: "POLO-ESS-NEG-S", size: "S", colorName: "Negro", colorSwatch: "#161514", stock: 25 },
      { sku: "POLO-ESS-NEG-M", size: "M", colorName: "Negro", colorSwatch: "#161514", stock: 40 },
      { sku: "POLO-ESS-NEG-L", size: "L", colorName: "Negro", colorSwatch: "#161514", stock: 30 },
      { sku: "POLO-ESS-NEG-XL", size: "XL", colorName: "Negro", colorSwatch: "#161514", stock: 15 },
      { sku: "POLO-ESS-NEG-XXL", size: "XXL", colorName: "Negro", colorSwatch: "#161514", stock: 8 },
      { sku: "POLO-ESS-ARE-S", size: "S", colorName: "Arena", colorSwatch: "#cdbfa8", stock: 20 },
      { sku: "POLO-ESS-ARE-M", size: "M", colorName: "Arena", colorSwatch: "#cdbfa8", stock: 30 },
      { sku: "POLO-ESS-ARE-L", size: "L", colorName: "Arena", colorSwatch: "#cdbfa8", stock: 22 },
      { sku: "POLO-ESS-ARE-XL", size: "XL", colorName: "Arena", colorSwatch: "#cdbfa8", stock: 12 },
      { sku: "POLO-ESS-ARE-XXL", size: "XXL", colorName: "Arena", colorSwatch: "#cdbfa8", stock: 5 },
    ],
    retailPrice: 7900,
    compareAtPrice: null,
    wholesalePrice: { amount: 5400, minQuantity: 24 },
  },
  {
    name: "Blusa satinada con lazo",
    slug: "blusa-lazo-satinada",
    shortDescription: "Blusa de tela satinada con lazo al cuello, manga larga y corte fluido.",
    fullDescription: "Blusa confeccionada en satén de poliéster reciclado con caída elegante. Cuello con lazo desmontable, mangas largas con puño de botón y espalda ligeramente más larga. Perfecta para looks de oficina o salidas nocturnas.",
    audience: "mujer",
    categorySlug: "blusas",
    isNew: false,
    isWholesale: false,
    badgeLabel: null,
    sortOrder: 3,
    images: [
      { url: "/products/blusa-lazo.jpg", alt: "Modelo con blusa marfil de manga larga y lazo negro al cuello", isPrimary: true },
    ],
    variants: [
      { sku: "BLU-LAZO-MF-XS", size: "XS", colorName: "Marfil", colorSwatch: "#efe9dc", stock: 6 },
      { sku: "BLU-LAZO-MF-S", size: "S", colorName: "Marfil", colorSwatch: "#efe9dc", stock: 12 },
      { sku: "BLU-LAZO-MF-M", size: "M", colorName: "Marfil", colorSwatch: "#efe9dc", stock: 10 },
      { sku: "BLU-LAZO-MF-L", size: "L", colorName: "Marfil", colorSwatch: "#efe9dc", stock: 7 },
      { sku: "BLU-LAZO-MF-XL", size: "XL", colorName: "Marfil", colorSwatch: "#efe9dc", stock: 4 },
      { sku: "BLU-LAZO-NEG-XS", size: "XS", colorName: "Negro", colorSwatch: "#151413", stock: 5 },
      { sku: "BLU-LAZO-NEG-S", size: "S", colorName: "Negro", colorSwatch: "#151413", stock: 10 },
      { sku: "BLU-LAZO-NEG-M", size: "M", colorName: "Negro", colorSwatch: "#151413", stock: 8 },
      { sku: "BLU-LAZO-NEG-L", size: "L", colorName: "Negro", colorSwatch: "#151413", stock: 6 },
      { sku: "BLU-LAZO-NEG-XL", size: "XL", colorName: "Negro", colorSwatch: "#151413", stock: 3 },
    ],
    retailPrice: 15900,
    compareAtPrice: null,
    wholesalePrice: null,
  },
  {
    name: "Blazer camel de corte relajado",
    slug: "blazer-camel-relajado",
    shortDescription: "Blazer unisex de corte relajado en tono camel, hombros desestructurados.",
    fullDescription: "Blazer de corte relajado en mezcla de lino y algodón, hombros naturales sin hombreras. Dos botones, bolsillos de plastrón y forro parcial. Un blazer versátil que funciona con jeans o pantalones de vestir.",
    audience: "hombre",
    categorySlug: "blazers",
    isNew: false,
    isWholesale: false,
    badgeLabel: "edicion-limitada",
    sortOrder: 4,
    images: [
      { url: "/products/blazer-camel.jpg", alt: "Modelo sentado con blazer camel, polo blanco y pantalón claro", isPrimary: true },
    ],
    variants: [
      { sku: "BLZ-CAM-CAM-S", size: "S", colorName: "Camel", colorSwatch: "#b8875a", stock: 4 },
      { sku: "BLZ-CAM-CAM-M", size: "M", colorName: "Camel", colorSwatch: "#b8875a", stock: 7 },
      { sku: "BLZ-CAM-CAM-L", size: "L", colorName: "Camel", colorSwatch: "#b8875a", stock: 5 },
      { sku: "BLZ-CAM-CAM-XL", size: "XL", colorName: "Camel", colorSwatch: "#b8875a", stock: 3 },
      { sku: "BLZ-CAM-GRA-S", size: "S", colorName: "Grafito", colorSwatch: "#3d3c3a", stock: 3 },
      { sku: "BLZ-CAM-GRA-M", size: "M", colorName: "Grafito", colorSwatch: "#3d3c3a", stock: 5 },
      { sku: "BLZ-CAM-GRA-L", size: "L", colorName: "Grafito", colorSwatch: "#3d3c3a", stock: 4 },
      { sku: "BLZ-CAM-GRA-XL", size: "XL", colorName: "Grafito", colorSwatch: "#3d3c3a", stock: 2 },
    ],
    retailPrice: 32900,
    compareAtPrice: 38900,
    wholesalePrice: null,
  },
  {
    name: "Casaca utilitaria oversize",
    slug: "casaca-utilitaria-oliva",
    shortDescription: "Casaca tipo utility con múltiples bolsillos, corte oversize en algodón encerado.",
    fullDescription: "Casaca utilitaria de corte oversize en algodón encerado resistente al agua. Cuatro bolsillos frontales con solapa, cierre de cremallera y botones a presión, cintura ajustable con cordón interior. Una pieza funcional con estética urbana.",
    audience: "mujer",
    categorySlug: "casacas",
    isNew: false,
    isWholesale: true,
    badgeLabel: null,
    sortOrder: 5,
    images: [
      { url: "/products/casaca-utilitaria.jpg", alt: "Modelo con casaca utilitaria verde oliva y gorro negro", isPrimary: true },
    ],
    variants: [
      { sku: "CAS-UTL-OLV-S", size: "S", colorName: "Oliva", colorSwatch: "#5b5a3c", stock: 10 },
      { sku: "CAS-UTL-OLV-M", size: "M", colorName: "Oliva", colorSwatch: "#5b5a3c", stock: 14 },
      { sku: "CAS-UTL-OLV-L", size: "L", colorName: "Oliva", colorSwatch: "#5b5a3c", stock: 8 },
      { sku: "CAS-UTL-ARE-S", size: "S", colorName: "Arena", colorSwatch: "#cdbfa8", stock: 7 },
      { sku: "CAS-UTL-ARE-M", size: "M", colorName: "Arena", colorSwatch: "#cdbfa8", stock: 11 },
      { sku: "CAS-UTL-ARE-L", size: "L", colorName: "Arena", colorSwatch: "#cdbfa8", stock: 6 },
    ],
    retailPrice: 27900,
    compareAtPrice: null,
    wholesalePrice: { amount: 21900, minQuantity: 12 },
  },
  {
    name: "Camisa de popelina",
    slug: "camisa-popelina-blanca",
    shortDescription: "Camisa clásica de popelina de algodón, cuello italiano y corte regular.",
    fullDescription: "Camisa confeccionada en popelina de algodón 100% de doble torsión, suave y resistente. Cuello italiano semirrígido, puños de dos botones y corte regular que permite movimiento. Un imprescindible para el guardarropa masculino.",
    audience: "hombre",
    categorySlug: "camisas",
    isNew: false,
    isWholesale: true,
    badgeLabel: null,
    sortOrder: 6,
    images: [
      { url: "/products/camisa-popelina.jpg", alt: "Camisas blancas de popelina colgadas en una barra", isPrimary: true },
    ],
    variants: [
      { sku: "CAM-POP-BL-S", size: "S", colorName: "Blanco", colorSwatch: "#f6f5f1", stock: 25 },
      { sku: "CAM-POP-BL-M", size: "M", colorName: "Blanco", colorSwatch: "#f6f5f1", stock: 40 },
      { sku: "CAM-POP-BL-L", size: "L", colorName: "Blanco", colorSwatch: "#f6f5f1", stock: 30 },
      { sku: "CAM-POP-BL-XL", size: "XL", colorName: "Blanco", colorSwatch: "#f6f5f1", stock: 18 },
      { sku: "CAM-POP-BL-XXL", size: "XXL", colorName: "Blanco", colorSwatch: "#f6f5f1", stock: 8 },
      { sku: "CAM-POP-CEL-S", size: "S", colorName: "Celeste", colorSwatch: "#c9d6e3", stock: 20 },
      { sku: "CAM-POP-CEL-M", size: "M", colorName: "Celeste", colorSwatch: "#c9d6e3", stock: 32 },
      { sku: "CAM-POP-CEL-L", size: "L", colorName: "Celeste", colorSwatch: "#c9d6e3", stock: 24 },
      { sku: "CAM-POP-CEL-XL", size: "XL", colorName: "Celeste", colorSwatch: "#c9d6e3", stock: 14 },
      { sku: "CAM-POP-CEL-XXL", size: "XXL", colorName: "Celeste", colorSwatch: "#c9d6e3", stock: 6 },
    ],
    retailPrice: 13900,
    compareAtPrice: null,
    wholesalePrice: { amount: 9900, minQuantity: 24 },
  },
  {
    name: "Casaca biker acolchada",
    slug: "casaca-biker-negra",
    shortDescription: "Casaca tipo biker en cuero sintético con acolchado en hombros y cierres metálicos.",
    fullDescription: "Casaca biker de cuero sintético de alta calidad con forro interior acolchado. Cierres metálicos en puños y bolsillos, solapa con hebilla y cinturón integrado. Una pieza con actitud que eleva cualquier look básico.",
    audience: "mujer",
    categorySlug: "casacas",
    isNew: true,
    isWholesale: false,
    badgeLabel: null,
    sortOrder: 7,
    images: [
      { url: "/products/casaca-biker.jpg", alt: "Casaca biker negra con cierres metálicos sobre tela blanca", isPrimary: true },
    ],
    variants: [
      { sku: "CAS-BIK-NEG-XS", size: "XS", colorName: "Negro", colorSwatch: "#121110", stock: 4 },
      { sku: "CAS-BIK-NEG-S", size: "S", colorName: "Negro", colorSwatch: "#121110", stock: 8 },
      { sku: "CAS-BIK-NEG-M", size: "M", colorName: "Negro", colorSwatch: "#121110", stock: 6 },
      { sku: "CAS-BIK-NEG-L", size: "L", colorName: "Negro", colorSwatch: "#121110", stock: 3 },
    ],
    retailPrice: 39900,
    compareAtPrice: null,
    wholesalePrice: null,
  },
  {
    name: "Casaca denim índigo",
    slug: "casaca-denim-indigo",
    shortDescription: "Casaca clásica de denim en tono índigo con cuello de pana contrastante.",
    fullDescription: "Casaca de denim 100% algodón en tono índigo profundo con cuello forrado en pana marrón. Bolsillos frontales con solapa y botones a presión, costura de caballo doble y lavado enzimático suave. Un clásico reinventado.",
    audience: "hombre",
    categorySlug: "denim",
    isNew: false,
    isWholesale: true,
    badgeLabel: null,
    sortOrder: 8,
    images: [
      { url: "/products/casaca-denim.jpg", alt: "Casaca de denim índigo con cuello de pana colgada sobre fondo negro", isPrimary: true },
    ],
    variants: [
      { sku: "CAS-DEN-IND-S", size: "S", colorName: "Índigo", colorSwatch: "#2b3a5c", stock: 12 },
      { sku: "CAS-DEN-IND-M", size: "M", colorName: "Índigo", colorSwatch: "#2b3a5c", stock: 18 },
      { sku: "CAS-DEN-IND-L", size: "L", colorName: "Índigo", colorSwatch: "#2b3a5c", stock: 14 },
      { sku: "CAS-DEN-IND-XL", size: "XL", colorName: "Índigo", colorSwatch: "#2b3a5c", stock: 8 },
      { sku: "CAS-DEN-NL-S", size: "S", colorName: "Negro lavado", colorSwatch: "#2a2a2c", stock: 10 },
      { sku: "CAS-DEN-NL-M", size: "M", colorName: "Negro lavado", colorSwatch: "#2a2a2c", stock: 15 },
      { sku: "CAS-DEN-NL-L", size: "L", colorName: "Negro lavado", colorSwatch: "#2a2a2c", stock: 12 },
      { sku: "CAS-DEN-NL-XL", size: "XL", colorName: "Negro lavado", colorSwatch: "#2a2a2c", stock: 6 },
    ],
    retailPrice: 22900,
    compareAtPrice: null,
    wholesalePrice: { amount: 17400, minQuantity: 12 },
  },
];

// ──────────────────────────────────────────────────────────────
// Seed execution
// ──────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Iniciando seed de datos de demostración...\n");

  // Verificar si ya existen datos
  const [existing] = await db.select({ count: count() }).from(schema.products);
  if (existing && existing.count > 0) {
    console.log(`ℹ️  Ya existen ${existing.count} productos en la base de datos.`);
    console.log("   Para evitar duplicados, el seed no insertará datos adicionales.");
    console.log("   Si deseas reiniciar, borra los datos manualmente primero.");
    return;
  }

  // 1. Insertar categorías
  console.log("📁 Insertando categorías...");
  const categoryMap = new Map<string, number>();

  for (const cat of DEMO_CATEGORIES) {
    const [inserted] = await db
      .insert(schema.categories)
      .values({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        audience: cat.audience ?? null,
        sortOrder: cat.sortOrder,
        isActive: true,
      })
      .returning({ id: schema.categories.id });

    if (inserted) {
      categoryMap.set(cat.slug, inserted.id);
      console.log(`   ✓ ${cat.name} (id: ${inserted.id})`);
    }
  }

  // 2. Insertar productos con variantes, imágenes y precios
  console.log("\n📦 Insertando productos...");

  for (const prod of DEMO_PRODUCTS) {
    const categoryId = categoryMap.get(prod.categorySlug);
    if (!categoryId) {
      console.error(`   ✗ Categoría no encontrada: ${prod.categorySlug}`);
      continue;
    }

    // Insertar producto
    const [insertedProduct] = await db
      .insert(schema.products)
      .values({
        slug: prod.slug,
        name: prod.name,
        shortDescription: prod.shortDescription,
        fullDescription: prod.fullDescription,
        audience: prod.audience,
        categoryId,
        status: "active",
        isNew: prod.isNew,
        isWholesale: prod.isWholesale,
        badgeLabel: prod.badgeLabel,
        sortOrder: prod.sortOrder,
        isDemo: true,
      })
      .returning({ id: schema.products.id });

    if (!insertedProduct) continue;
    const productId = insertedProduct.id;
    console.log(`   ✓ ${prod.name} (id: ${productId})`);

    // Insertar imágenes
    for (const [i, img] of prod.images.entries()) {
      await db.insert(schema.productImages).values({
        productId,
        url: img.url,
        alt: img.alt,
        sortOrder: i,
        isPrimary: img.isPrimary,
      });
    }

    // Insertar variantes
    for (const v of prod.variants) {
      await db.insert(schema.productVariants).values({
        productId,
        sku: v.sku,
        size: v.size,
        colorName: v.colorName,
        colorSwatch: v.colorSwatch,
        stock: v.stock,
        isActive: true,
      });
    }

    // Insertar precio minorista
    await db.insert(schema.productPrices).values({
      productId,
      type: "retail",
      amount: prod.retailPrice,
      compareAtAmount: prod.compareAtPrice,
      minQuantity: 1,
    });

    // Insertar precio mayorista si existe
    if (prod.wholesalePrice) {
      await db.insert(schema.productPrices).values({
        productId,
        type: "wholesale",
        amount: prod.wholesalePrice.amount,
        minQuantity: prod.wholesalePrice.minQuantity,
      });
    }
  }

  console.log("\n✅ Seed completado exitosamente.");
  console.log(`   ${DEMO_CATEGORIES.length} categorías`);
  console.log(`   ${DEMO_PRODUCTS.length} productos`);
  console.log(`   Todos marcados con is_demo=true`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error durante el seed:", err);
    process.exit(1);
  });
