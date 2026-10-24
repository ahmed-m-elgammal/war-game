/**
 * Database Schema Enumerations
 *
 * Defines all PostgreSQL enum types for the application inside the `game` schema.
 * These types match the locked domain model from plan/schemas/game.schema.sql.
 */

import { pgSchema } from "drizzle-orm/pg-core";

export const gameSchema = pgSchema("game");

export const accountStatusEnum = gameSchema.enum("account_status", [
  "active",
  "banned",
  "disabled",
  "merged"
]);

export const entitlementKindEnum = gameSchema.enum("entitlement_kind", [
  "pass",
  "cosmetic",
  "title",
  "badge"
]);

export const entitlementSourceEnum = gameSchema.enum("entitlement_source", [
  "revenuecat",
  "season_award",
  "admin_grant",
  "promo"
]);

export const entitlementStatusEnum = gameSchema.enum("entitlement_status", [
  "active",
  "expired",
  "revoked"
]);

export const cosmeticSlotEnum = gameSchema.enum("cosmetic_slot", [
  "flag",
  "emblem",
  "banner",
  "title",
  "map_pin",
  "capital_monument",
  "nameplate",
  "profile_badge"
]);

export const passPeriodStatusEnum = gameSchema.enum("pass_period_status", [
  "active",
  "expired",
  "revoked"
]);

export const passRewardStateEnum = gameSchema.enum("pass_reward_state", [
  "locked",
  "claimable",
  "claimed",
  "auto_claimed"
]);

export const missionStateEnum = gameSchema.enum("mission_state", [
  "active",
  "completed",
  "claimed",
  "expired"
]);

export const shopItemKindEnum = gameSchema.enum("shop_item_kind", ["pass", "cosmetic"]);

export const revenuecatStatusEnum = gameSchema.enum("revenuecat_status", [
  "received",
  "processed",
  "ignored",
  "failed"
]);

export const worldStatusEnum = gameSchema.enum("world_status", [
  "creating",
  "open",
  "running",
  "finished"
]);

export const operationalStateEnum = gameSchema.enum("operational_state", [
  "paused",
  "quarantined",
  "archived"
]);

export const factionKindEnum = gameSchema.enum("faction_kind", ["player", "ai"]);

export const factionStateEnum = gameSchema.enum("faction_state", [
  "pending_spawn",
  "active",
  "eliminated",
  "spectator",
  "ai_controlled",
  "finished"
]);

export const rebellionFactionStateEnum = gameSchema.enum("rebellion_faction_state", [
  "none",
  "active",
  "grace"
]);

export const rebellionStateEnum = gameSchema.enum("rebellion_state", [
  "spawned",
  "holding",
  "defeated"
]);

export const controllerTypeEnum = gameSchema.enum("controller_type", [
  "none",
  "player",
  "ai",
  "rebel"
]);

export const resourceTypeEnum = gameSchema.enum("resource_type", [
  "money",
  "gold",
  "food",
  "water",
  "oil"
]);

export const tradeableResourceEnum = gameSchema.enum("tradeable_resource", [
  "food",
  "water",
  "oil"
]);

export const unitTypeEnum = gameSchema.enum("unit_type", [
  "infantry",
  "tank",
  "aircraft",
  "artillery"
]);

export const doctrineWeaponEnum = gameSchema.enum("doctrine_weapon", [
  "rifles",
  "anti_tank",
  "anti_air"
]);

export const doctrineSkillEnum = gameSchema.enum("doctrine_skill", [
  "defender",
  "raider",
  "marcher"
]);

export const abilityTypeEnum = gameSchema.enum("ability_type", [
  "mobilization",
  "airstrike",
  "missile_strike"
]);

export const aiArchetypeEnum = gameSchema.enum("ai_archetype", [
  "garrison",
  "raider",
  "expansionist"
]);

export const armyStateEnum = gameSchema.enum("army_state", [
  "garrison",
  "marching",
  "resolving",
  "destroyed"
]);

export const armyPurposeEnum = gameSchema.enum("army_purpose", [
  "attack",
  "reinforce",
  "transfer",
  "return",
  "recall_return"
]);

export const movementModeEnum = gameSchema.enum("movement_mode", ["land", "air", "strategic"]);

export const battleResultEnum = gameSchema.enum("battle_result", [
  "attacker_win",
  "defender_win",
  "capture_no_battle",
  "aborted"
]);

export const allianceStateEnum = gameSchema.enum("alliance_state", ["active", "dissolved"]);

export const allianceRoleEnum = gameSchema.enum("alliance_role", ["leader", "member"]);

export const invitationStateEnum = gameSchema.enum("invitation_state", [
  "pending",
  "accepted",
  "declined",
  "expired",
  "cancelled"
]);

export const leaveReasonEnum = gameSchema.enum("leave_reason", [
  "left",
  "kicked",
  "abandoned",
  "dissolved"
]);

export const tradeKindEnum = gameSchema.enum("trade_kind", [
  "market_listing",
  "direct_offer",
  "state_exchange"
]);

export const tradeOfferStateEnum = gameSchema.enum("trade_offer_state", [
  "open",
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired"
]);

export const tradeLogStateEnum = gameSchema.enum("trade_log_state", [
  "settled",
  "rejected",
  "cancelled",
  "returned"
]);

export const queueStateEnum = gameSchema.enum("queue_state", [
  "queued",
  "running",
  "completed",
  "cancelled"
]);

export const worldEventTypeEnum = gameSchema.enum("world_event_type", [
  "join",
  "command",
  "admin",
  "season",
  "system",
  "account"
]);

export const eventActorTypeEnum = gameSchema.enum("event_actor_type", [
  "account",
  "faction",
  "admin",
  "system"
]);

export const reportTargetTypeEnum = gameSchema.enum("report_target_type", ["account", "faction"]);

export const reportStateEnum = gameSchema.enum("report_state", [
  "open",
  "reviewed",
  "actioned",
  "dismissed"
]);
