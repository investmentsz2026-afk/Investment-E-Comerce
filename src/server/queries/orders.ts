import "server-only";

import { and, asc, desc, eq, inArray, ilike, isNotNull, or, gte, lte } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  orders,
  orderItems,
  paymentTransactions,
  paymentWebhookEvents,
  inventoryReservations,
  inventoryMovements,
  taxDocuments,
  auditLogs,
  users,
  userAddresses,
  wholesaleQuotes,
  wholesaleQuoteItems,
} from "@/server/db/schema";
import { requireAdmin, type AuthUser } from "@/server/auth/session";
import { getCartSnapshot } from "@/server/cart/service";
import { isUserAuthorizedForWholesale } from "@/server/pricing/engine";
import {
  calculateServerShipping,
  getOrSeedShippingZones,
  getActivePhysicalStores,
  type ShippingCalculationResult,
  type ShippingZoneRecord,
  type PhysicalStoreRecord,
} from "@/server/shipping/service";
import { calculatePeruIgvBreakdown } from "@/server/tax/sunat-service";
import { releaseExpiredInventoryReservations } from "@/server/inventory/service";
import { getPaymentGatewayConfigStatus } from "@/server/payments/gateway";
import { escapeLike } from "@/lib/catalog-params";
import { getApprovedCompanyForUser } from "./quotes";

export type OrderStatus =
  | "pending_payment"
  | "payment_processing"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "payment_failed"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded";

export interface CheckoutLinePreview {
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  sku: string;
  size: string | null;
  colorName: string | null;
  colorSwatch: string | null;
  imageUrl: string;
  quantity: number;
  availableStock: number;
  retailUnitAmount: number;
  effectiveUnitAmount: number;
  lineDiscountAmount: number;
  lineSubtotalAmount: number;
  appliedPriceLabel: string;
  isStockSufficient: boolean;
}

export interface CheckoutSessionContext {
  source: "cart" | "quote";
  quoteId: number | null;
  quoteNumber: string | null;
  quotePaymentTerms: string | null;
  alreadyConvertedOrderId: number | null;
  orderMode: "retail" | "wholesale";
  isBlockedRole: boolean;
  blockedReason: string | null;
  lines: CheckoutLinePreview[];
  totalUnits: number;
  retailSubtotalAmount: number;
  discountAmount: number;
  subtotalAfterDiscountAmount: number;
  defaultShipping: ShippingCalculationResult;
  taxBreakdown: {
    taxableBaseAmount: number;
    igvAmount: number;
    totalAmount: number;
  };
  savedAddresses: Array<typeof userAddresses.$inferSelect>;
  shippingZones: ShippingZoneRecord[];
  activeStores: PhysicalStoreRecord[];
  approvedCompany: Awaited<ReturnType<typeof getApprovedCompanyForUser>>;
  paymentConfig: ReturnType<typeof getPaymentGatewayConfigStatus>;
  hasStockIssues: boolean;
}

/**
 * Construye el contexto completo de `/checkout` validando en el servidor:
 * - Si el usuario es `business_pending` o inactivo, o si proviene de una cotización.
 * - Si proviene de `?quoteId=X`, verifica que pertenezca al usuario, que esté en estado `accepted`,
 *   que no haya expirado y que no haya sido convertida previamente en pedido.
 * - Si proviene del carrito activo, recalcula todos los precios desde PostgreSQL.
 */
export async function getCheckoutSessionContext(
  user: AuthUser,
  quoteIdParam?: number | null,
): Promise<CheckoutSessionContext> {
  // Liberar reservas vencidas antes de evaluar stock disponible
  await releaseExpiredInventoryReservations();

  const db = getDb();
  const [savedAddresses, zones, approvedCompany, activeStores] = await Promise.all([
    db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, user.id))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt)),
    getOrSeedShippingZones(),
    getApprovedCompanyForUser(user.id),
    getActivePhysicalStores(),
  ]);

  const paymentConfig = getPaymentGatewayConfigStatus();
  const defaultAddr = savedAddresses[0];
  const initialLocation = {
    department: defaultAddr?.department ?? approvedCompany?.department ?? "Lima",
    province: defaultAddr?.province ?? approvedCompany?.province ?? "Lima",
    district: defaultAddr?.district ?? approvedCompany?.district ?? "Miraflores",
  };

  // Verificar bloqueo de cuentas empresariales pendientes o suspendidas
  if (user.role === "business_pending" || !user.isActive) {
    const emptyShipping = await calculateServerShipping(initialLocation, 0);
    return {
      source: quoteIdParam ? "quote" : "cart",
      quoteId: quoteIdParam ?? null,
      quoteNumber: null,
      quotePaymentTerms: null,
      alreadyConvertedOrderId: null,
      orderMode: "retail",
      isBlockedRole: true,
      blockedReason: !user.isActive
        ? "Tu cuenta se encuentra temporalmente suspendida. Comunícate con nuestro equipo comercial para regularizar tu acceso."
        : "Tu solicitud de cuenta empresarial mayorista aún se encuentra en evaluación comercial. Por seguridad normativa, las compras mayoristas se habilitan una vez aprobada tu empresa.",
      lines: [],
      totalUnits: 0,
      retailSubtotalAmount: 0,
      discountAmount: 0,
      subtotalAfterDiscountAmount: 0,
      defaultShipping: emptyShipping,
      taxBreakdown: { taxableBaseAmount: 0, igvAmount: 0, totalAmount: 0 },
      savedAddresses,
      shippingZones: zones,
      activeStores,
      approvedCompany,
      paymentConfig,
      hasStockIssues: false,
    };
  }

  // Caso A: Conversión de una cotización B2B aceptada (?quoteId=...)
  if (quoteIdParam && Number.isInteger(quoteIdParam) && quoteIdParam > 0) {
    const quoteRows = await db
      .select()
      .from(wholesaleQuotes)
      .where(and(eq(wholesaleQuotes.id, quoteIdParam), eq(wholesaleQuotes.userId, user.id)))
      .limit(1);

    if (quoteRows.length === 0) {
      const emptyShipping = await calculateServerShipping(initialLocation, 0);
      return {
        source: "quote",
        quoteId: quoteIdParam,
        quoteNumber: null,
        quotePaymentTerms: null,
        alreadyConvertedOrderId: null,
        orderMode: "wholesale",
        isBlockedRole: true,
        blockedReason: "La cotización indicada no existe o no pertenece a tu cuenta empresarial.",
        lines: [],
        totalUnits: 0,
        retailSubtotalAmount: 0,
        discountAmount: 0,
        subtotalAfterDiscountAmount: 0,
        defaultShipping: emptyShipping,
        taxBreakdown: { taxableBaseAmount: 0, igvAmount: 0, totalAmount: 0 },
        savedAddresses,
        shippingZones: zones,
      activeStores,
        approvedCompany,
        paymentConfig,
        hasStockIssues: false,
      };
    }

    const quote = quoteRows[0];

    // Verificar si esta cotización ya fue convertida en un pedido anteriormente
    const existingOrderForQuote = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.quoteId, quote.id))
      .limit(1);

    if (existingOrderForQuote.length > 0) {
      const emptyShipping = await calculateServerShipping(initialLocation, 0);
      return {
        source: "quote",
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        quotePaymentTerms: quote.paymentTermsProposal,
        alreadyConvertedOrderId: existingOrderForQuote[0].id,
        orderMode: "wholesale",
        isBlockedRole: true,
        blockedReason: `La cotización ${quote.quoteNumber} ya fue convertida en un pedido formal anteriormente. No es posible duplicar órdenes a partir de la misma cotización.`,
        lines: [],
        totalUnits: 0,
        retailSubtotalAmount: 0,
        discountAmount: 0,
        subtotalAfterDiscountAmount: 0,
        defaultShipping: emptyShipping,
        taxBreakdown: { taxableBaseAmount: 0, igvAmount: 0, totalAmount: 0 },
        savedAddresses,
        shippingZones: zones,
      activeStores,
        approvedCompany,
        paymentConfig,
        hasStockIssues: false,
      };
    }

    if (!isUserAuthorizedForWholesale(user)) {
      const emptyShipping = await calculateServerShipping(initialLocation, 0);
      return {
        source: "quote",
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        quotePaymentTerms: quote.paymentTermsProposal,
        alreadyConvertedOrderId: null,
        orderMode: "wholesale",
        isBlockedRole: true,
        blockedReason: "Tu cuenta no dispone de permisos mayoristas activos para convertir esta cotización.",
        lines: [],
        totalUnits: 0,
        retailSubtotalAmount: 0,
        discountAmount: 0,
        subtotalAfterDiscountAmount: 0,
        defaultShipping: emptyShipping,
        taxBreakdown: { taxableBaseAmount: 0, igvAmount: 0, totalAmount: 0 },
        savedAddresses,
        shippingZones: zones,
      activeStores,
        approvedCompany,
        paymentConfig,
        hasStockIssues: false,
      };
    }

    const isExpired =
      quote.status === "expired" ||
      (quote.validUntil !== null && quote.validUntil.getTime() <= Date.now());

    if (quote.status !== "accepted" || isExpired) {
      const emptyShipping = await calculateServerShipping(initialLocation, 0);
      return {
        source: "quote",
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        quotePaymentTerms: quote.paymentTermsProposal,
        alreadyConvertedOrderId: null,
        orderMode: "wholesale",
        isBlockedRole: true,
        blockedReason: isExpired
          ? `La cotización ${quote.quoteNumber} ha superado su fecha de vigencia y no puede convertirse en pedido.`
          : `Solo las cotizaciones con propuesta económica ACEPTADA pueden convertirse en pedido (estado actual: ${quote.status}).`,
        lines: [],
        totalUnits: 0,
        retailSubtotalAmount: 0,
        discountAmount: 0,
        subtotalAfterDiscountAmount: 0,
        defaultShipping: emptyShipping,
        taxBreakdown: { taxableBaseAmount: 0, igvAmount: 0, totalAmount: 0 },
        savedAddresses,
        shippingZones: zones,
      activeStores,
        approvedCompany,
        paymentConfig,
        hasStockIssues: false,
      };
    }

    const qItems = await db
      .select()
      .from(wholesaleQuoteItems)
      .where(eq(wholesaleQuoteItems.quoteId, quote.id))
      .orderBy(asc(wholesaleQuoteItems.id));

    const variantIds = qItems.map((i) => i.variantId).filter((v): v is number => v !== null);
    const { productVariants } = await import("@/server/db/schema");
    const liveVariants =
      variantIds.length > 0
        ? await db
            .select()
            .from(productVariants)
            .where(inArray(productVariants.id, variantIds))
        : [];
    const stockByVariant = new Map(liveVariants.map((v) => [v.id, v.stock]));

    let totalUnits = 0;
    let retailSubtotalAmount = 0;
    let subtotalAfterDiscountAmount = 0;
    let hasStockIssues = false;

    const lines: CheckoutLinePreview[] = qItems.map((it) => {
      const qty = it.approvedQuantity ?? it.requestedQuantity;
      const unitPrice = it.quotedUnitPrice ?? it.referenceUnitPriceSnapshot;
      const retailUnit = it.retailUnitPriceSnapshot;
      const lineSub = qty * unitPrice;
      const retailSub = qty * retailUnit;
      const lineDisc = Math.max(0, retailSub - lineSub);
      const availStock = it.variantId ? (stockByVariant.get(it.variantId) ?? 0) : 0;
      const sufficient = availStock >= qty;
      if (!sufficient) hasStockIssues = true;

      totalUnits += qty;
      retailSubtotalAmount += retailSub;
      subtotalAfterDiscountAmount += lineSub;

      return {
        variantId: it.variantId ?? 0,
        productId: it.productId ?? 0,
        productName: it.productNameSnapshot,
        productSlug: it.productSlugSnapshot,
        sku: it.skuSnapshot,
        size: it.sizeSnapshot,
        colorName: it.colorNameSnapshot,
        colorSwatch: it.colorSwatchSnapshot,
        imageUrl: it.imageUrlSnapshot ?? "/placeholder.jpg",
        quantity: qty,
        availableStock: availStock,
        retailUnitAmount: retailUnit,
        effectiveUnitAmount: unitPrice,
        lineDiscountAmount: lineDisc,
        lineSubtotalAmount: lineSub,
        appliedPriceLabel: `Tarifa Acordada en ${quote.quoteNumber}`,
        isStockSufficient: sufficient,
      };
    });

    const discountAmount = Math.max(0, retailSubtotalAmount - subtotalAfterDiscountAmount);
    const defaultShipping = await calculateServerShipping(
      initialLocation,
      subtotalAfterDiscountAmount,
    );
    const grandTotal = subtotalAfterDiscountAmount + defaultShipping.shippingAmount;
    const taxBreakdown = calculatePeruIgvBreakdown(grandTotal);

    return {
      source: "quote",
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      quotePaymentTerms: quote.paymentTermsProposal,
      alreadyConvertedOrderId: null,
      orderMode: "wholesale",
      isBlockedRole: false,
      blockedReason: null,
      lines,
      totalUnits,
      retailSubtotalAmount,
      discountAmount,
      subtotalAfterDiscountAmount,
      defaultShipping,
      taxBreakdown,
      savedAddresses,
      shippingZones: zones,
      activeStores,
      approvedCompany,
      paymentConfig,
      hasStockIssues,
    };
  }

  // Caso B: Checkout desde el carrito activo en el servidor
  const cart = await getCartSnapshot();
  const lines: CheckoutLinePreview[] = cart.items.map((item) => ({
    variantId: item.variantId,
    productId: item.productId,
    productName: item.productName,
    productSlug: item.productSlug,
    sku: item.sku,
    size: item.size,
    colorName: item.colorName,
    colorSwatch: item.colorSwatch,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    availableStock: item.availableStock,
    retailUnitAmount: item.pricing.retailUnitAmount ?? item.pricing.effectiveUnitAmount,
    effectiveUnitAmount: item.pricing.effectiveUnitAmount,
    lineDiscountAmount: item.pricing.lineSavingsAmount,
    lineSubtotalAmount: item.pricing.lineSubtotalAmount,
    appliedPriceLabel: item.pricing.appliedLabel,
    isStockSufficient: item.availabilityStatus === "available" || item.availabilityStatus === "low_stock",
  }));

  const hasWholesaleLine = cart.items.some((i) => i.pricing.appliedMode === "wholesale");
  const orderMode: "retail" | "wholesale" =
    cart.isWholesaleAuthorized && hasWholesaleLine ? "wholesale" : "retail";

  const defaultShipping = await calculateServerShipping(
    initialLocation,
    cart.estimatedTotalAmount,
  );
  const grandTotal = cart.estimatedTotalAmount + defaultShipping.shippingAmount;
  const taxBreakdown = calculatePeruIgvBreakdown(grandTotal);

  return {
    source: "cart",
    quoteId: null,
    quoteNumber: null,
    quotePaymentTerms: null,
    alreadyConvertedOrderId: null,
    orderMode,
    isBlockedRole: false,
    blockedReason: null,
    lines,
    totalUnits: cart.totalUnits,
    retailSubtotalAmount: cart.retailSubtotalAmount,
    discountAmount: cart.wholesaleSavingsAmount,
    subtotalAfterDiscountAmount: cart.estimatedTotalAmount,
    defaultShipping,
    taxBreakdown,
    savedAddresses,
    shippingZones: zones,
    activeStores,
    approvedCompany,
    paymentConfig,
    hasStockIssues: cart.hasStockIssues,
  };
}

/**
 * Lista los pedidos pertenecientes exclusivamente al usuario autenticado (`userId`).
 */
export async function getUserOrdersList(userId: number) {
  await releaseExpiredInventoryReservations();
  const db = getDb();

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  if (userOrders.length === 0) return [];

  const orderIds = userOrders.map((o) => o.id);
  const [items, docs] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds)),
    db
      .select()
      .from(taxDocuments)
      .where(inArray(taxDocuments.orderId, orderIds)),
  ]);

  return userOrders.map((ord) => {
    const oItems = items.filter((i) => i.orderId === ord.id);
    const totalUnits = oItems.reduce((acc, i) => acc + i.quantity, 0);
    const taxDoc = docs.find((d) => d.orderId === ord.id) ?? null;

    return {
      ...ord,
      adminNotes: null, // Nunca exponer notas administrativas internas al cliente
      lineCount: oItems.length,
      totalUnits,
      itemsPreview: oItems.slice(0, 3),
      taxDocument: taxDoc,
    };
  });
}

/**
 * Obtiene el detalle completo de un pedido verificando aislamiento estricto de datos (IDOR):
 * Solo el propietario (`order.userId === requestingUserId`) o un administrador pueden leerlo.
 */
export async function getOrderDetailForUser(
  orderId: number,
  requestingUserId: number,
  isAdmin = false,
) {
  await releaseExpiredInventoryReservations();
  const db = getDb();

  const whereClause = isAdmin
    ? eq(orders.id, orderId)
    : and(eq(orders.id, orderId), eq(orders.userId, requestingUserId));

  const found = await db
    .select()
    .from(orders)
    .where(whereClause)
    .limit(1);

  if (found.length === 0) return null;

  const ord = found[0];

  const [items, payments, reservations, movements, docs, webhooks, logs] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, ord.id))
      .orderBy(asc(orderItems.id)),
    db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.orderId, ord.id))
      .orderBy(desc(paymentTransactions.createdAt)),
    db
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.orderId, ord.id))
      .orderBy(asc(inventoryReservations.id)),
    isAdmin
      ? db
          .select()
          .from(inventoryMovements)
          .where(eq(inventoryMovements.orderId, ord.id))
          .orderBy(desc(inventoryMovements.createdAt))
      : Promise.resolve([]),
    db
      .select()
      .from(taxDocuments)
      .where(eq(taxDocuments.orderId, ord.id))
      .limit(1),
    isAdmin
      ? db
          .select()
          .from(paymentWebhookEvents)
          .where(eq(paymentWebhookEvents.orderId, ord.id))
          .orderBy(desc(paymentWebhookEvents.createdAt))
      : Promise.resolve([]),
    isAdmin
      ? db
          .select({
            log: auditLogs,
            actorFirstName: users.firstName,
            actorLastName: users.lastName,
            actorEmail: users.email,
          })
          .from(auditLogs)
          .leftJoin(users, eq(auditLogs.actorId, users.id))
          .where(and(eq(auditLogs.targetType, "order"), eq(auditLogs.targetId, ord.id)))
          .orderBy(desc(auditLogs.createdAt))
      : Promise.resolve([]),
  ]);

  const paymentConfig = getPaymentGatewayConfigStatus();

  return {
    order: {
      ...ord,
      adminNotes: isAdmin ? ord.adminNotes : null,
    },
    items,
    payments,
    reservations,
    movements,
    taxDocument: docs[0] ?? null,
    webhooks,
    auditLogs: logs,
    paymentConfig,
  };
}

/**
 * Consulta administrativa de todos los pedidos con filtros de búsqueda, canal comercial, rango de fechas, cliente, estado logístico y estado de pago.
 */
export async function getAdminOrdersList(filters?: {
  status?: string;
  paymentStatus?: string;
  orderMode?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: number;
  search?: string;
}) {
  await requireAdmin();
  await releaseExpiredInventoryReservations();

  const db = getDb();
  const conditions = [];

  if (
    filters?.status &&
    [
      "pending_payment",
      "payment_processing",
      "paid",
      "preparing",
      "shipped",
      "delivered",
      "cancelled",
      "payment_failed",
      "refunded",
    ].includes(filters.status)
  ) {
    conditions.push(eq(orders.status, filters.status as OrderStatus));
  }

  if (
    filters?.paymentStatus &&
    ["pending", "processing", "approved", "rejected", "cancelled", "refunded"].includes(
      filters.paymentStatus,
    )
  ) {
    conditions.push(eq(orders.paymentStatus, filters.paymentStatus as PaymentStatus));
  }

  if (filters?.orderMode && (filters.orderMode === "retail" || filters.orderMode === "wholesale")) {
    conditions.push(eq(orders.orderMode, filters.orderMode));
  }

  if (filters?.userId && Number.isInteger(filters.userId) && filters.userId > 0) {
    conditions.push(eq(orders.userId, filters.userId));
  }

  if (filters?.dateFrom && filters.dateFrom.trim().length > 0) {
    const fromDate = new Date(`${filters.dateFrom.trim()}T00:00:00.000-05:00`);
    if (!Number.isNaN(fromDate.getTime())) {
      conditions.push(gte(orders.createdAt, fromDate));
    }
  }

  if (filters?.dateTo && filters.dateTo.trim().length > 0) {
    const toDate = new Date(`${filters.dateTo.trim()}T23:59:59.999-05:00`);
    if (!Number.isNaN(toDate.getTime())) {
      conditions.push(lte(orders.createdAt, toDate));
    }
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const pattern = `%${escapeLike(filters.search.trim())}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, pattern),
        ilike(orders.customerEmailSnapshot, pattern),
        ilike(orders.customerFirstNameSnapshot, pattern),
        ilike(orders.customerLastNameSnapshot, pattern),
        ilike(orders.billingCustomerName, pattern),
        ilike(orders.billingDocNumber, pattern),
      ),
    );
  }

  const rows = await db
    .select()
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt));

  if (rows.length === 0) return [];

  const orderIds = rows.map((r) => r.id);
  const [allItems, allDocs] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds)),
    db
      .select()
      .from(taxDocuments)
      .where(inArray(taxDocuments.orderId, orderIds)),
  ]);

  return rows.map((r) => {
    const oItems = allItems.filter((i) => i.orderId === r.id);
    const totalUnits = oItems.reduce((acc, i) => acc + i.quantity, 0);
    const taxDoc = allDocs.find((d) => d.orderId === r.id) ?? null;

    return {
      ...r,
      lineCount: oItems.length,
      totalUnits,
      taxDocument: taxDoc,
    };
  });
}

// ──────────────────────────────────────────────────────────────
// Seguimiento Público de Pedido (/seguir-pedido)
// ──────────────────────────────────────────────────────────────

export interface PublicOrderTrackingEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone: "blue" | "emerald" | "indigo" | "purple" | "amber" | "rose";
}

export interface PublicOrderTrackingItem {
  id: number;
  productName: string;
  productSlug: string;
  size: string | null;
  colorName: string | null;
  colorSwatch: string | null;
  quantity: number;
  imageUrl: string;
}

export interface PublicOrderTrackingResult {
  orderNumber: string;
  orderMode: "retail" | "wholesale";
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethodLabel: string;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  deliveryProofImageUrl: string | null;
  cancellationReason: string | null;
  shippingZoneName: string;
  shippingEstimatedLabel: string;
  destinationSummary: string;
  recipientDisplay: string;
  totalUnits: number;
  isOwner: boolean;
  ownerOrderId: number | null;
  items: PublicOrderTrackingItem[];
  events: PublicOrderTrackingEvent[];
}

function maskRecipientName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Cliente American Colt";
  if (parts.length === 1) {
    const w = parts[0];
    return w.length <= 2 ? `${w[0]}***` : `${w.slice(0, 2)}${"*".repeat(Math.min(5, w.length - 2))}`;
  }
  const first = parts[0];
  const rest = parts.slice(1).map((w) => `${w[0].toUpperCase()}.`).join(" ");
  return `${first} ${rest}`;
}

function mapStatusLogToPublicEvent(
  logId: number,
  action: string,
  details: string,
  createdAt: Date,
): { statusTag?: string; event: PublicOrderTrackingEvent } | null {
  const ts = createdAt.toISOString();

  if (action === "order_cancelled") {
    return {
      statusTag: "cancelled",
      event: {
        id: `log-${logId}`,
        title: "Pedido Cancelado",
        description: "La orden fue cancelada y las prendas fueron liberadas del stock.",
        timestamp: ts,
        tone: "rose",
      },
    };
  }

  if (action === "order_refunded") {
    return {
      statusTag: "refunded",
      event: {
        id: `log-${logId}`,
        title: "Pedido Reembolsado",
        description: "El reembolso de la compra ha sido procesado correctamente.",
        timestamp: ts,
        tone: "amber",
      },
    };
  }

  if (action === "order_status_change") {
    const match = details.match(
      /→\s*(pending_payment|payment_processing|paid|preparing|shipped|delivered|cancelled|payment_failed|refunded)/,
    );
    const targetStatus = match?.[1] as OrderStatus | undefined;

    const carrierMatch = details.match(/Transportista:\s*([^.]+)\./);
    const trackingMatch = details.match(/Tracking:\s*([^.]+)\./);
    const courierSuffix = [
      carrierMatch?.[1] ? `Operador: ${carrierMatch[1].trim()}` : null,
      trackingMatch?.[1] ? `Guía: ${trackingMatch[1].trim()}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    switch (targetStatus) {
      case "paid":
        return {
          statusTag: "paid",
          event: {
            id: `log-${logId}`,
            title: "Pago Verificado y Aprobado",
            description: "Tu pago fue validado. El pedido ingresó a cola de preparación.",
            timestamp: ts,
            tone: "emerald",
          },
        };
      case "preparing":
        return {
          statusTag: "preparing",
          event: {
            id: `log-${logId}`,
            title: "Empacando en Almacén Central",
            description:
              "Nuestros especialistas están verificando tallas, acabados y embalando tu paquete.",
            timestamp: ts,
            tone: "indigo",
          },
        };
      case "shipped":
        return {
          statusTag: "shipped",
          event: {
            id: `log-${logId}`,
            title: "Despachado / En Ruta de Entrega",
            description: courierSuffix
              ? `Tu paquete fue entregado al courier. ${courierSuffix}.`
              : "Tu pedido salió de nuestro almacén central y va en camino a tu dirección.",
            timestamp: ts,
            tone: "purple",
          },
        };
      case "delivered":
        return {
          statusTag: "delivered",
          event: {
            id: `log-${logId}`,
            title: "Pedido Entregado con Éxito",
            description: "¡Gracias por confiar en American Colt JEANS™! Tu pedido fue entregado.",
            timestamp: ts,
            tone: "emerald",
          },
        };
      case "payment_failed":
        return {
          statusTag: "payment_failed",
          event: {
            id: `log-${logId}`,
            title: "Incidencia en la Validación de Pago",
            description: "No pudimos confirmar el cobro. Puedes reintentar o contactar soporte.",
            timestamp: ts,
            tone: "rose",
          },
        };
      case "payment_processing":
        return {
          statusTag: "payment_processing",
          event: {
            id: `log-${logId}`,
            title: "Pago en Verificación",
            description: "Estamos procesando y validando la operación de pago.",
            timestamp: ts,
            tone: "blue",
          },
        };
      default:
        return courierSuffix
          ? {
              event: {
                id: `log-${logId}`,
                title: "Actualización Logística",
                description: courierSuffix,
                timestamp: ts,
                tone: "blue",
              },
            }
          : null;
    }
  }

  return null;
}

/**
 * Consulta pública sanitizada para rastrear un pedido por número de pedido (`ORD-2026-...`)
 * o código de guía/tracking asignado. Nunca expone datos sensibles como direcciones exactas,
 * documentos tributarios ni notas internas administrativas a usuarios no propietarios.
 */
export async function getPublicOrderTracking(
  rawCode: string,
  requester?: { id: number; role: string } | null,
): Promise<PublicOrderTrackingResult | null> {
  const cleaned = rawCode.trim().replace(/^#/, "");
  if (cleaned.length < 4 || cleaned.length > 80) {
    return null;
  }

  await releaseExpiredInventoryReservations();
  const db = getDb();

  const found = await db
    .select()
    .from(orders)
    .where(
      or(
        ilike(orders.orderNumber, cleaned),
        and(isNotNull(orders.trackingNumber), ilike(orders.trackingNumber, cleaned)),
      ),
    )
    .limit(1);

  if (found.length === 0) return null;

  const ord = found[0];
  const isOwner = Boolean(
    requester && (requester.id === ord.userId || requester.role === "admin"),
  );

  const [items, logs] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, ord.id))
      .orderBy(asc(orderItems.id)),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(and(eq(auditLogs.targetType, "order"), eq(auditLogs.targetId, ord.id)))
      .orderBy(desc(auditLogs.createdAt)),
  ]);

  const seenTags = new Set<string>();
  const events: PublicOrderTrackingEvent[] = [];

  for (const l of logs) {
    const mapped = mapStatusLogToPublicEvent(l.id, l.action, l.details ?? "", l.createdAt);
    if (mapped) {
      if (mapped.statusTag) seenTags.add(mapped.statusTag);
      events.push(mapped.event);
    }
  }

  if (ord.deliveredAt && !seenTags.has("delivered")) {
    events.push({
      id: "milestone-delivered",
      title: "Pedido Entregado con Éxito",
      description: "¡Gracias por tu compra en American Colt JEANS™! El paquete fue entregado.",
      timestamp: ord.deliveredAt.toISOString(),
      tone: "emerald",
    });
  }

  if (ord.shippedAt && !seenTags.has("shipped")) {
    events.push({
      id: "milestone-shipped",
      title: "Despachado / En Ruta de Entrega",
      description: ord.carrierName
        ? `Tu pedido salió con ${ord.carrierName}${ord.trackingNumber ? ` (Guía ${ord.trackingNumber})` : ""}.`
        : "Tu pedido fue despachado desde nuestro almacén central.",
      timestamp: ord.shippedAt.toISOString(),
      tone: "purple",
    });
  }

  if (ord.paidAt && !seenTags.has("paid")) {
    events.push({
      id: "milestone-paid",
      title: "Pago Confirmado",
      description: "Pago validado correctamente. Orden habilitada para alistamiento.",
      timestamp: ord.paidAt.toISOString(),
      tone: "emerald",
    });
  }

  if (ord.cancelledAt && !seenTags.has("cancelled")) {
    events.push({
      id: "milestone-cancelled",
      title: "Pedido Cancelado",
      description: "El pedido fue cancelado y las unidades fueron liberadas.",
      timestamp: ord.cancelledAt.toISOString(),
      tone: "rose",
    });
  }

  if (ord.refundedAt && !seenTags.has("refunded")) {
    events.push({
      id: "milestone-refunded",
      title: "Reembolso Completado",
      description: "El importe del pedido ha sido reembolsado.",
      timestamp: ord.refundedAt.toISOString(),
      tone: "amber",
    });
  }

  events.push({
    id: "milestone-created",
    title: "Pedido Registrado",
    description: "Recibimos tu orden y reservamos las prendas seleccionadas.",
    timestamp: ord.createdAt.toISOString(),
    tone: "blue",
  });

  // Ordenar eventos del más reciente al más antiguo
  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const destinationSummary =
    [ord.shippingDistrict, ord.shippingProvince, ord.shippingDepartment]
      .map((s) => (s ?? "").trim())
      .filter(Boolean)
      .join(", ") || "Lima, Perú";

  const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);

  return {
    orderNumber: ord.orderNumber,
    orderMode: ord.orderMode,
    status: ord.status,
    paymentStatus: ord.paymentStatus,
    paymentMethodLabel: ord.paymentMethodLabel,
    createdAt: ord.createdAt.toISOString(),
    updatedAt: ord.updatedAt.toISOString(),
    paidAt: ord.paidAt ? ord.paidAt.toISOString() : null,
    shippedAt: ord.shippedAt ? ord.shippedAt.toISOString() : null,
    deliveredAt: ord.deliveredAt ? ord.deliveredAt.toISOString() : null,
    cancelledAt: ord.cancelledAt ? ord.cancelledAt.toISOString() : null,
    refundedAt: ord.refundedAt ? ord.refundedAt.toISOString() : null,
    carrierName: ord.carrierName,
    trackingNumber: ord.trackingNumber,
    trackingUrl: ord.trackingUrl,
    deliveryProofImageUrl: ord.deliveryProofImageUrl,
    cancellationReason: ord.cancellationReason,
    shippingZoneName: ord.shippingZoneNameSnapshot,
    shippingEstimatedLabel: ord.shippingEstimatedLabel,
    destinationSummary,
    recipientDisplay: isOwner
      ? ord.shippingRecipientName
      : maskRecipientName(ord.shippingRecipientName),
    totalUnits,
    isOwner,
    ownerOrderId: isOwner ? ord.id : null,
    items: items.map((item) => ({
      id: item.id,
      productName: item.productNameSnapshot,
      productSlug: item.productSlugSnapshot,
      size: item.sizeSnapshot,
      colorName: item.colorNameSnapshot,
      colorSwatch: item.colorSwatchSnapshot,
      quantity: item.quantity,
      imageUrl: item.imageUrlSnapshot ?? "/placeholder.jpg",
    })),
    events,
  };
}

/**
 * Devuelve los últimos 5 códigos de pedido del usuario autenticado para acceso rápido en `/seguir-pedido`.
 */
export async function getRecentOrderNumbersForUser(
  userId: number,
): Promise<{ orderNumber: string; status: OrderStatus; createdAt: string }[]> {
  const db = getDb();
  const rows = await db
    .select({
      orderNumber: orders.orderNumber,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  return rows.map((r) => ({
    orderNumber: r.orderNumber,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));
}

