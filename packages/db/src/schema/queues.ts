/**
 * Queues and Cooldowns Schema
 *
 * Implements building construction queues, unit recruitment queues, active
 * ability cooldowns, and the bilateral 24h ex-ally attack cooldown.
 */

import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import {
  abilityTypeEnum,
  gameSchema,
  leaveReasonEnum,
  queueStateEnum,
  resourceTypeEnum,
  unitTypeEnum
} from "./enums.js";
import { factions } from "./factions.js";
import { worldRegions } from "./regions.js";

export const buildQueue = gameSchema.table(
  "build_queue",
  {
    worldId: uuid("world_id").notNull(),
    orderId: bigint("order_id", { mode: "number" }).notNull(),
    factionId: bigint("faction_id", { mode: "number" }).notNull(),
    provinceId: smallint("province_id").notNull(),
    fromLevel: smallint("from_level").notNull(),
    toLevel: smallint("to_level").notNull(),
    state: queueStateEnum("state").notNull().default("queued"),
    enqueuedAt: timestamp("enqueued_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }),
    finishesAt: timestamp("finishes_at", { withTimezone: true, mode: "string" }),
    costMoney: bigint("cost_money", { mode: "number" }).notNull().default(0),
    costResourceType: resourceTypeEnum("cost_resource_type"),
    costResourceAmount: bigint("cost_resource_amount", { mode: "number" }).notNull().default(0),
    refundAmount: bigint("refund_amount", { mode: "number" }).notNull().default(0),
    cancelReason: text("cancel_reason"),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" })
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.orderId] }),
    foreignKey({
      columns: [t.worldId, t.factionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.provinceId],
      foreignColumns: [worldRegions.worldId, worldRegions.provinceId]
    }),
    check("build_queue_order_id_pos", sql`${t.orderId} > 0`),
    check("build_queue_from_level_range", sql`${t.fromLevel} between 1 and 4`),
    check("build_queue_to_level_range", sql`${t.toLevel} between 2 and 5`),
    check("build_level_order", sql`${t.toLevel} = ${t.fromLevel} + 1`),
    check("build_queue_cost_money_nonneg", sql`${t.costMoney} >= 0`),
    check("build_queue_cost_amount_nonneg", sql`${t.costResourceAmount} >= 0`),
    check("build_queue_refund_amount_nonneg", sql`${t.refundAmount} >= 0`),
    check(
      "build_cost_resource_shape",
      sql`(${t.costResourceType} is null and ${t.costResourceAmount} = 0) or (${t.costResourceType} is not null and ${t.costResourceAmount} > 0)`
    ),
    check(
      "build_state_time",
      sql`(${t.state} = 'queued' and ${t.startedAt} is null and ${t.finishesAt} is null and ${t.completedAt} is null and ${t.cancelReason} is null) or (${t.state} = 'running' and ${t.startedAt} is not null and ${t.finishesAt} is not null and ${t.completedAt} is null and ${t.cancelReason} is null) or (${t.state} = 'completed' and ${t.startedAt} is not null and ${t.finishesAt} is not null and ${t.completedAt} is not null and ${t.cancelReason} is null) or (${t.state} = 'cancelled' and ${t.completedAt} is null and ${t.cancelReason} is not null)`
    ),
    check(
      "build_finish_order",
      sql`${t.finishesAt} is null or ${t.startedAt} is null or ${t.finishesAt} > ${t.startedAt}`
    ),
    uniqueIndex("build_queue_one_running_idx")
      .on(t.worldId, t.factionId)
      .where(sql`${t.state} = 'running'`),
    uniqueIndex("build_queue_one_active_per_province_idx")
      .on(t.worldId, t.provinceId)
      .where(sql`${t.state} in ('queued', 'running')`)
  ]
);

export const trainingQueue = gameSchema.table(
  "training_queue",
  {
    worldId: uuid("world_id").notNull(),
    orderId: bigint("order_id", { mode: "number" }).notNull(),
    factionId: bigint("faction_id", { mode: "number" }).notNull(),
    provinceId: smallint("province_id").notNull(),
    unitType: unitTypeEnum("unit_type").notNull(),
    count: bigint("count", { mode: "number" }).notNull(),
    state: queueStateEnum("state").notNull().default("queued"),
    enqueuedAt: timestamp("enqueued_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }),
    finishesAt: timestamp("finishes_at", { withTimezone: true, mode: "string" }),
    costMoney: bigint("cost_money", { mode: "number" }).notNull().default(0),
    costResourceType: resourceTypeEnum("cost_resource_type"),
    costResourceAmount: bigint("cost_resource_amount", { mode: "number" }).notNull().default(0),
    refundAmount: bigint("refund_amount", { mode: "number" }).notNull().default(0),
    cancelReason: text("cancel_reason"),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" })
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.orderId] }),
    foreignKey({
      columns: [t.worldId, t.factionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.provinceId],
      foreignColumns: [worldRegions.worldId, worldRegions.provinceId]
    }),
    check("training_queue_order_id_pos", sql`${t.orderId} > 0`),
    check("training_queue_unit_type_valid", sql`${t.unitType} <> 'infantry'`),
    check("training_queue_count_pos", sql`${t.count} > 0`),
    check("training_queue_cost_money_nonneg", sql`${t.costMoney} >= 0`),
    check("training_queue_cost_amount_nonneg", sql`${t.costResourceAmount} >= 0`),
    check("training_queue_refund_amount_nonneg", sql`${t.refundAmount} >= 0`),
    check(
      "training_cost_resource_shape",
      sql`(${t.costResourceType} is null and ${t.costResourceAmount} = 0) or (${t.costResourceType} is not null and ${t.costResourceAmount} > 0)`
    ),
    check(
      "training_state_time",
      sql`(${t.state} = 'queued' and ${t.startedAt} is null and ${t.finishesAt} is null and ${t.completedAt} is null and ${t.cancelReason} is null) or (${t.state} = 'running' and ${t.startedAt} is not null and ${t.finishesAt} is not null and ${t.completedAt} is null and ${t.cancelReason} is null) or (${t.state} = 'completed' and ${t.startedAt} is not null and ${t.finishesAt} is not null and ${t.completedAt} is not null and ${t.cancelReason} is null) or (${t.state} = 'cancelled' and ${t.completedAt} is null and ${t.cancelReason} is not null)`
    ),
    check(
      "training_finish_order",
      sql`${t.finishesAt} is null or ${t.startedAt} is null or ${t.finishesAt} > ${t.startedAt}`
    ),
    uniqueIndex("training_queue_one_running_idx")
      .on(t.worldId, t.factionId)
      .where(sql`${t.state} = 'running'`)
  ]
);

export const abilityCooldowns = gameSchema.table(
  "ability_cooldowns",
  {
    worldId: uuid("world_id").notNull(),
    factionId: bigint("faction_id", { mode: "number" }).notNull(),
    ability: abilityTypeEnum("ability").notNull(),
    readyAt: timestamp("ready_at", { withTimezone: true, mode: "string" }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "string" }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.factionId, t.ability] }),
    foreignKey({
      columns: [t.worldId, t.factionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("ability_cooldown_order", sql`${t.readyAt} > ${t.lastUsedAt}`)
  ]
);

export const exAllyCooldowns = gameSchema.table(
  "ex_ally_cooldowns",
  {
    worldId: uuid("world_id").notNull(),
    factionAId: bigint("faction_a_id", { mode: "number" }).notNull(),
    factionBId: bigint("faction_b_id", { mode: "number" }).notNull(),
    until: timestamp("until", { withTimezone: true, mode: "string" }).notNull(),
    reason: leaveReasonEnum("reason").notNull()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.factionAId, t.factionBId] }),
    foreignKey({
      columns: [t.worldId, t.factionAId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.factionBId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("ex_ally_reason_valid", sql`${t.reason} in ('left', 'kicked')`),
    check("ex_ally_order", sql`${t.factionAId} < ${t.factionBId}`)
  ]
);
