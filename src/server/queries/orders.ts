import "server-only";

import { and, asc, desc, eq, inArray, ilike, or, gte, lte } from "drizzle-orm";
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
  type ShippingCalculationResult,
  type ShippingZoneRecord,
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
  const [savedAddresses, zones, approvedCompany] = await Promise.all([
    db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, user.id))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt)),
    getOrSeedShippingZones(),
    getApprovedCompanyForUser(user.id),
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

