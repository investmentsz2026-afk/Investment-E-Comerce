/**
 * Utilidades puras del catálogo (sin acceso a base de datos ni a `server-only`),
 * para poder reutilizarlas en páginas, consultas y pruebas automatizadas.
 */
import type { Audience, CatalogFilters, SortOption } from "@/types/catalog";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const SORT_OPTIONS: readonly SortOption[] = ["relevancia", "recientes", "precio-asc", "precio-desc", "nombre"];
const MAX_QUERY_LENGTH = 80;
const MAX_LIST_ITEMS = 20;
const MAX_ITEM_LENGTH = 30;
/** Tope razonable de precio aceptado por la URL (en soles). */
const MAX_PRICE_SOLES = 1_000_000;
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function list(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const raw = Array.isArray(v) ? v : [v];
  const clean = raw.map((s) => s.trim()).filter((s) => s.length > 0 && s.length <= MAX_ITEM_LENGTH);
  return Array.from(new Set(clean)).slice(0, MAX_LIST_ITEMS);
}

/** Convierte soles (texto de la URL) a céntimos enteros. Devuelve undefined si no es válido. */
export function parseSolesToCents(v: string | string[] | undefined): number | undefined {
  const s = first(v)?.trim().replace(",", ".");
  if (!s || !/^\d+(\.\d{1,2})?$/.test(s)) return undefined;
  const soles = Number(s);
  if (!Number.isFinite(soles) || soles > MAX_PRICE_SOLES) return undefined;
  return Math.round(soles * 100);
}

export function parsePage(v: string | string[] | undefined): number | undefined {
  const s = first(v);
  if (!s || !/^\d+$/.test(s)) return undefined;
  const n = parseInt(s, 10);
  return n >= 1 && n <= 10_000 ? n : undefined;
}

export function parseAudience(v: string | undefined): Audience | undefined {
  return v === "mujer" || v === "hombre" || v === "unisex" ? v : undefined;
}

export function parseSort(v: string | undefined): SortOption | undefined {
  return SORT_OPTIONS.includes(v as SortOption) ? (v as SortOption) : undefined;
}

/** Interpreta y sanea los parámetros de la URL del catálogo. */
export function parseCatalogParams(sp: RawSearchParams, base: Partial<CatalogFilters> = {}): CatalogFilters {
  let precioMin = parseSolesToCents(sp.precio_min);
  let precioMax = parseSolesToCents(sp.precio_max);
  if (precioMin !== undefined && precioMax !== undefined && precioMin > precioMax) {
    [precioMin, precioMax] = [precioMax, precioMin];
  }
  const q = first(sp.q)?.trim().slice(0, MAX_QUERY_LENGTH);

  return {
    ...base,
    audiencia: parseAudience(first(sp.audiencia)),
    busqueda: q ? q : undefined,
    orden: parseSort(first(sp.orden)),
    pagina: parsePage(sp.pagina),
    novedades: first(sp.novedades) === "1",
    mayorista: first(sp.mayorista) === "1",
    disponible: first(sp.disponible) === "1",
    tallas: list(sp.talla),
    colores: list(sp.color),
    precioMin,
    precioMax,
  };
}

/** Escapa los comodines de LIKE/ILIKE para que el texto del usuario se trate literalmente. */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Minúsculas y sin tildes, para búsquedas tolerantes ("sastreria" ↔ "Sastrería"). */
export function foldText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Tamaño de página: configurable por entorno (CATALOG_PAGE_SIZE), acotado y con valor por defecto. */
export function resolvePageSize(raw: string | undefined): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(n, MAX_PAGE_SIZE);
}

/** Acota la página solicitada al rango existente (nunca muestra una página vacía por URL manual). */
export function clampPage(page: number | undefined, totalPages: number): number {
  return Math.min(Math.max(1, page ?? 1), Math.max(1, totalPages));
}
