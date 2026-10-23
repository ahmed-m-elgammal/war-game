/**
 * Domain Enums and Closed Constant Sets
 *
 * Provides runtime Zod enum validators and TypeScript literal union types
 * for all fixed value sets defined across the domain model and architecture specs.
 */

import { z } from "zod";

export const RESOURCE_TYPES = ["money", "gold", "food", "water", "oil"] as const;
export const resourceTypeSchema = z.enum(RESOURCE_TYPES);
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const TRADEABLE_RESOURCES = ["food", "water", "oil"] as const;
export const tradeableResourceSchema = z.enum(TRADEABLE_RESOURCES);
export type TradeableResource = (typeof TRADEABLE_RESOURCES)[number];

export const UNIT_TYPES = ["infantry", "tank", "aircraft", "artillery"] as const;
export const unitTypeSchema = z.enum(UNIT_TYPES);
export type UnitType = (typeof UNIT_TYPES)[number];

export const WORLD_STATUSES = ["creating", "open", "running", "finished"] as const;
export const worldStatusSchema = z.enum(WORLD_STATUSES);
export type WorldStatus = (typeof WORLD_STATUSES)[number];

export const OPERATIONAL_STATES = ["paused", "quarantined", "archived"] as const;
export const operationalStateSchema = z.enum(OPERATIONAL_STATES);
export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export const PHASES = ["peace", "war"] as const;
export const phaseSchema = z.enum(PHASES);
export type Phase = (typeof PHASES)[number];

export const FACTION_KINDS = ["player", "ai"] as const;
export const factionKindSchema = z.enum(FACTION_KINDS);
export type FactionKind = (typeof FACTION_KINDS)[number];

export const FACTION_STATES = [
  "pending_spawn",
  "active",
  "eliminated",
  "spectator",
  "ai_controlled",
  "finished"
] as const;
export const factionStateSchema = z.enum(FACTION_STATES);
export type FactionState = (typeof FACTION_STATES)[number];

export const REBELLION_STATES = ["none", "active", "grace"] as const;
export const rebellionStateSchema = z.enum(REBELLION_STATES);
export type RebellionState = (typeof REBELLION_STATES)[number];

export const REBELLION_GROUP_STATES = ["spawned", "holding", "defeated"] as const;
export const rebellionGroupStateSchema = z.enum(REBELLION_GROUP_STATES);
export type RebellionGroupState = (typeof REBELLION_GROUP_STATES)[number];

export const CONTROLLER_TYPES = ["none", "player", "ai", "rebel"] as const;
export const controllerTypeSchema = z.enum(CONTROLLER_TYPES);
export type ControllerType = (typeof CONTROLLER_TYPES)[number];

export const ARMY_STATES = ["garrison", "marching", "resolving", "destroyed"] as const;
export const armyStateSchema = z.enum(ARMY_STATES);
export type ArmyState = (typeof ARMY_STATES)[number];

export const ARMY_PURPOSES = [
  "attack",
  "reinforce",
  "transfer",
  "return",
  "recall_return"
] as const;
export const armyPurposeSchema = z.enum(ARMY_PURPOSES);
export type ArmyPurpose = (typeof ARMY_PURPOSES)[number];

export const MOVEMENT_MODES = ["land", "air", "strategic"] as const;
export const movementModeSchema = z.enum(MOVEMENT_MODES);
export type MovementMode = (typeof MOVEMENT_MODES)[number];

export const BATTLE_RESULTS = [
  "attacker_win",
  "defender_win",
  "capture_no_battle",
  "aborted"
] as const;
export const battleResultSchema = z.enum(BATTLE_RESULTS);
export type BattleResult = (typeof BATTLE_RESULTS)[number];

export const ALLIANCE_STATES = ["active", "dissolved"] as const;
export const allianceStateSchema = z.enum(ALLIANCE_STATES);
export type AllianceState = (typeof ALLIANCE_STATES)[number];

export const ALLIANCE_ROLES = ["leader", "member"] as const;
export const allianceRoleSchema = z.enum(ALLIANCE_ROLES);
export type AllianceRole = (typeof ALLIANCE_ROLES)[number];

export const INVITATION_STATES = [
  "pending",
  "accepted",
  "declined",
  "expired",
  "cancelled"
] as const;
export const invitationStateSchema = z.enum(INVITATION_STATES);
export type InvitationState = (typeof INVITATION_STATES)[number];

export const LEAVE_REASONS = ["left", "kicked", "abandoned", "dissolved"] as const;
export const leaveReasonSchema = z.enum(LEAVE_REASONS);
export type LeaveReason = (typeof LEAVE_REASONS)[number];

export const TRADE_KINDS = ["market_listing", "direct_offer", "state_exchange"] as const;
export const tradeKindSchema = z.enum(TRADE_KINDS);
export type TradeKind = (typeof TRADE_KINDS)[number];

export const TRADE_OFFER_STATES = [
  "open",
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired"
] as const;
export const tradeOfferStateSchema = z.enum(TRADE_OFFER_STATES);
export type TradeOfferState = (typeof TRADE_OFFER_STATES)[number];

export const TRADE_LOG_STATES = ["settled", "rejected", "cancelled", "returned"] as const;
export const tradeLogStateSchema = z.enum(TRADE_LOG_STATES);
export type TradeLogState = (typeof TRADE_LOG_STATES)[number];

export const QUEUE_STATES = ["queued", "running", "completed", "cancelled"] as const;
export const queueStateSchema = z.enum(QUEUE_STATES);
export type QueueState = (typeof QUEUE_STATES)[number];

export const DOCTRINE_WEAPONS = ["rifles", "anti_tank", "anti_air"] as const;
export const doctrineWeaponSchema = z.enum(DOCTRINE_WEAPONS);
export type DoctrineWeapon = (typeof DOCTRINE_WEAPONS)[number];

export const DOCTRINE_SKILLS = ["defender", "raider", "marcher"] as const;
export const doctrineSkillSchema = z.enum(DOCTRINE_SKILLS);
export type DoctrineSkill = (typeof DOCTRINE_SKILLS)[number];

export const ABILITY_TYPES = ["mobilization", "airstrike", "missile_strike"] as const;
export const abilityTypeSchema = z.enum(ABILITY_TYPES);
export type AbilityType = (typeof ABILITY_TYPES)[number];

export const AI_ARCHETYPES = ["garrison", "raider", "expansionist"] as const;
export const aiArchetypeSchema = z.enum(AI_ARCHETYPES);
export type AiArchetype = (typeof AI_ARCHETYPES)[number];

export const ACCOUNT_STATUSES = ["active", "banned", "disabled", "merged"] as const;
export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ENTITLEMENT_KINDS = ["pass", "cosmetic", "title", "badge"] as const;
export const entitlementKindSchema = z.enum(ENTITLEMENT_KINDS);
export type EntitlementKind = (typeof ENTITLEMENT_KINDS)[number];

export const ENTITLEMENT_SOURCES = ["revenuecat", "season_award", "admin_grant", "promo"] as const;
export const entitlementSourceSchema = z.enum(ENTITLEMENT_SOURCES);
export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];

export const ENTITLEMENT_STATUSES = ["active", "expired", "revoked"] as const;
export const entitlementStatusSchema = z.enum(ENTITLEMENT_STATUSES);
export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

export const COSMETIC_SLOTS = [
  "flag",
  "emblem",
  "banner",
  "title",
  "map_pin",
  "capital_monument",
  "nameplate",
  "profile_badge"
] as const;
export const cosmeticSlotSchema = z.enum(COSMETIC_SLOTS);
export type CosmeticSlot = (typeof COSMETIC_SLOTS)[number];

export const PASS_PERIOD_STATUSES = ["active", "expired", "revoked"] as const;
export const passPeriodStatusSchema = z.enum(PASS_PERIOD_STATUSES);
export type PassPeriodStatus = (typeof PASS_PERIOD_STATUSES)[number];

export const PASS_REWARD_STATES = ["locked", "claimable", "claimed", "auto_claimed"] as const;
export const passRewardStateSchema = z.enum(PASS_REWARD_STATES);
export type PassRewardState = (typeof PASS_REWARD_STATES)[number];

export const MISSION_STATES = ["active", "completed", "claimed", "expired"] as const;
export const missionStateSchema = z.enum(MISSION_STATES);
export type MissionState = (typeof MISSION_STATES)[number];

export const SHOP_ITEM_KINDS = ["pass", "cosmetic"] as const;
export const shopItemKindSchema = z.enum(SHOP_ITEM_KINDS);
export type ShopItemKind = (typeof SHOP_ITEM_KINDS)[number];

export const WORLD_EVENT_TYPES = [
  "join",
  "command",
  "admin",
  "season",
  "system",
  "account"
] as const;
export const worldEventTypeSchema = z.enum(WORLD_EVENT_TYPES);
export type WorldEventType = (typeof WORLD_EVENT_TYPES)[number];

export const EVENT_ACTOR_TYPES = ["account", "faction", "admin", "system"] as const;
export const eventActorTypeSchema = z.enum(EVENT_ACTOR_TYPES);
export type EventActorType = (typeof EVENT_ACTOR_TYPES)[number];

export const COMMAND_TYPES = [
  "join_world",
  "launch_army",
  "recall_army",
  "split_army",
  "merge_army",
  "retreat_garrison",
  "reinforce_province",
  "enqueue_build",
  "cancel_build",
  "enqueue_training",
  "cancel_training",
  "purchase_tech",
  "change_doctrine",
  "create_market_listing",
  "create_direct_offer",
  "accept_trade",
  "decline_trade",
  "cancel_trade",
  "state_exchange",
  "create_alliance",
  "invite_to_alliance",
  "accept_alliance_invite",
  "leave_alliance",
  "kick_from_alliance",
  "use_ability"
] as const;
export const commandTypeSchema = z.enum(COMMAND_TYPES);
export type CommandType = (typeof COMMAND_TYPES)[number];
