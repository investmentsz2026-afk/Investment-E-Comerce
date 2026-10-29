/**
 * Motor centralizado de precios comerciales B2C / B2B — Fase 4.
 *
 * Responsabilidades:
 * - Distinguir entre precio minorista (B2C) y precio mayorista por escalas (B2B).
 * - Verificar estrictamente los permisos del usuario (solo `business_approved` activo o `admin`
 *   acceden a precios mayoristas).
 * - Soportar precios escalonados por volumen configurados en `product_prices`
 *   (por cantidad de la variante o cantidad acumulada del modelo en el carrito).
 * - Trabajar exclusivamente en céntimos enteros de PEN (sin errores de punto flotante).
 * - No inventar precios si un producto carece de tarifa configurada.
 */

export interface PriceTierInput {
  id?: number;
  type: "retail" | "wholesale";
  /** Importe unitario en céntimos enteros de PEN. */
  amount: number;
  /** Precio anterior referencial en céntimos de PEN. */
  compareAtAmount?: number | null;
  /** Cantidad mínima para activar la escala (1 para retail, >=1 para wholesale). */
  minQuantity: number;
  /** Cantidad máxima opcional de la escala (null = sin tope superior). */
  maxQuantity?: number | null;
}

export interface PromotionInput {
  id?: number;
  code: string;
  name: string;
  /** Porcentaje entero de descuento sobre precio minorista (1 a 90). */
  discountPercent: number;
  categoryId?: number | null;
  productId?: number | null;
  channelTarget: "retail" | "wholesale";
  startsAt: Date | string;
  endsAt: Date | string;
  isActive: boolean;
}

export interface PricingUserContext {
  role: string;
  isActive: boolean;
}

export type AppliedPriceMode = "retail" | "wholesale" | "unconfigured";

export interface WholesaleTierSummary {
  minQuantity: number;
  maxQuantity: number | null;
  unitAmount: number;
  isUnlocked: boolean;
}

export interface LinePricingResult {
  /** Modalidad efectivamente aplicada a la línea. */
  appliedMode: AppliedPriceMode;
  /** Etiqueta legible en español de la tarifa aplicada. */
  appliedLabel: string;
  /** Precio unitario minorista base en céntimos de PEN (null si no está configurado). */
  retailUnitAmount: number | null;
  /** Precio anterior tachado minorista (si existe promoción retail). */
  compareAtUnitAmount: number | null;
  /** Precio unitario efectivo aplicado en céntimos de PEN. */
  effectiveUnitAmount: number;
  /** Cantidad validada para el cálculo. */
  quantity: number;
  /** Subtotal de la línea en céntimos enteros (`effectiveUnitAmount * quantity`). */
  lineSubtotalAmount: number;
  /** Subtotal calculado a precio minorista para comparación (`retailUnitAmount * quantity`). */
  retailSubtotalAmount: number;
  /** Ahorro mayorista o por volumen en esta línea en céntimos enteros. */
  lineSavingsAmount: number;
  /** Indica si el usuario tiene autorización B2B activa. */
  isWholesaleAuthorized: boolean;
  /** Cantidad acumulada de todas las variantes del mismo producto en el carrito. */
  productGroupQuantity: number;
  /** Escalas mayoristas configuradas para este producto, ordenadas por `minQuantity`. */
  wholesaleTiers: WholesaleTierSummary[];
  /** Próxima escala mayorista disponible para incentivar volumen (solo para usuarios B2B autorizados). */
  nextWholesaleTier: {
    minQuantity: number;
    missingUnits: number;
    unitAmount: number;
  } | null;
  /** Cantidad mínima para la primera escala mayorista del producto (si existe). */
  firstWholesaleMinQuantity: number | null;
  /** Promoción activa aplicada a la línea (si corresponde). */
  appliedPromotion?: {
    code: string;
    name: string;
    discountPercent: number;
  } | null;
  /** Advertencia si falta configuración de precios en catálogo. */
  configurationWarning: string | null;
}

/**
 * Determina en el servidor si un usuario tiene permisos vigentes para acceder a tarifas B2B.
 * Empresas pendientes (`business_pending`), rechazadas (`customer`) o cuentas inactivas (`!isActive`)
 * jamás reciben precios mayoristas.
 */
export function isUserAuthorizedForWholesale(user: PricingUserContext | null | undefined): boolean {
  if (!user) return false;
  if (!user.isActive) return false;
  return user.role === "business_approved" || user.role === "admin";
}

/**
 * Valida y sanea una cantidad solicitada de prendas.
 * Rechaza negativos, cero, decimales/fracciones, NaN o cantidades desproporcionadas.
 */
export function validateRequestedQuantity(
  rawQuantity: unknown,
  maxAllowed = 5000,
): { valid: boolean; quantity: number; error?: string } {
  if (typeof rawQuantity !== "number" && typeof rawQuantity !== "string") {
    return { valid: false, quantity: 0, error: "La cantidad indicada no es válida." };
  }

  const num = typeof rawQuantity === "string" ? Number(rawQuantity.trim()) : rawQuantity;

  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return {
      valid: false,
      quantity: 0,
      error: "La cantidad debe ser un número entero de prendas (sin decimales).",
    };
  }

  if (num < 1) {
    return {
      valid: false,
      quantity: 0,
      error: "La cantidad mínima por variante es de 1 unidad.",
    };
  }

  if (num > maxAllowed) {
    return {
      valid: false,
      quantity: 0,
      error: `La cantidad máxima permitida por línea es de ${maxAllowed} unidades. Para volúmenes superiores solicita una cotización B2B.`,
    };
  }

  return { valid: true, quantity: num };
}

/**
 * Calcula el precio unitario, subtotal, ahorros y escalas por volumen de una línea.
 *
 * Nota sobre compras mayoristas textiles:
 * Cuando una empresa aprobada compra distintas tallas o colores de un mismo modelo (`productGroupQuantity`),
 * la suma de unidades del mismo producto permite alcanzar el umbral (`minQuantity`) de la escala mayorista
 * configurada en `product_prices`.
 */
export function calculateLinePricing(params: {
  prices: readonly PriceTierInput[];
  quantity: number;
  /** Suma de unidades de todas las variantes del mismo producto en el carrito/cotización. */
  productGroupQuantity?: number;
  isProductWholesaleEnabled: boolean;
  user: PricingUserContext | null | undefined;
  /** Promociones comerciales para evaluar vigencia y elegibilidad B2C/B2B (opcional). */
  promotions?: readonly PromotionInput[];
  productId?: number | null;
  categoryId?: number | null;
  now?: Date;
}): LinePricingResult {
  const { prices, quantity, isProductWholesaleEnabled, user } = params;
  const safeQty = Math.max(0, Math.trunc(quantity));
  const groupQty = Math.max(safeQty, Math.trunc(params.productGroupQuantity ?? safeQty));
  const isWholesaleAuthorized = isUserAuthorizedForWholesale(user);
  const evaluationDate = params.now ?? new Date();

  const retailTier = prices.find((p) => p.type === "retail" && p.amount > 0) ?? null;
  const retailUnitAmount = retailTier ? Math.trunc(retailTier.amount) : null;
  const baseCompareAtAmount =
    retailTier?.compareAtAmount && retailTier.compareAtAmount > retailTier.amount
      ? Math.trunc(retailTier.compareAtAmount)
      : null;

  const sortedWholesale = prices
    .filter((p) => p.type === "wholesale" && p.amount > 0 && p.minQuantity >= 1)
    .map((p) => ({
      minQuantity: Math.trunc(p.minQuantity),
      maxQuantity: p.maxQuantity != null ? Math.trunc(p.maxQuantity) : null,
      unitAmount: Math.trunc(p.amount),
    }))
    .sort((a, b) => a.minQuantity - b.minQuantity);

  const firstWholesaleMinQuantity = sortedWholesale[0]?.minQuantity ?? null;

  // Si no existe precio minorista configurado en absoluto, no inventamos un precio.
  if (retailUnitAmount === null) {
    return {
      appliedMode: "unconfigured",
      appliedLabel: "Precio pendiente de configuración",
      retailUnitAmount: null,
      compareAtUnitAmount: null,
      effectiveUnitAmount: 0,
      quantity: safeQty,
      lineSubtotalAmount: 0,
      retailSubtotalAmount: 0,
      lineSavingsAmount: 0,
      isWholesaleAuthorized,
      productGroupQuantity: groupQty,
      wholesaleTiers: [],
      nextWholesaleTier: null,
      firstWholesaleMinQuantity,
      appliedPromotion: null,
      configurationWarning:
        "Este producto aún no tiene un precio minorista configurado en el catálogo.",
    };
  }

  // Evaluar qué escala mayorista corresponde si el usuario está autorizado y el producto admite venta mayorista
  let matchedWholesaleTier: (typeof sortedWholesale)[number] | null = null;

  if (isWholesaleAuthorized && isProductWholesaleEnabled && sortedWholesale.length > 0) {
    for (const tier of sortedWholesale) {
      const meetsMin = groupQty >= tier.minQuantity;
      const meetsMax = tier.maxQuantity === null || groupQty <= tier.maxQuantity;
      if (meetsMin && meetsMax) {
        matchedWholesaleTier = tier;
      } else if (meetsMin && tier.maxQuantity !== null && groupQty > tier.maxQuantity) {
        // Si supera el máximo de un tramo y no hubiera otro superior, mantenemos el mejor tramo alcanzado
        matchedWholesaleTier = tier;
      }
    }
  }

  const wholesaleTiers: WholesaleTierSummary[] = sortedWholesale.map((t) => ({
    minQuantity: t.minQuantity,
    maxQuantity: t.maxQuantity,
    unitAmount: t.unitAmount,
    isUnlocked:
      isWholesaleAuthorized &&
      isProductWholesaleEnabled &&
      matchedWholesaleTier !== null &&
      t.minQuantity === matchedWholesaleTier.minQuantity,
  }));

  // Calcular próxima escala mayorista para informar al comprador B2B cuántas unidades le faltan
  let nextWholesaleTier: LinePricingResult["nextWholesaleTier"] = null;
  if (isWholesaleAuthorized && isProductWholesaleEnabled && sortedWholesale.length > 0) {
    const nextCandidate = sortedWholesale.find((t) => t.minQuantity > groupQty);
    if (nextCandidate) {
      nextWholesaleTier = {
        minQuantity: nextCandidate.minQuantity,
        missingUnits: nextCandidate.minQuantity - groupQty,
        unitAmount: nextCandidate.unitAmount,
      };
    }
  }

  // Evaluar promociones comerciales vigentes (sin acumular promociones B2C sobre tarifas mayoristas B2B,
  // aplicando siempre el precio autorizado más favorable para el cliente).
  let bestPromotion: PromotionInput | null = null;
  if (params.promotions && params.promotions.length > 0) {
    for (const promo of params.promotions) {
      if (!promo.isActive) continue;
      if (promo.discountPercent < 1 || promo.discountPercent > 90) continue;
      const starts = promo.startsAt instanceof Date ? promo.startsAt : new Date(promo.startsAt);
      const ends = promo.endsAt instanceof Date ? promo.endsAt : new Date(promo.endsAt);
      if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) continue;
      if (evaluationDate < starts || evaluationDate > ends) continue;

      if (promo.productId != null && promo.productId !== params.productId) continue;
      if (promo.categoryId != null && promo.categoryId !== params.categoryId) continue;
      if (promo.channelTarget === "wholesale" && !isWholesaleAuthorized) continue;

      if (!bestPromotion || promo.discountPercent > bestPromotion.discountPercent) {
        bestPromotion = promo;
      }
    }
  }

  const promoUnitAmount = bestPromotion
    ? Math.max(1, Math.round((retailUnitAmount * (100 - bestPromotion.discountPercent)) / 100))
    : null;

  let appliedMode: AppliedPriceMode = "retail";
  let effectiveUnitAmount = retailUnitAmount;
  let appliedLabel = "Precio minorista";
  let appliedPromotion: LinePricingResult["appliedPromotion"] = null;
  let compareAtUnitAmount = baseCompareAtAmount;

  if (matchedWholesaleTier) {
    const wholesaleAmount = Math.min(matchedWholesaleTier.unitAmount, retailUnitAmount);
    if (promoUnitAmount !== null && promoUnitAmount < wholesaleAmount) {
      // Si una promoción vigente ofrece un precio inferior al tramo mayorista alcanzado,
      // otorgamos el mejor precio sin duplicar descuentos.
      appliedMode = "retail";
      effectiveUnitAmount = promoUnitAmount;
      compareAtUnitAmount = retailUnitAmount;
      appliedPromotion = {
        code: bestPromotion!.code,
        name: bestPromotion!.name,
        discountPercent: bestPromotion!.discountPercent,
      };
      appliedLabel = `Promoción ${bestPromotion!.name} (-${bestPromotion!.discountPercent}%)`;
    } else {
      appliedMode = "wholesale";
      effectiveUnitAmount = wholesaleAmount;
      appliedLabel = `Tarifa mayorista B2B (escala ≥ ${matchedWholesaleTier.minQuantity} uds.)`;
    }
  } else if (promoUnitAmount !== null && promoUnitAmount < retailUnitAmount) {
    appliedMode = "retail";
    effectiveUnitAmount = promoUnitAmount;
    compareAtUnitAmount = baseCompareAtAmount
      ? Math.max(baseCompareAtAmount, retailUnitAmount)
      : retailUnitAmount;
    appliedPromotion = {
      code: bestPromotion!.code,
      name: bestPromotion!.name,
      discountPercent: bestPromotion!.discountPercent,
    };
    appliedLabel = `Promoción ${bestPromotion!.name} (-${bestPromotion!.discountPercent}%)`;
  }

  const lineSubtotalAmount = effectiveUnitAmount * safeQty;
  const retailSubtotalAmount = retailUnitAmount * safeQty;
  const lineSavingsAmount = Math.max(0, retailSubtotalAmount - lineSubtotalAmount);

  return {
    appliedMode,
    appliedLabel,
    retailUnitAmount,
    compareAtUnitAmount,
    effectiveUnitAmount,
    quantity: safeQty,
    lineSubtotalAmount,
    retailSubtotalAmount,
    lineSavingsAmount,
    isWholesaleAuthorized,
    productGroupQuantity: groupQty,
    wholesaleTiers,
    nextWholesaleTier,
    firstWholesaleMinQuantity,
    appliedPromotion,
    configurationWarning: null,
  };
}

