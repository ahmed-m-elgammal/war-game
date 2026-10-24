/**
 * @wargame/db (SERVER ONLY)
 *
 * Drizzle schema, table models, and persistence definitions. This package is
 * strictly server-only; client packages never import or access it.
 */

export const DB_SCHEMA_VERSION = "2026-10-23.1";

export * from "./readiness.js";
export * from "./schema/index.js";
