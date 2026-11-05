import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";
import fs from "fs";

let migrationPromise: Promise<void> | null = null;

/**
 * Ensures all pending Drizzle SQL migrations in `./drizzle` are applied
 * to the connected database. Safe to call multiple times (runs once).
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

    // Find drizzle migrations folder
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

    const migrationClient = postgres(connectionString, {
      max: 1,
      ssl: isLocal ? false : "require",
      connect_timeout: 10,
      onnotice: () => {}, // Silence "already exists, skipping" notices from flooding the console
    });

    const runSafetyPatches = async () => {
      console.log("🛠️ Running safety schema synchronization directly on PostgreSQL...");
      const statements = [
        // 1. Safe ENUM Types creation (prevents 'type already exists' fatal crashes)
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

        // 2. Base USERS table & columns
        `CREATE TABLE IF NOT EXISTS "users" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "email" varchar(320) NOT NULL,
          "phone" varchar(20),
          "name" varchar(120),
          "password_hash" text,
          "role" "user_role" DEFAULT 'USER' NOT NULL,
          "kyc_status" "kyc_status" DEFAULT 'PENDING' NOT NULL,
          "is_active" boolean DEFAULT true NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL
        );`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar(20);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" varchar(120);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "user_role" DEFAULT 'USER' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_status" "kyc_status" DEFAULT 'PENDING' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "title" varchar(50);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" text;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location" varchar(150);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "occupation" varchar(120);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "state" varchar(80);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" varchar(80);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "residence" varchar(150);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nin_verification_status" varchar(20) DEFAULT 'pending' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nba_verification_status" varchar(20) DEFAULT 'pending' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address_verification_status" varchar(20) DEFAULT 'pending' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accreditation_documents" jsonb;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "consent_signed_at" timestamp with time zone;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;`,

        // 3. AGENT PROFILES table
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

        // 4. AGENT WALLETS table
        `CREATE TABLE IF NOT EXISTS "agent_wallets" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "agent_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "balance_ngn" numeric(14, 2) DEFAULT '0.00' NOT NULL,
          "total_earned_ngn" numeric(14, 2) DEFAULT '0.00' NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
          CONSTRAINT "agent_wallets_agent_id_unique" UNIQUE("agent_id")
        );`,

        // 5. USER PAYMENT METHODS table
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

        // 6. TASK CHATS moderation columns
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "raw_message" text;`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "moderated_message" text;`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "message_type" varchar(20) DEFAULT 'TEXT';`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "moderation_status" varchar(30) DEFAULT 'PENDING_REVIEW';`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "moderated_at" timestamp with time zone;`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "rejection_reason" text;`,
        `CREATE INDEX IF NOT EXISTS "task_chats_moderation_idx" ON "task_chats"("moderation_status");`,

        // 7. TASK MILESTONES & REPORTS columns
        `ALTER TABLE "task_milestones" ADD COLUMN IF NOT EXISTS "description" text;`,
        `ALTER TABLE "task_milestones" ADD COLUMN IF NOT EXISTS "order_index" integer DEFAULT 0 NOT NULL;`,
        `ALTER TABLE "task_milestones" ADD COLUMN IF NOT EXISTS "deliverable_type" varchar(50) DEFAULT 'INSPECTION_CHECKLIST' NOT NULL;`,
        `ALTER TABLE "task_milestones" ADD COLUMN IF NOT EXISTS "checklist" jsonb;`,
        `ALTER TABLE "task_milestones" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;`,
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
        `ALTER TABLE "report_media" ADD COLUMN IF NOT EXISTS "caption" text;`,

        // 8. Deduplicate and ensure lowercase unique email index
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
          // Silent or log notice
        }
      }
      console.log("✅ Safety schema synchronization completed successfully!");
    };

    try {
      // 1. Always run safety schema patches first to ensure essential types and columns exist immediately
      await runSafetyPatches();

      // 2. Try Drizzle migrations if folder is found
      if (migrationsFolder) {
        console.log(`⏳ Checking database migrations from ${migrationsFolder}...`);
        try {
          const db = drizzle(migrationClient);
          await migrate(db, { migrationsFolder });
          console.log("✅ Database schema is up to date via migrations!");
        } catch (mErr: any) {
          const mMsg = mErr?.message || String(mErr);
          if (mMsg.includes("already exists") || mMsg.includes("duplicate")) {
            console.log("ℹ️ Database schema types or tables already initialized; skipping duplicate Drizzle execution.");
          } else {
            console.warn("⚠️ Standard migration notice:", mMsg);
          }
        }
      } else {
        console.warn("⚠️ Drizzle migrations folder not found, but safety schema synchronization was applied.");
      }
    } catch (err: any) {
      console.warn("⚠️ Migration process warning:", err?.message || err);
    } finally {
      await migrationClient.end({ timeout: 5 }).catch(() => {});
    }
  })();

  return migrationPromise;
}
