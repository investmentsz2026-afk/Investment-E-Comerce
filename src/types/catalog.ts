/**
 * Tipos de datos del catálogo derivados del esquema de base de datos.
 * Estos tipos representan las entidades tal como se consultan y presentan
 * en el frontend, no como se almacenan en las tablas directamente.
 */
import type { StaticImageData } from "next/image";

// ──────────────────────────────────────────────────────────────
// Tipos base (compatibles con Fase 1)
// ──────────────────────────────────────────────────────────────

/** Imagen con texto alternativo obligatorio (accesibilidad y SEO). */
export interface ImageAsset {
  src: StaticImageData | string;
  alt: string;
}

export type Audience = "mujer" | "hombre" | "unisex";

export type ProductBadge = "nuevo" | "edicion-limitada" | "mayorista" | "esencial";

export type SizeCode = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "28" | "30" | "32" | "34" | "36";

export interface ProductColor {
  name: string;
  /** Valor CSS para la muestra de color. */
  swatch: string;
}

/** Escala de precio mayorista por cantidad mínima. */
export interface WholesaleTier {
  minQuantity: number;
  /** Precio unitario en céntimos de PEN. */
  unitPrice: number;
}

/** Formato legacy para tarjetas de producto (compatible con product-card.tsx de Fase 1). */
export interface Product {
  id: string;
  slug: string;
  name: string;
  audience: Audience;
  category: string;
  /** Precio minorista en céntimos de PEN. */
  price: number;
  /** Precio anterior en céntimos de PEN, si existe una rebaja. */
  compareAtPrice?: number;
  colors: readonly ProductColor[];
  sizes: readonly SizeCode[];
  badge?: ProductBadge;
  image: ImageAsset;
  wholesale?: WholesaleTier;
  /** True cuando no queda stock en ninguna variante activa. */
  soldOut?: boolean;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: ImageAsset;
}

// ──────────────────────────────────────────────────────────────
// Tipos Fase 2: derivados de la base de datos
// ──────────────────────────────────────────────────────────────

/** Categoría consultada desde la DB. */
export interface CategoryRecord {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  audience: Audience | null;
  sortOrder: number;
  productCount?: number;
}

/** Imagen de producto consultada desde la DB. */
export interface ProductImageRecord {
  id: number;
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
}

/** Variante de producto consultada desde la DB. */
export interface ProductVariantRecord {
  id: number;
  sku: string;
  size: string | null;
  colorName: string | null;
  colorSwatch: string | null;
  stock: number;
  isActive: boolean;
}

/** Precio de producto consultado desde la DB. */
export interface ProductPriceRecord {
  id: number;
  type: "retail" | "wholesale";
  amount: number;
  compareAtAmount: number | null;
  minQuantity: number;
  maxQuantity: number | null;
}

/** Producto completo consultado de la DB con relaciones. */
export interface ProductRecord {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  fullDescription: string | null;
  audience: Audience;
  categoryId: number;
  status: "draft" | "active" | "archived";
  isNew: boolean;
  isWholesale: boolean;
  badgeLabel: string | null;
  sortOrder: number;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: CategoryRecord;
  images: ProductImageRecord[];
  variants: ProductVariantRecord[];
  prices: ProductPriceRecord[];
}

/** Producto formateado para la tarjeta de catálogo (extiende la interfaz legacy Product). */
export interface CatalogProduct extends Product {
  /** ID numérico de la DB. */
  dbId: number;
  shortDescription: string | null;
  isDemo: boolean;
  /** Variantes agrupadas por talla y color para seleccionar. */
  totalStock: number;
}

// ──────────────────────────────────────────────────────────────
// Parámetros de consulta
// ──────────────────────────────────────────────────────────────

export type SortOption = "relevancia" | "recientes" | "precio-asc" | "precio-desc" | "nombre";

export interface CatalogFilters {
  categoria?: string;
  audiencia?: Audience;
  precioMin?: number;
  precioMax?: number;
  tallas?: string[];
  colores?: string[];
  disponible?: boolean;
  novedades?: boolean;
  mayorista?: boolean;
  busqueda?: string;
  orden?: SortOption;
  pagina?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Opciones de filtro disponibles (para UI dinámica). */
export interface AvailableFilters {
  sizes: string[];
  colors: { name: string; swatch: string; count: number }[];
  priceRange: { min: number; max: number };
  audiences: { value: Audience; count: number }[];
}
