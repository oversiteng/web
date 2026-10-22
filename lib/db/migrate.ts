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

    if (!migrationsFolder) {
      console.warn("⚠️ Drizzle migrations folder with journal not found; skipping automated migration.");
      return;
    }

    const migrationClient = postgres(connectionString, {
      max: 1,
      ssl: isLocal ? false : "require",
      connect_timeout: 10,
    });

    try {
      console.log(`⏳ Applying database migrations from ${migrationsFolder}...`);
      const db = drizzle(migrationClient);
      await migrate(db, { migrationsFolder });
      console.log("✅ Database schema is up to date!");
    } catch (err: any) {
      console.error("❌ Failed to automatically apply migrations:", err?.message || err);
    } finally {
      await migrationClient.end({ timeout: 5 }).catch(() => {});
    }
  })();

  return migrationPromise;
}
