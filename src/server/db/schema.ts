/**
 * Esquema de base de datos — Fase 2: Catálogo de productos.
 *
 * Convenciones:
 * - Precios almacenados en CÉNTIMOS de PEN (integer) para evitar errores de punto flotante.
 * - slug: identificador amigable para URLs (único, indexado).
 * - Timestamps con zona horaria (timestamptz), default al momento de inserción.
 * - Relaciones definidas con `relations()` para habilitar consultas anidadas.
 */
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ──────────────────────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────────────────────

export const audienceEnum = pgEnum("audience", ["mujer", "hombre", "unisex"]);
export const priceTypeEnum = pgEnum("price_type", ["retail", "wholesale"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"]);

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "business_pending",
  "business_approved",
  "admin",
]);

export const businessApplicationStatusEnum = pgEnum("business_application_status", [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "suspended",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "application_created",
  "status_change",
  "role_change",
  "profile_update",
  "password_change",
  "address_created",
  "address_deleted",
  "quote_created",
  "quote_updated",
  "quote_status_change",
  "order_created",
  "order_status_change",
  "order_payment_change",
  "order_cancelled",
  "order_refunded",
  "inventory_movement",
  "shipping_rate_updated",
  "tax_document_event",
  "product_created",
  "product_updated",
  "category_updated",
  "promotion_updated",
  "customer_status_change",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "payment_processing",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "payment_failed",
  "refunded",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "approved",
  "rejected",
  "cancelled",
  "refunded",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "culqi",
  "mercadopago",
  "bank_transfer",
  "sandbox",
]);

export const taxDocumentTypeEnum = pgEnum("tax_document_type", [
  "boleta",
  "factura",
]);

export const taxDocumentStatusEnum = pgEnum("tax_document_status", [
  "pending_config",
  "pending_submission",
  "issued",
  "error",
  "voided",
]);

export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", [
  "reservation_hold",
  "reservation_release",
  "sale_confirm",
  "refund_restock",
  "manual_adjustment",
]);

export const inventoryReservationStatusEnum = pgEnum("inventory_reservation_status", [
  "active",
  "confirmed",
  "released",
  "expired",
]);

export const cartStatusEnum = pgEnum("cart_status", [
  "active",
  "merged",
  "converted",
  "abandoned",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "submitted",
  "under_review",
  "quoted",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
]);

// ──────────────────────────────────────────────────────────────
// Categories
// ──────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    parentId: integer("parent_id"),
    audience: audienceEnum("audience"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("categories_slug_idx").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
    index("categories_active_idx").on(t.isActive),
  ],
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, { relationName: "categoryParent" }),
  products: many(products),
}));

// ──────────────────────────────────────────────────────────────
// Products
// ──────────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    brand: varchar("brand", { length: 120 }).default("INVESTMENTS").notNull(),
    shortDescription: text("short_description"),
    fullDescription: text("full_description"),
    audience: audienceEnum("audience").notNull(),
    categoryId: integer("category_id")
      .references(() => categories.id)
      .notNull(),
    status: productStatusEnum("status").default("active").notNull(),
    /** Si está marcado como nuevo. */
    isNew: boolean("is_new").default(false).notNull(),
    /** Si está marcado como producto destacado en el catálogo comercial. */
    isFeatured: boolean("is_featured").default(false).notNull(),
    /** Si se vende al por mayor. */
    isWholesale: boolean("is_wholesale").default(false).notNull(),
    /** Etiqueta especial (edición limitada, esencial, etc.). */
    badgeLabel: varchar("badge_label", { length: 60 }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isDemo: boolean("is_demo").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_category_idx").on(t.categoryId),
    index("products_audience_idx").on(t.audience),
    index("products_status_idx").on(t.status),
    index("products_new_idx").on(t.isNew),
    index("products_featured_idx").on(t.isFeatured),
    index("products_wholesale_idx").on(t.isWholesale),
    index("products_created_idx").on(t.createdAt),
  ],
);

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
  prices: many(productPrices),
}));

// ──────────────────────────────────────────────────────────────
// Product Images
// ──────────────────────────────────────────────────────────────

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    url: text("url").notNull(),
    alt: varchar("alt", { length: 300 }).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
  },
  (t) => [
    index("product_images_product_idx").on(t.productId),
  ],
);

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

// ──────────────────────────────────────────────────────────────
// Product Variants (talla × color)
// ──────────────────────────────────────────────────────────────

export const productVariants = pgTable(
  "product_variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    sku: varchar("sku", { length: 60 }).notNull(),
    size: varchar("size", { length: 20 }),
    colorName: varchar("color_name", { length: 60 }),
    /** Valor CSS para la muestra de color (ej: #141312). */
    colorSwatch: varchar("color_swatch", { length: 20 }),
    stock: integer("stock").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (t) => [
    uniqueIndex("product_variants_sku_idx").on(t.sku),
    index("product_variants_product_idx").on(t.productId),
    index("product_variants_color_idx").on(t.colorName),
    index("product_variants_size_idx").on(t.size),
  ],
);

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

// ──────────────────────────────────────────────────────────────
// Product Prices
// ──────────────────────────────────────────────────────────────
// Permite precios minoristas y escalonados mayoristas por producto.
// amount almacena céntimos de PEN (integer) para precisión monetaria.

export const productPrices = pgTable(
  "product_prices",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    type: priceTypeEnum("type").notNull(),
    /** Precio en céntimos de PEN. */
    amount: integer("amount").notNull(),
    /** Precio anterior en céntimos de PEN (para descuentos). */
    compareAtAmount: integer("compare_at_amount"),
    /** Cantidad mínima para aplicar este precio (solo wholesale). */
    minQuantity: integer("min_quantity").default(1).notNull(),
    /** Cantidad máxima opcional (null = sin límite). */
    maxQuantity: integer("max_quantity"),
  },
  (t) => [
    index("product_prices_product_idx").on(t.productId),
    index("product_prices_type_idx").on(t.type),
  ],
);

export const productPricesRelations = relations(productPrices, ({ one }) => ({
  product: one(products, {
    fields: [productPrices.productId],
    references: [products.id],
  }),
}));

// ──────────────────────────────────────────────────────────────
// Phase 3: Users, Authentication & Wholesale B2B Accounts
// ──────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 120 }).notNull(),
    lastName: varchar("last_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    role: userRoleEnum("role").default("customer").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    index("users_role_idx").on(t.role),
    index("users_active_idx").on(t.isActive),
    index("users_created_idx").on(t.createdAt),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  addresses: many(userAddresses),
  businessApplications: many(businessApplications, { relationName: "userApplications" }),
  reviewedApplications: many(businessApplications, { relationName: "reviewedApplications" }),
  auditLogs: many(auditLogs),
  carts: many(carts),
  wholesaleQuotes: many(wholesaleQuotes, { relationName: "userQuotes" }),
  reviewedQuotes: many(wholesaleQuotes, { relationName: "reviewedQuotes" }),
  orders: many(orders),
}));

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_idx").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
    index("sessions_expires_idx").on(t.expiresAt),
  ],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("email_verif_token_hash_idx").on(t.tokenHash),
    index("email_verif_user_idx").on(t.userId),
  ],
);

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("pwd_reset_token_hash_idx").on(t.tokenHash),
    index("pwd_reset_user_idx").on(t.userId),
  ],
);

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const userAddresses = pgTable(
  "user_addresses",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 60 }).default("Principal").notNull(),
    recipientName: varchar("recipient_name", { length: 150 }).notNull(),
    recipientPhone: varchar("recipient_phone", { length: 30 }).notNull(),
    addressLine1: varchar("address_line1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line2", { length: 255 }),
    reference: varchar("reference", { length: 255 }),
    department: varchar("department", { length: 80 }).notNull(),
    province: varchar("province", { length: 80 }).notNull(),
    district: varchar("district", { length: 80 }).notNull(),
    postalCode: varchar("postal_code", { length: 20 }),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("user_addresses_user_idx").on(t.userId),
  ],
);

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.id],
  }),
}));

export const businessApplications = pgTable(
  "business_applications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    legalName: varchar("legal_name", { length: 200 }).notNull(),
    tradeName: varchar("trade_name", { length: 200 }).notNull(),
    taxId: varchar("tax_id", { length: 20 }).notNull(),
    contactName: varchar("contact_name", { length: 150 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 30 }).notNull(),
    businessType: varchar("business_type", { length: 80 }).notNull(),
    addressLine: varchar("address_line", { length: 255 }).notNull(),
    department: varchar("department", { length: 80 }).notNull(),
    province: varchar("province", { length: 80 }).notNull(),
    district: varchar("district", { length: 80 }).notNull(),
    estimatedVolume: varchar("estimated_volume", { length: 100 }).notNull(),
    additionalNotes: text("additional_notes"),
    status: businessApplicationStatusEnum("status").default("pending").notNull(),
    reviewedBy: integer("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    internalNotes: text("internal_notes"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("biz_app_user_idx").on(t.userId),
    index("biz_app_status_idx").on(t.status),
    index("biz_app_tax_id_idx").on(t.taxId),
    index("biz_app_created_idx").on(t.createdAt),
  ],
);

export const businessApplicationsRelations = relations(businessApplications, ({ one }) => ({
  user: one(users, {
    fields: [businessApplications.userId],
    references: [users.id],
    relationName: "userApplications",
  }),
  reviewer: one(users, {
    fields: [businessApplications.reviewedBy],
    references: [users.id],
    relationName: "reviewedApplications",
  }),
}));

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    actorId: integer("actor_id").references(() => users.id),
    action: auditActionEnum("action").notNull(),
    targetType: varchar("target_type", { length: 60 }).notNull(),
    targetId: integer("target_id").notNull(),
    details: text("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_actor_idx").on(t.actorId),
    index("audit_target_idx").on(t.targetType, t.targetId),
    index("audit_created_idx").on(t.createdAt),
  ],
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

// ──────────────────────────────────────────────────────────────
// Phase 4: Smart Cart, Volume Pricing & B2B Quotations
// ──────────────────────────────────────────────────────────────

export const carts = pgTable(
  "carts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    /** Hash SHA-256 del token temporal de visitante (solo cuando userId es null). */
    guestTokenHash: varchar("guest_token_hash", { length: 64 }),
    status: cartStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("carts_user_idx").on(t.userId),
    uniqueIndex("carts_guest_token_hash_idx").on(t.guestTokenHash),
    index("carts_status_idx").on(t.status),
  ],
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItems = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),
    cartId: integer("cart_id")
      .references(() => carts.id, { onDelete: "cascade" })
      .notNull(),
    variantId: integer("variant_id")
      .references(() => productVariants.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").notNull(),
    /**
     * Referencia histórica del precio unitario en céntimos de PEN al momento de agregar al carrito.
     * Solo para fines informativos; el motor de precios recalcula siempre con los precios vigentes del servidor.
     */
    addedUnitPriceSnapshot: integer("added_unit_price_snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("cart_items_cart_variant_idx").on(t.cartId, t.variantId),
    index("cart_items_cart_idx").on(t.cartId),
    index("cart_items_variant_idx").on(t.variantId),
  ],
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const wholesaleQuotes = pgTable(
  "wholesale_quotes",
  {
    id: serial("id").primaryKey(),
    quoteNumber: varchar("quote_number", { length: 40 }).notNull(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    businessApplicationId: integer("business_application_id").references(
      () => businessApplications.id,
      { onDelete: "set null" },
    ),
    companyLegalName: varchar("company_legal_name", { length: 200 }).notNull(),
    companyTradeName: varchar("company_trade_name", { length: 200 }).notNull(),
    companyTaxId: varchar("company_tax_id", { length: 20 }).notNull(),
    contactName: varchar("contact_name", { length: 150 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 30 }).notNull(),
    deliveryCity: varchar("delivery_city", { length: 120 }),
    commercialNeeds: text("commercial_needs").notNull(),
    customerNotes: text("customer_notes"),
    status: quoteStatusEnum("status").default("submitted").notNull(),
    currency: varchar("currency", { length: 3 }).default("PEN").notNull(),
    requestedSubtotalAmount: integer("requested_subtotal_amount").notNull(),
    quotedTotalAmount: integer("quoted_total_amount"),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    paymentTermsProposal: varchar("payment_terms_proposal", { length: 200 }),
    adminProposalNotes: text("admin_proposal_notes"),
    internalNotes: text("internal_notes"),
    customerDecisionNotes: text("customer_decision_notes"),
    reviewedBy: integer("reviewed_by").references(() => users.id),
    quotedAt: timestamp("quoted_at", { withTimezone: true }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("wholesale_quotes_number_idx").on(t.quoteNumber),
    index("wholesale_quotes_user_idx").on(t.userId),
    index("wholesale_quotes_status_idx").on(t.status),
    index("wholesale_quotes_tax_id_idx").on(t.companyTaxId),
    index("wholesale_quotes_created_idx").on(t.createdAt),
  ],
);

export const wholesaleQuotesRelations = relations(wholesaleQuotes, ({ one, many }) => ({
  user: one(users, {
    fields: [wholesaleQuotes.userId],
    references: [users.id],
    relationName: "userQuotes",
  }),
  businessApplication: one(businessApplications, {
    fields: [wholesaleQuotes.businessApplicationId],
    references: [businessApplications.id],
  }),
  reviewer: one(users, {
    fields: [wholesaleQuotes.reviewedBy],
    references: [users.id],
    relationName: "reviewedQuotes",
  }),
  items: many(wholesaleQuoteItems),
}));

export const wholesaleQuoteItems = pgTable(
  "wholesale_quote_items",
  {
    id: serial("id").primaryKey(),
    quoteId: integer("quote_id")
      .references(() => wholesaleQuotes.id, { onDelete: "cascade" })
      .notNull(),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productNameSnapshot: varchar("product_name_snapshot", { length: 200 }).notNull(),
    productSlugSnapshot: varchar("product_slug_snapshot", { length: 200 }).notNull(),
    skuSnapshot: varchar("sku_snapshot", { length: 60 }).notNull(),
    sizeSnapshot: varchar("size_snapshot", { length: 20 }),
    colorNameSnapshot: varchar("color_name_snapshot", { length: 60 }),
    colorSwatchSnapshot: varchar("color_swatch_snapshot", { length: 20 }),
    imageUrlSnapshot: text("image_url_snapshot"),
    requestedQuantity: integer("requested_quantity").notNull(),
    approvedQuantity: integer("approved_quantity"),
    retailUnitPriceSnapshot: integer("retail_unit_price_snapshot").notNull(),
    referenceUnitPriceSnapshot: integer("reference_unit_price_snapshot").notNull(),
    quotedUnitPrice: integer("quoted_unit_price"),
    lineSubtotalAmount: integer("line_subtotal_amount").notNull(),
    itemNotes: text("item_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("wholesale_quote_items_quote_idx").on(t.quoteId),
    index("wholesale_quote_items_variant_idx").on(t.variantId),
  ],
);

export const wholesaleQuoteItemsRelations = relations(wholesaleQuoteItems, ({ one }) => ({
  quote: one(wholesaleQuotes, {
    fields: [wholesaleQuoteItems.quoteId],
    references: [wholesaleQuotes.id],
  }),
  product: one(products, {
    fields: [wholesaleQuoteItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [wholesaleQuoteItems.variantId],
    references: [productVariants.id],
  }),
}));

// ──────────────────────────────────────────────────────────────
// Phase 5: Checkout, Orders, Payments, Shipping, Inventory & SUNAT
// ──────────────────────────────────────────────────────────────

export const shippingZones = pgTable(
  "shipping_zones",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 60 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    /** Departamento peruano (ej: "Lima", "Arequipa", "*" para tarifa nacional estándar). */
    department: varchar("department", { length: 80 }).notNull(),
    /** Provincia opcional (null o "*" aplica a todo el departamento). */
    province: varchar("province", { length: 80 }),
    /** Distrito opcional (null o "*" aplica a toda la provincia). */
    district: varchar("district", { length: 80 }),
    /** Costo de envío en céntimos de PEN. */
    rateAmount: integer("rate_amount").notNull(),
    /** Monto mínimo de subtotal en céntimos de PEN para envío gratuito (null = sin envío gratis). */
    freeShippingMinSubtotal: integer("free_shipping_min_subtotal"),
    /** Tiempo estimado de despacho informativo (ej: "24 a 48 horas hábiles"). */
    estimatedDaysLabel: varchar("estimated_days_label", { length: 120 }).notNull(),
    /** Si es false, la zona está explícitamente bloqueada / sin cobertura de despacho. */
    isAvailable: boolean("is_available").default(true).notNull(),
    unavailableReason: varchar("unavailable_reason", { length: 255 }),
    sortOrder: integer("sort_order").default(0).notNull(),
    updatedBy: integer("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("shipping_zones_code_idx").on(t.code),
    index("shipping_zones_dept_idx").on(t.department),
    index("shipping_zones_avail_idx").on(t.isAvailable),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: varchar("order_number", { length: 40 }).notNull(),
    /** Clave de idempotencia generada en el formulario de checkout para evitar pedidos duplicados por doble clic o reintentos. */
    idempotencyKey: varchar("idempotency_key", { length: 80 }).notNull(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    /** Si el pedido proviene de la conversión de una cotización B2B aceptada, referencia única que impide doble conversión. */
    quoteId: integer("quote_id").references(() => wholesaleQuotes.id, { onDelete: "restrict" }),
    /** Modalidad comercial aplicada ("retail" o "wholesale"). */
    orderMode: priceTypeEnum("order_mode").default("retail").notNull(),
    status: orderStatusEnum("status").default("pending_payment").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
    paymentProvider: paymentProviderEnum("payment_provider").notNull(),
    paymentMethodLabel: varchar("payment_method_label", { length: 100 }).notNull(),
    paymentProviderReference: varchar("payment_provider_reference", { length: 160 }),
    currency: varchar("currency", { length: 3 }).default("PEN").notNull(),

    // Snapshots de contacto del comprador
    customerEmailSnapshot: varchar("customer_email_snapshot", { length: 255 }).notNull(),
    customerFirstNameSnapshot: varchar("customer_first_name_snapshot", { length: 120 }).notNull(),
    customerLastNameSnapshot: varchar("customer_last_name_snapshot", { length: 120 }).notNull(),
    customerPhoneSnapshot: varchar("customer_phone_snapshot", { length: 30 }).notNull(),

    // Snapshots de dirección de entrega peruana
    shippingRecipientName: varchar("shipping_recipient_name", { length: 150 }).notNull(),
    shippingRecipientPhone: varchar("shipping_recipient_phone", { length: 30 }).notNull(),
    shippingDepartment: varchar("shipping_department", { length: 80 }).notNull(),
    shippingProvince: varchar("shipping_province", { length: 80 }).notNull(),
    shippingDistrict: varchar("shipping_district", { length: 80 }).notNull(),
    shippingAddressLine1: varchar("shipping_address_line1", { length: 255 }).notNull(),
    shippingAddressLine2: varchar("shipping_address_line2", { length: 255 }),
    shippingReference: varchar("shipping_reference", { length: 255 }),
    shippingZoneCodeSnapshot: varchar("shipping_zone_code_snapshot", { length: 60 }).notNull(),
    shippingZoneNameSnapshot: varchar("shipping_zone_name_snapshot", { length: 150 }).notNull(),
    shippingEstimatedLabel: varchar("shipping_estimated_label", { length: 120 }).notNull(),

    // Snapshots de datos tributarios (Boleta / Factura Perú)
    taxDocumentType: taxDocumentTypeEnum("tax_document_type").default("boleta").notNull(),
    billingDocType: varchar("billing_doc_type", { length: 16 }).default("DNI").notNull(),
    billingDocNumber: varchar("billing_doc_number", { length: 20 }).notNull(),
    billingCustomerName: varchar("billing_customer_name", { length: 200 }).notNull(),
    billingFiscalAddress: varchar("billing_fiscal_address", { length: 255 }),

    // Importes históricos en céntimos de PEN (inmutables tras creación)
    retailSubtotalAmount: integer("retail_subtotal_amount").notNull(),
    discountAmount: integer("discount_amount").default(0).notNull(),
    subtotalAfterDiscountAmount: integer("subtotal_after_discount_amount").notNull(),
    shippingAmount: integer("shipping_amount").notNull(),
    /** Base imponible sin IGV (céntimos PEN). En Perú los precios de catálogo incluyen 18% de IGV. */
    taxableBaseAmount: integer("taxable_base_amount").notNull(),
    /** Impuesto General a las Ventas (IGV 18% desglosado en céntimos PEN). */
    igvAmount: integer("igv_amount").notNull(),
    totalAmount: integer("total_amount").notNull(),

    // Seguimiento logístico real (sin datos inventados)
    carrierName: varchar("carrier_name", { length: 120 }),
    trackingNumber: varchar("tracking_number", { length: 120 }),
    trackingUrl: text("tracking_url"),
    customerNotes: text("customer_notes"),
    adminNotes: text("admin_notes"),
    cancellationReason: text("cancellation_reason"),

    reservationExpiresAt: timestamp("reservation_expires_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.orderNumber),
    uniqueIndex("orders_idempotency_key_idx").on(t.idempotencyKey),
    uniqueIndex("orders_quote_unique_idx").on(t.quoteId),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_payment_status_idx").on(t.paymentStatus),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  quote: one(wholesaleQuotes, {
    fields: [orders.quoteId],
    references: [wholesaleQuotes.id],
  }),
  items: many(orderItems),
  payments: many(paymentTransactions),
  reservations: many(inventoryReservations),
  movements: many(inventoryMovements),
  taxDocuments: many(taxDocuments),
}));

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productNameSnapshot: varchar("product_name_snapshot", { length: 200 }).notNull(),
    productSlugSnapshot: varchar("product_slug_snapshot", { length: 200 }).notNull(),
    skuSnapshot: varchar("sku_snapshot", { length: 60 }).notNull(),
    sizeSnapshot: varchar("size_snapshot", { length: 20 }),
    colorNameSnapshot: varchar("color_name_snapshot", { length: 60 }),
    colorSwatchSnapshot: varchar("color_swatch_snapshot", { length: 20 }),
    imageUrlSnapshot: text("image_url_snapshot"),
    quantity: integer("quantity").notNull(),
    retailUnitPriceSnapshot: integer("retail_unit_price_snapshot").notNull(),
    unitPriceSnapshot: integer("unit_price_snapshot").notNull(),
    lineDiscountAmount: integer("line_discount_amount").default(0).notNull(),
    lineSubtotalAmount: integer("line_subtotal_amount").notNull(),
    appliedPriceLabel: varchar("applied_price_label", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_variant_idx").on(t.variantId),
  ],
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const inventoryReservations = pgTable(
  "inventory_reservations",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    variantId: integer("variant_id")
      .references(() => productVariants.id, { onDelete: "restrict" })
      .notNull(),
    skuSnapshot: varchar("sku_snapshot", { length: 60 }).notNull(),
    quantity: integer("quantity").notNull(),
    status: inventoryReservationStatusEnum("status").default("active").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    releaseReason: varchar("release_reason", { length: 160 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("inv_reservations_order_variant_idx").on(t.orderId, t.variantId),
    index("inv_reservations_variant_status_idx").on(t.variantId, t.status),
    index("inv_reservations_expires_idx").on(t.expiresAt),
  ],
);

export const inventoryReservationsRelations = relations(inventoryReservations, ({ one }) => ({
  order: one(orders, {
    fields: [inventoryReservations.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [inventoryReservations.variantId],
    references: [productVariants.id],
  }),
}));

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: serial("id").primaryKey(),
    variantId: integer("variant_id")
      .references(() => productVariants.id, { onDelete: "restrict" })
      .notNull(),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
    actorId: integer("actor_id").references(() => users.id, { onDelete: "set null" }),
    skuSnapshot: varchar("sku_snapshot", { length: 60 }).notNull(),
    movementType: inventoryMovementTypeEnum("movement_type").notNull(),
    /** Cambio en stock disponible (negativo al reservar, positivo al liberar o reponer). */
    quantityDelta: integer("quantity_delta").notNull(),
    stockBefore: integer("stock_before").notNull(),
    stockAfter: integer("stock_after").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 120 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("inv_movements_idempotency_idx").on(t.idempotencyKey),
    index("inv_movements_variant_idx").on(t.variantId),
    index("inv_movements_order_idx").on(t.orderId),
    index("inv_movements_created_idx").on(t.createdAt),
  ],
);

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryMovements.variantId],
    references: [productVariants.id],
  }),
  order: one(orders, {
    fields: [inventoryMovements.orderId],
    references: [orders.id],
  }),
  actor: one(users, {
    fields: [inventoryMovements.actorId],
    references: [users.id],
  }),
}));

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    provider: paymentProviderEnum("provider").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).default("PEN").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 120 }).notNull(),
    providerTransactionId: varchar("provider_transaction_id", { length: 160 }),
    providerStatusDetail: varchar("provider_status_detail", { length: 160 }),
    paymentMethodBrand: varchar("payment_method_brand", { length: 60 }),
    maskedCardLast4: varchar("masked_card_last4", { length: 8 }),
    errorMessage: text("error_message"),
    isSandbox: boolean("is_sandbox").default(true).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("payment_tx_idempotency_idx").on(t.idempotencyKey),
    index("payment_tx_order_idx").on(t.orderId),
    index("payment_tx_provider_id_idx").on(t.providerTransactionId),
  ],
);

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  order: one(orders, {
    fields: [paymentTransactions.orderId],
    references: [orders.id],
  }),
}));

export const paymentWebhookEvents = pgTable(
  "payment_webhook_events",
  {
    id: serial("id").primaryKey(),
    provider: paymentProviderEnum("provider").notNull(),
    eventId: varchar("event_id", { length: 160 }).notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
    signatureValid: boolean("signature_valid").default(false).notNull(),
    processed: boolean("processed").default(false).notNull(),
    payloadSummary: text("payload_summary"),
    processingNotes: text("processing_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("payment_webhook_provider_event_idx").on(t.provider, t.eventId),
    index("payment_webhook_order_idx").on(t.orderId),
  ],
);

export const taxDocuments = pgTable(
  "tax_documents",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    documentType: taxDocumentTypeEnum("document_type").notNull(),
    status: taxDocumentStatusEnum("status").default("pending_config").notNull(),
    customerDocType: varchar("customer_doc_type", { length: 16 }).notNull(),
    customerDocNumber: varchar("customer_doc_number", { length: 20 }).notNull(),
    customerLegalName: varchar("customer_legal_name", { length: 200 }).notNull(),
    customerFiscalAddress: varchar("customer_fiscal_address", { length: 255 }),
    currency: varchar("currency", { length: 3 }).default("PEN").notNull(),
    taxableAmount: integer("taxable_amount").notNull(),
    igvAmount: integer("igv_amount").notNull(),
    totalAmount: integer("total_amount").notNull(),
    /** Serie y correlativo reales devueltos por el PSE/OSE autorizado cuando esté activo (null si está pendiente de configuración). */
    series: varchar("series", { length: 12 }),
    correlativeNumber: varchar("correlative_number", { length: 24 }),
    providerName: varchar("provider_name", { length: 80 }),
    providerExternalId: varchar("provider_external_id", { length: 160 }),
    sunatHash: varchar("sunat_hash", { length: 160 }),
    xmlUrl: text("xml_url"),
    pdfUrl: text("pdf_url"),
    cdrUrl: text("cdr_url"),
    providerResponseSummary: text("provider_response_summary"),
    errorMessage: text("error_message"),
    attemptCount: integer("attempt_count").default(0).notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("tax_documents_order_unique_idx").on(t.orderId),
    index("tax_documents_status_idx").on(t.status),
  ],
);

export const taxDocumentsRelations = relations(taxDocuments, ({ one }) => ({
  order: one(orders, {
    fields: [taxDocuments.orderId],
    references: [orders.id],
  }),
}));

// ──────────────────────────────────────────────────────────────
// Phase 6: Commercial Promotions & Campaign Rules
// ──────────────────────────────────────────────────────────────

export const promotions = pgTable(
  "promotions",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 60 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    /** Porcentaje entero de descuento sobre precio minorista (1 a 90). */
    discountPercent: integer("discount_percent").notNull(),
    /** Si se define, la promoción aplica solo a los productos de esta categoría. */
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    /** Si se define, la promoción aplica solo a este producto específico. */
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Canal objetivo: "retail" (solo B2C) o "wholesale" (permite aplicar también en B2B si mejora el tramo mayorista). */
    channelTarget: priceTypeEnum("channel_target").default("retail").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("promotions_code_idx").on(t.code),
    index("promotions_active_dates_idx").on(t.isActive, t.startsAt, t.endsAt),
    index("promotions_category_idx").on(t.categoryId),
    index("promotions_product_idx").on(t.productId),
  ],
);

export const promotionsRelations = relations(promotions, ({ one }) => ({
  category: one(categories, {
    fields: [promotions.categoryId],
    references: [categories.id],
  }),
  product: one(products, {
    fields: [promotions.productId],
    references: [products.id],
  }),
  creator: one(users, {
    fields: [promotions.createdBy],
    references: [users.id],
  }),
}));




