export type AdminInventoryOperationKind = "entry" | "adjustment" | "shrinkage";

/**
 * Valida los parámetros de un ajuste administrativo de inventario antes de tocar la base de datos.
 * Función pura compartida entre cliente, servidor y pruebas unitarias.
 */
export function validateAdminInventoryAdjustmentInput(input: {
  operationKind: AdminInventoryOperationKind;
  quantity: number;
  reason: string;
  currentStock: number;
}): { valid: boolean; quantityDelta: number; error?: string } {
  if (!Number.isInteger(input.quantity) || input.quantity === 0) {
    return {
      valid: false,
      quantityDelta: 0,
      error: "La cantidad debe ser un número entero distinto de cero.",
    };
  }

  const trimmedReason = input.reason.trim();
  if (trimmedReason.length < 4) {
    return {
      valid: false,
      quantityDelta: 0,
      error: "Debes registrar un motivo comercial o de almacén (mínimo 4 caracteres).",
    };
  }

  let quantityDelta = input.quantity;
  if (input.operationKind === "entry") {
    if (input.quantity < 1) {
      return {
        valid: false,
        quantityDelta: 0,
        error: "Las entradas de lote o reposiciones deben tener una cantidad positiva.",
      };
    }
    quantityDelta = Math.abs(input.quantity);
  } else if (input.operationKind === "shrinkage") {
    if (input.quantity < 1) {
      return {
        valid: false,
        quantityDelta: 0,
        error: "Indica las unidades de merma o pérdida como un entero positivo (se descontarán del stock).",
      };
    }
    quantityDelta = -Math.abs(input.quantity);
  }

  const projectedStock = input.currentStock + quantityDelta;
  if (projectedStock < 0) {
    return {
      valid: false,
      quantityDelta: 0,
      error: `Operación rechazada: no se permite dejar stock negativo (stock actual disponible: ${input.currentStock} uds., ajuste solicitado: ${quantityDelta} uds.).`,
    };
  }

  if (projectedStock > 100000) {
    return {
      valid: false,
      quantityDelta: 0,
      error: "El stock resultante supera el límite máximo permitido por variante (100,000 uds.).",
    };
  }

  return { valid: true, quantityDelta };
}
