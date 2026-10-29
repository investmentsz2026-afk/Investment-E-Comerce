const penFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formatea un monto en soles peruanos (PEN).
 * Los montos se manejan en céntimos para evitar errores de coma flotante.
 * @example formatPEN(18900) // "S/ 189.00"
 */
export function formatPEN(amountInCents: number): string {
  return penFormatter.format(amountInCents / 100);
}

export const formatPrice = formatPEN;
