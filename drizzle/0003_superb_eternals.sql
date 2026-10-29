CREATE TYPE "public"."inventory_movement_type" AS ENUM('reservation_hold', 'reservation_release', 'sale_confirm', 'refund_restock', 'manual_adjustment');--> statement-breakpoint
CREATE TYPE "public"."inventory_reservation_status" AS ENUM('active', 'confirmed', 'released', 'expired');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'payment_processing', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'payment_failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('culqi', 'mercadopago', 'bank_transfer', 'sandbox');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'approved', 'rejected', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."tax_document_status" AS ENUM('pending_config', 'pending_submission', 'issued', 'error', 'voided');--> statement-breakpoint
CREATE TYPE "public"."tax_document_type" AS ENUM('boleta', 'factura');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'order_created';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'order_status_change';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'order_payment_change';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'order_cancelled';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'order_refunded';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'inventory_movement';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'shipping_rate_updated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'tax_document_event';--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"variant_id" integer NOT NULL,
	"order_id" integer,
	"actor_id" integer,
	"sku_snapshot" varchar(60) NOT NULL,
	"movement_type" "inventory_movement_type" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"stock_before" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"idempotency_key" varchar(120) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"sku_snapshot" varchar(60) NOT NULL,
	"quantity" integer NOT NULL,
	"status" "inventory_reservation_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"release_reason" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"product_name_snapshot" varchar(200) NOT NULL,
	"product_slug_snapshot" varchar(200) NOT NULL,
	"sku_snapshot" varchar(60) NOT NULL,
	"size_snapshot" varchar(20),
	"color_name_snapshot" varchar(60),
	"color_swatch_snapshot" varchar(20),
	"image_url_snapshot" text,
	"quantity" integer NOT NULL,
	"retail_unit_price_snapshot" integer NOT NULL,
	"unit_price_snapshot" integer NOT NULL,
	"line_discount_amount" integer DEFAULT 0 NOT NULL,
	"line_subtotal_amount" integer NOT NULL,
	"applied_price_label" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(40) NOT NULL,
	"idempotency_key" varchar(80) NOT NULL,
	"user_id" integer NOT NULL,
	"quote_id" integer,
	"order_mode" "price_type" DEFAULT 'retail' NOT NULL,
	"status" "order_status" DEFAULT 'pending_payment' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_provider" "payment_provider" NOT NULL,
	"payment_method_label" varchar(100) NOT NULL,
	"payment_provider_reference" varchar(160),
	"currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"customer_email_snapshot" varchar(255) NOT NULL,
	"customer_first_name_snapshot" varchar(120) NOT NULL,
	"customer_last_name_snapshot" varchar(120) NOT NULL,
	"customer_phone_snapshot" varchar(30) NOT NULL,
	"shipping_recipient_name" varchar(150) NOT NULL,
	"shipping_recipient_phone" varchar(30) NOT NULL,
	"shipping_department" varchar(80) NOT NULL,
	"shipping_province" varchar(80) NOT NULL,
	"shipping_district" varchar(80) NOT NULL,
	"shipping_address_line1" varchar(255) NOT NULL,
	"shipping_address_line2" varchar(255),
	"shipping_reference" varchar(255),
	"shipping_zone_code_snapshot" varchar(60) NOT NULL,
	"shipping_zone_name_snapshot" varchar(150) NOT NULL,
	"shipping_estimated_label" varchar(120) NOT NULL,
	"tax_document_type" "tax_document_type" DEFAULT 'boleta' NOT NULL,
	"billing_doc_type" varchar(16) DEFAULT 'DNI' NOT NULL,
	"billing_doc_number" varchar(20) NOT NULL,
	"billing_customer_name" varchar(200) NOT NULL,
	"billing_fiscal_address" varchar(255),
	"retail_subtotal_amount" integer NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"subtotal_after_discount_amount" integer NOT NULL,
	"shipping_amount" integer NOT NULL,
	"taxable_base_amount" integer NOT NULL,
	"igv_amount" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"carrier_name" varchar(120),
	"tracking_number" varchar(120),
	"tracking_url" text,
	"customer_notes" text,
	"admin_notes" text,
	"cancellation_reason" text,
	"reservation_expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"idempotency_key" varchar(120) NOT NULL,
	"provider_transaction_id" varchar(160),
	"provider_status_detail" varchar(160),
	"payment_method_brand" varchar(60),
	"masked_card_last4" varchar(8),
	"error_message" text,
	"is_sandbox" boolean DEFAULT true NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"event_id" varchar(160) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"order_id" integer,
	"signature_valid" boolean DEFAULT false NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"payload_summary" text,
	"processing_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(150) NOT NULL,
	"department" varchar(80) NOT NULL,
	"province" varchar(80),
	"district" varchar(80),
	"rate_amount" integer NOT NULL,
	"free_shipping_min_subtotal" integer,
	"estimated_days_label" varchar(120) NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"unavailable_reason" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"document_type" "tax_document_type" NOT NULL,
	"status" "tax_document_status" DEFAULT 'pending_config' NOT NULL,
	"customer_doc_type" varchar(16) NOT NULL,
	"customer_doc_number" varchar(20) NOT NULL,
	"customer_legal_name" varchar(200) NOT NULL,
	"customer_fiscal_address" varchar(255),
	"currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"taxable_amount" integer NOT NULL,
	"igv_amount" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"series" varchar(12),
	"correlative_number" varchar(24),
	"provider_name" varchar(80),
	"provider_external_id" varchar(160),
	"sunat_hash" varchar(160),
	"xml_url" text,
	"pdf_url" text,
	"cdr_url" text,
	"provider_response_summary" text,
	"error_message" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"issued_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_wholesale_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."wholesale_quotes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inv_movements_idempotency_idx" ON "inventory_movements" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "inv_movements_variant_idx" ON "inventory_movements" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "inv_movements_order_idx" ON "inventory_movements" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "inv_movements_created_idx" ON "inventory_movements" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "inv_reservations_order_variant_idx" ON "inventory_reservations" USING btree ("order_id","variant_id");--> statement-breakpoint
CREATE INDEX "inv_reservations_variant_status_idx" ON "inventory_reservations" USING btree ("variant_id","status");--> statement-breakpoint
CREATE INDEX "inv_reservations_expires_idx" ON "inventory_reservations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_idx" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_key_idx" ON "orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_quote_unique_idx" ON "orders" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_tx_idempotency_idx" ON "payment_transactions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payment_tx_order_idx" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_tx_provider_id_idx" ON "payment_transactions" USING btree ("provider_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_webhook_provider_event_idx" ON "payment_webhook_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "payment_webhook_order_idx" ON "payment_webhook_events" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_zones_code_idx" ON "shipping_zones" USING btree ("code");--> statement-breakpoint
CREATE INDEX "shipping_zones_dept_idx" ON "shipping_zones" USING btree ("department");--> statement-breakpoint
CREATE INDEX "shipping_zones_avail_idx" ON "shipping_zones" USING btree ("is_available");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_documents_order_unique_idx" ON "tax_documents" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "tax_documents_status_idx" ON "tax_documents" USING btree ("status");