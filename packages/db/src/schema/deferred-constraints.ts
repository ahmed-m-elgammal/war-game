/**
 * Deferred Foreign Key Constraints
 *
 * Defines the circular and forward-referencing foreign keys that cannot be
 * evaluated immediately on insert due to circular row dependencies:
 * 1. factions.capital_province_id -> world_regions(world_id, province_id)
 * 2. rebellions.province_id -> world_regions(world_id, province_id)
 * 3. worlds.final_snapshot_seq -> world_snapshots(world_id, seq)
 *
 * Because Drizzle ORM (0.45.4) does not expose `DEFERRABLE INITIALLY DEFERRED`
 * in its schema builders, these constraints are modeled explicitly here and
 * provisioned in the initial migration (0000_init.sql).
 */

export interface DeferredForeignKeyDefinition {
  readonly constraintName: string;
  readonly table: string;
  readonly columns: readonly string[];
  readonly foreignTable: string;
  readonly foreignColumns: readonly string[];
  readonly deferrable: true;
  readonly initiallyDeferred: true;
  readonly sql: string;
}

export const DEFERRED_FOREIGN_KEYS: readonly DeferredForeignKeyDefinition[] = [
  {
    constraintName: "factions_capital_region_fk",
    table: "factions",
    columns: ["world_id", "capital_province_id"],
    foreignTable: "world_regions",
    foreignColumns: ["world_id", "province_id"],
    deferrable: true,
    initiallyDeferred: true,
    sql: 'ALTER TABLE "game"."factions" ADD CONSTRAINT "factions_capital_region_fk" FOREIGN KEY ("world_id","capital_province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;'
  },
  {
    constraintName: "rebellions_province_fk",
    table: "rebellions",
    columns: ["world_id", "province_id"],
    foreignTable: "world_regions",
    foreignColumns: ["world_id", "province_id"],
    deferrable: true,
    initiallyDeferred: true,
    sql: 'ALTER TABLE "game"."rebellions" ADD CONSTRAINT "rebellions_province_fk" FOREIGN KEY ("world_id","province_id") REFERENCES "game"."world_regions"("world_id","province_id") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;'
  },
  {
    constraintName: "worlds_final_snapshot_fk",
    table: "worlds",
    columns: ["world_id", "final_snapshot_seq"],
    foreignTable: "world_snapshots",
    foreignColumns: ["world_id", "seq"],
    deferrable: true,
    initiallyDeferred: true,
    sql: 'ALTER TABLE "game"."worlds" ADD CONSTRAINT "worlds_final_snapshot_fk" FOREIGN KEY ("world_id","final_snapshot_seq") REFERENCES "game"."world_snapshots"("world_id","seq") ON DELETE no action ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;'
  }
] as const;
