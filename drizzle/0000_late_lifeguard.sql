CREATE TYPE "public"."audience" AS ENUM('mujer', 'hombre', 'unisex');--> statement-breakpoint
CREATE TYPE "public"."price_type" AS ENUM('retail', 'wholesale');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"description" text,
	"image_url" text,
	"parent_id" integer,
	"audience" "audience",
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"url" text NOT NULL,
	"alt" varchar(300) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"type" "price_type" NOT NULL,
	"amount" integer NOT NULL,
	"compare_at_amount" integer,
	"min_quantity" integer DEFAULT 1 NOT NULL,
	"max_quantity" integer
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"sku" varchar(60) NOT NULL,
	"size" varchar(20),
	"color_name" varchar(60),
	"color_swatch" varchar(20),
	"stock" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"short_description" text,
	"full_description" text,
	"audience" "audience" NOT NULL,
	"category_id" integer NOT NULL,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"is_new" boolean DEFAULT false NOT NULL,
	"is_wholesale" boolean DEFAULT false NOT NULL,
	"badge_label" varchar(60),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "categories_active_idx" ON "categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_prices_product_idx" ON "product_prices" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_prices_type_idx" ON "product_prices" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variants_color_idx" ON "product_variants" USING btree ("color_name");--> statement-breakpoint
CREATE INDEX "product_variants_size_idx" ON "product_variants" USING btree ("size");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_audience_idx" ON "products" USING btree ("audience");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_new_idx" ON "products" USING btree ("is_new");--> statement-breakpoint
CREATE INDEX "products_wholesale_idx" ON "products" USING btree ("is_wholesale");--> statement-breakpoint
CREATE INDEX "products_created_idx" ON "products" USING btree ("created_at");