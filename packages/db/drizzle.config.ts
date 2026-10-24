/**
 * Drizzle Kit Configuration
 *
 * Configures schema paths, migration outputs, and connection credentials for
 * the PostgreSQL `game` schema.
 */

import { defineConfig } from "drizzle-kit";

const connectionString =
  process.env.DATABASE_URL_MIGRATIONS ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:54322/wargame";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  schemaFilter: ["game"],
  dbCredentials: {
    url: connectionString
  }
});
