"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  wholesaleQuotes,
  wholesaleQuoteItems,
  products,
  productVariants,
  productPrices,
  productImages,
  auditLogs,
} from "@/server/db/schema";
import { getCurrentSession, requireAdmin } from "@/server/auth/session";
import { checkRateLimit, recordFailedAttempt } from "@/server/auth/rate-limit";
import {
  calculateLinePricing,
  isUserAuthorizedForWholesale,
  validateRequestedQuantity,
} from "@/server/pricing/engine";
import { parseSolesToCents } from "@/lib/catalog-params";
import { getApprovedCompanyForUser, type QuoteStatus } from "@/server/queries/quotes";
import type { ActionResult } from "./auth";

export interface SubmitQuoteItemInput {
  variantId: number;
  quantity: number;
  itemNotes?: string;
}

export interface SubmitQuoteInput {
  deliveryCity?: string;
  commercialNeeds: string;
  customerNotes?: string;
  items: SubmitQuoteItemInput[];
}

function generateQuoteNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `COT-${year}-${rand}`;
}

/**
 * Envío de una nueva solicitud de cotización B2B por una empresa autorizada (`business_approved` o `admin`).
 *
 * Seguridad comercial:
 * - Verifica que el usuario tenga rol `business_approved` (o `admin`) y esté activo.
 * - Rechaza clientes minoristas (`customer`), empresas pendientes (`business_pending`) o suspendidas.
 * - Recalcula todos los precios de referencia directamente desde `product_prices` en PostgreSQL.
 * - Toma un snapshot inmutable de nombre, SKU, talla, color, imagen y precio vigente al momento de la solicitud.
 */
export async function submitWholesaleQuoteAction(
  input: SubmitQuoteInput,
): Promise<ActionResult<{ quoteId: number; quoteNumber: string }>> {
  const { session, user } = await getCurrentSession();

  if (!session || !user) {
    return {
      success: false,
      error: "Debes iniciar sesión con tu cuenta empresarial para solicitar una cotización.",
    };
  }

  if (!isUserAuthorizedForWholesale(user)) {
    return {
      success: false,
      error:
        "Solo las empresas mayoristas aprobadas y activas pueden solicitar cotizaciones B2B. Si tu solicitud está en revisión, espera la confirmación comercial.",
    };
  }

  // Protección contra spam de solicitudes de cotización
  const rlKey = `quote_submit:${user.id}`;
  const rlCheck = checkRateLimit(rlKey, 15, 15 * 60 * 1000);
  if (!rlCheck.allowed) {
    return {
      success: false,
      error: `Has alcanzado el límite temporal de solicitudes de cotización. Intenta nuevamente en ${rlCheck.retryAfterSeconds ?? 60} segundos.`,
    };
  }

  const commercialNeeds = (input.commercialNeeds ?? "").trim();
  if (commercialNeeds.length < 10) {
    return {
      success: false,
      error:
        "Describe tus necesidades comerciales o requerimientos del pedido (mínimo 10 caracteres).",
    };
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return {
      success: false,
      error: "Debes incluir al menos una variante de producto en la solicitud de cotización.",
    };
  }

  if (input.items.length > 50) {
    return {
      success: false,
      error: "Una solicitud de cotización puede contener hasta 50 líneas de variantes.",
    };
  }

  // Agrupar si enviaron la misma variante repetida
  const consolidatedByVariant = new Map<number, { quantity: number; itemNotes: string | null }>();
  for (const rawItem of input.items) {
    const vId = Number(rawItem.variantId);
    if (!Number.isInteger(vId) || vId <= 0) {
      return { success: false, error: "Se detectó una variante inválida en la solicitud." };
    }
    const qtyVal = validateRequestedQuantity(rawItem.quantity, 50000);
    if (!qtyVal.valid) {
      return { success: false, error: qtyVal.error };
    }
    const existing = consolidatedByVariant.get(vId);
    if (existing) {
      const nextQ = existing.quantity + qtyVal.quantity;
      const recheck = validateRequestedQuantity(nextQ, 50000);
      if (!recheck.valid) return { success: false, error: recheck.error };
      existing.quantity = recheck.quantity;
    } else {
      consolidatedByVariant.set(vId, {
        quantity: qtyVal.quantity,
        itemNotes: rawItem.itemNotes?.trim() ? rawItem.itemNotes.trim().slice(0, 500) : null,
      });
    }
  }

  const variantIds = Array.from(consolidatedByVariant.keys());
  const db = getDb();

  const variantRows = await db
    .select({
      variant: productVariants,
      product: products,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, variantIds));

  if (variantRows.length !== variantIds.length) {
    return {
      success: false,
      error: "Una o más variantes seleccionadas no existen en el catálogo.",
    };
  }

  for (const row of variantRows) {
    if (row.product.status !== "active" || !row.variant.isActive) {
      return {
        success: false,
        error: `El producto "${row.product.name}" (${row.variant.sku}) no se encuentra disponible actualmente.`,
      };
    }
  }

  const productIds = Array.from(new Set(variantRows.map((r) => r.product.id)));
  const [allPrices, allImages] = await Promise.all([
    db
      .select()
      .from(productPrices)
      .where(inArray(productPrices.productId, productIds)),
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds)),
  ]);

  const pricesByProduct = new Map<number, (typeof allPrices)[number][]>();
  for (const p of allPrices) {
    const list = pricesByProduct.get(p.productId) ?? [];
    list.push(p);
    pricesByProduct.set(p.productId, list);
  }

  const imageByProduct = new Map<number, string>();
  for (const img of allImages) {
    if (!imageByProduct.has(img.productId) || img.isPrimary) {
      imageByProduct.set(img.productId, img.url);
    }
  }

  // Sumar cantidades por producto para aplicar la escala mayorista referencial correcta
  const productGroupQty = new Map<number, number>();
  for (const row of variantRows) {
    const entry = consolidatedByVariant.get(row.variant.id)!;
    productGroupQty.set(
      row.product.id,
      (productGroupQty.get(row.product.id) ?? 0) + entry.quantity,
    );
  }

  let requestedSubtotalAmount = 0;
  const preparedItems: Array<{
    productId: number;
    variantId: number;
    productNameSnapshot: string;
    productSlugSnapshot: string;
    skuSnapshot: string;
    sizeSnapshot: string | null;
    colorNameSnapshot: string | null;
    colorSwatchSnapshot: string | null;
    imageUrlSnapshot: string | null;
    requestedQuantity: number;
    retailUnitPriceSnapshot: number;
    referenceUnitPriceSnapshot: number;
    lineSubtotalAmount: number;
    itemNotes: string | null;
  }> = [];

  for (const row of variantRows) {
    const entry = consolidatedByVariant.get(row.variant.id)!;
    const prodPrices = pricesByProduct.get(row.product.id) ?? [];
    const groupQty = productGroupQty.get(row.product.id) ?? entry.quantity;

    const linePricing = calculateLinePricing({
      prices: prodPrices,
      quantity: entry.quantity,
      productGroupQuantity: groupQty,
      isProductWholesaleEnabled: row.product.isWholesale,
      user,
    });

    if (linePricing.retailUnitAmount === null) {
      return {
        success: false,
        error: `El producto "${row.product.name}" aún no tiene precio base configurado.`,
      };
    }

    requestedSubtotalAmount += linePricing.lineSubtotalAmount;

    preparedItems.push({
      productId: row.product.id,
      variantId: row.variant.id,
      productNameSnapshot: row.product.name,
      productSlugSnapshot: row.product.slug,
      skuSnapshot: row.variant.sku,
      sizeSnapshot: row.variant.size,
      colorNameSnapshot: row.variant.colorName,
      colorSwatchSnapshot: row.variant.colorSwatch,
      imageUrlSnapshot: imageByProduct.get(row.product.id) ?? "/placeholder.jpg",
      requestedQuantity: entry.quantity,
      retailUnitPriceSnapshot: linePricing.retailUnitAmount,
      referenceUnitPriceSnapshot: linePricing.effectiveUnitAmount,
      lineSubtotalAmount: linePricing.lineSubtotalAmount,
      itemNotes: entry.itemNotes,
    });
  }

  // Obtener datos empresariales aprobados (o fallback para admin)
  const approvedCompany = await getApprovedCompanyForUser(user.id);
  const companyLegalName =
    approvedCompany?.legalName ?? `${user.firstName} ${user.lastName} (Cuenta Corporativa)`;
  const companyTradeName = approvedCompany?.tradeName ?? companyLegalName;
  const companyTaxId = approvedCompany?.taxId ?? "20000000001";
  const contactName = approvedCompany?.contactName ?? `${user.firstName} ${user.lastName}`;
  const contactEmail = approvedCompany?.contactEmail ?? user.email;
  const contactPhone = approvedCompany?.contactPhone ?? user.phone ?? "999999999";
  const deliveryCity =
    input.deliveryCity?.trim() ||
    (approvedCompany ? `${approvedCompany.district}, ${approvedCompany.department}` : "Lima");

  const quoteNumber = generateQuoteNumber();
  const now = new Date();

  const [createdQuote] = await db
    .insert(wholesaleQuotes)
    .values({
      quoteNumber,
      userId: user.id,
      businessApplicationId: approvedCompany?.id ?? null,
      companyLegalName,
      companyTradeName,
      companyTaxId,
      contactName,
      contactEmail,
      contactPhone,
      deliveryCity: deliveryCity.slice(0, 120),
      commercialNeeds: commercialNeeds.slice(0, 3000),
      customerNotes: input.customerNotes?.trim() ? input.customerNotes.trim().slice(0, 2000) : null,
      status: "submitted",
      currency: "PEN",
      requestedSubtotalAmount,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  for (const item of preparedItems) {
    await db.insert(wholesaleQuoteItems).values({
      quoteId: createdQuote.id,
      ...item,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.insert(auditLogs).values({
    actorId: user.id,
    action: "quote_created",
    targetType: "wholesale_quote",
    targetId: createdQuote.id,
    details: `Solicitud de cotización ${quoteNumber} enviada por ${companyLegalName} (RUC ${companyTaxId}) por un estimado referencial de ${requestedSubtotalAmount} céntimos PEN (${preparedItems.length} líneas).`,
  });

  recordFailedAttempt(rlKey, 15, 15 * 60 * 1000);

  revalidatePath("/mayorista/cotizaciones");
  revalidatePath("/cuenta");
  revalidatePath("/admin/cotizaciones");

  return {
    success: true,
    data: {
      quoteId: createdQuote.id,
      quoteNumber: createdQuote.quoteNumber,
    },
  };
}

/**
 * Permite a la empresa propietaria responder a una cotización emitida (`quoted` -> `accepted` o `rejected`)
 * o cancelar una solicitud propia aún no cerrada (`submitted` / `under_review` -> `cancelled`).
 *
 * Reglas de seguridad:
 * - Verifica propiedad estricta (`quote.userId === user.id`). Ninguna empresa puede alterar ni aceptar
 *   la cotización de otra.
 * - Impide aceptar una cotización cuya fecha `validUntil` haya vencido o cuyo estado sea `expired` / `rejected` / `cancelled`.
 * - Registra la decisión con marca de tiempo y auditoría, sin generar un pedido cobrable (Fase 5).
 */
export async function respondToWholesaleQuoteAction(input: {
  quoteId: number;
  decision: "accepted" | "rejected" | "cancelled";
  notes?: string;
}): Promise<ActionResult<{ status: QuoteStatus }>> {
  const { session, user } = await getCurrentSession();
  if (!session || !user) {
    return { success: false, error: "Debes iniciar sesión para gestionar tus cotizaciones." };
  }

  const quoteId = Number(input.quoteId);
  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    return { success: false, error: "Identificador de cotización inválido." };
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(wholesaleQuotes)
    .where(eq(wholesaleQuotes.id, quoteId))
    .limit(1);

  if (rows.length === 0 || rows[0].userId !== user.id) {
    return {
      success: false,
      error: "No se encontró la cotización solicitada o no tienes permisos para acceder a ella.",
    };
  }

  const quote = rows[0];
  const now = new Date();

  // Verificar expiración automática antes de procesar cualquier decisión
  if (
    quote.status === "quoted" &&
    quote.validUntil !== null &&
    quote.validUntil.getTime() <= now.getTime()
  ) {
    await db
      .update(wholesaleQuotes)
      .set({ status: "expired", updatedAt: now })
      .where(eq(wholesaleQuotes.id, quote.id));

    return {
      success: false,
      error:
        "Esta propuesta económica ha vencido y ya no puede ser aceptada. Solicita una actualización o una nueva cotización a tu ejecutivo comercial.",
    };
  }

  if (input.decision === "cancelled") {
    if (!["submitted", "under_review", "quoted"].includes(quote.status)) {
      return {
        success: false,
        error: `No es posible cancelar una cotización en estado "${quote.status}".`,
      };
    }

    await db
      .update(wholesaleQuotes)
      .set({
        status: "cancelled",
        customerDecisionNotes: input.notes?.trim() ? input.notes.trim().slice(0, 1000) : null,
        decidedAt: now,
        updatedAt: now,
      })
      .where(eq(wholesaleQuotes.id, quote.id));

    await db.insert(auditLogs).values({
      actorId: user.id,
      action: "quote_status_change",
      targetType: "wholesale_quote",
      targetId: quote.id,
      details: `Cotización ${quote.quoteNumber} cancelada por el cliente. ${input.notes ? `Nota: ${input.notes.trim()}` : ""}`,
    });

    revalidatePath(`/mayorista/cotizaciones/${quote.id}`);
    revalidatePath("/mayorista/cotizaciones");
    revalidatePath("/admin/cotizaciones");

    return { success: true, data: { status: "cancelled" } };
  }

  if (input.decision === "accepted" || input.decision === "rejected") {
    if (quote.status !== "quoted") {
      return {
        success: false,
        error:
          quote.status === "expired"
            ? "Esta cotización se encuentra vencida y no puede ser aceptada."
            : "Solo puedes aceptar o rechazar una cotización cuando el equipo comercial haya emitido una propuesta económica vigente.",
      };
    }

    await db
      .update(wholesaleQuotes)
      .set({
        status: input.decision,
        customerDecisionNotes: input.notes?.trim() ? input.notes.trim().slice(0, 1000) : null,
        decidedAt: now,
        updatedAt: now,
      })
      .where(eq(wholesaleQuotes.id, quote.id));

    await db.insert(auditLogs).values({
      actorId: user.id,
      action: "quote_status_change",
      targetType: "wholesale_quote",
      targetId: quote.id,
      details: `Propuesta de cotización ${quote.quoteNumber} ${input.decision === "accepted" ? "ACEPTADA" : "RECHAZADA"} por la empresa ${quote.companyLegalName}. ${input.notes ? `Observación: ${input.notes.trim()}` : ""}`,
    });

    revalidatePath(`/mayorista/cotizaciones/${quote.id}`);
    revalidatePath("/mayorista/cotizaciones");
    revalidatePath("/admin/cotizaciones");
    revalidatePath(`/admin/cotizaciones/${quote.id}`);

    return { success: true, data: { status: input.decision } };
  }

  return { success: false, error: "Acción no reconocida." };
}

export interface AdminQuoteItemProposalInput {
  itemId: number;
  approvedQuantity: number;
  /** Precio unitario propuesto en soles (ej: "48.50") o céntimos enteros si se indica. */
  quotedUnitPriceSoles: string;
}

export interface AdminManageQuoteInput {
  quoteId: number;
  nextStatus: QuoteStatus;
  validUntilDate?: string;
  paymentTermsProposal?: string;
  adminProposalNotes?: string;
  internalNotes?: string;
  items?: AdminQuoteItemProposalInput[];
}

/**
 * Gestión administrativa de una cotización B2B (exclusivo para rol `admin`).
 * Permite:
 * - Pasar a `under_review`.
 * - Emitir una propuesta económica formal (`quoted`) con precios unitarios especiales por variante,
 *   cantidades aprobadas, condiciones de pago y fecha de vencimiento (`validUntil`).
 * - Rechazar (`rejected`) o marcar como vencida (`expired`).
 * - Conservar de manera inmutable las condiciones ofrecidas y auditar quién realizó el cambio y cuándo.
 */
export async function adminUpdateWholesaleQuoteAction(
  input: AdminManageQuoteInput,
): Promise<ActionResult<{ status: QuoteStatus; quotedTotalAmount: number | null }>> {
  const { user: adminUser } = await requireAdmin();

  const quoteId = Number(input.quoteId);
  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    return { success: false, error: "ID de cotización inválido." };
  }

  const allowedStatuses: QuoteStatus[] = [
    "submitted",
    "under_review",
    "quoted",
    "accepted",
    "rejected",
    "expired",
    "cancelled",
  ];
  if (!allowedStatuses.includes(input.nextStatus)) {
    return { success: false, error: "Estado de cotización inválido." };
  }

  const db = getDb();
  const existingRows = await db
    .select()
    .from(wholesaleQuotes)
    .where(eq(wholesaleQuotes.id, quoteId))
    .limit(1);

  if (existingRows.length === 0) {
    return { success: false, error: "La cotización solicitada no existe." };
  }

  const quote = existingRows[0];

  // Inmutabilidad de cotizaciones ya cerradas o aceptadas
  if (["accepted", "rejected", "cancelled"].includes(quote.status)) {
    return {
      success: false,
      error: `Esta cotización se encuentra en estado definitivo "${quote.status}". Las condiciones comerciales aceptadas o cerradas son inmutables y no pueden alterarse retroactivamente.`,
    };
  }

  // Validación de transiciones de estado permitidas desde el estado actual
  const allowedTransitions: Record<QuoteStatus, QuoteStatus[]> = {
    submitted: ["submitted", "under_review", "quoted", "rejected", "cancelled"],
    under_review: ["under_review", "quoted", "rejected", "cancelled"],
    quoted: ["quoted", "expired", "rejected", "cancelled"],
    expired: ["expired", "quoted", "rejected", "cancelled"],
    accepted: [],
    rejected: [],
    cancelled: [],
  };

  const validNext = allowedTransitions[quote.status] ?? [];
  if (!validNext.includes(input.nextStatus)) {
    return {
      success: false,
      error: `Transición de estado no permitida desde "${quote.status}" hacia "${input.nextStatus}".`,
    };
  }

  const existingItems = await db
    .select()
    .from(wholesaleQuoteItems)
    .where(eq(wholesaleQuoteItems.quoteId, quote.id));

  const now = new Date();
  let validUntil: Date | null = quote.validUntil;

  if (input.validUntilDate && input.validUntilDate.trim().length > 0) {
    const parsedDate = new Date(`${input.validUntilDate.trim()}T23:59:59-05:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return { success: false, error: "La fecha de vencimiento ingresada no tiene un formato válido." };
    }
    validUntil = parsedDate;
  }

  if (input.nextStatus === "quoted") {
    if (!validUntil || validUntil.getTime() <= now.getTime()) {
      return {
        success: false,
        error:
          "Para publicar una propuesta económica debes definir una fecha de vencimiento futura válida.",
      };
    }
  }

  let quotedTotalAmount: number | null = quote.quotedTotalAmount;

  // Si se enviaron propuestas por línea de variante, validarlas y actualizarlas
  if (Array.isArray(input.items) && input.items.length > 0) {
    let runningTotal = 0;
    const itemMap = new Map(existingItems.map((it) => [it.id, it]));

    for (const propItem of input.items) {
      const dbItem = itemMap.get(Number(propItem.itemId));
      if (!dbItem) {
        return {
          success: false,
          error: `La línea de cotización #${propItem.itemId} no pertenece a esta solicitud.`,
        };
      }

      const qtyCheck = validateRequestedQuantity(propItem.approvedQuantity, 50000);
      if (!qtyCheck.valid) {
        return {
          success: false,
          error: `Cantidad inválida en ${dbItem.skuSnapshot}: ${qtyCheck.error}`,
        };
      }

      const unitPriceCents = parseSolesToCents(String(propItem.quotedUnitPriceSoles).replace(",", "."));
      if (unitPriceCents == null || unitPriceCents <= 0) {
        return {
          success: false,
          error: `El precio unitario propuesto para ${dbItem.skuSnapshot} debe ser un importe mayor a S/ 0.00.`,
        };
      }

      const lineSubtotal = unitPriceCents * qtyCheck.quantity;
      runningTotal += lineSubtotal;

      await db
        .update(wholesaleQuoteItems)
        .set({
          approvedQuantity: qtyCheck.quantity,
          quotedUnitPrice: unitPriceCents,
          lineSubtotalAmount: lineSubtotal,
          updatedAt: now,
        })
        .where(eq(wholesaleQuoteItems.id, dbItem.id));
    }

    quotedTotalAmount = runningTotal;
  } else if (input.nextStatus === "quoted" && quotedTotalAmount === null) {
    // Si no envió edición por línea pero emite cotización, usamos los precios de referencia
    let runningTotal = 0;
    for (const dbItem of existingItems) {
      const qty = dbItem.approvedQuantity ?? dbItem.requestedQuantity;
      const unit = dbItem.quotedUnitPrice ?? dbItem.referenceUnitPriceSnapshot;
      const sub = qty * unit;
      runningTotal += sub;
      await db
        .update(wholesaleQuoteItems)
        .set({
          approvedQuantity: qty,
          quotedUnitPrice: unit,
          lineSubtotalAmount: sub,
          updatedAt: now,
        })
        .where(eq(wholesaleQuoteItems.id, dbItem.id));
    }
    quotedTotalAmount = runningTotal;
  }

  await db
    .update(wholesaleQuotes)
    .set({
      status: input.nextStatus,
      quotedTotalAmount,
      validUntil,
      paymentTermsProposal: input.paymentTermsProposal?.trim()
        ? input.paymentTermsProposal.trim().slice(0, 200)
        : quote.paymentTermsProposal,
      adminProposalNotes: input.adminProposalNotes?.trim()
        ? input.adminProposalNotes.trim().slice(0, 3000)
        : quote.adminProposalNotes,
      internalNotes: input.internalNotes?.trim()
        ? input.internalNotes.trim().slice(0, 3000)
        : quote.internalNotes,
      reviewedBy: adminUser.id,
      quotedAt: input.nextStatus === "quoted" ? now : quote.quotedAt,
      updatedAt: now,
    })
    .where(eq(wholesaleQuotes.id, quote.id));

  await db.insert(auditLogs).values({
    actorId: adminUser.id,
    action: input.nextStatus !== quote.status ? "quote_status_change" : "quote_updated",
    targetType: "wholesale_quote",
    targetId: quote.id,
    details: `Cotización ${quote.quoteNumber}: estado ${quote.status} → ${input.nextStatus} por ${adminUser.firstName} ${adminUser.lastName}. Total propuesto: ${quotedTotalAmount !== null ? `${quotedTotalAmount} céntimos PEN` : "sin cambio"}.`,
  });

  revalidatePath("/admin/cotizaciones");
  revalidatePath(`/admin/cotizaciones/${quote.id}`);
  revalidatePath("/mayorista/cotizaciones");
  revalidatePath(`/mayorista/cotizaciones/${quote.id}`);

  return {
    success: true,
    data: {
      status: input.nextStatus,
      quotedTotalAmount,
    },
  };
}

