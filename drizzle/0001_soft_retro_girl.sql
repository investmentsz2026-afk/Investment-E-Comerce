CREATE TYPE "public"."audit_action" AS ENUM('application_created', 'status_change', 'role_change', 'profile_update', 'password_change', 'address_created', 'address_deleted');--> statement-breakpoint
CREATE TYPE "public"."business_application_status" AS ENUM('pending', 'under_review', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'business_pending', 'business_approved', 'admin');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer,
	"action" "audit_action" NOT NULL,
	"target_type" varchar(60) NOT NULL,
	"target_id" integer NOT NULL,
	"details" text,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"legal_name" varchar(200) NOT NULL,
	"trade_name" varchar(200) NOT NULL,
	"tax_id" varchar(20) NOT NULL,
	"contact_name" varchar(150) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(30) NOT NULL,
	"business_type" varchar(80) NOT NULL,
	"address_line" varchar(255) NOT NULL,
	"department" varchar(80) NOT NULL,
	"province" varchar(80) NOT NULL,
	"district" varchar(80) NOT NULL,
	"estimated_volume" varchar(100) NOT NULL,
	"additional_notes" text,
	"status" "business_application_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"internal_notes" text,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"email" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(60) DEFAULT 'Principal' NOT NULL,
	"recipient_name" varchar(150) NOT NULL,
	"recipient_phone" varchar(30) NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"reference" varchar(255),
	"department" varchar(80) NOT NULL,
	"province" varchar(80) NOT NULL,
	"district" varchar(80) NOT NULL,
	"postal_code" varchar(20),
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(120) NOT NULL,
	"last_name" varchar(120) NOT NULL,
	"phone" varchar(30),
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_applications" ADD CONSTRAINT "business_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_applications" ADD CONSTRAINT "business_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "biz_app_user_idx" ON "business_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "biz_app_status_idx" ON "business_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "biz_app_tax_id_idx" ON "business_applications" USING btree ("tax_id");--> statement-breakpoint
CREATE INDEX "biz_app_created_idx" ON "business_applications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_verif_token_hash_idx" ON "email_verification_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "email_verif_user_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pwd_reset_token_hash_idx" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "pwd_reset_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_addresses_user_idx" ON "user_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "users_created_idx" ON "users" USING btree ("created_at");