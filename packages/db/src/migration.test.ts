/**
 * Initial Migration Contract Tests
 *
 * Protects the generated migration from hand-edit drift after it leaves Drizzle
 * Kit. The migration is the physical contract for the game schema, so this
 * suite asserts exact deferred-FK parity, pin-format checks, ownership
 * constraints, the derived view, RLS enablement, and the schema seed.
 */

import { describe, expect, it } from "vitest";
import migrationSql from "../migrations/0000_init.sql?raw";
import { DEFERRED_FOREIGN_KEYS } from "./schema/deferred-constraints.js";

function quotedList(columns: readonly string[]): string {
  return columns.map((column) => `"${column}"`).join(",");
}

describe("0000_init.sql contract", () => {
  it("keeps every deferred foreign key in exact manifest parity", () => {
    expect(DEFERRED_FOREIGN_KEYS).toHaveLength(3);

    for (const fk of DEFERRED_FOREIGN_KEYS) {
      const expectedSql =
        `ALTER TABLE "game"."${fk.table}" ADD CONSTRAINT "${fk.constraintName}" ` +
        `FOREIGN KEY (${quotedList(fk.columns)}) ` +
        `REFERENCES "game"."${fk.foreignTable}"(${quotedList(fk.foreignColumns)}) ` +
        "ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;";

      expect(fk.sql).toBe(expectedSql);
      expect(migrationSql.split(fk.sql)).toHaveLength(2);
    }
  });

  it("enforces SHA-256 hex pin formats on worlds and snapshots", () => {
    const pinChecks = [
      ["worlds", "map_hash", "worlds_map_hash_sha256"],
      ["worlds", "config_hash", "worlds_config_hash_sha256"],
      ["world_snapshots", "map_hash", "world_snapshots_map_hash_sha256"],
      ["world_snapshots", "config_hash", "world_snapshots_config_hash_sha256"]
    ] as const;

    for (const [table, column, constraint] of pinChecks) {
      expect(migrationSql).toContain(
        `CONSTRAINT "${constraint}" CHECK ("game"."${table}"."${column}" ~* '^[0-9a-f]{64}$')`
      );
    }
  });

  it("binds snapshot pins and pass entitlements to their owning rows", () => {
    expect(migrationSql).toContain(
      'CONSTRAINT "worlds_pin_unique" UNIQUE("world_id","config_version","config_hash","map_id","map_hash")'
    );
    expect(migrationSql).toContain(
      'ALTER TABLE "game"."world_snapshots" ADD CONSTRAINT "world_snapshots_world_pin_fk" FOREIGN KEY ("world_id","config_version","config_hash","map_id","map_hash") REFERENCES "game"."worlds"("world_id","config_version","config_hash","map_id","map_hash")'
    );
    expect(migrationSql).toContain(
      'CONSTRAINT "account_entitlement_owner_unique" UNIQUE("account_id","entitlement_id")'
    );
    expect(migrationSql).toContain(
      'ALTER TABLE "game"."pass_periods" ADD CONSTRAINT "pass_period_entitlement_owner_fk" FOREIGN KEY ("account_id","source_entitlement_id") REFERENCES "game"."account_entitlements"("account_id","entitlement_id")'
    );
  });

  it("enforces rebel capture and system-trade nullability rules", () => {
    expect(migrationSql).toContain(
      'CONSTRAINT "region_rebel_last_attacker" CHECK ("game"."world_regions"."controller_type" <> \'rebel\' or "game"."world_regions"."last_attacker_faction_id" is null)'
    );
    expect(migrationSql).toContain(
      'CONSTRAINT "trade_log_buyer_null_only_system" CHECK ("game"."trade_log"."buyer_faction_id" is not null or "game"."trade_log"."kind" = \'state_exchange\')'
    );
  });

  it("keeps province_garrison derived and never allocates gameplay ids", () => {
    expect(migrationSql).toContain(
      'CREATE VIEW "game"."province_garrison" WITH (security_invoker = true) AS ('
    );
    expect(migrationSql).toContain("from game.neutral_garrisons ng");
    expect(migrationSql).not.toMatch(/\b(?:smallserial|serial|bigserial)\b/i);
    expect(migrationSql).toContain('"audit_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY');
    expect(migrationSql).toContain('"report_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY');
  });

  it("enables RLS, revokes PUBLIC, and seeds the exported schema version", () => {
    expect(migrationSql).toMatch(
      /DO \$\$[\s\S]*FROM pg_tables[\s\S]*WHERE schemaname = 'game'[\s\S]*ENABLE ROW LEVEL SECURITY[\s\S]*END \$\$;/
    );
    expect(migrationSql).toContain('REVOKE ALL ON SCHEMA "game" FROM PUBLIC;');
    expect(migrationSql).toContain(
      'INSERT INTO "game"."schema_meta" ("schema_version")\nVALUES (\'2026-10-23.1\')'
    );
  });
});
