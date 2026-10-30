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
      (connectionString.includes("localhost") && !connectionString.includes("sslmode=require"));

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
      console.log("🛠️ Running safety column synchronization directly on PostgreSQL...");
      const columns = [
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nin_verification_status" varchar(20) DEFAULT 'pending' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nba_verification_status" varchar(20) DEFAULT 'pending' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address_verification_status" varchar(20) DEFAULT 'pending' NOT NULL;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accreditation_documents" jsonb;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "consent_signed_at" timestamp with time zone;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "title" varchar(50);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" text;`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location" varchar(150);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "occupation" varchar(120);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "state" varchar(80);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" varchar(80);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "residence" varchar(150);`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;`,
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
        `DO $$ BEGIN
          CREATE TYPE chat_moderation_status AS ENUM ('PENDING_REVIEW', 'APPROVED_AS_IS', 'REFINED_BY_ADMIN', 'REJECTED');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "raw_message" text;`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "moderated_message" text;`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "message_type" varchar(20) DEFAULT 'TEXT';`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "moderation_status" varchar(30) DEFAULT 'PENDING_REVIEW';`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "moderated_at" timestamp with time zone;`,
        `ALTER TABLE "task_chats" ADD COLUMN IF NOT EXISTS "rejection_reason" text;`,
        `CREATE INDEX IF NOT EXISTS "task_chats_moderation_idx" ON "task_chats"("moderation_status");`,
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
      ];

      for (const query of columns) {
        try {
          await migrationClient.unsafe(query);
        } catch (e: any) {
          console.warn("Notice during column patch:", e?.message || e);
        }
      }
      console.log("✅ Safety column synchronization completed successfully!");
    };

    try {
      // 1. Always run safety column patches first to ensure essential columns exist immediately
      await runSafetyPatches();

      // 2. Try Drizzle migrations if folder is found
      if (migrationsFolder) {
        console.log(`⏳ Applying database migrations from ${migrationsFolder}...`);
        const db = drizzle(migrationClient);
        await migrate(db, { migrationsFolder });
        console.log("✅ Database schema is up to date via migrations!");
      } else {
        console.warn("⚠️ Drizzle migrations folder not found, but safety columns were applied.");
      }
    } catch (err: any) {
      console.warn("⚠️ Standard migration error:", err?.message || err);
    } finally {
      await migrationClient.end({ timeout: 5 }).catch(() => {});
    }
  })();

  return migrationPromise;
}
