/**
 * Database Schema Readiness
 *
 * The server must not report ready unless the connected database's
 * game.schema_meta.schema_version matches the server build. The check is kept
 * dependency-free and accepts a query function so it can be unit-tested
 * without a live PostgreSQL connection.
 */

export interface SchemaVersionRow {
  schema_version: string;
}

export interface SchemaVersionQueryResult {
  rows: SchemaVersionRow[];
}

export type SchemaVersionQuery = () => Promise<SchemaVersionQueryResult>;

export class SchemaVersionMismatchError extends Error {
  readonly code = "DATABASE_ERROR";

  constructor(
    readonly expected: string,
    readonly actual: string | null
  ) {
    super(`Database schema version ${actual ?? "<missing>"} does not match expected ${expected}.`);
    this.name = "SchemaVersionMismatchError";
  }
}

export function assertSchemaVersion(actual: string | null | undefined, expected: string): void {
  if (actual !== expected) {
    throw new SchemaVersionMismatchError(expected, actual ?? null);
  }
}

export const SCHEMA_VERSION_SQL =
  "SELECT schema_version FROM game.schema_meta WHERE id = true LIMIT 1;";

export async function checkDatabaseSchemaVersion(
  query: SchemaVersionQuery,
  expected: string
): Promise<void> {
  const result = await query();
  assertSchemaVersion(result?.rows?.[0]?.schema_version, expected);
}
