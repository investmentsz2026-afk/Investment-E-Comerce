"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  orders,
  orderItems,
  carts,
  cartItems,
  wholesaleQuotes,
  wholesaleQuoteItems,
  userAddresses,
  auditLogs,
} from "@/server/db/schema";
import { getCurrentSession, requireAdmin } from "@/server/auth/session";
import { validatePhone } from "@/server/auth/validators";
import { checkRateLimit, recordFailedAttempt } from "@/server/auth/rate-limit";
import { getCartSnapshot } from "@/server/cart/service";
import { isUserAuthorizedForWholesale } from "@/server/pricing/engine";
import {
  calculateServerShipping,
  updateShippingZoneConfig,
  type ShippingCalculationResult,
} from "@/server/shipping/service";
import {
  reserveInventoryForOrder,
  releaseInventoryForOrder,
  restockRefundedOrderInventory,
} from "@/server/inventory/service";
import {
  calculatePeruIgvBreakdown,
  ensureOrIssueTaxDocumentForOrder,
  querySunatDocumentStatusForOrder,
  validateBillingInput,
  type TaxDocumentType,
} from "@/server/tax/sunat-service";
import {
  processServerPaymentCharge,
  applyVerifiedPaymentOutcome,
  verifyAndSyncMercadoPagoPaymentById,
  type PaymentProviderName,
} from "@/server/payments/gateway";
import {
  sendOrderReceivedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
} from "@/server/email";
import type { ActionResult } from "./auth";
import type { OrderStatus } from "@/server/queries/orders";

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${rand}`;
}

async function resolveBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  }
}

/**
 * Permite al formulario de `/checkout` consultar en tiempo real el costo de envío
 * y el total exacto calculado en el servidor al cambiar el departamento/provincia/distrito.
 */
export async function quoteCheckoutShippingAction(input: {
  department: string;
  province?: string;
  district?: string;
  subtotalAfterDiscountCents: number;
}): Promise<
  ActionResult<{
    shipping: ShippingCalculationResult;
    taxableBaseAmount: number;
    igvAmount: number;
    totalAmount: number;
  }>
> {
  const shipping = await calculateServerShipping(
    {
      department: input.department ?? "",
      province: input.province ?? "",
      district: input.district ?? "",
    },
    Math.max(0, Math.trunc(Number(input.subtotalAfterDiscountCents) || 0)),
  );

  const grandTotal =
    Math.max(0, Math.trunc(Number(input.subtotalAfterDiscountCents) || 0)) +
    shipping.shippingAmount;
  const tax = calculatePeruIgvBreakdown(grandTotal);

  return {
    success: true,
    data: {
      shipping,
      taxableBaseAmount: tax.taxableBaseAmount,
      igvAmount: tax.igvAmount,
      totalAmount: tax.totalAmount,
    },
  };
}

export interface PlaceCheckoutOrderInput {
  idempotencyKey: string;
  source: "cart" | "quote";
  quoteId?: number | null;
  savedAddressId?: number | null;
  saveNewAddressToBook?: boolean;
  shippingRecipientName: string;
  shippingRecipientPhone: string;
  shippingDepartment: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingReference?: string;
  taxDocumentType: TaxDocumentType;
  billingDocType: "DNI" | "CE" | "RUC";
  billingDocNumber: string;
  billingCustomerName: string;
  billingFiscalAddress?: string;
  paymentProvider: PaymentProviderName;
  paymentToken?: string;
  maskedCardLast4?: string;
  customerNotes?: string;
}

/**
 * Crea un pedido en firme desde `/checkout` (ya sea desde el carrito activo o convirtiendo una cotización B2B aceptada).
 *
 * Garantías de seguridad (Módulos 1, 2, 3, 4, 5, 6, 9):
 * 1. Exige usuario autenticado y activo; bloquea cuentas `business_pending` o suspendidas.
 * 2. Nunca confía en precios, subtotales, descuentos, envíos ni totales enviados por el navegador:
 *    recalcula absolutamente todo desde PostgreSQL.
 * 3. Verifica idempotencia por `idempotencyKey` (evita pedidos duplicados por doble clic o reintentos).
 * 4. Si proviene de `quoteId`, verifica propiedad, vigencia, estado `accepted` y unicidad (`orders.quoteId` unique),
 *    respetando de forma inmutable las cantidades y precios aprobados en la cotización.
 * 5. Reserva atómicamente el stock de cada variante en `inventory_reservations`. Si falta stock en cualquier variante,
 *    revierte todo y no deja órdenes huérfanas.
 * 6. Procesa el cargo o registro de pago en el servidor.
 */
export async function placeCheckoutOrderAction(
  input: PlaceCheckoutOrderInput,
): Promise<
  ActionResult<{
    orderId: number;
    orderNumber: string;
    orderStatus: string;
    paymentStatus: string;
  }>
> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    return {
      success: false,
      error: "Debes iniciar sesión con tu cuenta para confirmar el pedido.",
    };
  }

  if (!user.isActive) {
    return {
      success: false,
      error: "Tu cuenta se encuentra inactiva o suspendida. Comunícate con atención al cliente.",
    };
  }

  if (user.role === "business_pending") {
    return {
      success: false,
      error:
        "Tu solicitud de cuenta empresarial aún está en evaluación comercial. No puedes emitir órdenes hasta su aprobación.",
    };
  }

  const rlKey = `checkout_place:${user.id}`;
  const rlCheck = checkRateLimit(rlKey, 20, 15 * 60 * 1000);
  if (!rlCheck.allowed) {
    return {
      success: false,
      error: `Demasiados intentos seguidos en el checkout. Por favor espera ${rlCheck.retryAfterSeconds ?? 60} segundos.`,
    };
  }

  const idempotencyKey = (input.idempotencyKey ?? "").trim().slice(0, 80);
  if (!idempotencyKey || idempotencyKey.length < 8) {
    return {
      success: false,
      error: "Falta la clave de seguridad contra doble envío (idempotencyKey). Recarga la página.",
    };
  }

  const db = getDb();

  // 1. Verificar idempotencia: si ya se creó un pedido con esta clave para este usuario, devolverlo sin duplicar
  const existingByKey = await db
    .select()
    .from(orders)
    .where(and(eq(orders.idempotencyKey, idempotencyKey), eq(orders.userId, user.id)))
    .limit(1);

  if (existingByKey.length > 0) {
    const existing = existingByKey[0];
    return {
      success: true,
      data: {
        orderId: existing.id,
        orderNumber: existing.orderNumber,
        orderStatus: existing.status,
        paymentStatus: existing.paymentStatus,
      },
    };
  }

  // 2. Resolver y validar dirección de entrega peruana
  let recipientName = (input.shippingRecipientName ?? "").trim();
  let recipientPhone = (input.shippingRecipientPhone ?? "").trim();
  let department = (input.shippingDepartment ?? "").trim();
  let province = (input.shippingProvince ?? "").trim();
  let district = (input.shippingDistrict ?? "").trim();
  let addressLine1 = (input.shippingAddressLine1 ?? "").trim();
  let addressLine2 = (input.shippingAddressLine2 ?? "").trim();
  let reference = (input.shippingReference ?? "").trim();

  if (input.savedAddressId && Number.isInteger(Number(input.savedAddressId)) && Number(input.savedAddressId) > 0) {
    const addrRows = await db
      .select()
      .from(userAddresses)
      .where(
        and(
          eq(userAddresses.id, Number(input.savedAddressId)),
          eq(userAddresses.userId, user.id),
        ),
      )
      .limit(1);

    if (addrRows.length === 0) {
      return {
        success: false,
        error: "La dirección seleccionada no existe o no pertenece a tu libreta de direcciones.",
      };
    }

    const saved = addrRows[0];
    recipientName = saved.recipientName;
    recipientPhone = saved.recipientPhone;
    department = saved.department;
    province = saved.province;
    district = saved.district;
    addressLine1 = saved.addressLine1;
    addressLine2 = saved.addressLine2 ?? "";
    reference = saved.reference ?? "";
  } else {
    if (!recipientName || recipientName.length < 3) {
      return { success: false, error: "Ingresa el nombre completo de la persona que recibirá el pedido." };
    }
    const phoneCheck = validatePhone(recipientPhone, true);
    if (!phoneCheck.valid) {
      return { success: false, error: phoneCheck.error };
    }
    if (!department) return { success: false, error: "Selecciona el departamento de entrega." };
    if (!province) return { success: false, error: "Ingresa la provincia de entrega." };
    if (!district) return { success: false, error: "Ingresa el distrito de entrega." };
    if (!addressLine1 || addressLine1.length < 5) {
      return { success: false, error: "Ingresa la dirección exacta de entrega (avenida, calle, número, interior)." };
    }

    if (input.saveNewAddressToBook) {
      await db.insert(userAddresses).values({
        userId: user.id,
        title: `${district}, ${department}`.slice(0, 60),
        recipientName: recipientName.slice(0, 150),
        recipientPhone: recipientPhone.slice(0, 30),
        addressLine1: addressLine1.slice(0, 255),
        addressLine2: addressLine2 ? addressLine2.slice(0, 255) : null,
        reference: reference ? reference.slice(0, 255) : null,
        department: department.slice(0, 80),
        province: province.slice(0, 80),
        district: district.slice(0, 80),
        isDefault: false,
      });
    }
  }

  // 3. Validar datos tributarios para Boleta o Factura Electrónica
  const billingValidation = validateBillingInput({
    documentType: input.taxDocumentType,
    customerDocType: input.billingDocType,
    customerDocNumber: input.billingDocNumber,
    customerLegalName: input.billingCustomerName,
    customerFiscalAddress: input.billingFiscalAddress,
  });

  if (!billingValidation.valid) {
    return { success: false, error: billingValidation.error };
  }

  // 4. Validar y recalcular líneas de productos desde el servidor (Cotización B2B aceptada vs Carrito activo)
  let orderMode: "retail" | "wholesale" = "retail";
  let resolvedQuoteId: number | null = null;
  let activeCartIdToMarkConverted: number | null = null;
  let retailSubtotalAmount = 0;
  let discountAmount = 0;
  let subtotalAfterDiscountAmount = 0;

  const preparedLines: Array<{
    productId: number;
    variantId: number;
    productNameSnapshot: string;
    productSlugSnapshot: string;
    skuSnapshot: string;
    sizeSnapshot: string | null;
    colorNameSnapshot: string | null;
    colorSwatchSnapshot: string | null;
    imageUrlSnapshot: string;
    quantity: number;
    retailUnitPriceSnapshot: number;
    unitPriceSnapshot: number;
    lineDiscountAmount: number;
    lineSubtotalAmount: number;
    appliedPriceLabel: string;
  }> = [];

  if (input.source === "quote" && input.quoteId) {
    if (!isUserAuthorizedForWholesale(user)) {
      return {
        success: false,
        error: "Solo las empresas mayoristas aprobadas y activas pueden convertir cotizaciones B2B en pedidos.",
      };
    }

    const qId = Number(input.quoteId);
    const quoteRows = await db
      .select()
      .from(wholesaleQuotes)
      .where(and(eq(wholesaleQuotes.id, qId), eq(wholesaleQuotes.userId, user.id)))
      .limit(1);

    if (quoteRows.length === 0) {
      return {
        success: false,
        error: "La cotización solicitada no existe o no pertenece a tu empresa.",
      };
    }

    const quote = quoteRows[0];

    // Impedir doble conversión de una misma cotización
    const existingQuoteOrder = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber })
      .from(orders)
      .where(eq(orders.quoteId, quote.id))
      .limit(1);

    if (existingQuoteOrder.length > 0) {
      return {
        success: false,
        error: `La cotización ${quote.quoteNumber} ya fue convertida previamente en el pedido ${existingQuoteOrder[0].orderNumber}.`,
      };
    }

    if (
      quote.status !== "accepted" ||
      (quote.validUntil !== null && quote.validUntil.getTime() <= Date.now())
    ) {
      return {
        success: false,
        error: "Esta cotización no se encuentra aceptada y vigente, por lo que no puede convertirse en pedido.",
      };
    }

    const qItems = await db
      .select()
      .from(wholesaleQuoteItems)
      .where(eq(wholesaleQuoteItems.quoteId, quote.id))
      .orderBy(asc(wholesaleQuoteItems.id));

    if (qItems.length === 0) {
      return { success: false, error: "La cotización no contiene líneas válidas." };
    }

    for (const qIt of qItems) {
      if (!qIt.variantId || !qIt.productId) {
        return {
          success: false,
          error: `La variante ${qIt.skuSnapshot} ya no existe en el catálogo activo.`,
        };
      }
      const qty = qIt.approvedQuantity ?? qIt.requestedQuantity;
      const unitPrice = qIt.quotedUnitPrice ?? qIt.referenceUnitPriceSnapshot;
      const retailUnit = qIt.retailUnitPriceSnapshot;
      const lineSub = qty * unitPrice;
      const retailSub = qty * retailUnit;
      const lineDisc = Math.max(0, retailSub - lineSub);

      retailSubtotalAmount += retailSub;
      subtotalAfterDiscountAmount += lineSub;

      preparedLines.push({
        productId: qIt.productId,
        variantId: qIt.variantId,
        productNameSnapshot: qIt.productNameSnapshot,
        productSlugSnapshot: qIt.productSlugSnapshot,
        skuSnapshot: qIt.skuSnapshot,
        sizeSnapshot: qIt.sizeSnapshot,
        colorNameSnapshot: qIt.colorNameSnapshot,
        colorSwatchSnapshot: qIt.colorSwatchSnapshot,
        imageUrlSnapshot: qIt.imageUrlSnapshot ?? "/placeholder.jpg",
        quantity: qty,
        retailUnitPriceSnapshot: retailUnit,
        unitPriceSnapshot: unitPrice,
        lineDiscountAmount: lineDisc,
        lineSubtotalAmount: lineSub,
        appliedPriceLabel: `Cotización Aprobada ${quote.quoteNumber}`,
      });
    }

    discountAmount = Math.max(0, retailSubtotalAmount - subtotalAfterDiscountAmount);
    orderMode = "wholesale";
    resolvedQuoteId = quote.id;
  } else {
    // Fuente: Carrito activo en el servidor
    const cartSnapshot = await getCartSnapshot();
    if (!cartSnapshot.cartId || cartSnapshot.items.length === 0) {
      return {
        success: false,
        error: "Tu bolsa de compras está vacía. Agrega prendas antes de confirmar el pedido.",
      };
    }

    if (cartSnapshot.hasStockIssues) {
      return {
        success: false,
        error:
          "Algunas variantes en tu bolsa superan el stock disponible actualmente. Ajusta las cantidades en la bolsa antes de continuar.",
      };
    }

    for (const cItem of cartSnapshot.items) {
      preparedLines.push({
        productId: cItem.productId,
        variantId: cItem.variantId,
        productNameSnapshot: cItem.productName,
        productSlugSnapshot: cItem.productSlug,
        skuSnapshot: cItem.sku,
        sizeSnapshot: cItem.size,
        colorNameSnapshot: cItem.colorName,
        colorSwatchSnapshot: cItem.colorSwatch,
        imageUrlSnapshot: cItem.imageUrl,
        quantity: cItem.quantity,
        retailUnitPriceSnapshot: cItem.pricing.retailUnitAmount ?? cItem.pricing.effectiveUnitAmount,
        unitPriceSnapshot: cItem.pricing.effectiveUnitAmount,
        lineDiscountAmount: cItem.pricing.lineSavingsAmount,
        lineSubtotalAmount: cItem.pricing.lineSubtotalAmount,
        appliedPriceLabel: cItem.pricing.appliedLabel,
      });
    }

    retailSubtotalAmount = cartSnapshot.retailSubtotalAmount;
    discountAmount = cartSnapshot.wholesaleSavingsAmount;
    subtotalAfterDiscountAmount = cartSnapshot.estimatedTotalAmount;
    activeCartIdToMarkConverted = cartSnapshot.cartId;

    const anyWholesale = cartSnapshot.items.some((i) => i.pricing.appliedMode === "wholesale");
    orderMode = cartSnapshot.isWholesaleAuthorized && anyWholesale ? "wholesale" : "retail";
  }

  // 5. Calcular y validar tarifa de envío en el servidor
  const shippingCalc = await calculateServerShipping(
    { department, province, district },
    subtotalAfterDiscountAmount,
  );

  if (!shippingCalc.isAvailable) {
    return {
      success: false,
      error:
        shippingCalc.unavailableReason ??
        `No contamos con cobertura de envío hacia ${district}, ${province} (${department}).`,
    };
  }

  const totalAmount = subtotalAfterDiscountAmount + shippingCalc.shippingAmount;
  const taxBreakdown = calculatePeruIgvBreakdown(totalAmount);

  const paymentMethodLabels: Record<PaymentProviderName, string> = {
    culqi: "Tarjeta de Crédito / Débito o Yape (Culqi)",
    mercadopago: "Mercado Pago Perú",
    bank_transfer: "Transferencia Bancaria / CCI Corporativo",
    sandbox: "Pasarela de Pruebas (Sandbox Seguro)",
  };
  const paymentProvider: PaymentProviderName = ["culqi", "mercadopago", "bank_transfer", "sandbox"].includes(
    input.paymentProvider,
  )
    ? input.paymentProvider
    : "sandbox";

  const orderNumber = generateOrderNumber();
  const now = new Date();
  const reservationExpiresAt = new Date(now.getTime() + 30 * 60 * 1000);

  // 6. Insertar cabecera del pedido
  let createdOrder: typeof orders.$inferSelect;
  try {
    const [inserted] = await db
      .insert(orders)
      .values({
        orderNumber,
        idempotencyKey,
        userId: user.id,
        quoteId: resolvedQuoteId,
        orderMode,
        status: "pending_payment",
        paymentStatus: "pending",
        paymentProvider,
        paymentMethodLabel: paymentMethodLabels[paymentProvider],
        currency: "PEN",
        customerEmailSnapshot: user.email,
        customerFirstNameSnapshot: user.firstName,
        customerLastNameSnapshot: user.lastName,
        customerPhoneSnapshot: user.phone ?? recipientPhone.slice(0, 30),
        shippingRecipientName: recipientName.slice(0, 150),
        shippingRecipientPhone: recipientPhone.slice(0, 30),
        shippingDepartment: department.slice(0, 80),
        shippingProvince: province.slice(0, 80),
        shippingDistrict: district.slice(0, 80),
        shippingAddressLine1: addressLine1.slice(0, 255),
        shippingAddressLine2: addressLine2 ? addressLine2.slice(0, 255) : null,
        shippingReference: reference ? reference.slice(0, 255) : null,
        shippingZoneCodeSnapshot: shippingCalc.zoneCode,
        shippingZoneNameSnapshot: shippingCalc.zoneName,
        shippingEstimatedLabel: shippingCalc.estimatedDaysLabel,
        taxDocumentType: input.taxDocumentType,
        billingDocType: input.billingDocType,
        billingDocNumber: input.billingDocNumber.trim().slice(0, 20),
        billingCustomerName: input.billingCustomerName.trim().slice(0, 200),
        billingFiscalAddress: input.billingFiscalAddress?.trim()
          ? input.billingFiscalAddress.trim().slice(0, 255)
          : null,
        retailSubtotalAmount,
        discountAmount,
        subtotalAfterDiscountAmount,
        shippingAmount: shippingCalc.shippingAmount,
        taxableBaseAmount: taxBreakdown.taxableBaseAmount,
        igvAmount: taxBreakdown.igvAmount,
        totalAmount: taxBreakdown.totalAmount,
        customerNotes: input.customerNotes?.trim() ? input.customerNotes.trim().slice(0, 1500) : null,
        reservationExpiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    createdOrder = inserted;
  } catch (err) {
    const msg = String(err);
    if (msg.includes("orders_idempotency_key_idx")) {
      const retryFound = await db
        .select()
        .from(orders)
        .where(eq(orders.idempotencyKey, idempotencyKey))
        .limit(1);
      if (retryFound[0]) {
        return {
          success: true,
          data: {
            orderId: retryFound[0].id,
            orderNumber: retryFound[0].orderNumber,
            orderStatus: retryFound[0].status,
            paymentStatus: retryFound[0].paymentStatus,
          },
        };
      }
    }
    if (msg.includes("orders_quote_unique_idx")) {
      return {
        success: false,
        error: "Esta cotización ya fue convertida en un pedido anteriormente.",
      };
    }
    throw err;
  }

  // 7. Reservar atómicamente el inventario para todas las variantes del pedido
  const reservationResult = await reserveInventoryForOrder({
    orderId: createdOrder.id,
    actorId: user.id,
    items: preparedLines.map((l) => ({
      variantId: l.variantId,
      sku: l.skuSnapshot,
      quantity: l.quantity,
    })),
  });

  if (!reservationResult.success) {
    // Si falló la reserva por falta de stock o compra simultánea, eliminar la cabecera recién creada y devolver error limpio
    await db.delete(orders).where(eq(orders.id, createdOrder.id));
    return {
      success: false,
      error: reservationResult.error ?? "Stock insuficiente para completar la reserva del pedido.",
    };
  }

  // 8. Insertar las líneas históricas inmutables del pedido
  for (const line of preparedLines) {
    await db.insert(orderItems).values({
      orderId: createdOrder.id,
      ...line,
      createdAt: now,
    });
  }

  // 9. Inicializar el registro de comprobante electrónico (Boleta / Factura)
  await ensureOrIssueTaxDocumentForOrder({
    orderId: createdOrder.id,
    orderNumber: createdOrder.orderNumber,
    isOrderPaid: false,
    billing: {
      documentType: input.taxDocumentType,
      customerDocType: input.billingDocType,
      customerDocNumber: input.billingDocNumber,
      customerLegalName: input.billingCustomerName,
      customerFiscalAddress: input.billingFiscalAddress,
    },
    taxableAmount: taxBreakdown.taxableBaseAmount,
    igvAmount: taxBreakdown.igvAmount,
    totalAmount: taxBreakdown.totalAmount,
    actorId: user.id,
  });

  // 10. Si provino del carrito activo, vaciarlo y marcar el carrito anterior como convertido
  if (activeCartIdToMarkConverted) {
    await db.delete(cartItems).where(eq(cartItems.cartId, activeCartIdToMarkConverted));
    await db
      .update(carts)
      .set({ status: "converted", updatedAt: now })
      .where(eq(carts.id, activeCartIdToMarkConverted));
  }

  await db.insert(auditLogs).values({
    actorId: user.id,
    action: "order_created",
    targetType: "order",
    targetId: createdOrder.id,
    details: `Pedido ${createdOrder.orderNumber} creado (${orderMode}) por ${createdOrder.totalAmount} céntimos PEN (${preparedLines.length} líneas).${resolvedQuoteId ? ` Convertido desde cotización #${resolvedQuoteId}.` : ""}`,
  });

  recordFailedAttempt(rlKey, 20, 15 * 60 * 1000);

  const baseUrl = await resolveBaseUrl();

  // 11. Procesar el cobro / operación de pago inicial
  const paymentRes = await processServerPaymentCharge({
    orderId: createdOrder.id,
    provider: paymentProvider,
    idempotencyKey: `pay:${idempotencyKey}`,
    paymentToken: input.paymentToken,
    maskedCardLast4: input.maskedCardLast4,
    actorId: user.id,
    baseUrl,
  });

  if (paymentRes.paymentStatus !== "approved") {
    sendOrderReceivedEmail({
      to: createdOrder.customerEmailSnapshot,
      customerName: createdOrder.customerFirstNameSnapshot,
      orderNumber: createdOrder.orderNumber,
      totalAmountCents: createdOrder.totalAmount,
      paymentMethodLabel: createdOrder.paymentMethodLabel,
      paymentStatus: paymentRes.paymentStatus,
      baseUrl,
      orderId: createdOrder.id,
    }).catch((e) => console.error("[Order] Error al despachar correo de pedido recibido:", e));
  }

  revalidatePath("/carrito");
  revalidatePath("/checkout");
  revalidatePath("/cuenta/pedidos");
  revalidatePath(`/cuenta/pedidos/${createdOrder.id}`);
  revalidatePath("/admin/pedidos");
  if (resolvedQuoteId) {
    revalidatePath(`/mayorista/cotizaciones/${resolvedQuoteId}`);
  }

  return {
    success: true,
    data: {
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      orderStatus: paymentRes.orderStatus,
      paymentStatus: paymentRes.paymentStatus,
    },
  };
}

/**
 * Permite al cliente propietario reintentar el pago de un pedido suyo que se encuentre en
 * `pending_payment`, `payment_processing` o `payment_failed` mientras su reserva de stock siga vigente.
 */
export async function retryOrderPaymentAction(input: {
  orderId: number;
  idempotencyKey: string;
  paymentProvider: PaymentProviderName;
  paymentToken?: string;
  maskedCardLast4?: string;
}): Promise<
  ActionResult<{
    orderStatus: string;
    paymentStatus: string;
    message: string;
  }>
> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    return { success: false, error: "Debes iniciar sesión para gestionar el pago de tu pedido." };
  }

  const orderId = Number(input.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return { success: false, error: "Identificador de pedido inválido." };
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
    .limit(1);

  if (rows.length === 0) {
    return {
      success: false,
      error: "Pedido no encontrado o no tienes permisos para acceder a él.",
    };
  }

  const order = rows[0];

  if (order.status === "cancelled" || order.status === "refunded") {
    return {
      success: false,
      error: "Este pedido se encuentra cancelado o reembolsado y ya no admite cobros.",
    };
  }

  if (order.paymentStatus === "approved" || order.status === "paid") {
    return {
      success: true,
      data: {
        orderStatus: order.status,
        paymentStatus: "approved",
        message: "Este pedido ya cuenta con un pago aprobado.",
      },
    };
  }

  const baseUrl = await resolveBaseUrl();
  const res = await processServerPaymentCharge({
    orderId: order.id,
    provider: input.paymentProvider,
    idempotencyKey: input.idempotencyKey.trim().slice(0, 120),
    paymentToken: input.paymentToken,
    maskedCardLast4: input.maskedCardLast4,
    actorId: user.id,
    baseUrl,
  });

  revalidatePath(`/cuenta/pedidos/${order.id}`);
  revalidatePath("/cuenta/pedidos");
  revalidatePath(`/admin/pedidos/${order.id}`);

  if (!res.success && res.paymentStatus === "rejected") {
    return {
      success: false,
      error: res.error ?? "El intento de pago fue rechazado.",
    };
  }

  return {
    success: true,
    data: {
      orderStatus: res.orderStatus,
      paymentStatus: res.paymentStatus,
      message: res.message,
    },
  };
}

/**
 * Permite al cliente propietario cancelar un pedido propio únicamente antes de haber sido pagado
 * (`pending_payment` o `payment_failed`), liberando de inmediato las reservas de stock.
 */
export async function customerCancelPendingOrderAction(input: {
  orderId: number;
  reason?: string;
}): Promise<ActionResult> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  const orderId = Number(input.orderId);
  const db = getDb();

  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)))
    .limit(1);

  if (rows.length === 0) {
    return { success: false, error: "Pedido no encontrado." };
  }

  const order = rows[0];
  if (!["pending_payment", "payment_failed", "payment_processing"].includes(order.status)) {
    return {
      success: false,
      error: "Solo puedes cancelar directamente un pedido que aún no haya sido pagado ni despachado.",
    };
  }

  const reason = input.reason?.trim() || "Cancelado voluntariamente por el cliente antes del pago";
  await releaseInventoryForOrder({
    orderId: order.id,
    reason,
    actorId: user.id,
  });

  const now = new Date();
  await db
    .update(orders)
    .set({
      status: "cancelled",
      paymentStatus: "cancelled",
      cancellationReason: reason.slice(0, 500),
      cancelledAt: now,
      updatedAt: now,
    })
    .where(eq(orders.id, order.id));

  await db.insert(auditLogs).values({
    actorId: user.id,
    action: "order_cancelled",
    targetType: "order",
    targetId: order.id,
    details: `Pedido ${order.orderNumber} cancelado por el cliente y stock liberado. Motivo: ${reason}`,
  });

  revalidatePath(`/cuenta/pedidos/${order.id}`);
  revalidatePath("/cuenta/pedidos");
  revalidatePath("/admin/pedidos");

  return { success: true };
}

/**
 * Gestión administrativa de un pedido (exclusivo para rol `admin`).
 *
 * Seguridad y Reglas de Negocio (Módulo 8):
 * - Nunca permite alterar arbitrariamente los importes históricos (`totalAmount`, `subtotal`, `shippingAmount`) de un pedido.
 * - Valida estrictamente las transiciones logísticas y de pago permitidas.
 * - Si se confirma el pago de una transferencia bancaria (`paid`), consolida el inventario y emite/registra el comprobante.
 * - Si se cancela un pedido no pagado (`cancelled`), libera las reservas de inventario.
 * - Si se reembolsa un pedido pagado (`refunded`), repone el stock (`refund_restock`) de forma idempotente y audita el motivo obligatorio.
 * - Registra transportista (`carrierName`) y código de seguimiento (`trackingNumber`) reales cuando se informa.
 */
export async function adminManageOrderAction(input: {
  orderId: number;
  nextStatus: OrderStatus;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  paymentReference?: string;
  adminNotes?: string;
  reason?: string;
}): Promise<ActionResult<{ status: OrderStatus }>> {
  const { user: adminUser } = await requireAdmin();

  const orderId = Number(input.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return { success: false, error: "ID de pedido inválido." };
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (rows.length === 0) {
    return { success: false, error: "El pedido indicado no existe." };
  }

  const order = rows[0];
  const now = new Date();
  const baseUrl = await resolveBaseUrl();

  // Matriz de transiciones permitidas desde el estado actual
  const allowedNextByCurrent: Record<OrderStatus, OrderStatus[]> = {
    pending_payment: ["pending_payment", "payment_processing", "paid", "cancelled", "payment_failed"],
    payment_processing: ["payment_processing", "paid", "cancelled", "payment_failed"],
    payment_failed: ["payment_failed", "paid", "cancelled"],
    paid: ["paid", "preparing", "shipped", "refunded"],
    preparing: ["preparing", "shipped", "refunded"],
    shipped: ["shipped", "delivered", "refunded"],
    delivered: ["delivered", "refunded"],
    cancelled: ["cancelled"],
    refunded: ["refunded"],
  };

  const validTargets = allowedNextByCurrent[order.status] ?? [];
  if (!validTargets.includes(input.nextStatus)) {
    return {
      success: false,
      error: `Transición no permitida desde el estado "${order.status}" hacia "${input.nextStatus}".`,
    };
  }

  // Si pasa a paid desde un estado pendiente, aplicar confirmación oficial de pago e inventario
  if (input.nextStatus === "paid" && order.paymentStatus !== "approved") {
    await applyVerifiedPaymentOutcome({
      orderId: order.id,
      outcome: "approved",
      provider: order.paymentProvider,
      providerReference:
        input.paymentReference?.trim() ||
        order.paymentProviderReference ||
        `ADM-VERIF-${order.orderNumber}`,
      actorId: adminUser.id,
      notes: input.reason?.trim() || "Pago verificado y conciliado por administración",
      baseUrl,
    });
  }

  // Si pasa a cancelled desde un estado aún no pagado, liberar reserva de inventario
  if (input.nextStatus === "cancelled" && order.status !== "cancelled") {
    const cancelReason = input.reason?.trim() || "Cancelado por administración";
    await releaseInventoryForOrder({
      orderId: order.id,
      reason: cancelReason,
      actorId: adminUser.id,
    });

    await db
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: "cancelled",
        cancellationReason: cancelReason.slice(0, 500),
        adminNotes: input.adminNotes?.trim() ? input.adminNotes.trim().slice(0, 2000) : order.adminNotes,
        cancelledAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));

    await db.insert(auditLogs).values({
      actorId: adminUser.id,
      action: "order_cancelled",
      targetType: "order",
      targetId: order.id,
      details: `Pedido ${order.orderNumber} cancelado por ${adminUser.firstName} ${adminUser.lastName}. Motivo: ${cancelReason}`,
    });

    revalidatePath(`/admin/pedidos/${order.id}`);
    revalidatePath("/admin/pedidos");
    revalidatePath(`/cuenta/pedidos/${order.id}`);
    revalidatePath("/cuenta/pedidos");

    return { success: true, data: { status: "cancelled" } };
  }

  // Si pasa a refunded desde un pedido pagado, exigir motivo y reponer el stock de forma idempotente
  if (input.nextStatus === "refunded" && order.status !== "refunded") {
    const refundReason = (input.reason ?? "").trim();
    if (refundReason.length < 5) {
      return {
        success: false,
        error: "Para procesar un reembolso de un pedido pagado es obligatorio registrar el motivo auditable (mín. 5 caracteres).",
      };
    }

    await restockRefundedOrderInventory({
      orderId: order.id,
      reason: refundReason,
      actorId: adminUser.id,
    });

    await db
      .update(orders)
      .set({
        status: "refunded",
        paymentStatus: "refunded",
        cancellationReason: refundReason.slice(0, 500),
        adminNotes: input.adminNotes?.trim() ? input.adminNotes.trim().slice(0, 2000) : order.adminNotes,
        refundedAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));

    await db.insert(auditLogs).values({
      actorId: adminUser.id,
      action: "order_refunded",
      targetType: "order",
      targetId: order.id,
      details: `Pedido ${order.orderNumber} REEMBOLSADO y stock repuesto por ${adminUser.firstName} ${adminUser.lastName}. Motivo: ${refundReason}`,
    });

    revalidatePath(`/admin/pedidos/${order.id}`);
    revalidatePath("/admin/pedidos");
    revalidatePath(`/cuenta/pedidos/${order.id}`);
    revalidatePath("/cuenta/pedidos");

    return { success: true, data: { status: "refunded" } };
  }

  const carrierName = input.carrierName !== undefined
    ? (input.carrierName.trim() ? input.carrierName.trim().slice(0, 120) : null)
    : order.carrierName;

  const trackingNumber = input.trackingNumber !== undefined
    ? (input.trackingNumber.trim() ? input.trackingNumber.trim().slice(0, 120) : null)
    : order.trackingNumber;

  const trackingUrl = input.trackingUrl !== undefined
    ? (input.trackingUrl.trim() ? input.trackingUrl.trim().slice(0, 500) : null)
    : order.trackingUrl;

  await db
    .update(orders)
    .set({
      status: input.nextStatus,
      carrierName,
      trackingNumber,
      trackingUrl,
      adminNotes: input.adminNotes !== undefined
        ? (input.adminNotes.trim() ? input.adminNotes.trim().slice(0, 2000) : null)
        : order.adminNotes,
      shippedAt: input.nextStatus === "shipped" && !order.shippedAt ? now : order.shippedAt,
      deliveredAt: input.nextStatus === "delivered" && !order.deliveredAt ? now : order.deliveredAt,
      updatedAt: now,
    })
    .where(eq(orders.id, order.id));

  await db.insert(auditLogs).values({
    actorId: adminUser.id,
    action: "order_status_change",
    targetType: "order",
    targetId: order.id,
    details: `Pedido ${order.orderNumber}: estado ${order.status} → ${input.nextStatus} por ${adminUser.firstName} ${adminUser.lastName}.${carrierName ? ` Transportista: ${carrierName}.` : ""}${trackingNumber ? ` Tracking: ${trackingNumber}.` : ""}`,
  });

  if (input.nextStatus === "shipped" && order.status !== "shipped") {
    sendOrderShippedEmail({
      to: order.customerEmailSnapshot,
      customerName: order.customerFirstNameSnapshot,
      orderNumber: order.orderNumber,
      carrierName,
      trackingNumber,
      baseUrl,
      orderId: order.id,
    }).catch((e) => console.error("[Order] Error al enviar correo de despacho:", e));
  } else if (input.nextStatus === "delivered" && order.status !== "delivered") {
    sendOrderDeliveredEmail({
      to: order.customerEmailSnapshot,
      customerName: order.customerFirstNameSnapshot,
      orderNumber: order.orderNumber,
      baseUrl,
      orderId: order.id,
    }).catch((e) => console.error("[Order] Error al enviar correo de entrega:", e));
  }

  revalidatePath(`/admin/pedidos/${order.id}`);
  revalidatePath("/admin/pedidos");
  revalidatePath(`/cuenta/pedidos/${order.id}`);
  revalidatePath("/cuenta/pedidos");

  return {
    success: true,
    data: { status: input.nextStatus },
  };
}

/**
 * Permite al administrador actualizar las tarifas de envío de una zona geográfica peruana.
 */
export async function adminUpdateShippingZoneAction(input: {
  zoneId: number;
  rateAmountSoles: string;
  freeShippingMinSoles?: string;
  estimatedDaysLabel: string;
  isAvailable: boolean;
  unavailableReason?: string;
}): Promise<ActionResult> {
  const { user: adminUser } = await requireAdmin();

  const rateSoles = Number(String(input.rateAmountSoles).replace(",", "."));
  if (Number.isNaN(rateSoles) || rateSoles < 0) {
    return { success: false, error: "El importe de la tarifa de envío no es válido." };
  }

  const rateCents = Math.round(rateSoles * 100);
  let freeMinCents: number | null = null;

  if (input.freeShippingMinSoles && input.freeShippingMinSoles.trim().length > 0) {
    const freeSoles = Number(String(input.freeShippingMinSoles).replace(",", "."));
    if (!Number.isNaN(freeSoles) && freeSoles > 0) {
      freeMinCents = Math.round(freeSoles * 100);
    }
  }

  await updateShippingZoneConfig(adminUser.id, Number(input.zoneId), {
    rateAmount: rateCents,
    freeShippingMinSubtotal: freeMinCents,
    estimatedDaysLabel: input.estimatedDaysLabel || "24 a 48 horas hábiles",
    isAvailable: Boolean(input.isAvailable),
    unavailableReason: input.unavailableReason,
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/checkout");

  return { success: true };
}

/**
 * Permite al administrador reintentar la emisión o consultar el estado de un comprobante electrónico
 * ante el proveedor PSE/OSE autorizado por SUNAT sin duplicar numeración ni inventar datos.
 */
export async function adminRetryOrSyncTaxDocumentAction(input: {
  orderId: number;
  operation?: "emit_or_retry" | "query_status";
}): Promise<
  ActionResult<{
    status: string;
    series: string | null;
    correlativeNumber: string | null;
    summary: string;
  }>
> {
  const { user: adminUser } = await requireAdmin();
  const orderId = Number(input.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return { success: false, error: "ID de pedido inválido." };
  }

  const db = getDb();
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (rows.length === 0) {
    return { success: false, error: "El pedido indicado no existe." };
  }

  const order = rows[0];
  const baseUrl = await resolveBaseUrl();

  if (input.operation === "query_status") {
    const qRes = await querySunatDocumentStatusForOrder({
      orderId: order.id,
      actorId: adminUser.id,
    });
    revalidatePath(`/admin/pedidos/${order.id}`);
    revalidatePath(`/cuenta/pedidos/${order.id}`);
    if (!qRes.ok) {
      return { success: false, error: qRes.message };
    }
    return {
      success: true,
      data: {
        status: qRes.status,
        series: null,
        correlativeNumber: null,
        summary: qRes.message,
      },
    };
  }

  const isPaid =
    order.paymentStatus === "approved" ||
    ["paid", "preparing", "shipped", "delivered"].includes(order.status);

  const taxRes = await ensureOrIssueTaxDocumentForOrder({
    orderId: order.id,
    orderNumber: order.orderNumber,
    isOrderPaid: isPaid,
    billing: {
      documentType: order.taxDocumentType,
      customerDocType: (order.billingDocType as "DNI" | "CE" | "RUC") || "DNI",
      customerDocNumber: order.billingDocNumber,
      customerLegalName: order.billingCustomerName,
      customerFiscalAddress: order.billingFiscalAddress,
    },
    taxableAmount: order.taxableBaseAmount,
    igvAmount: order.igvAmount,
    totalAmount: order.totalAmount,
    actorId: adminUser.id,
    baseUrl,
  });

  revalidatePath(`/admin/pedidos/${order.id}`);
  revalidatePath(`/cuenta/pedidos/${order.id}`);

  if (taxRes.status === "error") {
    return {
      success: false,
      error: taxRes.providerResponseSummary ?? "Error al comunicar con el PSE/OSE.",
    };
  }

  return {
    success: true,
    data: {
      status: taxRes.status,
      series: taxRes.series,
      correlativeNumber: taxRes.correlativeNumber,
      summary: taxRes.providerResponseSummary ?? "Estado de comprobante sincronizado.",
    },
  };
}

/**
 * Permite al administrador conciliar/recuperar en el servidor un pago confirmado en Mercado Pago
 * mediante su ID de pago (`mpPaymentId`) si ocurrió un fallo temporal de red durante el webhook.
 */
export async function adminReconcileMercadoPagoPaymentAction(input: {
  orderId: number;
  mpPaymentId: string;
}): Promise<ActionResult<{ message: string }>> {
  const { user: adminUser } = await requireAdmin();
  const orderId = Number(input.orderId);
  const mpPaymentId = (input.mpPaymentId ?? "").trim();

  if (!orderId || !mpPaymentId) {
    return {
      success: false,
      error: "Ingresa un ID de pago de Mercado Pago válido para verificar en la API oficial.",
    };
  }

  const baseUrl = await resolveBaseUrl();
  const syncRes = await verifyAndSyncMercadoPagoPaymentById({
    mpPaymentId,
    expectedOrderId: orderId,
    actorId: adminUser.id,
    baseUrl,
  });

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
  revalidatePath(`/cuenta/pedidos/${orderId}`);

  if (!syncRes.ok) {
    return { success: false, error: syncRes.message };
  }

  return {
    success: true,
    data: { message: syncRes.message },
  };
}

