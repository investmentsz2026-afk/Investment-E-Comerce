import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  ecommerceShowcaseConfig,
  heroSlides,
  homeLineSlides,
  lookbookSlides,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";

export type LookbookSlot = "left" | "right" | "brand";

export interface HeroSlideItem {
  id: number;
  badge: string;
  promoPill: string;
  eyebrow: string;
  titleLine1: string;
  titleHighlight: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  bgImageUrl: string;
  productId: number | null;
  cardTag: string;
  cardTitle: string;
  cardSubtitle: string;
  cardPriceText: string;
  cardHref: string;
  cardImageUrl: string;
  cardHoverImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface HomeLineItem {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  hoverImageUrl: string | null;
  linkHref: string;
  accent: "blue" | "red";
  sortOrder: number;
  isActive: boolean;
}

export const DEFAULT_HOME_LINES: ReadonlyArray<HomeLineItem> = [
  {
    id: 1,
    title: "Pantalones Drill",
    subtitle: "King 767 · Skinny Fit",
    badge: "Línea Drill",
    linkHref: "/catalogo/pantalones?audiencia=hombre",
    imageUrl: "/catalogo-colt/pantalon-king-767-model.png",
    hoverImageUrl: "/catalogo-colt/pantalon-king-767-closeup.png",
    accent: "blue",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 2,
    title: "Jeans Denim",
    subtitle: "Relaxed 750 & Comfort 762",
    badge: "Catálogo 2026",
    linkHref: "/catalogo/denim?audiencia=hombre",
    imageUrl: "/catalogo-colt/jean-relaxed-750-model.png",
    hoverImageUrl: "/catalogo-colt/jean-relaxed-750-closeup.png",
    accent: "red",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 3,
    title: "Camisas Denim",
    subtitle: "Camisa Zair · Slim Fit",
    badge: "Slim Fit",
    linkHref: "/catalogo/camisas?audiencia=hombre",
    imageUrl: "/catalogo-colt/camisa-zair-model.png",
    hoverImageUrl: "/catalogo-colt/camisa-zair-closeup.png",
    accent: "blue",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 4,
    title: "Polos Piqué Mark",
    subtitle: "Classic Fit · 10 Colores",
    badge: "Algodón Peruano",
    linkHref: "/catalogo/polos?audiencia=hombre",
    imageUrl: "/catalogo-colt/polo-mark-model.png",
    hoverImageUrl: "/catalogo-colt/polo-mark-closeup.png",
    accent: "red",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 5,
    title: "Drill Fendy 769",
    subtitle: "Slim Fit · 9 Colores",
    badge: "Stretch",
    linkHref: "/producto/pantalon-drill-fendy-769",
    imageUrl: "/catalogo-colt/pantalon-fendy-769-model.png",
    hoverImageUrl: "/catalogo-colt/pantalon-fendy-769-closeup.png",
    accent: "blue",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 6,
    title: "Bermuda Balance 770",
    subtitle: "Drill Stretch · Tallas 28 a 46",
    badge: "Temporada",
    linkHref: "/producto/bermuda-drill-balance-770",
    imageUrl: "/catalogo-colt/bermuda-balance-770-model.png",
    hoverImageUrl: "/catalogo-colt/bermuda-balance-770-closeup.png",
    accent: "red",
    sortOrder: 6,
    isActive: true,
  },
  {
    id: 7,
    title: "Drill Rolex 770",
    subtitle: "Straight Fit · Bota Recta",
    badge: "Confort",
    linkHref: "/producto/pantalon-drill-rolex-770",
    imageUrl: "/catalogo-colt/pantalon-rolex-770-model.png",
    hoverImageUrl: "/catalogo-colt/pantalon-rolex-770-closeup.png",
    accent: "blue",
    sortOrder: 7,
    isActive: true,
  },
  {
    id: 8,
    title: "Camisa Kendall",
    subtitle: "Slim Fit · 8 Colores",
    badge: "Nuevo Ingreso",
    linkHref: "/producto/camisa-clasica-kendall-slim-fit",
    imageUrl: "/catalogo-colt/camisa-kendall-model.png",
    hoverImageUrl: "/catalogo-colt/camisa-kendall-closeup.png",
    accent: "red",
    sortOrder: 8,
    isActive: true,
  },
];

export const DEFAULT_HERO_SLIDES: ReadonlyArray<HeroSlideItem> = [
  {
    id: 1,
    badge: "CATÁLOGO OFICIAL 2026",
    promoPill: "3x2 Y HASTA -50% DSCTO",
    eyebrow: "AMERICAN COLT JEANS™ · LÍNEA HOMBRE",
    titleLine1: "¡TUS PREFERIDOS EN",
    titleHighlight: "JEANS & DENIM!",
    description:
      "Colección masculina American Colt: Jean Relaxed 750, Comfort 762, Bull Denim 750 y Camisa Denim Zair.",
    primaryCtaLabel: "Ver más aquí >>",
    primaryCtaHref: "/catalogo?audiencia=hombre",
    secondaryCtaLabel: "Ofertas -50%",
    secondaryCtaHref: "/catalogo?audiencia=hombre&novedades=1&oferta=50",
    bgImageUrl: "/catalogo-colt/hero-colt-1.png",
    productId: null,
    cardTag: "Catálogo 2026",
    cardTitle: "Camisa Denim Zair",
    cardSubtitle: "Slim Fit · Pasa el mouse para zoom",
    cardPriceText: "S/ 130.00",
    cardHref: "/producto/camisa-denim-zair-slim-fit",
    cardImageUrl: "/catalogo-colt/camisa-zair-model.png",
    cardHoverImageUrl: "/catalogo-colt/camisa-zair-closeup.png",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 2,
    badge: "LÍNEA DRILL PREMIUM",
    promoPill: "TALLAS 28 A 40 · STRETCH",
    eyebrow: "PANTALONES & BERMUDAS DRILL",
    titleLine1: "ELEGANCIA Y CONFORT",
    titleHighlight: "DRILL PREMIUM",
    description:
      "Pantalones Drill King 767 (Skinny Fit), Fendy 769 (Slim Fit), Rolex 770 (Straight Fit) y Bermuda Balance 770.",
    primaryCtaLabel: "Ver más aquí >>",
    primaryCtaHref: "/catalogo/pantalones?audiencia=hombre",
    secondaryCtaLabel: "Ver King 767",
    secondaryCtaHref: "/producto/pantalon-drill-king-767",
    bgImageUrl: "/catalogo-colt/hero-colt-2.png",
    productId: null,
    cardTag: "Top Ventas",
    cardTitle: "Pantalón Drill King 767",
    cardSubtitle: "Skinny Fit · 7 Colores",
    cardPriceText: "S/ 140.00",
    cardHref: "/producto/pantalon-drill-king-767",
    cardImageUrl: "/catalogo-colt/pantalon-king-767-model.png",
    cardHoverImageUrl: "/catalogo-colt/pantalon-king-767-closeup.png",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 3,
    badge: "LÍNEA CLÁSICA AMERICAN COLT",
    promoPill: "TALLAS HASTA 46",
    eyebrow: "CALCE CLÁSICO Y RESISTENCIA SUPERIOR",
    titleLine1: "TRADICIÓN Y ESTILO",
    titleHighlight: "LÍNEA CLÁSICA",
    description:
      "Jeans Comfort 762, Bull Denim 750 y Parker 769 confeccionados con mezclilla de alto gramaje.",
    primaryCtaLabel: "Ver más aquí >>",
    primaryCtaHref: "/catalogo/denim?audiencia=hombre",
    secondaryCtaLabel: "Comfort 762",
    secondaryCtaHref: "/producto/jean-denim-comfort-762",
    bgImageUrl: "/catalogo-colt/hero-colt-3.png",
    productId: null,
    cardTag: "Línea Clásica",
    cardTitle: "Jean Comfort 762",
    cardSubtitle: "Classic Fit · Tallas 28 a 46",
    cardPriceText: "S/ 130.00",
    cardHref: "/producto/jean-denim-comfort-762",
    cardImageUrl: "/catalogo-colt/jean-comfort-762-model.png",
    cardHoverImageUrl: "/catalogo-colt/jean-comfort-762-closeup.png",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 4,
    badge: "NUEVA TEMPORADA",
    promoPill: "ALGODÓN PERUANO",
    eyebrow: "CAMISAS MANGA LARGA & POLOS PIQUÉ",
    titleLine1: "CAMISAS KENDALL &",
    titleHighlight: "POLOS CLÁSICOS MARK",
    description:
      "Combina tus Jeans y Pantalones Drill con nuestras Camisas Kendall Slim Fit y Polos Piqué Mark.",
    primaryCtaLabel: "Ver más aquí >>",
    primaryCtaHref: "/catalogo/camisas?audiencia=hombre",
    secondaryCtaLabel: "Ver Polos",
    secondaryCtaHref: "/catalogo/polos?audiencia=hombre",
    bgImageUrl: "/catalogo-colt/hero-colt-4.png",
    productId: null,
    cardTag: "Algodón Peruano",
    cardTitle: "Polo Piqué Clásico Mark",
    cardSubtitle: "10 Colores · Tallas S a XXL",
    cardPriceText: "S/ 89.00",
    cardHref: "/producto/polo-pique-clasico-mark",
    cardImageUrl: "/catalogo-colt/polo-mark-model.png",
    cardHoverImageUrl: "/catalogo-colt/polo-mark-closeup.png",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 5,
    badge: "CANAL MAYORISTA B2B",
    promoPill: "PRECIOS DE FÁBRICA",
    eyebrow: "ABASTECE TU TIENDA, BOUTIQUE O EMPRESA",
    titleLine1: "VENTAS POR MAYOR",
    titleHighlight: "Y POR UNIDAD",
    description:
      "Precios escalonados automáticos desde 12, 50 y 200+ unidades en toda la colección American Colt JEANS™.",
    primaryCtaLabel: "Ver más aquí >>",
    primaryCtaHref: "/mayorista",
    secondaryCtaLabel: "Cotizar Lote",
    secondaryCtaHref: "/mayorista/cotizaciones",
    bgImageUrl: "/catalogo-colt/hero-colt-1.png",
    productId: null,
    cardTag: "Tarifa Mayorista",
    cardTitle: "Jean Relaxed 750",
    cardSubtitle: "Lotes desde 12 Unidades",
    cardPriceText: "Por Mayor S/ 88.00",
    cardHref: "/producto/jean-denim-relaxed-750",
    cardImageUrl: "/catalogo-colt/jean-relaxed-750-model.png",
    cardHoverImageUrl: "/catalogo-colt/jean-relaxed-750-closeup.png",
    sortOrder: 5,
    isActive: true,
  },
];

export interface LookbookSlideItem {
  id: number;
  title: string;
  subtitle: string | null;
  badge: string;
  priceTag: string | null;
  imageUrl: string;
  linkHref: string;
  slot: LookbookSlot;
  sortOrder: number;
  isActive: boolean;
}

export interface EcommerceShowcaseConfig {
  centerBadge: string;
  centerTitle: string;
  centerHighlight: string;
  centerSubtitle: string;
  leftLabel: string;
  rightLabel: string;
}

export const SHOWCASE_CONFIG_KEY = "home_b2b_stage";
export const BRAND_CONFIG_KEY = "home_brand_manifesto";

export const DEFAULT_SHOWCASE_CONFIG: EcommerceShowcaseConfig = {
  centerBadge: "AMERICAN COLT JEANS™ · 2026",
  centerTitle: "VESTIMOS NEGOCIOS QUE",
  centerHighlight: "CRECEN.",
  centerSubtitle:
    "Prendas oficiales en Denim, Drill y Algodón Peruano por unidad y mayor.",
  leftLabel: "CAMISAS & POLOS",
  rightLabel: "JEANS & DRILL",
};

export const DEFAULT_BRAND_CONFIG: EcommerceShowcaseConfig = {
  centerBadge: "Marca Oficial Peruana",
  centerTitle: "AUTÉNTICO DENIM AMERICANO CON EL",
  centerHighlight: "MEJOR ALGODÓN PERUANO",
  centerSubtitle:
    "Prendas en Denim Ring y Drill de exportación con acabados de primera para compra por unidad y distribuidores B2B.",
  leftLabel: "CALIDAD DENIM EXPORTACIÓN",
  rightLabel: "100% Confección Peruana",
};

export const DEFAULT_LOOKBOOK_SLIDES: ReadonlyArray<Omit<LookbookSlideItem, "id">> = [
  // LADO IZQUIERDO: CAMISAS & POLOS
  {
    title: "Camisa Denim Zair",
    subtitle: "Slim Fit · Algodón Denim Premium",
    badge: "CAMISAS",
    priceTag: "S/ 130.00",
    imageUrl: "/catalogo-colt/camisa-zair-model.png",
    linkHref: "/producto/camisa-denim-zair-slim-fit",
    slot: "left",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "Camisa Clásica Kendall",
    subtitle: "Slim Fit · Acabado Ejecutivo",
    badge: "NUEVA TEMPORADA",
    priceTag: "S/ 125.00",
    imageUrl: "/catalogo-colt/camisa-kendall-model.png",
    linkHref: "/producto/camisa-clasica-kendall-slim-fit",
    slot: "left",
    sortOrder: 2,
    isActive: true,
  },
  {
    title: "Polo Piqué Clásico Mark",
    subtitle: "10 Colores · Algodón Peruano",
    badge: "POLOS PIQUÉ",
    priceTag: "S/ 89.00",
    imageUrl: "/catalogo-colt/polo-mark-model.png",
    linkHref: "/producto/polo-pique-clasico-mark",
    slot: "left",
    sortOrder: 3,
    isActive: true,
  },
  // LADO DERECHO: JEANS & PANTALONES DRILL
  {
    title: "Look Ejecutivo Denim Zair",
    subtitle: "Jean Slim + Sobrecamisa Indigo 2026",
    badge: "EDICIÓN 2026",
    priceTag: "S/ 130.00",
    imageUrl: "/lookbook-denim-ejecutivo.jpg",
    linkHref: "/producto/camisa-denim-zair-slim-fit",
    slot: "right",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "Pantalón Drill King 767",
    subtitle: "Skinny Fit Stretch · 7 Colores",
    badge: "TOP VENTAS",
    priceTag: "S/ 140.00",
    imageUrl: "/catalogo-colt/pantalon-king-767-model.png",
    linkHref: "/producto/pantalon-drill-king-767",
    slot: "right",
    sortOrder: 2,
    isActive: true,
  },
  {
    title: "Jean Denim Comfort 762",
    subtitle: "Classic Fit · Tallas 28 a 46",
    badge: "CLÁSICO",
    priceTag: "S/ 130.00",
    imageUrl: "/catalogo-colt/jean-comfort-762-model.png",
    linkHref: "/producto/jean-denim-comfort-762",
    slot: "right",
    sortOrder: 3,
    isActive: true,
  },
  {
    title: "Pantalón Drill Fendy 769",
    subtitle: "Slim Fit Semipitillo · 9 Colores",
    badge: "DRILL STRETCH",
    priceTag: "S/ 130.00",
    imageUrl: "/catalogo-colt/pantalon-fendy-769-model.png",
    linkHref: "/producto/pantalon-drill-fendy-769",
    slot: "right",
    sortOrder: 4,
    isActive: true,
  },
  // SECCIÓN MARCA OFICIAL PERUANA
  {
    title: "Campaña Oficial American Colt 2026",
    subtitle: "Algodón Peruano · Alta Resistencia",
    badge: "CALIDAD EXPORTACIÓN",
    priceTag: "Tallas 28 - 46",
    imageUrl: "/catalogo-colt/02-campana-bolsas.png",
    linkHref: "/catalogo",
    slot: "brand",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "Colección Denim 2026",
    subtitle: "Cortes Relaxed, Comfort & Slim Fit",
    badge: "DENIM RING",
    priceTag: "Unidad & Mayor",
    imageUrl: "/catalogo-colt/16-portada-jeans-2026.png",
    linkHref: "/catalogo/denim?audiencia=hombre",
    slot: "brand",
    sortOrder: 2,
    isActive: true,
  },
  {
    title: "Edición Estudio Indigo",
    subtitle: "Acabado Enzimático y Elastano Premium",
    badge: "TALLER PERUANO",
    priceTag: "Stock Permanente",
    imageUrl: "/catalogo-colt/01-estudio-azul.png",
    linkHref: "/catalogo/camisas?audiencia=hombre",
    slot: "brand",
    sortOrder: 3,
    isActive: true,
  },
  {
    title: "Línea Drill & Urbano B2B",
    subtitle: "Precios de Fábrica desde 12 Unidades",
    badge: "VENTA B2B",
    priceTag: "Envío Nacional",
    imageUrl: "/catalogo-colt/08-linea-drill-premium.png",
    linkHref: "/mayorista",
    slot: "brand",
    sortOrder: 4,
    isActive: true,
  },
];

let seedPromise: Promise<void> | null = null;
let seedCompleted = false;

async function ensureSeededIfEmpty() {
  if (seedCompleted) return;
  if (!seedPromise) {
    seedPromise = runEnsureSeeded().then(
      () => {
        seedCompleted = true;
        seedPromise = null;
      },
      (err) => {
        seedPromise = null;
        throw err;
      },
    );
  }
  await seedPromise;
}

async function runEnsureSeeded() {
  const db = getDb();

  // 1. Sembrar configuraciones (escenario B2B + sección marca) si faltan
  const existingCfgs = await db
    .select({ key: ecommerceShowcaseConfig.key })
    .from(ecommerceShowcaseConfig);

  if (!existingCfgs.some((c) => c.key === SHOWCASE_CONFIG_KEY)) {
    await db.insert(ecommerceShowcaseConfig).values({
      key: SHOWCASE_CONFIG_KEY,
      ...DEFAULT_SHOWCASE_CONFIG,
    });
  }

  if (!existingCfgs.some((c) => c.key === BRAND_CONFIG_KEY)) {
    await db.insert(ecommerceShowcaseConfig).values({
      key: BRAND_CONFIG_KEY,
      ...DEFAULT_BRAND_CONFIG,
    });
  }

  // 2. Sembrar slides iniciales si la tabla está vacía, o repartir los existentes / añadir sección marca
  const allSlides = await db
    .select({
      id: lookbookSlides.id,
      title: lookbookSlides.title,
      slot: lookbookSlides.slot,
    })
    .from(lookbookSlides)
    .orderBy(asc(lookbookSlides.id));

  if (allSlides.length === 0) {
    await db.insert(lookbookSlides).values(
      DEFAULT_LOOKBOOK_SLIDES.map((s) => ({
        title: s.title,
        subtitle: s.subtitle,
        badge: s.badge,
        priceTag: s.priceTag,
        imageUrl: s.imageUrl,
        linkHref: s.linkHref,
        slot: s.slot,
        sortOrder: s.sortOrder,
        isActive: s.isActive,
      })),
    );
  } else {
    // Limpiar duplicados accidentales por concurrencia previa
    const seenLooks = new Set<string>();
    const dupLookIds: number[] = [];
    for (const s of allSlides) {
      const k = `${s.title.trim().toLowerCase()}|${s.slot}`;
      if (seenLooks.has(k)) dupLookIds.push(s.id);
      else seenLooks.add(k);
    }
    if (dupLookIds.length > 0) {
      await db.delete(lookbookSlides).where(inArray(lookbookSlides.id, dupLookIds));
    }

    const hasLeft = allSlides.some((s) => s.slot === "left");
    if (!hasLeft) {
      const shirtIds = allSlides
        .filter(
          (s) =>
            s.title.toLowerCase().includes("camisa") ||
            s.title.toLowerCase().includes("polo"),
        )
        .map((s) => s.id);

      if (shirtIds.length > 0) {
        await db
          .update(lookbookSlides)
          .set({ slot: "left" })
          .where(inArray(lookbookSlides.id, shirtIds));
      }

      const hasKendall = allSlides.some((s) =>
        s.title.toLowerCase().includes("kendall"),
      );
      if (!hasKendall) {
        await db.insert(lookbookSlides).values({
          title: "Camisa Clásica Kendall",
          subtitle: "Slim Fit · Acabado Ejecutivo",
          badge: "NUEVA TEMPORADA",
          priceTag: "S/ 125.00",
          imageUrl: "/catalogo-colt/camisa-kendall-model.png",
          linkHref: "/producto/camisa-clasica-kendall-slim-fit",
          slot: "left",
          sortOrder: 2,
          isActive: true,
        });
      }
    }

    const hasBrand = allSlides.some((s) => s.slot === "brand");
    if (!hasBrand) {
      const brandDefaults = DEFAULT_LOOKBOOK_SLIDES.filter(
        (s) => s.slot === "brand",
      );
      if (brandDefaults.length > 0) {
        await db.insert(lookbookSlides).values(
          brandDefaults.map((s) => ({
            title: s.title,
            subtitle: s.subtitle,
            badge: s.badge,
            priceTag: s.priceTag,
            imageUrl: s.imageUrl,
            linkHref: s.linkHref,
            slot: s.slot,
            sortOrder: s.sortOrder,
            isActive: s.isActive,
          })),
        );
      }
    }
  }

  // 3. Sembrar slides iniciales de Portada Principal (Hero) si está vacía y limpiar duplicados
  const existingHero = await db
    .select({
      id: heroSlides.id,
      titleLine1: heroSlides.titleLine1,
      titleHighlight: heroSlides.titleHighlight,
    })
    .from(heroSlides)
    .orderBy(asc(heroSlides.id));

  if (existingHero.length === 0) {
    await db.insert(heroSlides).values(
      DEFAULT_HERO_SLIDES.map((h) => ({
        badge: h.badge,
        promoPill: h.promoPill,
        eyebrow: h.eyebrow,
        titleLine1: h.titleLine1,
        titleHighlight: h.titleHighlight,
        description: h.description,
        primaryCtaLabel: h.primaryCtaLabel,
        primaryCtaHref: h.primaryCtaHref,
        secondaryCtaLabel: h.secondaryCtaLabel,
        secondaryCtaHref: h.secondaryCtaHref,
        bgImageUrl: h.bgImageUrl,
        productId: h.productId,
        cardTag: h.cardTag,
        cardTitle: h.cardTitle,
        cardSubtitle: h.cardSubtitle,
        cardPriceText: h.cardPriceText,
        cardHref: h.cardHref,
        cardImageUrl: h.cardImageUrl,
        cardHoverImageUrl: h.cardHoverImageUrl,
        sortOrder: h.sortOrder,
        isActive: h.isActive,
      })),
    );
  } else {
    const seenHeroes = new Set<string>();
    const dupHeroIds: number[] = [];
    for (const h of existingHero) {
      const k = `${h.titleLine1.trim().toLowerCase()}|${h.titleHighlight.trim().toLowerCase()}`;
      if (seenHeroes.has(k)) dupHeroIds.push(h.id);
      else seenHeroes.add(k);
    }
    if (dupHeroIds.length > 0) {
      await db.delete(heroSlides).where(inArray(heroSlides.id, dupHeroIds));
    }
  }

  // 4. Sembrar tarjetas iniciales de "¡Explora Nuestras Líneas!" si está vacía y limpiar duplicados
  const existingLines = await db
    .select({
      id: homeLineSlides.id,
      title: homeLineSlides.title,
      linkHref: homeLineSlides.linkHref,
    })
    .from(homeLineSlides)
    .orderBy(asc(homeLineSlides.id));

  if (existingLines.length === 0) {
    await db.insert(homeLineSlides).values(
      DEFAULT_HOME_LINES.map((l) => ({
        title: l.title,
        subtitle: l.subtitle,
        badge: l.badge,
        imageUrl: l.imageUrl,
        hoverImageUrl: l.hoverImageUrl,
        linkHref: l.linkHref,
        accent: l.accent,
        sortOrder: l.sortOrder,
        isActive: l.isActive,
      })),
    );
  } else {
    const seenLines = new Set<string>();
    const dupLineIds: number[] = [];
    for (const l of existingLines) {
      const k = `${l.title.trim().toLowerCase()}|${l.linkHref.trim()}`;
      if (seenLines.has(k)) dupLineIds.push(l.id);
      else seenLines.add(k);
    }
    if (dupLineIds.length > 0) {
      await db.delete(homeLineSlides).where(inArray(homeLineSlides.id, dupLineIds));
    }
  }
}

function mapHeroSlide(r: typeof heroSlides.$inferSelect): HeroSlideItem {
  return {
    id: r.id,
    badge: r.badge,
    promoPill: r.promoPill,
    eyebrow: r.eyebrow,
    titleLine1: r.titleLine1,
    titleHighlight: r.titleHighlight,
    description: r.description,
    primaryCtaLabel: r.primaryCtaLabel,
    primaryCtaHref: r.primaryCtaHref,
    secondaryCtaLabel: r.secondaryCtaLabel,
    secondaryCtaHref: r.secondaryCtaHref,
    bgImageUrl: r.bgImageUrl,
    productId: r.productId ?? null,
    cardTag: r.cardTag,
    cardTitle: r.cardTitle,
    cardSubtitle: r.cardSubtitle,
    cardPriceText: r.cardPriceText,
    cardHref: r.cardHref,
    cardImageUrl: r.cardImageUrl,
    cardHoverImageUrl: r.cardHoverImageUrl ?? null,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  };
}

function mapHomeLine(r: typeof homeLineSlides.$inferSelect): HomeLineItem {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    badge: r.badge,
    imageUrl: r.imageUrl,
    hoverImageUrl: r.hoverImageUrl ?? null,
    linkHref: r.linkHref,
    accent: r.accent === "red" ? "red" : "blue",
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  };
}

function mapSlide(r: typeof lookbookSlides.$inferSelect): LookbookSlideItem {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    badge: r.badge,
    priceTag: r.priceTag,
    imageUrl: r.imageUrl,
    linkHref: r.linkHref,
    slot: r.slot === "left" ? "left" : r.slot === "brand" ? "brand" : "right",
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  };
}

function mapConfigRow(
  cfg: typeof ecommerceShowcaseConfig.$inferSelect | undefined,
  fallback: EcommerceShowcaseConfig,
): EcommerceShowcaseConfig {
  return cfg
    ? {
        centerBadge: cfg.centerBadge,
        centerTitle: cfg.centerTitle,
        centerHighlight: cfg.centerHighlight,
        centerSubtitle: cfg.centerSubtitle,
        leftLabel: cfg.leftLabel,
        rightLabel: cfg.rightLabel,
      }
    : fallback;
}

/**
 * Obtiene los looks activos y textos configurables del escenario 3D y sección marca para la portada pública (/).
 */
export async function getActivePublicShowcaseData(): Promise<{
  slides: LookbookSlideItem[];
  heroSlides: HeroSlideItem[];
  homeLines: HomeLineItem[];
  config: EcommerceShowcaseConfig;
  brandConfig: EcommerceShowcaseConfig;
}> {
  try {
    await ensureSeededIfEmpty();
    const db = getDb();
    const [rows, heroRows, lineRows, cfgRows] = await Promise.all([
      db
        .select()
        .from(lookbookSlides)
        .where(eq(lookbookSlides.isActive, true))
        .orderBy(asc(lookbookSlides.sortOrder), asc(lookbookSlides.id)),
      db
        .select()
        .from(heroSlides)
        .where(eq(heroSlides.isActive, true))
        .orderBy(asc(heroSlides.sortOrder), asc(heroSlides.id)),
      db
        .select()
        .from(homeLineSlides)
        .where(eq(homeLineSlides.isActive, true))
        .orderBy(asc(homeLineSlides.sortOrder), asc(homeLineSlides.id)),
      db.select().from(ecommerceShowcaseConfig),
    ]);

    const mainCfg = cfgRows.find((c) => c.key === SHOWCASE_CONFIG_KEY);
    const brandCfg = cfgRows.find((c) => c.key === BRAND_CONFIG_KEY);

    return {
      slides: rows.map(mapSlide),
      heroSlides:
        heroRows.length > 0 ? heroRows.map(mapHeroSlide) : [...DEFAULT_HERO_SLIDES],
      homeLines:
        lineRows.length > 0 ? lineRows.map(mapHomeLine) : [...DEFAULT_HOME_LINES],
      config: mapConfigRow(mainCfg, DEFAULT_SHOWCASE_CONFIG),
      brandConfig: mapConfigRow(brandCfg, DEFAULT_BRAND_CONFIG),
    };
  } catch {
    return {
      slides: DEFAULT_LOOKBOOK_SLIDES.map((s, idx) => ({ ...s, id: idx + 1 })),
      heroSlides: [...DEFAULT_HERO_SLIDES],
      homeLines: [...DEFAULT_HOME_LINES],
      config: DEFAULT_SHOWCASE_CONFIG,
      brandConfig: DEFAULT_BRAND_CONFIG,
    };
  }
}

/**
 * Obtiene todas las tarjetas y configuraciones de portada para /admin/contenido.
 */
export async function getAdminShowcaseData(): Promise<{
  slides: LookbookSlideItem[];
  heroSlides: HeroSlideItem[];
  homeLines: HomeLineItem[];
  config: EcommerceShowcaseConfig;
  brandConfig: EcommerceShowcaseConfig;
}> {
  await requireAdmin();
  await ensureSeededIfEmpty();
  const db = getDb();
  const [rows, heroRows, lineRows, cfgRows] = await Promise.all([
    db
      .select()
      .from(lookbookSlides)
      .orderBy(asc(lookbookSlides.sortOrder), asc(lookbookSlides.id)),
    db
      .select()
      .from(heroSlides)
      .orderBy(asc(heroSlides.sortOrder), asc(heroSlides.id)),
    db
      .select()
      .from(homeLineSlides)
      .orderBy(asc(homeLineSlides.sortOrder), asc(homeLineSlides.id)),
    db.select().from(ecommerceShowcaseConfig),
  ]);

  const mainCfg = cfgRows.find((c) => c.key === SHOWCASE_CONFIG_KEY);
  const brandCfg = cfgRows.find((c) => c.key === BRAND_CONFIG_KEY);

  return {
    slides: rows.map(mapSlide),
    heroSlides: heroRows.map(mapHeroSlide),
    homeLines: lineRows.map(mapHomeLine),
    config: mapConfigRow(mainCfg, DEFAULT_SHOWCASE_CONFIG),
    brandConfig: mapConfigRow(brandCfg, DEFAULT_BRAND_CONFIG),
  };
}
