/**
 * Database Schema Readiness Tests
 *
 * Protects the readiness contract: the exact schema version passes, while a
 * different or missing version blocks readiness before the server starts
 * accepting traffic.
 */

import { describe, expect, it } from "vitest";
import {
  SCHEMA_VERSION_SQL,
  SchemaVersionMismatchError,
  assertSchemaVersion,
  checkDatabaseSchemaVersion
} from "./readiness.js";

describe("database schema readiness", () => {
  it("exports the canonical schema version query SQL", () => {
    expect(SCHEMA_VERSION_SQL).toContain("game.schema_meta");
    expect(SCHEMA_VERSION_SQL).toContain("schema_version");
  });

  it("accepts the exact expected schema version", () => {
    expect(() => assertSchemaVersion("2026-10-23.1", "2026-10-23.1")).not.toThrow();
  });

  it("rejects a different or missing schema version", () => {
    expect(() => assertSchemaVersion("2026-10-24.1", "2026-10-23.1")).toThrow(
      SchemaVersionMismatchError
    );
    expect(() => assertSchemaVersion(null, "2026-10-23.1")).toThrow(SchemaVersionMismatchError);
    expect(() => assertSchemaVersion(undefined, "2026-10-23.1")).toThrow(
      SchemaVersionMismatchError
    );
  });

  it("passes only when the live query returns the expected version", async () => {
    await expect(
      checkDatabaseSchemaVersion(
        async () => ({ rows: [{ schema_version: "2026-10-23.1" }] }),
        "2026-10-23.1"
      )
    ).resolves.toBeUndefined();

    await expect(
      checkDatabaseSchemaVersion(async () => ({ rows: [] }), "2026-10-23.1")
    ).rejects.toBeInstanceOf(SchemaVersionMismatchError);

    await expect(
      checkDatabaseSchemaVersion(async () => ({}) as never, "2026-10-23.1")
    ).rejects.toBeInstanceOf(SchemaVersionMismatchError);
  });
});
