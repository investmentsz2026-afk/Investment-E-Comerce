import { and, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  productVariants,
  inventoryReservations,
  inventoryMovements,
  orders,
  auditLogs,
} from "@/server/db/schema";

/** Duración predeterminada de la reserva temporal de stock durante el checkout: 30 minutos. */
export const RESERVATION_HOLD_MINUTES = 30;

export interface ReserveItemInput {
  variantId: number;
  sku: string;
  quantity: number;
}

export interface ReserveStockResult {
  success: boolean;
  error?: string;
  failedSku?: string;
  expiresAt?: Date;
}

/**
 * Libera todas las reservas activas cuya fecha `expiresAt` ya venció y repone el stock
 * disponible en `product_variants` de forma idempotente.
 * También marca los pedidos en `pending_payment` vencidos como `cancelled`.
 */
export async function releaseExpiredInventoryReservations(): Promise<number> {
  const db = getDb();
  const now = new Date();

  const expiredRows = await db
    .select()
    .from(inventoryReservations)
    .where(
      and(
        eq(inventoryReservations.status, "active"),
        lt(inventoryReservations.expiresAt, now),
      ),
    );

  if (expiredRows.length === 0) return 0;

  let releasedCount = 0;

  for (const res of expiredRows) {
    // Transición atómica de active -> expired para garantizar idempotencia ante ejecuciones concurrentes
    const updatedRes = await db
      .update(inventoryReservations)
      .set({
        status: "expired",
        releasedAt: now,
        releaseReason: "Expiración automática de reserva de checkout",
        updatedAt: now,
      })
      .where(
        and(
          eq(inventoryReservations.id, res.id),
          eq(inventoryReservations.status, "active"),
        ),
      )
      .returning();

    if (updatedRes.length === 0) continue;

    // Reponer el stock en product_variants
    const [updatedVariant] = await db
      .update(productVariants)
      .set({
        stock: sql`${productVariants.stock} + ${res.quantity}`,
      })
      .where(eq(productVariants.id, res.variantId))
      .returning({ stock: productVariants.stock });

    const stockAfter = updatedVariant?.stock ?? res.quantity;
    const stockBefore = stockAfter - res.quantity;

    await db
      .insert(inventoryMovements)
      .values({
        variantId: res.variantId,
        orderId: res.orderId,
        actorId: null,
        skuSnapshot: res.skuSnapshot,
        movementType: "reservation_release",
        quantityDelta: res.quantity,
        stockBefore,
        stockAfter,
        idempotencyKey: `release:order:${res.orderId}:variant:${res.variantId}`,
        notes: `Liberación automática de reserva vencida (+${res.quantity} uds.)`,
        createdAt: now,
      })
      .onConflictDoNothing();

    // Si el pedido sigue en pending_payment, marcarlo como cancelado por expiración
    await db
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "cancelled",
        cancellationReason: "Reserva de stock expirada por falta de confirmación de pago en el plazo establecido.",
        cancelledAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(orders.id, res.orderId),
          eq(orders.status, "pending_payment"),
        ),
      );

    releasedCount += 1;
  }

  return releasedCount;
}

/**
 * Reserva atómicamente el inventario para todas las líneas de un pedido recién creado.
 *
 * Seguridad contra sobreventa y compras simultáneas:
 * - Cada variante se descuenta con `WHERE id = variantId AND is_active = true AND stock >= quantity`.
 * - Si alguna variante no tiene stock suficiente en ese instante exacto, se revierten inmediatamente
 *   todas las reservas previas del mismo lote para no dejar stock bloqueado ni negativo.
 */
export async function reserveInventoryForOrder(params: {
  orderId: number;
  actorId: number;
  items: ReserveItemInput[];
  holdMinutes?: number;
}): Promise<ReserveStockResult> {
  // Primero liberamos cualquier reserva expirada para que su stock esté disponible
  await releaseExpiredInventoryReservations();

  const db = getDb();
  const now = new Date();
  const holdMs = (params.holdMinutes ?? RESERVATION_HOLD_MINUTES) * 60 * 1000;
  const expiresAt = new Date(now.getTime() + holdMs);

  const deductHistory: Array<{
    variantId: number;
    sku: string;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
  }> = [];

  for (const item of params.items) {
    // Descuento atómico condicional: nunca permite stock negativo
    const deducted = await db
      .update(productVariants)
      .set({
        stock: sql`${productVariants.stock} - ${item.quantity}`,
      })
      .where(
        and(
          eq(productVariants.id, item.variantId),
          eq(productVariants.isActive, true),
          gte(productVariants.stock, item.quantity),
        ),
      )
      .returning({ stock: productVariants.stock, sku: productVariants.sku });

    if (deducted.length === 0) {
      // Revertir descuentos previos de este intento fallido
      for (const prev of deductHistory) {
        await db
          .update(productVariants)
          .set({
            stock: sql`${productVariants.stock} + ${prev.quantity}`,
          })
          .where(eq(productVariants.id, prev.variantId));
      }

      return {
        success: false,
        failedSku: item.sku,
        error: `Stock insuficiente para la variante ${item.sku} (se solicitaron ${item.quantity} uds.). Otra compra simultánea o falta de inventario impidió reservar las unidades.`,
      };
    }

    const stockAfter = deducted[0].stock;
    const stockBefore = stockAfter + item.quantity;

    deductHistory.push({
      variantId: item.variantId,
      sku: item.sku,
      quantity: item.quantity,
      stockBefore,
      stockAfter,
    });
  }

  // Registrar las reservas activas y los movimientos de inventario con clave idempotente
  for (const h of deductHistory) {
    await db
      .insert(inventoryReservations)
      .values({
        orderId: params.orderId,
        variantId: h.variantId,
        skuSnapshot: h.sku,
        quantity: h.quantity,
        status: "active",
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    await db
      .insert(inventoryMovements)
      .values({
        variantId: h.variantId,
        orderId: params.orderId,
        actorId: params.actorId,
        skuSnapshot: h.sku,
        movementType: "reservation_hold",
        quantityDelta: -h.quantity,
        stockBefore: h.stockBefore,
        stockAfter: h.stockAfter,
        idempotencyKey: `hold:order:${params.orderId}:variant:${h.variantId}`,
        notes: `Reserva temporal de inventario por checkout (Pedido #${params.orderId})`,
        createdAt: now,
      })
      .onConflictDoNothing();
  }

  return {
    success: true,
    expiresAt,
  };
}

/**
 * Confirma definitivamente la salida de inventario cuando el pago del pedido es verificado.
 * Es totalmente idempotente: si el webhook o la confirmación llega repetida, no vuelve a descontar
 * stock ni duplica movimientos `sale_confirm`.
 *
 * Recuperación ante confirmaciones tardías (cuando la reserva había expirado pero el pago sí entró):
 * - Si la reserva ya estaba en `expired` o `released`, intenta descontar nuevamente el stock real
 *   y audita la recuperación.
 */
export async function confirmInventorySaleForOrder(params: {
  orderId: number;
  actorId?: number | null;
}): Promise<{ confirmed: boolean; alreadyConfirmed: boolean; error?: string }> {
  const db = getDb();
  const now = new Date();

  const reservations = await db
    .select()
    .from(inventoryReservations)
    .where(eq(inventoryReservations.orderId, params.orderId));

  if (reservations.length === 0) {
    return { confirmed: false, alreadyConfirmed: false, error: "No existen reservas para este pedido." };
  }

  if (reservations.every((r) => r.status === "confirmed")) {
    return { confirmed: true, alreadyConfirmed: true };
  }

  for (const res of reservations) {
    if (res.status === "confirmed") continue;

    if (res.status === "active") {
      // Transición atómica active -> confirmed (el stock ya fue retenido en el hold)
      const updated = await db
        .update(inventoryReservations)
        .set({
          status: "confirmed",
          confirmedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(inventoryReservations.id, res.id),
            eq(inventoryReservations.status, "active"),
          ),
        )
        .returning();

      if (updated.length > 0) {
        const [vRow] = await db
          .select({ stock: productVariants.stock })
          .from(productVariants)
          .where(eq(productVariants.id, res.variantId))
          .limit(1);

        const currentStock = vRow?.stock ?? 0;

        await db
          .insert(inventoryMovements)
          .values({
            variantId: res.variantId,
            orderId: res.orderId,
            actorId: params.actorId ?? null,
            skuSnapshot: res.skuSnapshot,
            movementType: "sale_confirm",
            quantityDelta: 0, // El descuento físico ocurrió en reservation_hold
            stockBefore: currentStock,
            stockAfter: currentStock,
            idempotencyKey: `confirm:order:${res.orderId}:variant:${res.variantId}`,
            notes: `Confirmación definitiva de venta de ${res.quantity} uds. tras pago verificado.`,
            createdAt: now,
          })
          .onConflictDoNothing();
      }
    } else if (res.status === "expired" || res.status === "released") {
      // Recuperación segura si un pago asíncrono llega después de que la reserva había sido liberada
      const deducted = await db
        .update(productVariants)
        .set({
          stock: sql`GREATEST(0, ${productVariants.stock} - ${res.quantity})`,
        })
        .where(eq(productVariants.id, res.variantId))
        .returning({ stock: productVariants.stock });

      const stockAfter = deducted[0]?.stock ?? 0;
      const stockBefore = stockAfter + res.quantity;

      await db
        .update(inventoryReservations)
        .set({
          status: "confirmed",
          confirmedAt: now,
          updatedAt: now,
        })
        .where(eq(inventoryReservations.id, res.id));

      await db
        .insert(inventoryMovements)
        .values({
          variantId: res.variantId,
          orderId: res.orderId,
          actorId: params.actorId ?? null,
          skuSnapshot: res.skuSnapshot,
          movementType: "sale_confirm",
          quantityDelta: -res.quantity,
          stockBefore,
          stockAfter,
          idempotencyKey: `confirm:order:${res.orderId}:variant:${res.variantId}`,
          notes: `Recuperación y confirmación de venta tras notificación tardía de pago (-${res.quantity} uds.).`,
          createdAt: now,
        })
        .onConflictDoNothing();
    }
  }

  return { confirmed: true, alreadyConfirmed: false };
}

/**
 * Libera las reservas activas de un pedido cuando el pago falla o el pedido se cancela antes de pagar.
 * Idempotente: si ya estaba `released` o `expired`, no vuelve a sumar stock.
 */
export async function releaseInventoryForOrder(params: {
  orderId: number;
  reason: string;
  actorId?: number | null;
}): Promise<{ releasedUnits: number }> {
  const db = getDb();
  const now = new Date();

  const reservations = await db
    .select()
    .from(inventoryReservations)
    .where(
      and(
        eq(inventoryReservations.orderId, params.orderId),
        eq(inventoryReservations.status, "active"),
      ),
    );

  let releasedUnits = 0;

  for (const res of reservations) {
    const updated = await db
      .update(inventoryReservations)
      .set({
        status: "released",
        releasedAt: now,
        releaseReason: params.reason.slice(0, 160),
        updatedAt: now,
      })
      .where(
        and(
          eq(inventoryReservations.id, res.id),
          eq(inventoryReservations.status, "active"),
        ),
      )
      .returning();

    if (updated.length === 0) continue;

    const [updatedVariant] = await db
      .update(productVariants)
      .set({
        stock: sql`${productVariants.stock} + ${res.quantity}`,
      })
      .where(eq(productVariants.id, res.variantId))
      .returning({ stock: productVariants.stock });

    const stockAfter = updatedVariant?.stock ?? res.quantity;
    const stockBefore = stockAfter - res.quantity;

    await db
      .insert(inventoryMovements)
      .values({
        variantId: res.variantId,
        orderId: res.orderId,
        actorId: params.actorId ?? null,
        skuSnapshot: res.skuSnapshot,
        movementType: "reservation_release",
        quantityDelta: res.quantity,
        stockBefore,
        stockAfter,
        idempotencyKey: `release:order:${res.orderId}:variant:${res.variantId}`,
        notes: `Liberación de reserva (+${res.quantity} uds.): ${params.reason}`,
        createdAt: now,
      })
      .onConflictDoNothing();

    releasedUnits += res.quantity;
  }

  return { releasedUnits };
}

/**
 * Repone el inventario de un pedido que ya había sido pagado/confirmado cuando se procesa
 * una cancelación con reembolso (`refund_restock`). Totalmente idempotente por variante.
 */
export async function restockRefundedOrderInventory(params: {
  orderId: number;
  reason: string;
  actorId: number;
}): Promise<{ restockedUnits: number }> {
  const db = getDb();
  const now = new Date();

  const confirmedReservations = await db
    .select()
    .from(inventoryReservations)
    .where(
      and(
        eq(inventoryReservations.orderId, params.orderId),
        eq(inventoryReservations.status, "confirmed"),
      ),
    );

  let restockedUnits = 0;

  for (const res of confirmedReservations) {
    const movementKey = `refund_restock:order:${res.orderId}:variant:${res.variantId}`;

    // Comprobar si ya se repuso anteriormente esta variante para este pedido
    const existingMov = await db
      .select({ id: inventoryMovements.id })
      .from(inventoryMovements)
      .where(eq(inventoryMovements.idempotencyKey, movementKey))
      .limit(1);

    if (existingMov.length > 0) continue;

    await db
      .update(inventoryReservations)
      .set({
        status: "released",
        releasedAt: now,
        releaseReason: `Reembolso: ${params.reason}`.slice(0, 160),
        updatedAt: now,
      })
      .where(eq(inventoryReservations.id, res.id));

    const [updatedVariant] = await db
      .update(productVariants)
      .set({
        stock: sql`${productVariants.stock} + ${res.quantity}`,
      })
      .where(eq(productVariants.id, res.variantId))
      .returning({ stock: productVariants.stock });

    const stockAfter = updatedVariant?.stock ?? res.quantity;
    const stockBefore = stockAfter - res.quantity;

    await db
      .insert(inventoryMovements)
      .values({
        variantId: res.variantId,
        orderId: res.orderId,
        actorId: params.actorId,
        skuSnapshot: res.skuSnapshot,
        movementType: "refund_restock",
        quantityDelta: res.quantity,
        stockBefore,
        stockAfter,
        idempotencyKey: movementKey,
        notes: `Reposición de stock por reembolso/cancelación de pedido pagado (+${res.quantity} uds.): ${params.reason}`,
        createdAt: now,
      })
      .onConflictDoNothing();

    await db.insert(auditLogs).values({
      actorId: params.actorId,
      action: "inventory_movement",
      targetType: "product_variant",
      targetId: res.variantId,
      details: `Reposición por reembolso de Pedido #${res.orderId} (${res.skuSnapshot}): +${res.quantity} uds. (Stock: ${stockBefore} → ${stockAfter})`,
    });

    restockedUnits += res.quantity;
  }

  return { restockedUnits };
}

export type AdminInventoryOperationKind = "entry" | "adjustment" | "shrinkage";

export interface AdminInventoryAdjustmentInput {
  variantId: number;
  actorId: number;
  operationKind: AdminInventoryOperationKind;
  /** Cantidad entera distinta de cero. En 'entry' > 0; en 'shrinkage' > 0 (se convierte a delta negativo); en 'adjustment' puede ser positivo o negativo. */
  quantity: number;
  reason: string;
  idempotencyKey?: string;
}

export interface AdminInventoryAdjustmentResult {
  success: boolean;
  error?: string;
  stockBefore?: number;
  stockAfter?: number;
  quantityDelta?: number;
  movementId?: number;
}

/**
 * Valida los parámetros de un ajuste administrativo de inventario antes de tocar la base de datos.
 * Función pura exportada para pruebas unitarias y de seguridad.
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

/**
 * Registra una entrada de lote, ajuste manual o merma/pérdida en el inventario administrativo.
 * - Nunca permite stock negativo (validación atómica en PostgreSQL `WHERE stock + delta >= 0`).
 * - No sobrescribe reservas activas de pedidos en curso (`inventory_reservations` permanece intacta).
 * - Registra kardex en `inventory_movements` y trazabilidad en `audit_logs`.
 */
export async function recordAdminInventoryAdjustment(
  input: AdminInventoryAdjustmentInput,
): Promise<AdminInventoryAdjustmentResult> {
  // Primero liberamos reservas expiradas para trabajar con el disponible real
  await releaseExpiredInventoryReservations();

  const db = getDb();
  const now = new Date();

  const [variant] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, input.variantId))
    .limit(1);

  if (!variant) {
    return { success: false, error: "La variante de producto indicada no existe." };
  }

  const check = validateAdminInventoryAdjustmentInput({
    operationKind: input.operationKind,
    quantity: input.quantity,
    reason: input.reason,
    currentStock: variant.stock,
  });

  if (!check.valid) {
    return { success: false, error: check.error };
  }

  const delta = check.quantityDelta;
  const idempKey =
    input.idempotencyKey?.trim() ||
    `manual:${input.operationKind}:variant:${variant.id}:actor:${input.actorId}:${now.getTime()}`;

  // Verificar idempotencia si se proporcionó clave explícita
  if (input.idempotencyKey) {
    const existing = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.idempotencyKey, idempKey))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: true,
        stockBefore: existing[0].stockBefore,
        stockAfter: existing[0].stockAfter,
        quantityDelta: existing[0].quantityDelta,
        movementId: existing[0].id,
      };
    }
  }

  // Actualización atómica en PostgreSQL garantizando que el stock jamás quede en negativo
  const updatedRows = await db
    .update(productVariants)
    .set({
      stock: sql`${productVariants.stock} + ${delta}`,
    })
    .where(
      delta < 0
        ? and(
            eq(productVariants.id, variant.id),
            gte(productVariants.stock, Math.abs(delta)),
          )
        : eq(productVariants.id, variant.id),
    )
    .returning({ stock: productVariants.stock });

  if (updatedRows.length === 0) {
    return {
      success: false,
      error: `Stock insuficiente para aplicar el descuento de ${Math.abs(delta)} unidades en el SKU ${variant.sku}.`,
    };
  }

  const stockAfter = updatedRows[0].stock;
  const stockBefore = stockAfter - delta;

  const kindLabel =
    input.operationKind === "entry"
      ? "Entrada de lote / reposición"
      : input.operationKind === "shrinkage"
        ? "Baja por merma / pérdida"
        : "Ajuste manual de inventario";

  const [movement] = await db
    .insert(inventoryMovements)
    .values({
      variantId: variant.id,
      orderId: null,
      actorId: input.actorId,
      skuSnapshot: variant.sku,
      movementType: "manual_adjustment",
      quantityDelta: delta,
      stockBefore,
      stockAfter,
      idempotencyKey: idempKey,
      notes: `[${kindLabel}] ${input.reason.trim()}`,
      createdAt: now,
    })
    .returning({ id: inventoryMovements.id });

  await db.insert(auditLogs).values({
    actorId: input.actorId,
    action: "inventory_movement",
    targetType: "product_variant",
    targetId: variant.id,
    details: `${kindLabel} en SKU ${variant.sku}: ${delta > 0 ? `+${delta}` : delta} uds. (Stock: ${stockBefore} → ${stockAfter}). Motivo: ${input.reason.trim()}`,
  });

  return {
    success: true,
    stockBefore,
    stockAfter,
    quantityDelta: delta,
    movementId: movement?.id,
  };
}
