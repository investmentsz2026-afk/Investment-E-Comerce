CREATE TYPE "public"."cart_status" AS ENUM('active', 'merged', 'converted', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('submitted', 'under_review', 'quoted', 'accepted', 'rejected', 'expired', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'quote_created';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'quote_updated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'quote_status_change';--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"cart_id" integer NOT NULL,
	"variant_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"added_unit_price_snapshot" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"guest_token_hash" varchar(64),
	"status" "cart_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wholesale_quote_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"product_name_snapshot" varchar(200) NOT NULL,
	"product_slug_snapshot" varchar(200) NOT NULL,
	"sku_snapshot" varchar(60) NOT NULL,
	"size_snapshot" varchar(20),
	"color_name_snapshot" varchar(60),
	"color_swatch_snapshot" varchar(20),
	"image_url_snapshot" text,
	"requested_quantity" integer NOT NULL,
	"approved_quantity" integer,
	"retail_unit_price_snapshot" integer NOT NULL,
	"reference_unit_price_snapshot" integer NOT NULL,
	"quoted_unit_price" integer,
	"line_subtotal_amount" integer NOT NULL,
	"item_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wholesale_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_number" varchar(40) NOT NULL,
	"user_id" integer NOT NULL,
	"business_application_id" integer,
	"company_legal_name" varchar(200) NOT NULL,
	"company_trade_name" varchar(200) NOT NULL,
	"company_tax_id" varchar(20) NOT NULL,
	"contact_name" varchar(150) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(30) NOT NULL,
	"delivery_city" varchar(120),
	"commercial_needs" text NOT NULL,
	"customer_notes" text,
	"status" "quote_status" DEFAULT 'submitted' NOT NULL,
	"currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"requested_subtotal_amount" integer NOT NULL,
	"quoted_total_amount" integer,
	"valid_until" timestamp with time zone,
	"payment_terms_proposal" varchar(200),
	"admin_proposal_notes" text,
	"internal_notes" text,
	"customer_decision_notes" text,
	"reviewed_by" integer,
	"quoted_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesale_quote_items" ADD CONSTRAINT "wholesale_quote_items_quote_id_wholesale_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."wholesale_quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesale_quote_items" ADD CONSTRAINT "wholesale_quote_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesale_quote_items" ADD CONSTRAINT "wholesale_quote_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesale_quotes" ADD CONSTRAINT "wholesale_quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesale_quotes" ADD CONSTRAINT "wholesale_quotes_business_application_id_business_applications_id_fk" FOREIGN KEY ("business_application_id") REFERENCES "public"."business_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesale_quotes" ADD CONSTRAINT "wholesale_quotes_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_variant_idx" ON "cart_items" USING btree ("cart_id","variant_id");--> statement-breakpoint
CREATE INDEX "cart_items_cart_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "cart_items_variant_idx" ON "cart_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "carts_user_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carts_guest_token_hash_idx" ON "carts" USING btree ("guest_token_hash");--> statement-breakpoint
CREATE INDEX "carts_status_idx" ON "carts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wholesale_quote_items_quote_idx" ON "wholesale_quote_items" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "wholesale_quote_items_variant_idx" ON "wholesale_quote_items" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wholesale_quotes_number_idx" ON "wholesale_quotes" USING btree ("quote_number");--> statement-breakpoint
CREATE INDEX "wholesale_quotes_user_idx" ON "wholesale_quotes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wholesale_quotes_status_idx" ON "wholesale_quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wholesale_quotes_tax_id_idx" ON "wholesale_quotes" USING btree ("company_tax_id");--> statement-breakpoint
CREATE INDEX "wholesale_quotes_created_idx" ON "wholesale_quotes" USING btree ("created_at");