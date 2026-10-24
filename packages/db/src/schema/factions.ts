/**
 * Faction and Doctrine Schema
 *
 * Implements per-world faction participants, resource stockpiles, tech unlocks,
 * doctrine choices, and provincial rebellions.
 *
 * Circular Constraints:
 * - factions(world_id, capital_province_id) -> world_regions(world_id, province_id)
 * - rebellions(world_id, province_id) -> world_regions(world_id, province_id)
 * Both are enforced via DEFERRABLE INITIALLY DEFERRED foreign keys defined in
 * DEFERRED_FOREIGN_KEYS and the initial database migration.
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
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts.js";
import {
  aiArchetypeEnum,
  doctrineSkillEnum,
  doctrineWeaponEnum,
  factionKindEnum,
  factionStateEnum,
  gameSchema,
  rebellionFactionStateEnum,
  rebellionStateEnum,
  resourceTypeEnum
} from "./enums.js";
import { worlds } from "./worlds.js";

export const factions = gameSchema.table(
  "factions",
  {
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.worldId),
    factionId: bigint("faction_id", { mode: "number" }).notNull(),
    accountId: uuid("account_id").references(() => accounts.accountId),
    kind: factionKindEnum("kind").notNull(),
    state: factionStateEnum("state").notNull(),
    name: text("name").notNull(),
    nameKey: text("name_key").notNull(),
    emblemId: text("emblem_id").notNull(),
    colorId: text("color_id").notNull(),
    capitalProvinceId: smallint("capital_province_id"),
    support: smallint("support").notNull().default(60),
    supportRemainder: numeric("support_remainder", { precision: 18, scale: 6 })
      .notNull()
      .default("0"),
    rebellionState: rebellionFactionStateEnum("rebellion_state").notNull().default("none"),
    rebellionGraceUntil: timestamp("rebellion_grace_until", {
      withTimezone: true,
      mode: "string"
    }),
    protectionUntil: timestamp("protection_until", {
      withTimezone: true,
      mode: "string"
    }),
    era: smallint("era").notNull().default(1),
    voluntaryRelocationUsed: boolean("voluntary_relocation_used").notNull().default(false),
    buildSlots: smallint("build_slots").notNull().default(1),
    trainingSlots: smallint("training_slots").notNull().default(1),
    doctrineWeapon: doctrineWeaponEnum("doctrine_weapon"),
    doctrineSkill: doctrineSkillEnum("doctrine_skill"),
    aiArchetype: aiArchetypeEnum("ai_archetype"),
    aiState: jsonb("ai_state"),
    publicScore: bigint("public_score", { mode: "number" }).notNull().default(0),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "string" }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "string" }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true, mode: "string" }),
    eliminatedAt: timestamp("eliminated_at", { withTimezone: true, mode: "string" }),
    finishedAt: timestamp("finished_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.factionId] }),
    check("faction_id_pos", sql`${t.factionId} > 0`),
    check(
      "faction_capital_province_range",
      sql`${t.capitalProvinceId} is null or ${t.capitalProvinceId} between 1 and 254`
    ),
    check("faction_support_range", sql`${t.support} between 0 and 100`),
    check(
      "faction_support_remainder_range",
      sql`${t.supportRemainder} >= 0 and ${t.supportRemainder} < 1`
    ),
    check("faction_era_range", sql`${t.era} between 1 and 4`),
    check("faction_build_slots_range", sql`${t.buildSlots} between 1 and 2`),
    check("faction_training_slots_range", sql`${t.trainingSlots} between 1 and 2`),
    check("faction_public_score_nonneg", sql`${t.publicScore} >= 0`),
    check("faction_name_len", sql`char_length(${t.name}) between 1 and 32`),
    check(
      "faction_ai_account",
      sql`(${t.kind} = 'ai' and ${t.accountId} is null and ${t.aiArchetype} is not null) or (${t.kind} = 'player' and ${t.accountId} is not null and (${t.aiArchetype} is null or ${t.state} = 'ai_controlled'))`
    ),
    check(
      "faction_ai_controlled_archetype",
      sql`${t.state} <> 'ai_controlled' or ${t.aiArchetype} is not null`
    ),
    check("faction_ai_no_capital", sql`${t.kind} <> 'ai' or ${t.capitalProvinceId} is null`),
    check(
      "faction_rebellion_grace",
      sql`(${t.rebellionState} = 'grace' and ${t.rebellionGraceUntil} is not null) or (${t.rebellionState} <> 'grace' and ${t.rebellionGraceUntil} is null)`
    ),
    check(
      "faction_ai_state_object",
      sql`${t.aiState} is null or jsonb_typeof(${t.aiState}) = 'object'`
    ),
    uniqueIndex("factions_account_world_idx")
      .on(t.worldId, t.accountId)
      .where(sql`${t.accountId} is not null`),
    index("factions_world_state_idx").on(t.worldId, t.state),
    index("factions_name_key_idx").on(t.worldId, t.nameKey)
  ]
);

export const factionResources = gameSchema.table(
  "faction_resources",
  {
    worldId: uuid("world_id").notNull(),
    factionId: bigint("faction_id", { mode: "number" }).notNull(),
    resourceType: resourceTypeEnum("resource_type").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull().default(0),
    remainder: numeric("remainder", { precision: 18, scale: 6 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.factionId, t.resourceType] }),
    foreignKey({
      columns: [t.worldId, t.factionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("faction_resources_amount_nonneg", sql`${t.amount} >= 0`),
    check("faction_resources_remainder_range", sql`${t.remainder} >= 0 and ${t.remainder} < 1`)
  ]
);

export const factionTechs = gameSchema.table(
  "faction_techs",
  {
    worldId: uuid("world_id").notNull(),
    factionId: bigint("faction_id", { mode: "number" }).notNull(),
    techId: text("tech_id").notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.factionId, t.techId] }),
    foreignKey({
      columns: [t.worldId, t.factionId],
      foreignColumns: [factions.worldId, factions.factionId]
    })
  ]
);

export const doctrineLog = gameSchema.table(
  "doctrine_log",
  {
    worldId: uuid("world_id").notNull(),
    changeId: bigint("change_id", { mode: "number" }).notNull(),
    factionId: bigint("faction_id", { mode: "number" }).notNull(),
    oldWeapon: doctrineWeaponEnum("old_weapon"),
    newWeapon: doctrineWeaponEnum("new_weapon"),
    oldSkill: doctrineSkillEnum("old_skill"),
    newSkill: doctrineSkillEnum("new_skill"),
    changedAt: timestamp("changed_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.changeId] }),
    foreignKey({
      columns: [t.worldId, t.factionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("doctrine_log_change_id_pos", sql`${t.changeId} > 0`)
  ]
);

export const rebellions = gameSchema.table(
  "rebellions",
  {
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.worldId),
    rebellionId: bigint("rebellion_id", { mode: "number" }).notNull(),
    originFactionId: bigint("origin_faction_id", { mode: "number" }).notNull(),
    provinceId: smallint("province_id").notNull(),
    state: rebellionStateEnum("state").notNull(),
    spawnedAt: timestamp("spawned_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    defeatedAt: timestamp("defeated_at", { withTimezone: true, mode: "string" })
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.rebellionId] }),
    foreignKey({
      columns: [t.worldId, t.originFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("rebellions_id_pos", sql`${t.rebellionId} > 0`),
    check("rebellions_province_id_range", sql`${t.provinceId} between 1 and 254`),
    check(
      "rebellion_defeated_time",
      sql`(${t.state} = 'defeated' and ${t.defeatedAt} is not null) or (${t.state} in ('spawned', 'holding') and ${t.defeatedAt} is null)`
    ),
    uniqueIndex("rebellions_one_active_per_origin_idx")
      .on(t.worldId, t.originFactionId)
      .where(sql`${t.state} in ('spawned', 'holding')`)
  ]
);
