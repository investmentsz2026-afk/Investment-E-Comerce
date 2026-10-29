/**
 * Validadores puros de reglas comerciales para el Panel Administrativo (Fase 6).
 * Sin dependencias de Next.js ni de base de datos para permitir pruebas unitarias directas.
 */

export function normalizeCommercialSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parsePenToCents(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim().replace(",", ".");
  if (!str) return null;
  const num = Number(str);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export interface ValidatedWholesaleTier {
  minQuantity: number;
  maxQuantity: number | null;
  amountCents: number;
}

export function validateProductCommercialPayload(input: {
  name: string;
  slug: string;
  categoryId: number;
  audience: string;
  status: string;
  retailPricePen: string | number;
  compareAtPricePen?: string | number | null;
  isWholesale: boolean;
  wholesaleTiers?: Array<{
    minQuantity: number | string;
    maxQuantity?: number | string | null;
    pricePen: number | string;
  }>;
  variants?: Array<{
    id?: number;
    sku: string;
    size?: string | null;
    colorName?: string | null;
    colorSwatch?: string | null;
    stock: number | string;
    isActive?: boolean;
  }>;
}): {
  valid: boolean;
  error?: string;
  normalizedSlug?: string;
  retailAmountCents?: number;
  compareAtAmountCents?: number | null;
  validatedTiers?: ValidatedWholesaleTier[];
} {
  const name = input.name.trim();
  if (name.length < 3 || name.length > 200) {
    return {
      valid: false,
      error: "El nombre del producto debe tener entre 3 y 200 caracteres.",
    };
  }

  const normalizedSlug = normalizeCommercialSlug(input.slug || name);
  if (normalizedSlug.length < 3 || normalizedSlug.length > 200) {
    return {
      valid: false,
      error: "El identificador URL (slug) del producto no es válido.",
    };
  }

  if (!Number.isInteger(input.categoryId) || input.categoryId <= 0) {
    return {
      valid: false,
      error: "Debes seleccionar una categoría válida para el producto.",
    };
  }

  if (!["mujer", "hombre", "unisex"].includes(input.audience)) {
    return {
      valid: false,
      error: "La colección/audiencia seleccionada no es válida.",
    };
  }

  if (!["draft", "active", "archived"].includes(input.status)) {
    return {
      valid: false,
      error: "El estado comercial del producto no es válido.",
    };
  }

  const retailCents = parsePenToCents(input.retailPricePen);
  if (retailCents === null || retailCents <= 0) {
    return {
      valid: false,
      error: "El precio minorista (B2C) debe ser mayor a S/ 0.00.",
    };
  }

  let compareAtCents: number | null = null;
  if (
    input.compareAtPricePen !== undefined &&
    input.compareAtPricePen !== null &&
    String(input.compareAtPricePen).trim() !== ""
  ) {
    compareAtCents = parsePenToCents(input.compareAtPricePen);
    if (compareAtCents === null || compareAtCents <= retailCents) {
      return {
        valid: false,
        error: "El precio anterior referencial debe ser mayor al precio minorista actual.",
      };
    }
  }

  const validatedTiers: ValidatedWholesaleTier[] = [];
  if (input.isWholesale && input.wholesaleTiers && input.wholesaleTiers.length > 0) {
    const seenMins = new Set<number>();
    for (const rawTier of input.wholesaleTiers) {
      const minQty = Number(rawTier.minQuantity);
      const maxQty =
        rawTier.maxQuantity !== undefined &&
        rawTier.maxQuantity !== null &&
        String(rawTier.maxQuantity).trim() !== ""
          ? Number(rawTier.maxQuantity)
          : null;
      const tierCents = parsePenToCents(rawTier.pricePen);

      if (!Number.isInteger(minQty) || minQty < 2) {
        return {
          valid: false,
          error: "Cada escala mayorista B2B debe tener una cantidad mínima entera de al menos 2 unidades.",
        };
      }
      if (seenMins.has(minQty)) {
        return {
          valid: false,
          error: `No puedes duplicar la cantidad mínima (${minQty} uds.) en varias escalas mayoristas.`,
        };
      }
      seenMins.add(minQty);

      if (maxQty !== null && (!Number.isInteger(maxQty) || maxQty < minQty)) {
        return {
          valid: false,
          error: `En la escala desde ${minQty} uds., la cantidad máxima debe ser mayor o igual al mínimo.`,
        };
      }

      if (tierCents === null || tierCents <= 0) {
        return {
          valid: false,
          error: `El precio unitario de la escala mayorista (≥ ${minQty} uds.) debe ser mayor a S/ 0.00.`,
        };
      }

      if (tierCents >= retailCents) {
        return {
          valid: false,
          error: `El precio mayorista (≥ ${minQty} uds.) debe ser menor que el precio minorista (S/ ${(retailCents / 100).toFixed(2)}).`,
        };
      }

      validatedTiers.push({
        minQuantity: minQty,
        maxQuantity: maxQty,
        amountCents: tierCents,
      });
    }

    validatedTiers.sort((a, b) => a.minQuantity - b.minQuantity);
  }

  if (input.variants && input.variants.length > 0) {
    const seenSkus = new Set<string>();
    for (const v of input.variants) {
      const sku = v.sku.trim().toUpperCase();
      if (sku.length < 3 || sku.length > 60) {
        return {
          valid: false,
          error: "Cada variante debe tener un código SKU válido (entre 3 y 60 caracteres).",
        };
      }
      if (seenSkus.has(sku)) {
        return {
          valid: false,
          error: `El código SKU "${sku}" está repetido dentro del mismo producto.`,
        };
      }
      seenSkus.add(sku);

      const stockNum = Number(v.stock);
      if (!Number.isInteger(stockNum) || stockNum < 0) {
        return {
          valid: false,
          error: `El stock de la variante ${sku} no puede ser negativo ni decimal.`,
        };
      }
    }
  } else {
    return {
      valid: false,
      error: "El producto debe contar con al menos una variante (talla/color/SKU).",
    };
  }

  return {
    valid: true,
    normalizedSlug,
    retailAmountCents: retailCents,
    compareAtAmountCents: compareAtCents,
    validatedTiers,
  };
}

export function validateCategoryPayload(input: {
  id?: number | null;
  name: string;
  slug: string;
  parentId?: number | null;
}): {
  valid: boolean;
  error?: string;
  normalizedSlug?: string;
} {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 120) {
    return {
      valid: false,
      error: "El nombre de la categoría debe tener entre 2 y 120 caracteres.",
    };
  }

  const normalizedSlug = normalizeCommercialSlug(input.slug || name);
  if (normalizedSlug.length < 2 || normalizedSlug.length > 140) {
    return {
      valid: false,
      error: "El slug de la categoría no es válido.",
    };
  }

  if (input.id && input.parentId && input.id === input.parentId) {
    return {
      valid: false,
      error: "Una categoría no puede ser subcategoría de sí misma.",
    };
  }

  return {
    valid: true,
    normalizedSlug,
  };
}

export function validatePromotionPayload(input: {
  code: string;
  name: string;
  discountPercent: number | string;
  startsAt: string | Date;
  endsAt: string | Date;
}): {
  valid: boolean;
  error?: string;
  normalizedCode?: string;
  discountPercent?: number;
  startsDate?: Date;
  endsDate?: Date;
} {
  const name = input.name.trim();
  if (name.length < 3 || name.length > 160) {
    return {
      valid: false,
      error: "El nombre de la campaña o promoción debe tener entre 3 y 160 caracteres.",
    };
  }

  const normalizedCode = input.code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "");
  if (normalizedCode.length < 3 || normalizedCode.length > 40) {
    return {
      valid: false,
      error: "El código de promoción debe tener entre 3 y 40 caracteres alfanuméricos.",
    };
  }

  const pct = Number(input.discountPercent);
  if (!Number.isInteger(pct) || pct < 1 || pct > 90) {
    return {
      valid: false,
      error: "El porcentaje de descuento debe ser un número entero entre 1% y 90%.",
    };
  }

  const startsDate = input.startsAt instanceof Date ? input.startsAt : new Date(input.startsAt);
  const endsDate = input.endsAt instanceof Date ? input.endsAt : new Date(input.endsAt);

  if (Number.isNaN(startsDate.getTime()) || Number.isNaN(endsDate.getTime())) {
    return {
      valid: false,
      error: "Las fechas de inicio y fin de la promoción deben ser válidas.",
    };
  }

  if (endsDate.getTime() <= startsDate.getTime()) {
    return {
      valid: false,
      error: "La fecha de finalización debe ser posterior a la fecha de inicio.",
    };
  }

  return {
    valid: true,
    normalizedCode,
    discountPercent: pct,
    startsDate,
    endsDate,
  };
}

