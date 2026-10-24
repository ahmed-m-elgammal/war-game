/**
 * World and Simulation Lease Schema
 *
 * Implements the lifecycle of isolated world instances and the single-writer
 * lease table used for distributed locking and writer fencing.
 *
 * Forward/Circular Constraints:
 * - worlds(world_id, final_snapshot_seq) -> world_snapshots(world_id, seq)
 * Enforced via DEFERRABLE INITIALLY DEFERRED foreign key defined in
 * DEFERRED_FOREIGN_KEYS and the initial database migration.
 */

import { sql } from "drizzle-orm";
import {
  bigint,
  char,
  check,
  index,
  smallint,
  text,
  timestamp,
  unique,
  uuid
} from "drizzle-orm/pg-core";
import { gameSchema, operationalStateEnum, worldStatusEnum } from "./enums.js";

export const worlds = gameSchema.table(
  "worlds",
  {
    worldId: uuid("world_id").primaryKey(),
    name: text("name").notNull(),
    mapId: text("map_id").notNull(),
    mapHash: char("map_hash", { length: 64 }).notNull(),
    configVersion: text("config_version").notNull(),
    configHash: char("config_hash", { length: 64 }).notNull(),
    status: worldStatusEnum("status").notNull().default("creating"),
    operationalState: operationalStateEnum("operational_state"),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }),
    joinDeadline: timestamp("join_deadline", { withTimezone: true, mode: "string" }),
    seasonEnd: timestamp("season_end", { withTimezone: true, mode: "string" }),
    maxHumans: smallint("max_humans").notNull(),
    aiCount: smallint("ai_count").notNull(),
    provinceCount: smallint("province_count").notNull(),
    version: bigint("version", { mode: "number" }).notNull().default(0),
    lastTick: bigint("last_tick", { mode: "number" }).notNull().default(0),
    lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull().default(0),
    finalSnapshotSeq: bigint("final_snapshot_seq", { mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true, mode: "string" })
  },
  (t) => [
    check("worlds_max_humans_range", sql`${t.maxHumans} between 20 and 24`),
    check("worlds_ai_count_range", sql`${t.aiCount} between 10 and 15`),
    check("worlds_province_count_range", sql`${t.provinceCount} between 80 and 100`),
    check("worlds_version_nonneg", sql`${t.version} >= 0`),
    check("worlds_last_tick_nonneg", sql`${t.lastTick} >= 0`),
    check("worlds_last_event_seq_nonneg", sql`${t.lastEventSeq} >= 0`),
    check(
      "worlds_final_snapshot_seq_pos",
      sql`${t.finalSnapshotSeq} is null or ${t.finalSnapshotSeq} > 0`
    ),
    check("world_started", sql`${t.status} = 'creating' or ${t.startedAt} is not null`),
    check(
      "world_join_deadline",
      sql`${t.startedAt} is null or ${t.joinDeadline} is null or ${t.joinDeadline} >= ${t.startedAt}`
    ),
    check(
      "world_season_end",
      sql`${t.startedAt} is null or ${t.seasonEnd} is null or ${t.seasonEnd} > ${t.startedAt}`
    ),
    check("world_finished_time", sql`${t.status} <> 'finished' or ${t.finishedAt} is not null`),
    check(
      "world_finished_snapshot",
      sql`${t.status} <> 'finished' or ${t.finalSnapshotSeq} is not null`
    ),
    check(
      "world_operational_state",
      sql`${t.operationalState} is null or ${t.status} in ('open', 'running', 'finished')`
    ),
    check("worlds_map_hash_sha256", sql`${t.mapHash} ~* '^[0-9a-f]{64}$'`),
    check("worlds_config_hash_sha256", sql`${t.configHash} ~* '^[0-9a-f]{64}$'`),
    unique("worlds_pin_unique").on(t.worldId, t.configVersion, t.configHash, t.mapId, t.mapHash),
    index("worlds_status_idx").on(t.status, t.startedAt)
  ]
);

export const worldLeases = gameSchema.table(
  "world_leases",
  {
    worldId: uuid("world_id")
      .primaryKey()
      .references(() => worlds.worldId),
    ownerId: text("owner_id").notNull(),
    leaseVersion: bigint("lease_version", { mode: "number" }).notNull().default(0),
    leaseExpiresAt: timestamp("lease_expires_at", {
      withTimezone: true,
      mode: "string"
    }).notNull(),
    heartbeatAt: timestamp("heartbeat_at", { withTimezone: true, mode: "string" }).notNull(),
    acquiredAt: timestamp("acquired_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    check("lease_version_nonneg", sql`${t.leaseVersion} >= 0`),
    check("lease_expiry_order", sql`${t.leaseExpiresAt} > ${t.acquiredAt}`)
  ]
);
