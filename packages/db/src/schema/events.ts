/**
 * World Events, Snapshots, Receipts, and Season Results Schema
 *
 * Implements the append-only input log, compressed binary snapshots, idempotency
 * command receipts, and final post-freeze season rankings.
 */

import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  check,
  customType,
  foreignKey,
  index,
  jsonb,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts.js";
import { eventActorTypeEnum, gameSchema, worldEventTypeEnum } from "./enums.js";
import { factions } from "./factions.js";
import { worlds } from "./worlds.js";

export const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType() {
    return "bytea";
  }
});

export const worldEvents = gameSchema.table(
  "world_events",
  {
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.worldId),
    seq: bigint("seq", { mode: "number" }).notNull(),
    type: worldEventTypeEnum("type").notNull(),
    commandType: text("command_type"),
    actorType: eventActorTypeEnum("actor_type").notNull(),
    actorAccountId: uuid("actor_account_id").references(() => accounts.accountId),
    actorFactionId: bigint("actor_faction_id", { mode: "number" }),
    commandId: uuid("command_id"),
    effectiveAt: timestamp("effective_at", { withTimezone: true, mode: "string" }).notNull(),
    priority: smallint("priority").notNull().default(80),
    payload: jsonb("payload").notNull(),
    leaseVersion: bigint("lease_version", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.seq] }),
    foreignKey({
      columns: [t.worldId, t.actorFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("world_events_seq_pos", sql`${t.seq} > 0`),
    check("world_events_priority_range", sql`${t.priority} between 0 and 80`),
    check("world_events_lease_version_nonneg", sql`${t.leaseVersion} >= 0`),
    check(
      "world_event_actor_shape",
      sql`(${t.actorType} = 'system' and ${t.actorAccountId} is null and ${t.actorFactionId} is null) or (${t.actorType} = 'account' and ${t.actorAccountId} is not null and ${t.actorFactionId} is null) or (${t.actorType} = 'admin' and ${t.actorAccountId} is not null and ${t.actorFactionId} is null) or (${t.actorType} = 'faction' and ${t.actorFactionId} is not null and ${t.actorAccountId} is null)`
    ),
    check("world_event_payload_object", sql`jsonb_typeof(${t.payload}) = 'object'`),
    index("world_events_order_idx").on(t.worldId, t.effectiveAt, t.priority, t.seq),
    index("world_events_command_idx")
      .on(t.worldId, t.commandId)
      .where(sql`${t.commandId} is not null`)
  ]
);

export const worldSnapshots = gameSchema.table(
  "world_snapshots",
  {
    worldId: uuid("world_id").notNull(),
    seq: bigint("seq", { mode: "number" }).notNull(),
    tick: bigint("tick", { mode: "number" }).notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true, mode: "string" }).notNull(),
    stateGzip: bytea("state_gzip").notNull(),
    stateHash: bytea("state_hash").notNull(),
    lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull(),
    configVersion: text("config_version").notNull(),
    configHash: char("config_hash", { length: 64 }).notNull(),
    mapId: text("map_id").notNull(),
    mapHash: char("map_hash", { length: 64 }).notNull(),
    leaseVersion: bigint("lease_version", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.seq] }),
    foreignKey({
      name: "world_snapshots_world_pin_fk",
      columns: [t.worldId, t.configVersion, t.configHash, t.mapId, t.mapHash],
      foreignColumns: [
        worlds.worldId,
        worlds.configVersion,
        worlds.configHash,
        worlds.mapId,
        worlds.mapHash
      ]
    }),
    check("world_snapshots_seq_pos", sql`${t.seq} > 0`),
    check("world_snapshots_tick_nonneg", sql`${t.tick} >= 0`),
    check("world_snapshots_last_event_seq_nonneg", sql`${t.lastEventSeq} >= 0`),
    check("world_snapshots_lease_version_nonneg", sql`${t.leaseVersion} >= 0`),
    check("snapshot_gzip_nonempty", sql`octet_length(${t.stateGzip}) > 0`),
    check("snapshot_hash_sha256", sql`octet_length(${t.stateHash}) = 32`),
    check("world_snapshots_map_hash_sha256", sql`${t.mapHash} ~* '^[0-9a-f]{64}$'`),
    check("world_snapshots_config_hash_sha256", sql`${t.configHash} ~* '^[0-9a-f]{64}$'`),
    index("world_snapshots_created_idx").on(t.worldId, t.createdAt)
  ]
);

export const commandReceipts = gameSchema.table(
  "command_receipts",
  {
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.accountId),
    commandId: uuid("command_id").notNull(),
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.worldId),
    factionId: bigint("faction_id", { mode: "number" }),
    commandType: text("command_type").notNull(),
    resultCode: text("result_code").notNull(),
    resultPayload: jsonb("result_payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.accountId, t.commandId] }),
    foreignKey({
      columns: [t.worldId, t.factionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("command_receipt_expiry", sql`${t.expiresAt} > ${t.createdAt}`),
    check("command_receipt_payload_object", sql`jsonb_typeof(${t.resultPayload}) = 'object'`),
    index("command_receipts_world_idx").on(t.worldId, t.createdAt),
    index("command_receipts_expiry_idx").on(t.expiresAt)
  ]
);

export const seasonResults = gameSchema.table(
  "season_results",
  {
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.worldId),
    factionId: bigint("faction_id", { mode: "number" }).notNull(),
    accountId: uuid("account_id").references(() => accounts.accountId),
    rank: smallint("rank").notNull(),
    provinceCount: smallint("province_count").notNull(),
    totalTroops: bigint("total_troops", { mode: "number" }).notNull().default(0),
    economyScore: bigint("economy_score", { mode: "number" }).notNull().default(0),
    armyScore: bigint("army_score", { mode: "number" }).notNull().default(0),
    supportScore: bigint("support_score", { mode: "number" }).notNull().default(0),
    totalScore: bigint("total_score", { mode: "number" }).notNull().default(0),
    isPlayerControlled: boolean("is_player_controlled").notNull(),
    isLinked: boolean("is_linked").notNull(),
    isConqueror: boolean("is_conqueror").notNull().default(false),
    isBestNation: boolean("is_best_nation").notNull().default(false),
    titleIds: text("title_ids")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    recap: jsonb("recap").notNull().default({}),
    finalSnapshotSeq: bigint("final_snapshot_seq", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.factionId] }),
    foreignKey({
      columns: [t.worldId, t.factionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.finalSnapshotSeq],
      foreignColumns: [worldSnapshots.worldId, worldSnapshots.seq]
    }),
    check("season_results_rank_pos", sql`${t.rank} >= 1`),
    check("season_results_province_count_nonneg", sql`${t.provinceCount} >= 0`),
    check("season_results_total_troops_nonneg", sql`${t.totalTroops} >= 0`),
    check("season_results_economy_score_nonneg", sql`${t.economyScore} >= 0`),
    check("season_results_army_score_nonneg", sql`${t.armyScore} >= 0`),
    check("season_results_support_score_nonneg", sql`${t.supportScore} >= 0`),
    check("season_results_total_score_nonneg", sql`${t.totalScore} >= 0`),
    check(
      "season_result_ai_account",
      sql`${t.accountId} is not null or not ${t.isPlayerControlled}`
    ),
    check(
      "season_result_award_eligibility",
      sql`(not ${t.isConqueror} and not ${t.isBestNation}) or (${t.isPlayerControlled} and ${t.isLinked})`
    ),
    uniqueIndex("season_results_one_conqueror_idx")
      .on(t.worldId)
      .where(sql`${t.isConqueror}`),
    uniqueIndex("season_results_one_best_nation_idx")
      .on(t.worldId)
      .where(sql`${t.isBestNation}`),
    uniqueIndex("season_results_account_idx")
      .on(t.worldId, t.accountId)
      .where(sql`${t.accountId} is not null`)
  ]
);
