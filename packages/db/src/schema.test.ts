/**
 * Database Schema and Conformance Tests
 *
 * Verifies that the Drizzle schema matches the specification from
 * plan/06-data-model.md and plan/schemas/game.schema.sql:
 * - Exactly 39 tables and 1 derived view.
 * - All tables, views, and enums reside in the `game` schema.
 * - No auto-incrementing serial sequences inside game tick tables.
 * - Full parity with shared domain contracts (World, WorldSnapshotMeta, D-CONFIG-PIN).
 * - Schema version constant matches the locked migration version.
 */

import { describe, expect, it } from "vitest";
import { getTableColumns } from "drizzle-orm";
import * as schema from "./index.js";

describe("@wargame/db schema specification", () => {
  it("exports the locked schema version matching plan/06", () => {
    expect(schema.DB_SCHEMA_VERSION).toBe("2026-10-23.1");
  });

  it("contains exactly 39 tables and 1 view in the game schema", () => {
    const exportedEntities = Object.values(schema) as unknown[];
    const tables = exportedEntities.filter(
      (entity): entity is Record<symbol, unknown> =>
        typeof entity === "object" &&
        entity !== null &&
        Symbol.for("drizzle:Schema") in entity &&
        (entity as Record<symbol, unknown>)[Symbol.for("drizzle:Schema")] === "game"
    );
    const views = exportedEntities.filter(
      (entity): entity is Record<symbol, { schema?: string; name?: string }> =>
        typeof entity === "object" &&
        entity !== null &&
        Symbol.for("drizzle:ViewBaseConfig") in entity
    );

    expect(tables).toHaveLength(39);
    expect(views).toHaveLength(1);

    for (const table of tables) {
      expect(table[Symbol.for("drizzle:Schema")]).toBe("game");
    }

    for (const view of views) {
      const viewConfig = view[Symbol.for("drizzle:ViewBaseConfig")];
      expect(viewConfig?.schema).toBe("game");
    }
  });

  it("ensures game simulation entities use safe bigint ids instead of auto-increment serials", () => {
    const worldCols = getTableColumns(schema.worlds);
    const factionCols = getTableColumns(schema.factions);
    const armyCols = getTableColumns(schema.armies);
    const eventCols = getTableColumns(schema.worldEvents);

    expect(worldCols.worldId.dataType).toBe("string");
    expect(factionCols.factionId.dataType).toBe("number");
    expect(armyCols.armyId.dataType).toBe("number");
    expect(eventCols.seq.dataType).toBe("number");

    expect(factionCols.factionId.hasDefault).toBe(false);
    expect(armyCols.armyId.hasDefault).toBe(false);
    expect(eventCols.seq.hasDefault).toBe(false);
  });

  it("verifies the province_garrison view shape and name", () => {
    const view = schema.provinceGarrison as unknown as Record<
      symbol,
      { schema?: string; name?: string }
    >;
    const viewConfig = view[Symbol.for("drizzle:ViewBaseConfig")];
    expect(viewConfig?.name).toBe("province_garrison");
    expect(viewConfig?.schema).toBe("game");
  });

  it("verifies all 40 enums belong to the game schema", () => {
    const exportedEntities = Object.values(schema) as unknown[];
    const enums = exportedEntities.filter(
      (entity) => typeof entity === "function" && "enumName" in entity && "schema" in entity
    ) as Array<{ enumName: string; schema: string }>;

    expect(enums).toHaveLength(40);
    for (const e of enums) {
      expect(e.schema).toBe("game");
    }
  });

  it("verifies the 3 deferred circular foreign keys are declared with DEFERRABLE INITIALLY DEFERRED", () => {
    expect(schema.DEFERRED_FOREIGN_KEYS).toHaveLength(3);

    const names = schema.DEFERRED_FOREIGN_KEYS.map((fk) => fk.constraintName);
    expect(names).toEqual([
      "factions_capital_region_fk",
      "rebellions_province_fk",
      "worlds_final_snapshot_fk"
    ]);

    for (const fk of schema.DEFERRED_FOREIGN_KEYS) {
      expect(fk.deferrable).toBe(true);
      expect(fk.initiallyDeferred).toBe(true);
      expect(fk.sql).toContain("DEFERRABLE INITIALLY DEFERRED");
    }
  });

  it("verifies worlds table stores SHA-256 config_hash and map_hash (D-CONFIG-PIN)", () => {
    const cols = getTableColumns(schema.worlds);

    expect(cols.mapId).toBeDefined();
    expect(cols.mapId.dataType).toBe("string");

    expect(cols.mapHash).toBeDefined();
    expect(cols.mapHash.dataType).toBe("string");
    expect(cols.mapHash.notNull).toBe(true);

    expect(cols.configVersion).toBeDefined();
    expect(cols.configVersion.dataType).toBe("string");

    expect(cols.configHash).toBeDefined();
    expect(cols.configHash.dataType).toBe("string");
    expect(cols.configHash.notNull).toBe(true);
  });

  it("verifies world_snapshots table stores self-contained metadata and pin hashes", () => {
    const cols = getTableColumns(schema.worldSnapshots);

    expect(cols.configVersion).toBeDefined();
    expect(cols.configVersion.notNull).toBe(true);

    expect(cols.configHash).toBeDefined();
    expect(cols.configHash.notNull).toBe(true);

    expect(cols.mapId).toBeDefined();
    expect(cols.mapId.notNull).toBe(true);

    expect(cols.mapHash).toBeDefined();
    expect(cols.mapHash.notNull).toBe(true);
  });
});
