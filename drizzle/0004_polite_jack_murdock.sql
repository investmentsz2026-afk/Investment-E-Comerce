ALTER TYPE "public"."audit_action" ADD VALUE 'product_created';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'product_updated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'category_updated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'promotion_updated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'customer_status_change';--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"discount_percent" integer NOT NULL,
	"category_id" integer,
	"product_id" integer,
	"channel_target" "price_type" DEFAULT 'retail' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" varchar(120) DEFAULT 'INVESTMENTS' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_code_idx" ON "promotions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "promotions_active_dates_idx" ON "promotions" USING btree ("is_active","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "promotions_category_idx" ON "promotions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "promotions_product_idx" ON "promotions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("is_featured");