/**
 * Military, Armies, and Battle Schema
 *
 * Implements army entities (garrison and marching), individual unit stacks, and
 * the permanent battle log audit table.
 */

import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  jsonb,
  numeric,
  primaryKey,
  smallint,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";
import {
  armyPurposeEnum,
  armyStateEnum,
  battleResultEnum,
  controllerTypeEnum,
  gameSchema,
  movementModeEnum,
  unitTypeEnum
} from "./enums.js";
import { factions, rebellions } from "./factions.js";
import { worldRegions } from "./regions.js";
import { worlds } from "./worlds.js";

export const armies = gameSchema.table(
  "armies",
  {
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.worldId),
    armyId: bigint("army_id", { mode: "number" }).notNull(),
    ownerFactionId: bigint("owner_faction_id", { mode: "number" }),
    rebelGroupId: bigint("rebel_group_id", { mode: "number" }),
    state: armyStateEnum("state").notNull(),
    purpose: armyPurposeEnum("purpose"),
    mode: movementModeEnum("mode"),
    locationProvinceId: smallint("location_province_id"),
    originProvinceId: smallint("origin_province_id"),
    targetProvinceId: smallint("target_province_id"),
    departAt: timestamp("depart_at", { withTimezone: true, mode: "string" }),
    arriveAt: timestamp("arrive_at", { withTimezone: true, mode: "string" }),
    fatigueUntil: timestamp("fatigue_until", { withTimezone: true, mode: "string" }),
    recallable: boolean("recallable").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    destroyedAt: timestamp("destroyed_at", { withTimezone: true, mode: "string" })
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.armyId] }),
    foreignKey({
      columns: [t.worldId, t.ownerFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.rebelGroupId],
      foreignColumns: [rebellions.worldId, rebellions.rebellionId]
    }),
    foreignKey({
      columns: [t.worldId, t.locationProvinceId],
      foreignColumns: [worldRegions.worldId, worldRegions.provinceId]
    }),
    foreignKey({
      columns: [t.worldId, t.originProvinceId],
      foreignColumns: [worldRegions.worldId, worldRegions.provinceId]
    }),
    foreignKey({
      columns: [t.worldId, t.targetProvinceId],
      foreignColumns: [worldRegions.worldId, worldRegions.provinceId]
    }),
    check("armies_id_pos", sql`${t.armyId} > 0`),
    check(
      "army_owner_xor",
      sql`(${t.ownerFactionId} is not null) <> (${t.rebelGroupId} is not null)`
    ),
    check(
      "army_state_shape",
      sql`(${t.state} = 'garrison' and ${t.locationProvinceId} is not null and ${t.originProvinceId} is null and ${t.targetProvinceId} is null and ${t.purpose} is null and ${t.mode} is null and ${t.departAt} is null and ${t.arriveAt} is null) or (${t.state} in ('marching', 'resolving') and ${t.locationProvinceId} is null and ${t.originProvinceId} is not null and ${t.targetProvinceId} is not null and ${t.purpose} is not null and ${t.mode} is not null and ${t.departAt} is not null and ${t.arriveAt} is not null) or (${t.state} = 'destroyed' and ${t.destroyedAt} is not null)`
    ),
    check(
      "army_time_order",
      sql`${t.departAt} is null or ${t.arriveAt} is null or ${t.arriveAt} > ${t.departAt}`
    ),
    check(
      "army_origin_target",
      sql`${t.originProvinceId} is null or ${t.targetProvinceId} is null or ${t.originProvinceId} <> ${t.targetProvinceId}`
    ),
    check("army_garrison_recallable", sql`${t.state} <> 'garrison' or not ${t.recallable}`),
    index("armies_arrival_idx").on(t.worldId, t.state, t.arriveAt),
    index("armies_owner_idx").on(t.worldId, t.ownerFactionId),
    index("armies_rebel_idx")
      .on(t.worldId, t.rebelGroupId)
      .where(sql`${t.rebelGroupId} is not null`)
  ]
);

export const armyUnits = gameSchema.table(
  "army_units",
  {
    worldId: uuid("world_id").notNull(),
    armyId: bigint("army_id", { mode: "number" }).notNull(),
    unitType: unitTypeEnum("unit_type").notNull(),
    count: bigint("count", { mode: "number" }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.armyId, t.unitType] }),
    foreignKey({
      columns: [t.worldId, t.armyId],
      foreignColumns: [armies.worldId, armies.armyId]
    }),
    check("army_units_count_pos", sql`${t.count} > 0`)
  ]
);

export const battleLog = gameSchema.table(
  "battle_log",
  {
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.worldId),
    battleId: bigint("battle_id", { mode: "number" }).notNull(),
    provinceId: smallint("province_id").notNull(),
    attackerControllerType: controllerTypeEnum("attacker_controller_type").notNull(),
    attackerFactionId: bigint("attacker_faction_id", { mode: "number" }),
    defenderControllerType: controllerTypeEnum("defender_controller_type").notNull(),
    defenderFactionId: bigint("defender_faction_id", { mode: "number" }),
    attackerArmyId: bigint("attacker_army_id", { mode: "number" }).notNull(),
    defenderArmyIds: bigint("defender_army_ids", { mode: "number" })
      .array()
      .notNull()
      .default(sql`'{}'::bigint[]`),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }).notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "string" }).notNull(),
    result: battleResultEnum("result").notNull(),
    provinceLevelBefore: smallint("province_level_before").notNull(),
    provinceLevelAfter: smallint("province_level_after").notNull(),
    attackerPower: numeric("attacker_power", { precision: 18, scale: 6 }).notNull(),
    defenderPower: numeric("defender_power", { precision: 18, scale: 6 }).notNull(),
    attackerUnits: jsonb("attacker_units").notNull(),
    defenderUnits: jsonb("defender_units").notNull(),
    attackerLosses: jsonb("attacker_losses").notNull(),
    defenderLosses: jsonb("defender_losses").notNull(),
    attackerMultipliers: jsonb("attacker_multipliers").notNull(),
    defenderMultipliers: jsonb("defender_multipliers").notNull(),
    loot: jsonb("loot").notNull().default({}),
    supportChanges: jsonb("support_changes").notNull().default({}),
    newOwnerFactionId: bigint("new_owner_faction_id", { mode: "number" }),
    publicSummary: jsonb("public_summary").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.battleId] }),
    foreignKey({
      columns: [t.worldId, t.provinceId],
      foreignColumns: [worldRegions.worldId, worldRegions.provinceId]
    }),
    foreignKey({
      columns: [t.worldId, t.attackerFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.defenderFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.attackerArmyId],
      foreignColumns: [armies.worldId, armies.armyId]
    }),
    foreignKey({
      columns: [t.worldId, t.newOwnerFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("battle_id_pos", sql`${t.battleId} > 0`),
    check(
      "battle_attacker_controller_valid",
      sql`${t.attackerControllerType} in ('player', 'ai', 'rebel')`
    ),
    check(
      "battle_defender_controller_valid",
      sql`${t.defenderControllerType} in ('none', 'player', 'ai', 'rebel')`
    ),
    check("battle_province_level_before_range", sql`${t.provinceLevelBefore} between 1 and 5`),
    check("battle_province_level_after_range", sql`${t.provinceLevelAfter} between 1 and 5`),
    check("battle_attacker_power_nonneg", sql`${t.attackerPower} >= 0`),
    check("battle_defender_power_nonneg", sql`${t.defenderPower} >= 0`),
    check("battle_time_order", sql`${t.resolvedAt} >= ${t.startedAt}`),
    check(
      "battle_attacker_shape",
      sql`(${t.attackerControllerType} in ('player', 'ai') and ${t.attackerFactionId} is not null) or (${t.attackerControllerType} = 'rebel' and ${t.attackerFactionId} is null)`
    ),
    check(
      "battle_defender_shape",
      sql`(${t.defenderControllerType} in ('player', 'ai') and ${t.defenderFactionId} is not null) or (${t.defenderControllerType} in ('none', 'rebel') and ${t.defenderFactionId} is null)`
    ),
    index("battle_log_province_idx").on(t.worldId, t.provinceId, t.resolvedAt)
  ]
);
