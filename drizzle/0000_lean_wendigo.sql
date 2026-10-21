CREATE TYPE "public"."agent_tier" AS ENUM('GENERAL', 'TECHNICAL_SUPERVISOR', 'INVESTIGATOR', 'LEGAL_COUNSEL', 'ENFORCEMENT_LIAISON');--> statement-breakpoint
CREATE TYPE "public"."consultation_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('TASK_UPDATE', 'PAYMENT', 'CHAT', 'SYSTEM', 'ALERT');--> statement-breakpoint
CREATE TYPE "public"."payment_gateway" AS ENUM('PAYSTACK', 'FLUTTERWAVE');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'AUTHORIZED', 'CAPTURED', 'ESCROWED', 'RELEASED', 'REFUNDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."risk_rating" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."task_module" AS ENUM('QUICK_ERRANDS', 'PROPERTY_OVERSITE', 'PROJECT_WATCH', 'DUE_DILIGENCE', 'LEGAL_ADVISORY', 'LAW_ENFORCEMENT', 'VULNERABILITY_TEST');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('DRAFT', 'PENDING', 'MATCHED', 'AGENT_EN_ROUTE', 'AGENT_ON_SITE', 'IN_PROGRESS', 'REPORT_SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED', 'DISPUTED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."waitlist_status" AS ENUM('PENDING', 'CONTACTED', 'CONVERTED');--> statement-breakpoint
CREATE TABLE "agent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" "agent_tier" DEFAULT 'GENERAL' NOT NULL,
	"nba_number" varchar(50),
	"nin_id" varchar(20),
	"rating" numeric(3, 2) DEFAULT '0.00',
	"total_tasks" integer DEFAULT 0 NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"service_area_lat" numeric(10, 7),
	"service_area_lng" numeric(10, 7),
	"service_radius_km" numeric(6, 2) DEFAULT '10.00',
	"bank_code" varchar(10),
	"bank_account_number" varchar(20),
	"bank_account_name" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "agent_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"balance_ngn" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_earned_ngn" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_wallets_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "due_diligence_dossiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"risk_rating" "risk_rating",
	"anonymized" boolean DEFAULT false NOT NULL,
	"dossier_pdf_s3_key" text,
	"findings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "due_diligence_dossiers_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "legal_consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"lawyer_agent_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone,
	"duration_mins" integer DEFAULT 60,
	"retainer_amount_ngn" numeric(12, 2),
	"status" "consultation_status" DEFAULT 'SCHEDULED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"bucket" varchar(128) NOT NULL,
	"status" "media_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" DEFAULT 'SYSTEM' NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"task_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbound_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"to_address" varchar(320) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"template" varchar(120) NOT NULL,
	"retries" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_ngn" numeric(12, 2) NOT NULL,
	"gateway" "payment_gateway" NOT NULL,
	"gateway_ref" varchar(255),
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"escrow_released_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"amount_ngn" numeric(12, 2) NOT NULL,
	"bank_code" varchar(10) NOT NULL,
	"account_number" varchar(20) NOT NULL,
	"gateway_ref" varchar(255),
	"status" "payout_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"parcel_number" varchar(50),
	"property_type" varchar(50),
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"media_url" text NOT NULL,
	"media_type" varchar(20) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"captured_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"message" text,
	"file_url" text,
	"is_moderated" boolean DEFAULT false NOT NULL,
	"moderated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"target_date" timestamp with time zone,
	"status" "milestone_status" DEFAULT 'PENDING' NOT NULL,
	"completion_pct" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"summary" text,
	"findings" text,
	"pdf_s3_key" text,
	"watermark_code" varchar(32),
	"status" "report_status" DEFAULT 'DRAFT' NOT NULL,
	"completion_pct" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"agent_id" uuid,
	"property_id" uuid,
	"module_type" "task_module" NOT NULL,
	"status" "task_status" DEFAULT 'DRAFT' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal',
	"title" varchar(255) NOT NULL,
	"description" text,
	"location_address" text,
	"location_lat" numeric(10, 7),
	"location_lng" numeric(10, 7),
	"form_data" jsonb,
	"price_ngn" numeric(12, 2),
	"pricing_mode" varchar(30) DEFAULT 'AUTOMATED',
	"quote_status" varchar(30) DEFAULT 'ESTIMATED',
	"agent_target_hours" integer,
	"client_promised_hours" integer,
	"client_promised_delivery_date" timestamp with time zone,
	"waypoints" jsonb,
	"purchase_items" jsonb,
	"requires_official_docs" boolean DEFAULT false,
	"pricing_breakdown" jsonb,
	"scheduled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(20),
	"name" varchar(120),
	"title" varchar(50),
	"address" text,
	"location" varchar(150),
	"occupation" varchar(120),
	"state" varchar(80),
	"country" varchar(80),
	"residence" varchar(150),
	"password_hash" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"kyc_status" "kyc_status" DEFAULT 'PENDING' NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(120),
	"interest" varchar(120),
	"status" "waitlist_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_wallets" ADD CONSTRAINT "agent_wallets_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "due_diligence_dossiers" ADD CONSTRAINT "due_diligence_dossiers_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_consultations" ADD CONSTRAINT "legal_consultations_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_consultations" ADD CONSTRAINT "legal_consultations_lawyer_agent_id_users_id_fk" FOREIGN KEY ("lawyer_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_emails" ADD CONSTRAINT "outbound_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_transactions" ADD CONSTRAINT "payout_transactions_wallet_id_agent_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."agent_wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_transactions" ADD CONSTRAINT "payout_transactions_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_media" ADD CONSTRAINT "report_media_report_id_task_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."task_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_chats" ADD CONSTRAINT "task_chats_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_chats" ADD CONSTRAINT "task_chats_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_chats" ADD CONSTRAINT "task_chats_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_chats" ADD CONSTRAINT "task_chats_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_milestones" ADD CONSTRAINT "task_milestones_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reports" ADD CONSTRAINT "task_reports_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reports" ADD CONSTRAINT "task_reports_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_profiles_tier_idx" ON "agent_profiles" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "agent_profiles_available_idx" ON "agent_profiles" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "due_diligence_dossiers_task_idx" ON "due_diligence_dossiers" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "legal_consultations_task_idx" ON "legal_consultations" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "legal_consultations_lawyer_idx" ON "legal_consultations" USING btree ("lawyer_agent_id");--> statement-breakpoint
CREATE INDEX "media_assets_owner_idx" ON "media_assets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "outbound_emails_to_address_idx" ON "outbound_emails" USING btree ("to_address");--> statement-breakpoint
CREATE INDEX "payments_task_idx" ON "payments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payout_transactions_agent_idx" ON "payout_transactions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "payout_transactions_status_idx" ON "payout_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "properties_user_idx" ON "properties" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "report_media_report_idx" ON "report_media" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "task_chats_task_idx" ON "task_chats" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_chats_sender_idx" ON "task_chats" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "task_milestones_task_idx" ON "task_milestones" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_reports_task_idx" ON "task_reports" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_reports_agent_idx" ON "task_reports" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "tasks_user_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_agent_idx" ON "tasks" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "tasks_module_idx" ON "tasks" USING btree ("module_type");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_email_unique" ON "waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_status_idx" ON "waitlist" USING btree ("status");--> statement-breakpoint
CREATE INDEX "waitlist_interest_idx" ON "waitlist" USING btree ("interest");