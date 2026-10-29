/** Lógica pura de variantes y stock (solo cuentan las variantes activas). */
export interface VariantLike {
  size: string | null;
  colorName: string | null;
  stock: number;
  isActive: boolean;
}

export function activeVariants<T extends VariantLike>(variants: readonly T[]): T[] {
  return variants.filter((v) => v.isActive);
}

/** Stock total del producto: suma de variantes activas (nunca negativo). */
export function totalStock(variants: readonly VariantLike[]): number {
  return activeVariants(variants).reduce((sum, v) => sum + Math.max(0, v.stock), 0);
}

export function isSoldOut(variants: readonly VariantLike[]): boolean {
  return totalStock(variants) === 0;
}

/** Variante exacta para una combinación color + talla (o null si no existe o está inactiva). */
export function findVariant<T extends VariantLike>(variants: readonly T[], color: string | null, size: string | null): T | null {
  if (!color || !size) return null;
  return activeVariants(variants).find((v) => v.colorName === color && v.size === size) ?? null;
}

/** ¿Hay unidades de esa talla en el color elegido? */
export function sizeInStock(variants: readonly VariantLike[], color: string | null, size: string): boolean {
  return activeVariants(variants).some((v) => (color === null || v.colorName === color) && v.size === size && v.stock > 0);
}

/** ¿Hay unidades de ese color (en cualquier talla)? */
export function colorInStock(variants: readonly VariantLike[], color: string): boolean {
  return activeVariants(variants).some((v) => v.colorName === color && v.stock > 0);
}
