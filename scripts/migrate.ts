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

import { ensureDatabaseMigrated } from "../lib/db/migrate";

async function run() {
  try {
    console.log("⏳ Starting database migration runner...");
    await ensureDatabaseMigrated();
    console.log("✅ Database migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
}

run();
