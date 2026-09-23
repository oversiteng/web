import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Drizzle.");
  }

  const client = postgres(connectionString, {
    max: 10,
    ssl: process.env.NODE_ENV === "production" ? "require" : undefined,
  });

  dbInstance = drizzle(client);
  return dbInstance;
}
