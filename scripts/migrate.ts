import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";
import fs from "fs";

// Load local environment variables if available
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require("dotenv");
  dotenv.config({ path: ".env.local" });
  dotenv.config({ path: ".env" });
} catch {
  // production environments already have process.env populated
}

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL is required to run migrations.");
    process.exit(1);
  }

  const isLocal =
    connectionString.includes("@postgres:") ||
    (connectionString.includes("localhost") && !connectionString.includes("sslmode=require"));

  console.log("⏳ Connecting to database to apply pending migrations...");

  // Use max: 1 connection for running migrations
  const migrationClient = postgres(connectionString, {
    max: 1,
    ssl: isLocal ? false : "require",
  });

  const db = drizzle(migrationClient);

  // Look for drizzle migration folder
  const possiblePaths = [
    path.join(process.cwd(), "drizzle"),
    path.join(__dirname, "../drizzle"),
    path.join(__dirname, "drizzle"),
  ];

  let migrationsFolder = possiblePaths.find((p) => fs.existsSync(p));

  if (!migrationsFolder) {
    console.warn("⚠️ Migrations folder 'drizzle' not found in standard paths, falling back to './drizzle'");
    migrationsFolder = "./drizzle";
  }

  console.log(`📁 Using migrations folder: ${migrationsFolder}`);

  try {
    await migrate(db, { migrationsFolder });
    console.log("✅ Database migrations applied successfully!");
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
