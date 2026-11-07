try {
  const { config } = require("dotenv");
  config({ path: ".env.local" });
} catch {
  // dotenv not available in minimal production containers; environment variables are already injected
}
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/oversite",
  },
  verbose: true,
  strict: true,
});
