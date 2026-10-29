import "server-only";

import { and, desc, eq, inArray, or, ilike, asc } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  wholesaleQuotes,
  wholesaleQuoteItems,
  businessApplications,
  products,
  productVariants,
  productPrices,
  productImages,
  auditLogs,
  users,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { escapeLike } from "@/lib/catalog-params";

export type QuoteStatus =
  | "submitted"
  | "under_review"
  | "quoted"
  | "accepted"
  | "rejected"
  | "expired"
  | "cancelled";

export interface QuoteItemDetail {
  id: number;
  quoteId: number;
  productId: number | null;
  variantId: number | null;
  productNameSnapshot: string;
  productSlugSnapshot: string;
  skuSnapshot: string;
  sizeSnapshot: string | null;
  colorNameSnapshot: string | null;
  colorSwatchSnapshot: string | null;
  imageUrlSnapshot: string | null;
  requestedQuantity: number;
  approvedQuantity: number | null;
  retailUnitPriceSnapshot: number;
  referenceUnitPriceSnapshot: number;
  quotedUnitPrice: number | null;
  lineSubtotalAmount: number;
  itemNotes: string | null;
  /** Stock actual en vivo de la variante (si aún existe). */
  liveStock: number | null;
  /** Precio minorista actual en vivo (para detectar cambios posteriores de catálogo). */
  liveRetailPrice: number | null;
}

export interface QuoteDetail {
  id: number;
  quoteNumber: string;
  userId: number;
  businessApplicationId: number | null;
  companyLegalName: string;
  companyTradeName: string;
  companyTaxId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  deliveryCity: string | null;
  commercialNeeds: string;
  customerNotes: string | null;
  status: QuoteStatus;
  currency: string;
  requestedSubtotalAmount: number;
  quotedTotalAmount: number | null;
  validUntil: Date | null;
  paymentTermsProposal: string | null;
  adminProposalNotes: string | null;
  internalNotes: string | null;
  customerDecisionNotes: string | null;
  reviewedBy: number | null;
  reviewerName: string | null;
  quotedAt: Date | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isExpiredNow: boolean;
  items: QuoteItemDetail[];
}

/**
 * Si una cotización en estado `quoted` tiene `validUntil` vencido respecto a la hora actual,
 * actualiza su estado a `expired` en la base de datos y retorna `"expired"`.
 */
async function syncExpiredQuoteIfNeeded(quote: {
  id: number;
  status: QuoteStatus;
  validUntil: Date | null;
}): Promise<QuoteStatus> {
  if (
    quote.status === "quoted" &&
    quote.validUntil !== null &&
    quote.validUntil.getTime() <= Date.now()
  ) {
    const db = getDb();
    await db
      .update(wholesaleQuotes)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(eq(wholesaleQuotes.id, quote.id));

    await db.insert(auditLogs).values({
      actorId: null,
      action: "quote_status_change",
      targetType: "wholesale_quote",
      targetId: quote.id,
      details: "Cotización marcada automáticamente como vencida (expired) por superar valid_until.",
    });

    return "expired";
  }
  return quote.status;
}

/**
 * Obtiene el perfil empresarial aprobado asociado a un usuario (si existe).
 */
export async function getApprovedCompanyForUser(userId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(businessApplications)
    .where(
      and(
        eq(businessApplications.userId, userId),
        eq(businessApplications.status, "approved"),
      ),
    )
    .orderBy(desc(businessApplications.updatedAt))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Obtiene el catálogo de productos y variantes activas disponibles para armar una solicitud de cotización B2B.
 */
export async function getWholesaleCatalogSelectorItems() {
  const db = getDb();

  const activeProducts = await db
    .select()
    .from(products)
    .where(eq(products.status, "active"))
    .orderBy(asc(products.sortOrder), asc(products.name));

  if (activeProducts.length === 0) return [];

  const productIds = activeProducts.map((p) => p.id);

  const [variants, prices, images] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(
        and(
          inArray(productVariants.productId, productIds),
          eq(productVariants.isActive, true),
        ),
      )
      .orderBy(asc(productVariants.id)),
    db
      .select()
      .from(productPrices)
      .where(inArray(productPrices.productId, productIds))
      .orderBy(asc(productPrices.minQuantity)),
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(asc(productImages.sortOrder)),
  ]);

  return activeProducts.map((prod) => {
    const prodVariants = variants.filter((v) => v.productId === prod.id);
    const prodPrices = prices.filter((p) => p.productId === prod.id);
    const prodImages = images.filter((img) => img.productId === prod.id);
    const primaryImg = prodImages.find((i) => i.isPrimary) ?? prodImages[0];

    const retailPrice = prodPrices.find((p) => p.type === "retail")?.amount ?? 0;
    const wholesaleTiers = prodPrices
      .filter((p) => p.type === "wholesale")
      .map((p) => ({
        minQuantity: p.minQuantity,
        maxQuantity: p.maxQuantity,
        amount: p.amount,
      }));

    return {
      id: prod.id,
      slug: prod.slug,
      name: prod.name,
      isWholesale: prod.isWholesale,
      imageUrl: primaryImg?.url ?? "/placeholder.jpg",
      retailPrice,
      wholesaleTiers,
      variants: prodVariants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        colorName: v.colorName,
        colorSwatch: v.colorSwatch,
        stock: v.stock,
      })),
    };
  });
}

/**
 * Lista todas las solicitudes de cotización pertenecientes exclusivamente al usuario autenticado.
 */
export async function getUserWholesaleQuotes(userId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(wholesaleQuotes)
    .where(eq(wholesaleQuotes.userId, userId))
    .orderBy(desc(wholesaleQuotes.createdAt));

  if (rows.length === 0) return [];

  const quoteIds = rows.map((q) => q.id);
  const allItems = await db
    .select()
    .from(wholesaleQuoteItems)
    .where(inArray(wholesaleQuoteItems.quoteId, quoteIds));

  const results = [];
  for (const q of rows) {
    const effectiveStatus = await syncExpiredQuoteIfNeeded({
      id: q.id,
      status: q.status,
      validUntil: q.validUntil,
    });
    const qItems = allItems.filter((i) => i.quoteId === q.id);
    const totalUnits = qItems.reduce(
      (acc, it) => acc + (it.approvedQuantity ?? it.requestedQuantity),
      0,
    );

    results.push({
      ...q,
      internalNotes: null, // Nunca exponer notas internas confidenciales al cliente
      status: effectiveStatus,
      itemCount: qItems.length,
      totalUnits,
    });
  }

  return results;
}

/**
 * Obtiene el detalle completo de una cotización verificando aislamiento de datos:
 * Solo el propietario (`quote.userId === requestingUserId`) o un administrador pueden leerla.
 */
export async function getQuoteDetailForUser(
  quoteId: number,
  requestingUserId: number,
  isAdmin = false,
): Promise<QuoteDetail | null> {
  const db = getDb();

  const whereClause = isAdmin
    ? eq(wholesaleQuotes.id, quoteId)
    : and(eq(wholesaleQuotes.id, quoteId), eq(wholesaleQuotes.userId, requestingUserId));

  const rows = await db
    .select()
    .from(wholesaleQuotes)
    .where(whereClause)
    .limit(1);

  if (rows.length === 0) return null;

  const q = rows[0];
  const effectiveStatus = await syncExpiredQuoteIfNeeded({
    id: q.id,
    status: q.status,
    validUntil: q.validUntil,
  });

  let reviewerName: string | null = null;
  if (q.reviewedBy) {
    const revRows = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, q.reviewedBy))
      .limit(1);
    if (revRows[0]) {
      reviewerName = `${revRows[0].firstName} ${revRows[0].lastName}`;
    }
  }

  const items = await db
    .select()
    .from(wholesaleQuoteItems)
    .where(eq(wholesaleQuoteItems.quoteId, q.id))
    .orderBy(asc(wholesaleQuoteItems.id));

  const variantIds = items.map((i) => i.variantId).filter((v): v is number => v !== null);
  const productIds = items.map((i) => i.productId).filter((p): p is number => p !== null);

  const [liveVariants, livePrices] = await Promise.all([
    variantIds.length > 0
      ? db
          .select({ id: productVariants.id, stock: productVariants.stock })
          .from(productVariants)
          .where(inArray(productVariants.id, variantIds))
      : Promise.resolve([]),
    productIds.length > 0
      ? db
          .select({
            productId: productPrices.productId,
            type: productPrices.type,
            amount: productPrices.amount,
          })
          .from(productPrices)
          .where(inArray(productPrices.productId, productIds))
      : Promise.resolve([]),
  ]);

  const stockMap = new Map(liveVariants.map((v) => [v.id, v.stock]));
  const retailMap = new Map<number, number>();
  for (const lp of livePrices) {
    if (lp.type === "retail") {
      retailMap.set(lp.productId, lp.amount);
    }
  }

  const enrichedItems: QuoteItemDetail[] = items.map((it) => ({
    id: it.id,
    quoteId: it.quoteId,
    productId: it.productId,
    variantId: it.variantId,
    productNameSnapshot: it.productNameSnapshot,
    productSlugSnapshot: it.productSlugSnapshot,
    skuSnapshot: it.skuSnapshot,
    sizeSnapshot: it.sizeSnapshot,
    colorNameSnapshot: it.colorNameSnapshot,
    colorSwatchSnapshot: it.colorSwatchSnapshot,
    imageUrlSnapshot: it.imageUrlSnapshot,
    requestedQuantity: it.requestedQuantity,
    approvedQuantity: it.approvedQuantity,
    retailUnitPriceSnapshot: it.retailUnitPriceSnapshot,
    referenceUnitPriceSnapshot: it.referenceUnitPriceSnapshot,
    quotedUnitPrice: it.quotedUnitPrice,
    lineSubtotalAmount: it.lineSubtotalAmount,
    itemNotes: it.itemNotes,
    liveStock: it.variantId ? (stockMap.get(it.variantId) ?? null) : null,
    liveRetailPrice: it.productId ? (retailMap.get(it.productId) ?? null) : null,
  }));

  return {
    id: q.id,
    quoteNumber: q.quoteNumber,
    userId: q.userId,
    businessApplicationId: q.businessApplicationId,
    companyLegalName: q.companyLegalName,
    companyTradeName: q.companyTradeName,
    companyTaxId: q.companyTaxId,
    contactName: q.contactName,
    contactEmail: q.contactEmail,
    contactPhone: q.contactPhone,
    deliveryCity: q.deliveryCity,
    commercialNeeds: q.commercialNeeds,
    customerNotes: q.customerNotes,
    status: effectiveStatus,
    currency: q.currency,
    requestedSubtotalAmount: q.requestedSubtotalAmount,
    quotedTotalAmount: q.quotedTotalAmount,
    validUntil: q.validUntil,
    paymentTermsProposal: q.paymentTermsProposal,
    adminProposalNotes: q.adminProposalNotes,
    internalNotes: isAdmin ? q.internalNotes : null,
    customerDecisionNotes: q.customerDecisionNotes,
    reviewedBy: q.reviewedBy,
    reviewerName,
    quotedAt: q.quotedAt,
    decidedAt: q.decidedAt,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    isExpiredNow:
      effectiveStatus === "expired" ||
      (q.validUntil !== null && q.validUntil.getTime() <= Date.now()),
    items: enrichedItems,
  };
}

/**
 * Consulta administrativa de todas las cotizaciones B2B con filtros de estado y búsqueda.
 */
export async function getAdminWholesaleQuotes(filters?: {
  status?: string;
  search?: string;
}) {
  await requireAdmin();
  const db = getDb();

  const conditions = [];

  if (
    filters?.status &&
    [
      "submitted",
      "under_review",
      "quoted",
      "accepted",
      "rejected",
      "expired",
      "cancelled",
    ].includes(filters.status)
  ) {
    conditions.push(eq(wholesaleQuotes.status, filters.status as QuoteStatus));
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const pattern = `%${escapeLike(filters.search.trim())}%`;
    conditions.push(
      or(
        ilike(wholesaleQuotes.quoteNumber, pattern),
        ilike(wholesaleQuotes.companyLegalName, pattern),
        ilike(wholesaleQuotes.companyTradeName, pattern),
        ilike(wholesaleQuotes.companyTaxId, pattern),
        ilike(wholesaleQuotes.contactEmail, pattern),
      ),
    );
  }

  const rows = await db
    .select()
    .from(wholesaleQuotes)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(wholesaleQuotes.createdAt));

  if (rows.length === 0) return [];

  const quoteIds = rows.map((r) => r.id);
  const allItems = await db
    .select()
    .from(wholesaleQuoteItems)
    .where(inArray(wholesaleQuoteItems.quoteId, quoteIds));

  const results = [];
  for (const r of rows) {
    const effectiveStatus = await syncExpiredQuoteIfNeeded({
      id: r.id,
      status: r.status,
      validUntil: r.validUntil,
    });
    const qItems = allItems.filter((i) => i.quoteId === r.id);
    const totalUnits = qItems.reduce(
      (acc, it) => acc + (it.approvedQuantity ?? it.requestedQuantity),
      0,
    );

    results.push({
      ...r,
      status: effectiveStatus,
      itemCount: qItems.length,
      totalUnits,
    });
  }

  return results;
}

/**
 * Historial de auditoría de una cotización específica (exclusivo para administradores).
 */
export async function getQuoteAuditLogs(quoteId: number) {
  await requireAdmin();
  const db = getDb();

  const rows = await db
    .select({
      log: auditLogs,
      actorFirstName: users.firstName,
      actorLastName: users.lastName,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(
      and(
        eq(auditLogs.targetType, "wholesale_quote"),
        eq(auditLogs.targetId, quoteId),
      ),
    )
    .orderBy(desc(auditLogs.createdAt));

  return rows;
}

