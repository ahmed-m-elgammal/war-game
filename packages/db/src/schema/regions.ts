/**
 * World Region and Province Schema
 *
 * Implements per-world province states, static neutral defenders, and daily
 * support swing accounting.
 */

import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  numeric,
  primaryKey,
  smallint,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { controllerTypeEnum, gameSchema, resourceTypeEnum, unitTypeEnum } from "./enums.js";
import { factions, rebellions } from "./factions.js";
import { worlds } from "./worlds.js";

export const worldRegions = gameSchema.table(
  "world_regions",
  {
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.worldId),
    provinceId: smallint("province_id").notNull(),
    ownerFactionId: bigint("owner_faction_id", { mode: "number" }),
    controllerType: controllerTypeEnum("controller_type").notNull(),
    rebelGroupId: bigint("rebel_group_id", { mode: "number" }),
    lastAttackerFactionId: bigint("last_attacker_faction_id", { mode: "number" }),
    level: smallint("level").notNull().default(1),
    terrainResource: resourceTypeEnum("terrain_resource").notNull(),
    isCapital: boolean("is_capital").notNull().default(false),
    isRefugee: boolean("is_refugee").notNull().default(false),
    capturedAt: timestamp("captured_at", { withTimezone: true, mode: "string" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.provinceId] }),
    foreignKey({
      columns: [t.worldId, t.ownerFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.rebelGroupId],
      foreignColumns: [rebellions.worldId, rebellions.rebellionId]
    }),
    foreignKey({
      columns: [t.worldId, t.lastAttackerFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("regions_province_id_range", sql`${t.provinceId} between 1 and 254`),
    check("regions_level_range", sql`${t.level} between 1 and 5`),
    check(
      "region_controller",
      sql`(${t.controllerType} = 'none' and ${t.ownerFactionId} is null and ${t.rebelGroupId} is null) or (${t.controllerType} in ('player', 'ai') and ${t.ownerFactionId} is not null and ${t.rebelGroupId} is null) or (${t.controllerType} = 'rebel' and ${t.ownerFactionId} is null and ${t.rebelGroupId} is not null)`
    ),
    check(
      "region_capital_owner",
      sql`not ${t.isCapital} or (${t.ownerFactionId} is not null and ${t.controllerType} = 'player')`
    ),
    check(
      "region_refugee_state",
      sql`not ${t.isRefugee} or (${t.ownerFactionId} is null and ${t.rebelGroupId} is null and ${t.level} = 1)`
    ),
    check(
      "region_rebel_last_attacker",
      sql`${t.controllerType} <> 'rebel' or ${t.lastAttackerFactionId} is null`
    ),
    index("world_regions_owner_idx").on(t.worldId, t.ownerFactionId),
    uniqueIndex("world_regions_one_capital_idx")
      .on(t.worldId, t.ownerFactionId)
      .where(sql`${t.isCapital}`),
    index("world_regions_rebel_idx")
      .on(t.worldId, t.rebelGroupId)
      .where(sql`${t.rebelGroupId} is not null`)
  ]
);

export const neutralGarrisons = gameSchema.table(
  "neutral_garrisons",
  {
    worldId: uuid("world_id").notNull(),
    provinceId: smallint("province_id").notNull(),
    unitType: unitTypeEnum("unit_type").notNull(),
    count: bigint("count", { mode: "number" }).notNull()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.provinceId, t.unitType] }),
    foreignKey({
      columns: [t.worldId, t.provinceId],
      foreignColumns: [worldRegions.worldId, worldRegions.provinceId]
    }),
    check("neutral_garrisons_count_pos", sql`${t.count} > 0`)
  ]
);

export const supportDaily = gameSchema.table(
  "support_daily",
  {
    worldId: uuid("world_id").notNull(),
    factionId: bigint("faction_id", { mode: "number" }).notNull(),
    provinceId: smallint("province_id").notNull(),
    worldDay: smallint("world_day").notNull(),
    netDelta: numeric("net_delta", { precision: 8, scale: 3 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.factionId, t.provinceId, t.worldDay] }),
    foreignKey({
      columns: [t.worldId, t.factionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.provinceId],
      foreignColumns: [worldRegions.worldId, worldRegions.provinceId]
    }),
    check("support_daily_world_day_range", sql`${t.worldDay} between 1 and 30`)
  ]
);
