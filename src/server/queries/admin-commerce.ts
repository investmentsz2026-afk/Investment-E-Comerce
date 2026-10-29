import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
} from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  auditLogs,
  businessApplications,
  categories,
  inventoryMovements,
  inventoryReservations,
  orderItems,
  orders,
  productImages,
  productPrices,
  products,
  productVariants,
  promotions,
  taxDocuments,
  userAddresses,
  users,
  wholesaleQuoteItems,
  wholesaleQuotes,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { escapeLike } from "@/lib/catalog-params";
import { releaseExpiredInventoryReservations } from "@/server/inventory/service";

const REVENUE_ORDER_STATUSES = new Set([
  "paid",
  "preparing",
  "shipped",
  "delivered",
]);

export interface AdminDashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  channel?: "all" | "retail" | "wholesale";
  status?: string;
}

/**
 * 6.1 — Centro de Control Comercial Principal (/admin)
 * Obtiene indicadores reales desde Neon PostgreSQL sin ningún valor inventado.
 */
export async function getAdminCommercialDashboard(filters?: AdminDashboardFilters) {
  await requireAdmin();
  await releaseExpiredInventoryReservations();

  const db = getDb();
  const now = new Date();

  // Ventanas de tiempo estándar (Zona horaria Perú UTC-5)
  const peruNowStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const startOfToday = new Date(`${peruNowStr}T00:00:00.000-05:00`);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(`${peruNowStr.slice(0, 7)}-01T00:00:00.000-05:00`);

  const [
    allOrders,
    allOrderItems,
    allVariantsWithProduct,
    allUsers,
    allBizApps,
    allQuotes,
    allTaxDocs,
  ] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(orderItems),
    db
      .select({
        variant: productVariants,
        productName: products.name,
        productSlug: products.slug,
        productStatus: products.status,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .orderBy(asc(productVariants.stock), asc(products.name)),
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(businessApplications).orderBy(desc(businessApplications.createdAt)),
    db.select().from(wholesaleQuotes).orderBy(desc(wholesaleQuotes.createdAt)),
    db.select().from(taxDocuments).orderBy(desc(taxDocuments.createdAt)),
  ]);

  // Ventas globales (hoy, semana, mes) sobre órdenes efectivamente pagadas / en despacho / entregadas
  let salesTodayAmount = 0;
  let salesTodayOrders = 0;
  let salesWeekAmount = 0;
  let salesWeekOrders = 0;
  let salesMonthAmount = 0;
  let salesMonthOrders = 0;

  for (const ord of allOrders) {
    if (!REVENUE_ORDER_STATUSES.has(ord.status)) continue;
    const refDate = ord.paidAt ?? ord.createdAt;
    if (refDate >= startOfToday) {
      salesTodayAmount += ord.totalAmount;
      salesTodayOrders += 1;
    }
    if (refDate >= startOfWeek) {
      salesWeekAmount += ord.totalAmount;
      salesWeekOrders += 1;
    }
    if (refDate >= startOfMonth) {
      salesMonthAmount += ord.totalAmount;
      salesMonthOrders += 1;
    }
  }

  // Filtrado dinámico de pedidos para el bloque de análisis por fecha, canal y estado
  const filterFrom =
    filters?.dateFrom && filters.dateFrom.trim()
      ? new Date(`${filters.dateFrom.trim()}T00:00:00.000-05:00`)
      : null;
  const filterTo =
    filters?.dateTo && filters.dateTo.trim()
      ? new Date(`${filters.dateTo.trim()}T23:59:59.999-05:00`)
      : null;

  const filteredOrders = allOrders.filter((ord) => {
    if (filters?.channel && filters.channel !== "all" && ord.orderMode !== filters.channel) {
      return false;
    }
    if (filters?.status && filters.status !== "all" && ord.status !== filters.status) {
      return false;
    }
    if (filterFrom && !Number.isNaN(filterFrom.getTime()) && ord.createdAt < filterFrom) {
      return false;
    }
    if (filterTo && !Number.isNaN(filterTo.getTime()) && ord.createdAt > filterTo) {
      return false;
    }
    return true;
  });

  // Resumen comparativo B2C (minorista) vs B2B (mayorista) dentro del conjunto filtrado
  let retailRevenueAmount = 0;
  let retailConfirmedOrders = 0;
  let retailTotalOrders = 0;

  let wholesaleRevenueAmount = 0;
  let wholesaleConfirmedOrders = 0;
  let wholesaleTotalOrders = 0;

  const statusBreakdown: Record<string, number> = {
    pending_payment: 0,
    payment_processing: 0,
    paid: 0,
    preparing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    payment_failed: 0,
    refunded: 0,
  };

  for (const ord of filteredOrders) {
    statusBreakdown[ord.status] = (statusBreakdown[ord.status] ?? 0) + 1;
    const isRevenue = REVENUE_ORDER_STATUSES.has(ord.status);

    if (ord.orderMode === "wholesale") {
      wholesaleTotalOrders += 1;
      if (isRevenue) {
        wholesaleConfirmedOrders += 1;
        wholesaleRevenueAmount += ord.totalAmount;
      }
    } else {
      retailTotalOrders += 1;
      if (isRevenue) {
        retailConfirmedOrders += 1;
        retailRevenueAmount += ord.totalAmount;
      }
    }
  }

  const pendingPaymentOrdersCount =
    (statusBreakdown.pending_payment ?? 0) + (statusBreakdown.payment_processing ?? 0);
  const pendingPreparationOrdersCount =
    (statusBreakdown.paid ?? 0) + (statusBreakdown.preparing ?? 0);

  // Productos más vendidos (calculado a partir de order_items de pedidos confirmados dentro del filtro)
  const confirmedOrderIdSet = new Set(
    filteredOrders.filter((o) => REVENUE_ORDER_STATUSES.has(o.status)).map((o) => o.id),
  );

  const topProductsMap = new Map<
    string,
    {
      productId: number | null;
      productName: string;
      productSlug: string;
      unitsSold: number;
      revenueAmount: number;
      ordersCount: number;
    }
  >();

  for (const item of allOrderItems) {
    if (!confirmedOrderIdSet.has(item.orderId)) continue;
    const key = item.productId ? `id:${item.productId}` : `slug:${item.productSlugSnapshot}`;
    const current = topProductsMap.get(key) ?? {
      productId: item.productId,
      productName: item.productNameSnapshot,
      productSlug: item.productSlugSnapshot,
      unitsSold: 0,
      revenueAmount: 0,
      ordersCount: 0,
    };
    current.unitsSold += item.quantity;
    current.revenueAmount += item.lineSubtotalAmount;
    current.ordersCount += 1;
    topProductsMap.set(key, current);
  }

  const topSellingProducts = Array.from(topProductsMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenueAmount - a.revenueAmount)
    .slice(0, 6);

  // Alertas de inventario real: stock bajo (1 a 5 uds.) y agotados (0 uds.) en productos activos
  const activeVariants = allVariantsWithProduct.filter(
    (v) => v.productStatus === "active" && v.variant.isActive,
  );
  const outOfStockVariants = activeVariants.filter((v) => v.variant.stock <= 0);
  const lowStockVariants = activeVariants.filter(
    (v) => v.variant.stock > 0 && v.variant.stock <= 5,
  );

  // Indicadores de clientes, empresas mayoristas, cotizaciones y comprobantes electrónicos
  const nonAdminUsers = allUsers.filter((u) => u.role !== "admin");
  const retailCustomersCount = nonAdminUsers.filter((u) => u.role === "customer").length;
  const approvedCompaniesCount = allBizApps.filter((a) => a.status === "approved").length;
  const pendingCompaniesCount = allBizApps.filter(
    (a) => a.status === "pending" || a.status === "under_review",
  ).length;

  const pendingQuotes = allQuotes.filter(
    (q) => q.status === "submitted" || q.status === "under_review" || q.status === "quoted",
  );

  const pendingTaxDocs = allTaxDocs.filter(
    (d) =>
      d.status === "pending_config" ||
      d.status === "pending_submission" ||
      d.status === "error",
  );

  return {
    salesGlobal: {
      todayAmount: salesTodayAmount,
      todayOrders: salesTodayOrders,
      weekAmount: salesWeekAmount,
      weekOrders: salesWeekOrders,
      monthAmount: salesMonthAmount,
      monthOrders: salesMonthOrders,
    },
    filteredSummary: {
      totalOrders: filteredOrders.length,
      confirmedOrders: retailConfirmedOrders + wholesaleConfirmedOrders,
      totalRevenueAmount: retailRevenueAmount + wholesaleRevenueAmount,
      pendingPaymentOrdersCount,
      pendingPreparationOrdersCount,
      retail: {
        totalOrders: retailTotalOrders,
        confirmedOrders: retailConfirmedOrders,
        revenueAmount: retailRevenueAmount,
      },
      wholesale: {
        totalOrders: wholesaleTotalOrders,
        confirmedOrders: wholesaleConfirmedOrders,
        revenueAmount: wholesaleRevenueAmount,
      },
      statusBreakdown,
      recentOrders: filteredOrders.slice(0, 8),
    },
    inventoryAlerts: {
      outOfStockCount: outOfStockVariants.length,
      lowStockCount: lowStockVariants.length,
      outOfStockItems: outOfStockVariants.slice(0, 8),
      lowStockItems: lowStockVariants.slice(0, 8),
    },
    topSellingProducts,
    customersAndB2B: {
      totalRegisteredCustomers: nonAdminUsers.length,
      retailCustomersCount,
      approvedCompaniesCount,
      pendingCompaniesCount,
      pendingApplicationsPreview: allBizApps
        .filter((a) => a.status === "pending" || a.status === "under_review")
        .slice(0, 5),
    },
    quotesSummary: {
      pendingCount: pendingQuotes.length,
      submittedCount: allQuotes.filter((q) => q.status === "submitted" || q.status === "under_review").length,
      quotedCount: allQuotes.filter((q) => q.status === "quoted").length,
      acceptedCount: allQuotes.filter((q) => q.status === "accepted").length,
      recentPendingQuotes: pendingQuotes.slice(0, 5),
    },
    taxDocumentsSummary: {
      pendingTotalCount: pendingTaxDocs.length,
      pendingConfigCount: allTaxDocs.filter((d) => d.status === "pending_config").length,
      pendingSubmissionCount: allTaxDocs.filter((d) => d.status === "pending_submission").length,
      errorCount: allTaxDocs.filter((d) => d.status === "error").length,
      issuedCount: allTaxDocs.filter((d) => d.status === "issued").length,
      recentPendingDocs: pendingTaxDocs.slice(0, 5),
    },
  };
}

/**
 * 6.2 — Listado administrativo de productos con búsqueda, filtros, ordenamiento y paginación.
 */
export async function getAdminProductsCatalog(params?: {
  search?: string;
  categoryId?: number;
  status?: string;
  audience?: string;
  stockFilter?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  sort?: "newest" | "name_asc" | "stock_asc" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}) {
  await requireAdmin();
  const db = getDb();

  const conditions = [];
  if (params?.categoryId && Number.isInteger(params.categoryId) && params.categoryId > 0) {
    conditions.push(eq(products.categoryId, params.categoryId));
  }
  if (params?.status && ["draft", "active", "archived"].includes(params.status)) {
    conditions.push(eq(products.status, params.status as "draft" | "active" | "archived"));
  }
  if (params?.audience && ["mujer", "hombre", "unisex"].includes(params.audience)) {
    conditions.push(eq(products.audience, params.audience as "mujer" | "hombre" | "unisex"));
  }
  if (params?.search && params.search.trim().length > 0) {
    const pattern = `%${escapeLike(params.search.trim())}%`;
    conditions.push(
      or(
        ilike(products.name, pattern),
        ilike(products.slug, pattern),
        ilike(products.brand, pattern),
        ilike(products.badgeLabel, pattern),
      ),
    );
  }

  const [rawProducts, allCategories, allVariants, allPrices, allImages] = await Promise.all([
    db
      .select()
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(products.createdAt)),
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(productVariants),
    db.select().from(productPrices),
    db.select().from(productImages).orderBy(asc(productImages.sortOrder)),
  ]);

  const categoryById = new Map(allCategories.map((c) => [c.id, c]));

  const enriched = rawProducts.map((prod) => {
    const pVariants = allVariants.filter((v) => v.productId === prod.id);
    const activeVariants = pVariants.filter((v) => v.isActive);
    const totalStock = activeVariants.reduce((acc, v) => acc + v.stock, 0);
    const pPrices = allPrices.filter((pr) => pr.productId === prod.id);
    const retailPriceRow = pPrices.find((pr) => pr.type === "retail") ?? null;
    const wholesaleTiers = pPrices
      .filter((pr) => pr.type === "wholesale")
      .sort((a, b) => a.minQuantity - b.minQuantity);
    const pImages = allImages.filter((im) => im.productId === prod.id);
    const primaryImage = pImages.find((im) => im.isPrimary) ?? pImages[0] ?? null;

    return {
      ...prod,
      categoryName: categoryById.get(prod.categoryId)?.name ?? "Sin categoría",
      categorySlug: categoryById.get(prod.categoryId)?.slug ?? "",
      variantsCount: pVariants.length,
      activeVariantsCount: activeVariants.length,
      totalStock,
      skusPreview: pVariants.slice(0, 3).map((v) => v.sku),
      retailAmount: retailPriceRow?.amount ?? null,
      compareAtAmount: retailPriceRow?.compareAtAmount ?? null,
      lowestWholesaleAmount: wholesaleTiers.length > 0 ? wholesaleTiers[wholesaleTiers.length - 1].amount : null,
      wholesaleMinQty: wholesaleTiers[0]?.minQuantity ?? null,
      primaryImageUrl: primaryImage?.url ?? "/placeholder.jpg",
    };
  });

  // También permitir buscar por SKU si el usuario escribió un código SKU en search
  let filteredList = enriched;
  if (params?.search && params.search.trim().length > 0 && filteredList.length === 0) {
    const qLower = params.search.trim().toLowerCase();
    const matchedProdIds = new Set(
      allVariants
        .filter((v) => v.sku.toLowerCase().includes(qLower))
        .map((v) => v.productId),
    );
    if (matchedProdIds.size > 0) {
      const skuProds = await db
        .select()
        .from(products)
        .where(inArray(products.id, Array.from(matchedProdIds)));
      filteredList = skuProds.map((prod) => {
        const pVariants = allVariants.filter((v) => v.productId === prod.id);
        const activeVariants = pVariants.filter((v) => v.isActive);
        const totalStock = activeVariants.reduce((acc, v) => acc + v.stock, 0);
        const pPrices = allPrices.filter((pr) => pr.productId === prod.id);
        const retailPriceRow = pPrices.find((pr) => pr.type === "retail") ?? null;
        const wholesaleTiers = pPrices
          .filter((pr) => pr.type === "wholesale")
          .sort((a, b) => a.minQuantity - b.minQuantity);
        const pImages = allImages.filter((im) => im.productId === prod.id);
        const primaryImage = pImages.find((im) => im.isPrimary) ?? pImages[0] ?? null;

        return {
          ...prod,
          categoryName: categoryById.get(prod.categoryId)?.name ?? "Sin categoría",
          categorySlug: categoryById.get(prod.categoryId)?.slug ?? "",
          variantsCount: pVariants.length,
          activeVariantsCount: activeVariants.length,
          totalStock,
          skusPreview: pVariants.slice(0, 3).map((v) => v.sku),
          retailAmount: retailPriceRow?.amount ?? null,
          compareAtAmount: retailPriceRow?.compareAtAmount ?? null,
          lowestWholesaleAmount:
            wholesaleTiers.length > 0 ? wholesaleTiers[wholesaleTiers.length - 1].amount : null,
          wholesaleMinQty: wholesaleTiers[0]?.minQuantity ?? null,
          primaryImageUrl: primaryImage?.url ?? "/placeholder.jpg",
        };
      });
    }
  }

  if (params?.stockFilter && params.stockFilter !== "all") {
    filteredList = filteredList.filter((item) => {
      if (params.stockFilter === "out_of_stock") return item.totalStock <= 0;
      if (params.stockFilter === "low_stock") return item.totalStock > 0 && item.totalStock <= 10;
      if (params.stockFilter === "in_stock") return item.totalStock > 0;
      return true;
    });
  }

  // Ordenamiento
  const sortMode = params?.sort ?? "newest";
  filteredList.sort((a, b) => {
    if (sortMode === "name_asc") return a.name.localeCompare(b.name, "es");
    if (sortMode === "stock_asc") return a.totalStock - b.totalStock;
    if (sortMode === "price_asc") return (a.retailAmount ?? 0) - (b.retailAmount ?? 0);
    if (sortMode === "price_desc") return (b.retailAmount ?? 0) - (a.retailAmount ?? 0);
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const pageSize = Math.max(1, Math.min(50, params?.pageSize ?? 20));
  const totalCount = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.max(1, Math.min(totalPages, params?.page ?? 1));
  const startIdx = (currentPage - 1) * pageSize;

  return {
    items: filteredList.slice(startIdx, startIdx + pageSize),
    categories: allCategories,
    pagination: {
      totalCount,
      totalPages,
      currentPage,
      pageSize,
    },
  };
}

/**
 * 6.2 — Detalle administrativo completo de un producto para edición o creación.
 */
export async function getAdminProductDetail(productId: number) {
  await requireAdmin();
  const db = getDb();

  const [foundProducts, allCategories] = await Promise.all([
    db.select().from(products).where(eq(products.id, productId)).limit(1),
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
  ]);

  if (foundProducts.length === 0) return null;
  const product = foundProducts[0];

  const [images, variants, prices, orderRefs, quoteRefs] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.sortOrder), asc(productImages.id)),
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .orderBy(asc(productVariants.id)),
    db
      .select()
      .from(productPrices)
      .where(eq(productPrices.productId, product.id))
      .orderBy(asc(productPrices.type), asc(productPrices.minQuantity)),
    db
      .select({ id: orderItems.id, variantId: orderItems.variantId })
      .from(orderItems)
      .where(eq(orderItems.productId, product.id)),
    db
      .select({ id: wholesaleQuoteItems.id, variantId: wholesaleQuoteItems.variantId })
      .from(wholesaleQuoteItems)
      .where(eq(wholesaleQuoteItems.productId, product.id)),
  ]);

  const referencedVariantIds = new Set<number>();
  for (const r of orderRefs) {
    if (r.variantId) referencedVariantIds.add(r.variantId);
  }
  for (const q of quoteRefs) {
    if (q.variantId) referencedVariantIds.add(q.variantId);
  }

  return {
    product,
    categories: allCategories,
    images,
    variants: variants.map((v) => ({
      ...v,
      hasHistoricalReferences: referencedVariantIds.has(v.id),
    })),
    prices,
    hasHistoricalOrdersOrQuotes: orderRefs.length > 0 || quoteRefs.length > 0,
    historicalOrderItemsCount: orderRefs.length,
    historicalQuoteItemsCount: quoteRefs.length,
  };
}

/**
 * 6.3 — Listado administrativo de categorías y subcategorías con conteo de productos.
 */
export async function getAdminCategoriesCatalog() {
  await requireAdmin();
  const db = getDb();

  const [allCategories, allProducts] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select({ id: products.id, categoryId: products.categoryId, status: products.status }).from(products),
  ]);

  const catMap = new Map(allCategories.map((c) => [c.id, c]));

  return allCategories.map((cat) => {
    const linkedProducts = allProducts.filter((p) => p.categoryId === cat.id);
    const activeProducts = linkedProducts.filter((p) => p.status === "active");
    const childCategories = allCategories.filter((c) => c.parentId === cat.id);
    const parentCategory = cat.parentId ? (catMap.get(cat.parentId) ?? null) : null;

    return {
      ...cat,
      parentName: parentCategory?.name ?? null,
      totalProductsCount: linkedProducts.length,
      activeProductsCount: activeProducts.length,
      subcategoriesCount: childCategories.length,
    };
  });
}

/**
 * 6.4 — Listado administrativo de promociones y campañas B2C / B2B.
 */
export async function getAdminPromotionsCatalog() {
  await requireAdmin();
  const db = getDb();

  const [allPromotions, allCategories, allProducts] = await Promise.all([
    db.select().from(promotions).orderBy(desc(promotions.createdAt)),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name)),
    db
      .select({ id: products.id, name: products.name, slug: products.slug, isWholesale: products.isWholesale })
      .from(products)
      .orderBy(asc(products.name)),
  ]);

  const catNameById = new Map(allCategories.map((c) => [c.id, c.name]));
  const prodNameById = new Map(allProducts.map((p) => [p.id, p.name]));
  const now = new Date();

  return {
    promotions: allPromotions.map((pr) => {
      const isCurrentlyInWindow = now >= pr.startsAt && now <= pr.endsAt;
      const isExpired = now > pr.endsAt;
      const isScheduled = now < pr.startsAt;
      const liveStatus: "active_now" | "scheduled" | "expired" | "paused" = !pr.isActive
        ? "paused"
        : isExpired
          ? "expired"
          : isScheduled
            ? "scheduled"
            : isCurrentlyInWindow
              ? "active_now"
              : "paused";
      return {
        ...pr,
        categoryName: pr.categoryId ? (catNameById.get(pr.categoryId) ?? null) : null,
        productName: pr.productId ? (prodNameById.get(pr.productId) ?? null) : null,
        liveStatus,
      };
    }),
    categories: allCategories,
    products: allProducts,
  };
}

/**
 * 6.5 — Inventario Administrativo, Reservas Activas y Kardex de Movimientos.
 */
export async function getAdminInventoryCatalog(filters?: {
  search?: string;
  stockState?: "all" | "out_of_stock" | "low_stock" | "available";
  movementType?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  await requireAdmin();
  await releaseExpiredInventoryReservations();

  const db = getDb();

  const [variantsRows, activeReservations, movementsRows] = await Promise.all([
    db
      .select({
        variant: productVariants,
        productId: products.id,
        productName: products.name,
        productSlug: products.slug,
        productStatus: products.status,
        categoryName: categories.name,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(productVariants.stock), asc(products.name), asc(productVariants.sku)),
    db
      .select({
        reservation: inventoryReservations,
        orderNumber: orders.orderNumber,
      })
      .from(inventoryReservations)
      .innerJoin(orders, eq(inventoryReservations.orderId, orders.id))
      .where(eq(inventoryReservations.status, "active"))
      .orderBy(asc(inventoryReservations.expiresAt)),
    db
      .select({
        movement: inventoryMovements,
        productName: products.name,
        productId: products.id,
        size: productVariants.size,
        colorName: productVariants.colorName,
        actorFirstName: users.firstName,
        actorLastName: users.lastName,
        actorEmail: users.email,
        orderNumber: orders.orderNumber,
      })
      .from(inventoryMovements)
      .innerJoin(productVariants, eq(inventoryMovements.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(users, eq(inventoryMovements.actorId, users.id))
      .leftJoin(orders, eq(inventoryMovements.orderId, orders.id))
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(200),
  ]);

  const reservedByVariant = new Map<number, number>();
  for (const r of activeReservations) {
    const prev = reservedByVariant.get(r.reservation.variantId) ?? 0;
    reservedByVariant.set(r.reservation.variantId, prev + r.reservation.quantity);
  }

  let filteredVariants = variantsRows.map((row) => {
    const reservedUnits = reservedByVariant.get(row.variant.id) ?? 0;
    return {
      ...row,
      reservedUnits,
    };
  });

  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.trim().toLowerCase();
    filteredVariants = filteredVariants.filter(
      (r) =>
        r.variant.sku.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        (r.variant.colorName && r.variant.colorName.toLowerCase().includes(q)) ||
        (r.variant.size && r.variant.size.toLowerCase().includes(q)),
    );
  }

  if (filters?.stockState && filters.stockState !== "all") {
    filteredVariants = filteredVariants.filter((r) => {
      if (filters.stockState === "out_of_stock") return r.variant.stock <= 0;
      if (filters.stockState === "low_stock") return r.variant.stock > 0 && r.variant.stock <= 5;
      if (filters.stockState === "available") return r.variant.stock > 5;
      return true;
    });
  }

  // Filtrar el historial de movimientos (kardex) por búsqueda, tipo y rango de fechas
  const fromDate =
    filters?.dateFrom && filters.dateFrom.trim()
      ? new Date(`${filters.dateFrom.trim()}T00:00:00.000-05:00`)
      : null;
  const toDate =
    filters?.dateTo && filters.dateTo.trim()
      ? new Date(`${filters.dateTo.trim()}T23:59:59.999-05:00`)
      : null;

  const filteredMovements = movementsRows.filter((m) => {
    if (filters?.movementType && filters.movementType !== "all") {
      if (m.movement.movementType !== filters.movementType) return false;
    }
    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      const matchesSku = m.movement.skuSnapshot.toLowerCase().includes(q);
      const matchesProd = m.productName.toLowerCase().includes(q);
      const matchesNotes = (m.movement.notes ?? "").toLowerCase().includes(q);
      if (!matchesSku && !matchesProd && !matchesNotes) return false;
    }
    if (fromDate && !Number.isNaN(fromDate.getTime()) && m.movement.createdAt < fromDate) {
      return false;
    }
    if (toDate && !Number.isNaN(toDate.getTime()) && m.movement.createdAt > toDate) {
      return false;
    }
    return true;
  });

  const totalAvailableUnits = variantsRows.reduce((acc, r) => acc + r.variant.stock, 0);
  const totalReservedUnits = activeReservations.reduce(
    (acc, r) => acc + r.reservation.quantity,
    0,
  );
  const outOfStockCount = variantsRows.filter(
    (r) => r.productStatus === "active" && r.variant.isActive && r.variant.stock <= 0,
  ).length;
  const lowStockCount = variantsRows.filter(
    (r) => r.productStatus === "active" && r.variant.isActive && r.variant.stock > 0 && r.variant.stock <= 5,
  ).length;

  return {
    summary: {
      totalVariants: variantsRows.length,
      totalAvailableUnits,
      totalReservedUnits,
      outOfStockCount,
      lowStockCount,
    },
    variants: filteredVariants,
    allVariantsForSelector: variantsRows,
    activeReservations,
    movements: filteredMovements,
  };
}

/**
 * 6.6 — Administración de Clientes y Empresas Mayoristas (/admin/clientes).
 * Permite buscar por nombre, correo, teléfono o RUC y consultar historial comercial.
 */
export async function getAdminCustomersCatalog(filters?: {
  search?: string;
  role?: string;
  status?: "all" | "active" | "suspended";
}) {
  await requireAdmin();
  const db = getDb();

  const [allUsers, allBizApps, allOrders, allQuotes] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(businessApplications).orderBy(desc(businessApplications.createdAt)),
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(wholesaleQuotes).orderBy(desc(wholesaleQuotes.createdAt)),
  ]);

  const enriched = allUsers.map((u) => {
    const userApps = allBizApps.filter((a) => a.userId === u.id);
    const latestApp = userApps[0] ?? null;
    const userOrders = allOrders.filter((o) => o.userId === u.id);
    const confirmedOrders = userOrders.filter((o) => REVENUE_ORDER_STATUSES.has(o.status));
    const totalSpentAmount = confirmedOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const userQuotes = allQuotes.filter((q) => q.userId === u.id);

    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      emailVerifiedAt: u.emailVerifiedAt,
      createdAt: u.createdAt,
      company: latestApp
        ? {
            id: latestApp.id,
            legalName: latestApp.legalName,
            tradeName: latestApp.tradeName,
            taxId: latestApp.taxId,
            status: latestApp.status,
          }
        : null,
      ordersCount: userOrders.length,
      confirmedOrdersCount: confirmedOrders.length,
      totalSpentAmount,
      quotesCount: userQuotes.length,
    };
  });

  return enriched.filter((item) => {
    if (filters?.role && filters.role !== "all" && item.role !== filters.role) {
      return false;
    }
    if (filters?.status === "active" && !item.isActive) return false;
    if (filters?.status === "suspended" && item.isActive) return false;

    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      const matchesName = fullName.includes(q);
      const matchesEmail = item.email.toLowerCase().includes(q);
      const matchesPhone = (item.phone ?? "").toLowerCase().includes(q);
      const matchesRuc = (item.company?.taxId ?? "").toLowerCase().includes(q);
      const matchesCompany =
        (item.company?.legalName ?? "").toLowerCase().includes(q) ||
        (item.company?.tradeName ?? "").toLowerCase().includes(q);
      if (!matchesName && !matchesEmail && !matchesPhone && !matchesRuc && !matchesCompany) {
        return false;
      }
    }
    return true;
  });
}

/**
 * 6.6 — Ficha integral 360° de un cliente o empresa mayorista (/admin/clientes/[id]).
 */
export async function getAdminCustomerDetail(userId: number) {
  await requireAdmin();
  const db = getDb();

  const foundUsers = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (foundUsers.length === 0) return null;
  const customer = foundUsers[0];

  const [addresses, applications, customerOrders, customerQuotes, logs] = await Promise.all([
    db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, customer.id))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt)),
    db
      .select()
      .from(businessApplications)
      .where(eq(businessApplications.userId, customer.id))
      .orderBy(desc(businessApplications.createdAt)),
    db
      .select()
      .from(orders)
      .where(eq(orders.userId, customer.id))
      .orderBy(desc(orders.createdAt)),
    db
      .select()
      .from(wholesaleQuotes)
      .where(eq(wholesaleQuotes.userId, customer.id))
      .orderBy(desc(wholesaleQuotes.createdAt)),
    db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.targetType, "user"), eq(auditLogs.targetId, customer.id)))
      .orderBy(desc(auditLogs.createdAt))
      .limit(30),
  ]);

  const confirmedOrders = customerOrders.filter((o) => REVENUE_ORDER_STATUSES.has(o.status));
  const totalSpentAmount = confirmedOrders.reduce((acc, o) => acc + o.totalAmount, 0);

  return {
    customer: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      role: customer.role,
      isActive: customer.isActive,
      emailVerifiedAt: customer.emailVerifiedAt,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    },
    addresses,
    applications,
    orders: customerOrders,
    quotes: customerQuotes,
    auditLogs: logs,
    metrics: {
      totalOrders: customerOrders.length,
      confirmedOrders: confirmedOrders.length,
      totalSpentAmount,
      totalQuotes: customerQuotes.length,
    },
  };
}
