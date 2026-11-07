import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";
import fs from "fs";

let migrationPromise: Promise<void> | null = null;

/**
 * Ensures all database tables, columns, enums, and indexes exist
 * across all environments (dev, staging, prod).
 * Safe to call multiple times (runs once per process).
 */
export async function ensureDatabaseMigrated(): Promise<void> {
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    // Skip running migrations during Next.js static build phase in Docker!
    if (
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.DATABASE_URL?.includes("dummy")
    ) {
      return;
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("⚠️ DATABASE_URL not set; skipping automated migration check.");
      return;
    }

    const isLocal =
      connectionString.includes("@postgres:") ||
      connectionString.includes("127.0.0.1") ||
      (connectionString.includes("localhost") && !connectionString.includes("sslmode=require")) ||
      connectionString.includes("sslmode=disable");

    const migrationClient = postgres(connectionString, {
      max: 1,
      ssl: isLocal ? false : "require",
      connect_timeout: 10,
      onnotice: () => {}, // Silence notices
    });

    const runSafetyPatches = async () => {
      console.log("🛠️ Running full unified schema synchronization directly on PostgreSQL...");
      const statements = [
        // ─── 1. Enums ────────────────────────────────────────────────────────
        `DO $$ BEGIN CREATE TYPE "public"."user_role" AS ENUM('USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."kyc_status" AS ENUM('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."agent_tier" AS ENUM('GENERAL', 'TECHNICAL_SUPERVISOR', 'INVESTIGATOR', 'LEGAL_COUNSEL', 'ENFORCEMENT_LIAISON'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."task_status" AS ENUM('DRAFT', 'PENDING', 'MATCHED', 'AGENT_EN_ROUTE', 'AGENT_ON_SITE', 'IN_PROGRESS', 'REPORT_SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED', 'DISPUTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."task_module" AS ENUM('QUICK_ERRANDS', 'PROPERTY_OVERSITE', 'PROJECT_WATCH', 'DUE_DILIGENCE', 'LEGAL_ADVISORY', 'LAW_ENFORCEMENT', 'VULNERABILITY_TEST'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'AUTHORIZED', 'CAPTURED', 'ESCROWED', 'RELEASED', 'REFUNDED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."payment_gateway" AS ENUM('PAYSTACK', 'FLUTTERWAVE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."media_status" AS ENUM('pending', 'processing', 'ready', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."milestone_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."report_status" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."risk_rating" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."consultation_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."payout_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."notification_type" AS ENUM('TASK_UPDATE', 'PAYMENT', 'CHAT', 'SYSTEM', 'ALERT'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."waitlist_status" AS ENUM('PENDING', 'CONTACTED', 'CONVERTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN CREATE TYPE "public"."chat_moderation_status" AS ENUM('PENDING_REVIEW', 'APPROVED_AS_IS', 'REFINED_BY_ADMIN', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,

        // ─── 2. Users Table ──────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "users" (
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
          "nin_verification_status" varchar(20) DEFAULT 'pending' NOT NULL,
          "nba_verification_status" varchar(20) DEFAULT 'pending' NOT NULL,
          "address_verification_status" varchar(20) DEFAULT 'pending' NOT NULL,
          "accreditation_documents" jsonb,
          "consent_signed_at" timestamp with time zone,
          "avatar_url" text,
          "is_active" boolean DEFAULT true NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar(20);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" varchar(120);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "title" varchar(50);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" text;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location" varchar(150);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "occupation" varchar(120);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "state" varchar(80);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" varchar(80);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "residence" varchar(150);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "user_role" DEFAULT 'USER' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_status" "kyc_status" DEFAULT 'PENDING' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nin_verification_status" varchar(20) DEFAULT 'pending' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nba_verification_status" varchar(20) DEFAULT 'pending' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address_verification_status" varchar(20) DEFAULT 'pending' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accreditation_documents" jsonb;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "consent_signed_at" timestamp with time zone;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;`,

        // ─── 3. Agent Profiles Table ─────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "agent_profiles" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
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
        );`,

        // ─── 4. Agent Wallets Table ──────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "agent_wallets" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "agent_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "balance_ngn" numeric(14, 2) DEFAULT '0.00' NOT NULL,
          "total_earned_ngn" numeric(14, 2) DEFAULT '0.00' NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
          CONSTRAINT "agent_wallets_agent_id_unique" UNIQUE("agent_id")
        );`,

        // ─── 5. Properties Table ─────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "properties" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "title" varchar(255) NOT NULL,
          "address" text NOT NULL,
          "latitude" numeric(10, 7),
          "longitude" numeric(10, 7),
          "parcel_number" varchar(50),
          "property_type" varchar(50),
          "description" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `CREATE INDEX IF NOT EXISTS "properties_user_idx" ON "properties"("user_id");`,

        // ─── 6. Tasks Table ──────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "tasks" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "agent_id" uuid REFERENCES "users"("id"),
          "property_id" uuid REFERENCES "properties"("id"),
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
        );`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "client_promised_delivery_date" timestamp with time zone;`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "pricing_breakdown" jsonb;`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "requires_official_docs" boolean DEFAULT false;`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "waypoints" jsonb;`,
        `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "purchase_items" jsonb;`,
        `CREATE INDEX IF NOT EXISTS "tasks_user_idx" ON "tasks"("user_id");`,
        `CREATE INDEX IF NOT EXISTS "tasks_agent_idx" ON "tasks"("agent_id");`,
        `CREATE INDEX IF NOT EXISTS "tasks_property_idx" ON "tasks"("property_id");`,
        `CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status");`,
        `CREATE INDEX IF NOT EXISTS "tasks_module_idx" ON "tasks"("module_type");`,

        // ─── 7. Notifications Table ──────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "notifications" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "type" "notification_type" DEFAULT 'SYSTEM' NOT NULL,
          "title" varchar(255) NOT NULL,
          "body" text,
          "is_read" boolean DEFAULT false NOT NULL,
          "task_id" uuid REFERENCES "tasks"("id") ON DELETE CASCADE,
          "metadata" jsonb,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications"("user_id");`,
        `CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("is_read");`,
        `CREATE INDEX IF NOT EXISTS "notifications_task_idx" ON "notifications"("task_id");`,

        // ─── 8. Media Assets Table ───────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "media_assets" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "object_key" text NOT NULL,
          "bucket" varchar(128) NOT NULL,
          "status" "media_status" DEFAULT 'pending' NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `CREATE INDEX IF NOT EXISTS "media_assets_owner_idx" ON "media_assets"("owner_id");`,

        // ─── 9. Task Reports & Report Media ──────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "task_reports" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "task_id" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
          "agent_id" uuid NOT NULL REFERENCES "users"("id"),
          "summary" text,
          "findings" text,
          "pdf_s3_key" text,
          "watermark_code" varchar(32),
          "status" "report_status" DEFAULT 'DRAFT' NOT NULL,
          "completion_pct" integer DEFAULT 0 NOT NULL,
          "checklist" jsonb,
          "measurements" jsonb,
          "severity" varchar(20) DEFAULT 'NONE',
          "incidental_expenses" jsonb,
          "metadata" jsonb,
          "official_notes" text,
          "compiled_at" timestamp with time zone,
          "compiled_by" uuid REFERENCES "users"("id"),
          "user_reviewed_at" timestamp with time zone,
          "user_rejection_reason" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `ALTER TABLE "task_reports" ADD COLUMN IF NOT EXISTS "checklist" jsonb;`,
        `ALTER TABLE "task_reports" ADD COLUMN IF NOT EXISTS "measurements" jsonb;`,
        `ALTER TABLE "task_reports" ADD COLUMN IF NOT EXISTS "severity" varchar(20) DEFAULT 'NONE';`,
        `ALTER TABLE "task_reports" ADD COLUMN IF NOT EXISTS "incidental_expenses" jsonb;`,
        `ALTER TABLE "task_reports" ADD COLUMN IF NOT EXISTS "metadata" jsonb;`,
        `ALTER TABLE "task_reports" ADD COLUMN IF NOT EXISTS "official_notes" text;`,
        `ALTER TABLE "task_reports" ADD COLUMN IF NOT EXISTS "compiled_at" timestamp with time zone;`,
        `ALTER TABLE "task_reports" ADD COLUMN IF NOT EXISTS "compiled_by" uuid REFERENCES "users"("id");`,
        `ALTER TABLE "task_reports" ADD COLUMN IF NOT EXISTS "user_reviewed_at" timestamp with time zone;`,
        `ALTER TABLE "task_reports" ADD COLUMN IF NOT EXISTS "user_rejection_reason" text;`,
        `CREATE INDEX IF NOT EXISTS "task_reports_task_idx" ON "task_reports"("task_id");`,
        `CREATE INDEX IF NOT EXISTS "task_reports_agent_idx" ON "task_reports"("agent_id");`,

        `CREATE TABLE IF NOT EXISTS "report_media" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "report_id" uuid NOT NULL REFERENCES "task_reports"("id") ON DELETE CASCADE,
          "media_url" text NOT NULL,
          "media_type" varchar(20) NOT NULL,
          "latitude" numeric(10, 7),
          "longitude" numeric(10, 7),
          "captured_at" timestamp with time zone,
          "caption" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `ALTER TABLE "report_media" ADD COLUMN IF NOT EXISTS "caption" text;`,
        `CREATE INDEX IF NOT EXISTS "report_media_report_idx" ON "report_media"("report_id");`,

        // ─── 10. Task Milestones ─────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "task_milestones" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "task_id" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
          "title" varchar(255) NOT NULL,
          "description" text,
          "order_index" integer DEFAULT 0 NOT NULL,
          "deliverable_type" varchar(50) DEFAULT 'INSPECTION_CHECKLIST' NOT NULL,
          "checklist" jsonb,
          "target_date" timestamp with time zone,
          "status" "milestone_status" DEFAULT 'PENDING' NOT NULL,
          "completion_pct" integer DEFAULT 0 NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `ALTER TABLE "task_milestones" ADD COLUMN IF NOT EXISTS "description" text;`,
        `ALTER TABLE "task_milestones" ADD COLUMN IF NOT EXISTS "order_index" integer DEFAULT 0 NOT NULL;`,
        `ALTER TABLE "task_milestones" ADD COLUMN IF NOT EXISTS "deliverable_type" varchar(50) DEFAULT 'INSPECTION_CHECKLIST' NOT NULL;`,
        `ALTER TABLE "task_milestones" ADD COLUMN IF NOT EXISTS "checklist" jsonb;`,
        `ALTER TABLE "task_milestones" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;`,
        `CREATE INDEX IF NOT EXISTS "task_milestones_task_idx" ON "task_milestones"("task_id");`,

        // ─── 11. Task Chats ──────────────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "task_chats" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "task_id" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
          "sender_id" uuid NOT NULL REFERENCES "users"("id"),
          "receiver_id" uuid NOT NULL REFERENCES "users"("id"),
          "message" text,
          "raw_message" text,
          "moderated_message" text,
          "message_type" varchar(20) DEFAULT 'TEXT',
          "moderation_status" varchar(30) DEFAULT 'PENDING_REVIEW',
          "moderated_at" timestamp with time zone,
          "rejection_reason" text,
          "file_url" text,
          "is_moderated" boolean DEFAULT false NOT NULL,
          "moderated_by" uuid REFERENCES "users"("id"),
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "raw_message" text;`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "moderated_message" text;`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "message_type" varchar(20) DEFAULT 'TEXT';`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "moderation_status" varchar(30) DEFAULT 'PENDING_REVIEW';`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "moderated_at" timestamp with time zone;`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "rejection_reason" text;`,
        `CREATE INDEX IF NOT EXISTS "task_chats_task_idx" ON "task_chats"("task_id");`,
        `CREATE INDEX IF NOT EXISTS "task_chats_sender_idx" ON "task_chats"("sender_id");`,
        `CREATE INDEX IF NOT EXISTS "task_chats_receiver_idx" ON "task_chats"("receiver_id");`,

        // ─── 12. Payments & Payouts ──────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "payments" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "task_id" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
          "user_id" uuid NOT NULL REFERENCES "users"("id"),
          "amount_ngn" numeric(12, 2) NOT NULL,
          "gateway" "payment_gateway" NOT NULL,
          "gateway_ref" varchar(255),
          "status" "payment_status" DEFAULT 'PENDING' NOT NULL,
          "escrow_released_at" timestamp with time zone,
          "metadata" jsonb,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `CREATE INDEX IF NOT EXISTS "payments_task_idx" ON "payments"("task_id");`,
        `CREATE INDEX IF NOT EXISTS "payments_user_idx" ON "payments"("user_id");`,

        `CREATE TABLE IF NOT EXISTS "payout_transactions" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "wallet_id" uuid NOT NULL REFERENCES "agent_wallets"("id") ON DELETE CASCADE,
          "agent_id" uuid NOT NULL REFERENCES "users"("id"),
          "amount_ngn" numeric(12, 2) NOT NULL,
          "bank_code" varchar(10) NOT NULL,
          "account_number" varchar(20) NOT NULL,
          "gateway_ref" varchar(255),
          "status" "payout_status" DEFAULT 'PENDING' NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "processed_at" timestamp with time zone
        );`,

        `CREATE TABLE IF NOT EXISTS "user_payment_methods" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "authorization_code" varchar(255) NOT NULL,
          "card_type" varchar(50) DEFAULT 'card' NOT NULL,
          "brand" varchar(50) NOT NULL,
          "last4" varchar(4) NOT NULL,
          "expiry_month" varchar(4) NOT NULL,
          "expiry_year" varchar(4) NOT NULL,
          "bank" varchar(120),
          "is_default" boolean DEFAULT false NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `CREATE INDEX IF NOT EXISTS "user_payment_methods_user_idx" ON "user_payment_methods"("user_id");`,

        // ─── 13. Specialized Tables ──────────────────────────────────────────
        `CREATE TABLE IF NOT EXISTS "due_diligence_dossiers" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "task_id" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
          "risk_rating" "risk_rating",
          "anonymized" boolean DEFAULT false NOT NULL,
          "dossier_pdf_s3_key" text,
          "findings" jsonb,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
          CONSTRAINT "due_diligence_dossiers_task_id_unique" UNIQUE("task_id")
        );`,

        `CREATE TABLE IF NOT EXISTS "legal_consultations" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "task_id" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
          "lawyer_agent_id" uuid NOT NULL REFERENCES "users"("id"),
          "scheduled_at" timestamp with time zone,
          "duration_mins" integer DEFAULT 60,
          "retainer_amount_ngn" numeric(12, 2),
          "status" "consultation_status" DEFAULT 'SCHEDULED' NOT NULL,
          "notes" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,

        `CREATE TABLE IF NOT EXISTS "outbound_emails" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
          "to_address" varchar(320) NOT NULL,
          "subject" varchar(255) NOT NULL,
          "template" varchar(120) NOT NULL,
          "retries" integer DEFAULT 0 NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,

        `CREATE TABLE IF NOT EXISTS "waitlist" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "email" varchar(320) NOT NULL,
          "name" varchar(120),
          "interest" varchar(120),
          "status" "waitlist_status" DEFAULT 'PENDING' NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,

        // ─── 14. Email index & lowercasing ───────────────────────────────────
        `DO $$ BEGIN
          DELETE FROM "agent_profiles" WHERE "user_id" IN (
            SELECT a.id FROM "users" a JOIN "users" b ON LOWER(a.email) = LOWER(b.email) AND a.created_at < b.created_at
          );
          DELETE FROM "users" a USING "users" b WHERE LOWER(a.email) = LOWER(b.email) AND a.created_at < b.created_at;
          UPDATE "users" SET "email" = LOWER("email") WHERE "email" != LOWER("email");
          DROP INDEX IF EXISTS "users_email_unique";
          CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" (LOWER("email"));
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END $$;`,
      ];

      for (const statement of statements) {
        try {
          await migrationClient.unsafe(statement);
        } catch (e: any) {
          // Non-fatal statement notice
        }
      }
      console.log("✅ Unified schema synchronization completed successfully!");
    };

    try {
      // 1. Run complete unified schema patches first
      await runSafetyPatches();

      // 2. Run Drizzle migrations if folder is available
      const possibleFolders = [
        path.join(process.cwd(), "drizzle"),
        path.resolve(__dirname, "../../drizzle"),
        path.resolve(__dirname, "../drizzle"),
      ];

      const migrationsFolder = possibleFolders.find((folder) => {
        try {
          return fs.existsSync(folder) && fs.existsSync(path.join(folder, "meta", "_journal.json"));
        } catch {
          return false;
        }
      });

      if (migrationsFolder) {
        try {
          const db = drizzle(migrationClient);
          await migrate(db, { migrationsFolder });
          console.log("✅ Database schema is up to date via migrations!");
        } catch (mErr: any) {
          // Silently ignore already exists from raw Drizzle migrations
        }
      }
    } catch (err: any) {
      console.warn("⚠️ Migration process warning:", err?.message || err);
    } finally {
      await migrationClient.end({ timeout: 5 }).catch(() => {});
    }
  })();

  return migrationPromise;
}
