/**
 * Schema Metadata Table
 *
 * Tracks the physical database migration version. Server readiness check fails
 * if the database schema version does not match the server build.
 */

import { sql } from "drizzle-orm";
import { boolean, text, timestamp, check } from "drizzle-orm/pg-core";
import { gameSchema } from "./enums.js";

export const schemaMeta = gameSchema.table(
  "schema_meta",
  {
    id: boolean("id").primaryKey().default(true),
    schemaVersion: text("schema_version").notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [check("schema_meta_id_check", sql`${t.id} = true`)]
);
