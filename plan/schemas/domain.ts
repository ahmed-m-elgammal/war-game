/**
 * WARGAME v1 domain model — planning artifact.
 *
 * This file is the type-level target for `packages/shared/src/domain` once the
 * implementation starts. It is deliberately dependency-free: no Drizzle,
 * Colyseus, React, or Supabase imports.
 *
 * Authority:
 * - `specs/09-v1-design-lock.md` is the v1 lock.
 * - `plan/03-gameplay-rules.md` defines gameplay transitions.
 * - `plan/05-architecture.md` defines runtime and persistence ownership.
 * - `plan/06-data-model.md` explains these types and their storage mapping.
 *
 * Values marked TBD in `03`/`09` are represented as fields, not as invented
 * constants. Configuration supplies the values at runtime.
 */

/* -------------------------------------------------------------------------- */
/* Primitive conventions                                                      */
/* -------------------------------------------------------------------------- */

export type Brand<T, B extends string> = T & { readonly __brand: B };

/** Supabase Auth user id. Immutable for the life of the account. */
export type AccountId = Brand<string, "AccountId">;

/** Server-created world id. Stable for the life of the world/season. */
export type WorldId = Brand<string, "WorldId">;

/** Per-world monotonic id. Never reuse an id inside a world. */
export type FactionId = Brand<number, "FactionId">;
export type ArmyId = Brand<number, "ArmyId">;
export type BattleId = Brand<number, "BattleId">;
export type TradeOfferId = Brand<number, "TradeOfferId">;
export type TradeId = Brand<number, "TradeId">;
export type AllianceId = Brand<number, "AllianceId">;
export type AllianceMembershipId = Brand<number, "AllianceMembershipId">;
export type AllianceInvitationId = Brand<number, "AllianceInvitationId">;
export type BuildOrderId = Brand<number, "BuildOrderId">;
export type TrainingOrderId = Brand<number, "TrainingOrderId">;
export type RebellionId = Brand<number, "RebellionId">;
export type DoctrineChangeId = Brand<number, "DoctrineChangeId">;

/** Static map region id. It is also the mask colour id. */
export type ProvinceId = Brand<number, "ProvinceId">;

/** Client-generated idempotency key, unique per account. */
export type CommandId = Brand<string, "CommandId">;

/** ISO-8601 UTC timestamp. The server clock is authoritative. */
export type Timestamp = string;

/** Safe non-negative integer. DB columns may be BIGINT; the API rejects values
 * above Number.MAX_SAFE_INTEGER. */
export type UInt = number;

/** Fixed-point remainder for a continuous rate. Always in [0, 1). */
export type RateRemainder = number;

export type Era = 1 | 2 | 3 | 4;
export type ProvinceLevel = 1 | 2 | 3 | 4 | 5;
export type QueueSlots = 1 | 2;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export interface JsonObject {
  readonly [key: string]: JsonValue;
}

/* -------------------------------------------------------------------------- */
/* Enums and closed value sets                                                */
/* -------------------------------------------------------------------------- */

export const RESOURCE_TYPES = ["money", "gold", "food", "water", "oil"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

/** Tradeable resources. Gold is the currency; money is not transferable. */
export const TRADEABLE_RESOURCES = ["food", "water", "oil"] as const;
export type TradeableResource = (typeof TRADEABLE_RESOURCES)[number];

/** The fourth slot is artillery in Era 1 and missile/artillery from Era 2. */
export const UNIT_TYPES = ["infantry", "tank", "aircraft", "artillery"] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const WORLD_STATUSES = ["creating", "open", "running", "finished"] as const;
export type WorldStatus = (typeof WORLD_STATUSES)[number];

export const OPERATIONAL_STATES = ["paused", "quarantined", "archived"] as const;
export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export const PHASES = ["peace", "war"] as const;
export type Phase = (typeof PHASES)[number];

export const FACTION_KINDS = ["player", "ai"] as const;
export type FactionKind = (typeof FACTION_KINDS)[number];

export const FACTION_STATES = [
  "pending_spawn",
  "active",
  "eliminated",
  "spectator",
  "ai_controlled",
  "finished",
] as const;
export type FactionState = (typeof FACTION_STATES)[number];

export const REBELLION_STATES = ["none", "active", "grace"] as const;
export type RebellionFactionState = (typeof REBELLION_STATES)[number];

export const REBELLION_GROUP_STATES = ["spawned", "holding", "defeated"] as const;
export type RebellionGroupState = (typeof REBELLION_GROUP_STATES)[number];

export const CONTROLLER_TYPES = ["none", "player", "ai", "rebel"] as const;
export type ControllerType = (typeof CONTROLLER_TYPES)[number];

export const ARMY_STATES = ["garrison", "marching", "resolving", "destroyed"] as const;
export type ArmyState = (typeof ARMY_STATES)[number];

export const ARMY_PURPOSES = [
  "attack",
  "reinforce",
  "transfer",
  "return",
  "recall_return",
] as const;
export type ArmyPurpose = (typeof ARMY_PURPOSES)[number];

export const MOVEMENT_MODES = ["land", "air", "strategic"] as const;
export type MovementMode = (typeof MOVEMENT_MODES)[number];

export const BATTLE_RESULTS = [
  "attacker_win",
  "defender_win",
  "capture_no_battle",
  "aborted",
] as const;
export type BattleResult = (typeof BATTLE_RESULTS)[number];

export const ALLIANCE_STATES = ["active", "dissolved"] as const;
export type AllianceState = (typeof ALLIANCE_STATES)[number];

export const ALLIANCE_ROLES = ["leader", "member"] as const;
export type AllianceRole = (typeof ALLIANCE_ROLES)[number];

export const INVITATION_STATES = [
  "pending",
  "accepted",
  "declined",
  "expired",
  "cancelled",
] as const;
export type InvitationState = (typeof INVITATION_STATES)[number];

export const LEAVE_REASONS = ["left", "kicked", "abandoned", "dissolved"] as const;
export type LeaveReason = (typeof LEAVE_REASONS)[number];

export const TRADE_KINDS = ["market_listing", "direct_offer", "state_exchange"] as const;
export type TradeKind = (typeof TRADE_KINDS)[number];

export const TRADE_OFFER_STATES = [
  "open",
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired",
] as const;
export type TradeOfferState = (typeof TRADE_OFFER_STATES)[number];

export const TRADE_LOG_STATES = ["settled", "rejected", "cancelled", "returned"] as const;
export type TradeLogState = (typeof TRADE_LOG_STATES)[number];

export const QUEUE_STATES = ["queued", "running", "completed", "cancelled"] as const;
export type QueueState = (typeof QUEUE_STATES)[number];

export const DOCTRINE_WEAPONS = ["rifles", "anti_tank", "anti_air"] as const;
export type DoctrineWeapon = (typeof DOCTRINE_WEAPONS)[number];

export const DOCTRINE_SKILLS = ["defender", "raider", "marcher"] as const;
export type DoctrineSkill = (typeof DOCTRINE_SKILLS)[number];

export const ABILITY_TYPES = ["mobilization", "airstrike", "missile_strike"] as const;
export type AbilityType = (typeof ABILITY_TYPES)[number];

export const AI_ARCHETYPES = ["garrison", "raider", "expansionist"] as const;
export type AiArchetype = (typeof AI_ARCHETYPES)[number];

export const ACCOUNT_STATUSES = ["active", "banned", "disabled", "merged"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ENTITLEMENT_KINDS = ["pass", "cosmetic", "title", "badge"] as const;
export type EntitlementKind = (typeof ENTITLEMENT_KINDS)[number];

export const ENTITLEMENT_SOURCES = [
  "revenuecat",
  "season_award",
  "admin_grant",
  "promo",
] as const;
export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];

export const ENTITLEMENT_STATUSES = ["active", "expired", "revoked"] as const;
export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

export const COSMETIC_SLOTS = [
  "flag",
  "emblem",
  "banner",
  "title",
  "map_pin",
  "capital_monument",
  "nameplate",
  "profile_badge",
] as const;
export type CosmeticSlot = (typeof COSMETIC_SLOTS)[number];

export const PASS_PERIOD_STATUSES = ["active", "expired", "revoked"] as const;
export type PassPeriodStatus = (typeof PASS_PERIOD_STATUSES)[number];

export const PASS_REWARD_STATES = ["locked", "claimable", "claimed", "auto_claimed"] as const;
export type PassRewardState = (typeof PASS_REWARD_STATES)[number];

export const MISSION_STATES = ["active", "completed", "claimed", "expired"] as const;
export type MissionState = (typeof MISSION_STATES)[number];

export const SHOP_ITEM_KINDS = ["pass", "cosmetic"] as const;
export type ShopItemKind = (typeof SHOP_ITEM_KINDS)[number];

export const REVENUECAT_STATUSES = ["received", "processed", "ignored", "failed"] as const;
export type RevenueCatStatus = (typeof REVENUECAT_STATUSES)[number];

export const REPORT_STATES = ["open", "reviewed", "actioned", "dismissed"] as const;
export type ReportState = (typeof REPORT_STATES)[number];

export const REPORT_TARGET_TYPES = ["account", "faction"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const WORLD_EVENT_TYPES = [
  "join",
  "command",
  "admin",
  "season",
  "system",
  "account",
] as const;
export type WorldEventType = (typeof WORLD_EVENT_TYPES)[number];

export const EVENT_ACTOR_TYPES = ["account", "faction", "admin", "system"] as const;
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
  "use_ability",
] as const;
export type CommandType = (typeof COMMAND_TYPES)[number];

/* -------------------------------------------------------------------------- */
/* Shared value objects                                                       */
/* -------------------------------------------------------------------------- */

export interface ResourceBalance {
  /** Whole units available for spending. */
  amount: UInt;
  /** Continuous-production remainder in [0, 1). */
  remainder: RateRemainder;
}

export type ResourceStockpile = Record<ResourceType, ResourceBalance>;

/** Complete unit-count vector. Missing types are normalized to zero. */
export type UnitCounts = Record<UnitType, UInt>;

/** Public approximation. It must never carry an exact enemy count. */
export interface TroopBand {
  min: UInt;
  /** `null` means the band is open-ended. */
  max: UInt | null;
}

export interface WorldClock {
  startedAt: Timestamp;
  now: Timestamp;
  tick: number;
  dayIndex: number;
  phase: Phase;
  era: Era;
  seasonEnd: Timestamp;
}

export interface RngState {
  /** Seed committed with the world configuration. */
  seed: string;
  /** Opaque PRNG state. Persisted so replay matches. */
  state: string;
}

export interface WorldIdCounters {
  faction: FactionId;
  army: ArmyId;
  battle: BattleId;
  tradeOffer: TradeOfferId;
  trade: TradeId;
  alliance: AllianceId;
  allianceMembership: AllianceMembershipId;
  allianceInvitation: AllianceInvitationId;
  buildOrder: BuildOrderId;
  trainingOrder: TrainingOrderId;
  rebellion: RebellionId;
  doctrineChange: DoctrineChangeId;
}

/* -------------------------------------------------------------------------- */
/* Account and meta-state                                                     */
/* -------------------------------------------------------------------------- */

export interface Account {
  accountId: AccountId;
  displayName: string;
  /** Lower-cased, profanity-normalized lookup value. Not an identity key. */
  displayNameKey: string;
  status: AccountStatus;
  /** Cached from Supabase anonymous identity; the auth system remains authority. */
  isGuest: boolean;
  mergedInto: AccountId | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSeenAt: Timestamp | null;
  bannedUntil: Timestamp | null;
  banReason: string | null;
  /** Optimistic concurrency for account-level writes. */
  version: number;
}

export interface AccountEntitlement {
  entitlementId: string;
  accountId: AccountId;
  kind: EntitlementKind;
  /** `shop_items.item_id`, `season_pass`, or a config title/badge id. */
  catalogId: string;
  source: EntitlementSource;
  /** RevenueCat event id for idempotent grants; null for manual/season grants. */
  sourceEventId: string | null;
  grantedAt: Timestamp;
  /** Pass: end of the rolling 30-day term. Cosmetics: null = permanent. */
  expiresAt: Timestamp | null;
  status: EntitlementStatus;
  revokedAt: Timestamp | null;
  revocationReason: string | null;
  metadata: JsonObject;
}

export interface CosmeticEquip {
  accountId: AccountId;
  slot: CosmeticSlot;
  catalogId: string;
  equippedAt: Timestamp;
}

export interface PassPeriod {
  passPeriodId: string;
  accountId: AccountId;
  startsAt: Timestamp;
  endsAt: Timestamp;
  sourceEntitlementId: string;
  status: PassPeriodStatus;
  createdAt: Timestamp;
}

export interface PassProgress {
  passPeriodId: string;
  xp: UInt;
  level: number;
  premiumUnlocked: boolean;
  updatedAt: Timestamp;
}

export interface PassRewardClaim {
  passPeriodId: string;
  rewardId: string;
  state: PassRewardState;
  claimedAt: Timestamp | null;
  updatedAt: Timestamp;
}

export interface MissionProgress {
  accountId: AccountId;
  missionId: string;
  /** E.g. `daily:2026-10-23` or `weekly:2026-W43`; exact cadence is TBD. */
  periodKey: string;
  progress: UInt;
  target: UInt;
  state: MissionState;
  completedAt: Timestamp | null;
  claimedAt: Timestamp | null;
  updatedAt: Timestamp;
}

export interface ShopItemDefinition {
  itemId: string;
  kind: ShopItemKind;
  slot: CosmeticSlot | null;
  name: string;
  description: string;
  /** Display price only. The mobile store is the purchase authority. */
  priceUsdCents: UInt;
  storeProductId: string | null;
  active: boolean;
  metadata: JsonObject;
}

export interface RevenueCatEvent {
  eventId: string;
  /** Null if the provider sent an app user id that cannot be mapped. */
  accountId: AccountId | null;
  appUserId: string;
  eventType: string;
  productId: string | null;
  entitlementIds: string[];
  eventAt: Timestamp;
  payload: JsonObject;
  status: RevenueCatStatus;
  processedAt: Timestamp | null;
  error: string | null;
}

export interface SeasonResult {
  worldId: WorldId;
  factionId: FactionId;
  accountId: AccountId | null;
  rank: number;
  provinceCount: UInt;
  totalTroops: UInt;
  economyScore: number;
  armyScore: number;
  supportScore: number;
  totalScore: number;
  isPlayerControlled: boolean;
  /** Linked social identity at freeze; awards require true. */
  isLinked: boolean;
  isConqueror: boolean;
  isBestNation: boolean;
  /** A faction may hold both cosmetic titles. */
  titleIds: string[];
  recap: JsonObject;
  finalSnapshotSeq: number;
  createdAt: Timestamp;
}

export interface AdminAudit {
  auditId: string;
  actorAccountId: AccountId;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  beforeState: JsonObject | null;
  afterState: JsonObject | null;
  createdAt: Timestamp;
}

export interface NameReport {
  reportId: string;
  reporterAccountId: AccountId;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  state: ReportState;
  createdAt: Timestamp;
  reviewedBy: AccountId | null;
  reviewedAt: Timestamp | null;
  resolution: string | null;
}

/* -------------------------------------------------------------------------- */
/* World, persistence, and command envelopes                                  */
/* -------------------------------------------------------------------------- */

export interface World {
  worldId: WorldId;
  name: string;
  mapId: string;
  configVersion: string;
  status: WorldStatus;
  /** Nullable overlay; it does not replace the public lifecycle status. */
  operationalState: OperationalState | null;
  startedAt: Timestamp | null;
  joinDeadline: Timestamp | null;
  seasonEnd: Timestamp | null;
  maxHumans: number;
  aiCount: number;
  provinceCount: number;
  /** Applied-input version used by clients for stale-command checks. */
  version: number;
  lastTick: number;
  lastEventSeq: number;
  finalSnapshotSeq: number | null;
  createdAt: Timestamp;
  finishedAt: Timestamp | null;
}

export interface WorldLease {
  worldId: WorldId;
  ownerId: string;
  leaseVersion: number;
  leaseExpiresAt: Timestamp;
  heartbeatAt: Timestamp;
  acquiredAt: Timestamp;
}

export interface WorldSnapshotMeta {
  worldId: WorldId;
  seq: number;
  tick: number;
  effectiveAt: Timestamp;
  /** Lower-case hex SHA-256 of canonical JSON. */
  stateHash: string;
  lastEventSeq: number;
  configVersion: string;
  leaseVersion: number;
  createdAt: Timestamp;
}

export interface WorldSnapshot {
  meta: WorldSnapshotMeta;
  state: WorldState;
}

export interface WorldEvent {
  worldId: WorldId;
  seq: number;
  type: WorldEventType;
  commandType: CommandType | null;
  actorType: EventActorType;
  actorAccountId: AccountId | null;
  actorFactionId: FactionId | null;
  commandId: CommandId | null;
  effectiveAt: Timestamp;
  priority: number;
  payload: JsonObject;
  leaseVersion: number;
  createdAt: Timestamp;
}

export interface CommandReceipt {
  accountId: AccountId;
  commandId: CommandId;
  worldId: WorldId;
  factionId: FactionId | null;
  commandType: CommandType;
  resultCode: string;
  resultPayload: JsonObject;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface CommandEnvelope<T extends JsonObject = JsonObject> {
  commandId: CommandId;
  type: CommandType;
  worldVersion: number;
  payload: T;
}

/* -------------------------------------------------------------------------- */
/* Faction, economy, support, rebellion                                       */
/* -------------------------------------------------------------------------- */

export interface AiState {
  archetype: AiArchetype;
  lastDecisionAt: Timestamp | null;
  nextDecisionAt: Timestamp | null;
  targetFactionId: FactionId | null;
  targetProvinceId: ProvinceId | null;
  stance: "expand" | "defend" | "raid" | "recover";
  reserveRatio: number;
}

export interface Faction {
  factionId: FactionId;
  worldId: WorldId;
  accountId: AccountId | null;
  kind: FactionKind;
  state: FactionState;
  name: string;
  nameKey: string;
  emblemId: string;
  colorId: string;
  capitalProvinceId: ProvinceId | null;

  /** Public exact support, 0-100, per `09` §8.1. */
  support: number;
  /** Continuous-driver remainder for support. */
  supportRemainder: RateRemainder;
  rebellionState: RebellionFactionState;
  rebellionGraceUntil: Timestamp | null;

  protectionUntil: Timestamp | null;
  /** Cached calendar era; the clock remains authoritative. */
  era: Era;
  /** Set by the once-per-season voluntary capital relocation. */
  voluntaryRelocationUsed: boolean;
  /** National queue capacity: 1 by default, upgradable to 2. */
  buildSlots: QueueSlots;
  trainingSlots: QueueSlots;

  doctrineWeapon: DoctrineWeapon | null;
  doctrineSkill: DoctrineSkill | null;
  research: string[];

  /** Live copy; the physical projection is `faction_resources`. */
  resources: ResourceStockpile;

  aiArchetype: AiArchetype | null;
  aiState: AiState | null;

  /** Public projection used by the map leaderboard. */
  publicScore: number;

  joinedAt: Timestamp;
  lastSeenAt: Timestamp | null;
  abandonedAt: Timestamp | null;
  eliminatedAt: Timestamp | null;
  finishedAt: Timestamp | null;
}

export interface FactionTech {
  worldId: WorldId;
  factionId: FactionId;
  techId: string;
  purchasedAt: Timestamp;
}

export interface DoctrineChange {
  changeId: DoctrineChangeId;
  worldId: WorldId;
  factionId: FactionId;
  oldWeapon: DoctrineWeapon | null;
  newWeapon: DoctrineWeapon | null;
  oldSkill: DoctrineSkill | null;
  newSkill: DoctrineSkill | null;
  changedAt: Timestamp;
}

export interface SupportDaily {
  worldId: WorldId;
  factionId: FactionId;
  provinceId: ProvinceId;
  worldDay: number;
  /** Net regional-event support applied today. The ±1 cap is a rules check. */
  netDelta: number;
  updatedAt: Timestamp;
}

export interface Rebellion {
  rebellionId: RebellionId;
  worldId: WorldId;
  originFactionId: FactionId;
  provinceId: ProvinceId;
  state: RebellionGroupState;
  spawnedAt: Timestamp;
  defeatedAt: Timestamp | null;
}

/* -------------------------------------------------------------------------- */
/* Map and province                                                           */
/* -------------------------------------------------------------------------- */

export interface MapProvince {
  provinceId: ProvinceId;
  name: string;
  /** Visual/narrative only; never a combat modifier. */
  terrain: string;
  /** Fixed for the season. Capitals produce money instead. */
  terrainResource: ResourceType;
  neighbors: ProvinceId[];
  /** Hex colour used by the hidden mask. */
  maskColor: string;
  centroid: { x: number; y: number };
  isRefugeeCandidate: boolean;
}

export interface MapDefinition {
  mapId: string;
  version: string;
  width: number;
  height: number;
  maskAsset: string;
  provinces: MapProvince[];
}

export interface WorldRegion {
  worldId: WorldId;
  provinceId: ProvinceId;
  ownerFactionId: FactionId | null;
  controllerType: ControllerType;
  rebelGroupId: RebellionId | null;
  /** Last player/AI faction that captured the province; null after a rebel capture. */
  lastAttackerFactionId: FactionId | null;
  level: ProvinceLevel;
  terrainResource: ResourceType;
  isCapital: boolean;
  isRefugee: boolean;
  capturedAt: Timestamp | null;
  updatedAt: Timestamp;
}

/* -------------------------------------------------------------------------- */
/* Military                                                                   */
/* -------------------------------------------------------------------------- */

export interface Army {
  armyId: ArmyId;
  worldId: WorldId;
  /** Exactly one of ownerFactionId/rebelGroupId is non-null. */
  ownerFactionId: FactionId | null;
  rebelGroupId: RebellionId | null;
  state: ArmyState;
  purpose: ArmyPurpose | null;
  mode: MovementMode | null;
  /** Set only while state is `garrison`. */
  locationProvinceId: ProvinceId | null;
  /** Set only while marching/resolving. */
  originProvinceId: ProvinceId | null;
  targetProvinceId: ProvinceId | null;
  units: UnitCounts;
  departAt: Timestamp | null;
  arriveAt: Timestamp | null;
  fatigueUntil: Timestamp | null;
  recallable: boolean;
  createdAt: Timestamp;
  destroyedAt: Timestamp | null;
}

export interface BattleMultipliers {
  era: number;
  counter: number;
  weapon: number;
  skill: number;
  fortification: number;
  capital: number;
  offline: number;
  ability: number;
}

export interface BattleLog {
  battleId: BattleId;
  worldId: WorldId;
  provinceId: ProvinceId;
  attackerControllerType: Exclude<ControllerType, "none">;
  attackerFactionId: FactionId | null;
  defenderControllerType: ControllerType;
  defenderFactionId: FactionId | null;
  attackerArmyId: ArmyId;
  defenderArmyIds: ArmyId[];
  startedAt: Timestamp;
  resolvedAt: Timestamp;
  result: BattleResult;
  provinceLevelBefore: ProvinceLevel;
  provinceLevelAfter: ProvinceLevel;
  attackerPower: number;
  defenderPower: number;
  attackerUnits: UnitCounts;
  defenderUnits: UnitCounts;
  attackerLosses: UnitCounts;
  defenderLosses: UnitCounts;
  attackerMultipliers: BattleMultipliers;
  defenderMultipliers: BattleMultipliers;
  loot: JsonObject;
  supportChanges: JsonObject;
  newOwnerFactionId: FactionId | null;
  publicSummary: JsonObject;
  createdAt: Timestamp;
}

/* -------------------------------------------------------------------------- */
/* Alliances and trade                                                        */
/* -------------------------------------------------------------------------- */

export interface Alliance {
  allianceId: AllianceId;
  worldId: WorldId;
  name: string;
  nameKey: string;
  /** Null while the alliance has no acting leader. */
  leaderFactionId: FactionId | null;
  state: AllianceState;
  createdAt: Timestamp;
  dissolvedAt: Timestamp | null;
}

export interface AllianceMembership {
  membershipId: AllianceMembershipId;
  worldId: WorldId;
  allianceId: AllianceId;
  factionId: FactionId;
  role: AllianceRole;
  joinedAt: Timestamp;
  leftAt: Timestamp | null;
  leaveReason: LeaveReason | null;
}

export interface AllianceInvitation {
  invitationId: AllianceInvitationId;
  worldId: WorldId;
  allianceId: AllianceId;
  inviterFactionId: FactionId;
  inviteeFactionId: FactionId;
  state: InvitationState;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  respondedAt: Timestamp | null;
}

export interface TradeOffer {
  offerId: TradeOfferId;
  worldId: WorldId;
  kind: Exclude<TradeKind, "state_exchange">;
  sellerFactionId: FactionId;
  /** Set for direct offers; null for market listings. */
  buyerFactionId: FactionId | null;
  resource: TradeableResource;
  amount: UInt;
  priceGold: UInt;
  state: TradeOfferState;
  /** Resource held while open/pending. */
  escrowAmount: UInt;
  taxGold: UInt;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  /** Non-null while the offer is frozen by war. */
  frozenAt: Timestamp | null;
  resolvedAt: Timestamp | null;
}

export interface TradeLog {
  tradeId: TradeId;
  worldId: WorldId;
  offerId: TradeOfferId | null;
  kind: TradeKind;
  sellerFactionId: FactionId;
  buyerFactionId: FactionId | null;
  resource: TradeableResource;
  amount: UInt;
  gold: UInt;
  taxGold: UInt;
  state: TradeLogState;
  reason: string | null;
  createdAt: Timestamp;
}

/** Per-faction daily counters; reset at the start of each world day. */
export interface TradeDaily {
  worldId: WorldId;
  factionId: FactionId;
  worldDay: number;
  tradesCount: UInt;
  goldMoved: UInt;
  updatedAt: Timestamp;
}

/* -------------------------------------------------------------------------- */
/* Queues and cooldowns                                                       */
/* -------------------------------------------------------------------------- */

export interface BuildOrder {
  orderId: BuildOrderId;
  worldId: WorldId;
  factionId: FactionId;
  provinceId: ProvinceId;
  fromLevel: ProvinceLevel;
  toLevel: ProvinceLevel;
  state: QueueState;
  enqueuedAt: Timestamp;
  startedAt: Timestamp | null;
  finishesAt: Timestamp | null;
  costMoney: UInt;
  costResourceType: ResourceType | null;
  costResourceAmount: UInt;
  refundAmount: UInt;
  cancelReason: string | null;
  completedAt: Timestamp | null;
}

export interface TrainingOrder {
  orderId: TrainingOrderId;
  worldId: WorldId;
  factionId: FactionId;
  provinceId: ProvinceId;
  unitType: Exclude<UnitType, "infantry">;
  count: UInt;
  state: QueueState;
  enqueuedAt: Timestamp;
  startedAt: Timestamp | null;
  finishesAt: Timestamp | null;
  costMoney: UInt;
  costResourceType: ResourceType | null;
  costResourceAmount: UInt;
  refundAmount: UInt;
  cancelReason: string | null;
  completedAt: Timestamp | null;
}

export interface AbilityCooldown {
  worldId: WorldId;
  factionId: FactionId;
  ability: AbilityType;
  readyAt: Timestamp;
  lastUsedAt: Timestamp;
}

export interface ExAllyCooldown {
  worldId: WorldId;
  /** Stored in ascending order: factionAId < factionBId. */
  factionAId: FactionId;
  factionBId: FactionId;
  until: Timestamp;
  reason: Exclude<LeaveReason, "abandoned" | "dissolved">;
}

/* -------------------------------------------------------------------------- */
/* Serializable world state                                                   */
/* -------------------------------------------------------------------------- */

export interface WorldState {
  /** Version of this snapshot payload shape. */
  schemaVersion: number;
  worldId: WorldId;
  configVersion: string;
  clock: WorldClock;
  rng: RngState;

  /** Applied-input version; monotonic. */
  version: number;
  lastEventSeq: number;
  nextIds: WorldIdCounters;

  factions: Record<string, Faction>;
  regions: Record<string, WorldRegion>;
  armies: Record<string, Army>;
  /** Neutral province garrisons. Owned/rebel garrisons live in `armies`. */
  neutralGarrisons: Record<string, UnitCounts>;

  alliances: Record<string, Alliance>;
  allianceMembers: Record<string, AllianceMembership>;
  allianceInvitations: Record<string, AllianceInvitation>;

  tradeOffers: Record<string, TradeOffer>;
  tradeDaily: Record<string, TradeDaily>;
  rebellions: Record<string, Rebellion>;
  buildOrders: Record<string, BuildOrder>;
  trainingOrders: Record<string, TrainingOrder>;
  abilityCooldowns: Record<string, AbilityCooldown>;
  exAllyCooldowns: Record<string, ExAllyCooldown>;
  supportDaily: Record<string, SupportDaily>;
}

/* -------------------------------------------------------------------------- */
/* Client StateView — visibility is part of the contract                      */
/* -------------------------------------------------------------------------- */

export interface PublicFaction {
  factionId: FactionId;
  name: string;
  emblemId: string;
  colorId: string;
  kind: FactionKind;
  state: FactionState;
  allianceId: AllianceId | null;
  provinceCount: number;
  publicScore: number;
  /** Public exact, per `09` §8.1. */
  support: number;
  protectionUntil: Timestamp | null;
  isAiControlled: boolean;
}

export interface PublicRegion {
  provinceId: ProvinceId;
  ownerFactionId: FactionId | null;
  controllerType: ControllerType;
  level: ProvinceLevel;
  terrainResource: ResourceType;
  isCapital: boolean;
  isProtected: boolean;
  troopBand: TroopBand;
}

export interface PublicArmy {
  armyId: ArmyId;
  ownerFactionId: FactionId | null;
  originProvinceId: ProvinceId | null;
  targetProvinceId: ProvinceId | null;
  departAt: Timestamp | null;
  arriveAt: Timestamp | null;
  troopBand: TroopBand;
}

export interface PublicAlliance {
  allianceId: AllianceId;
  name: string;
  leaderFactionId: FactionId | null;
  memberFactionIds: FactionId[];
  state: AllianceState;
}

export interface PublicTradeOffer {
  offerId: TradeOfferId;
  kind: Exclude<TradeKind, "state_exchange">;
  sellerFactionId: FactionId;
  buyerFactionId: FactionId | null;
  resource: TradeableResource;
  amount: UInt;
  priceGold: UInt;
  state: TradeOfferState;
  expiresAt: Timestamp;
  frozen: boolean;
}

export interface PublicBattleSummary {
  battleId: BattleId;
  provinceId: ProvinceId;
  attackerControllerType: Exclude<ControllerType, "none">;
  attackerFactionId: FactionId | null;
  defenderControllerType: ControllerType;
  defenderFactionId: FactionId | null;
  result: BattleResult;
  resolvedAt: Timestamp;
  summary: JsonObject;
}

export interface PublicWorldState {
  clock: WorldClock;
  version: number;
  factions: Record<string, PublicFaction>;
  regions: Record<string, PublicRegion>;
  armies: Record<string, PublicArmy>;
  alliances: Record<string, PublicAlliance>;
  tradeOffers: Record<string, PublicTradeOffer>;
  battleSummaries: Record<string, PublicBattleSummary>;
}

export interface ExactProvince {
  provinceId: ProvinceId;
  units: UnitCounts;
}

export interface ExactArmy {
  armyId: ArmyId;
  units: UnitCounts;
}

export interface ProvincePrivate {
  provinceId: ProvinceId;
  buildOrderId: BuildOrderId | null;
  trainingOrderIds: TrainingOrderId[];
}

export interface PrivateOwnFaction {
  factionId: FactionId;
  resources: ResourceStockpile;
  research: string[];
  doctrineWeapon: DoctrineWeapon | null;
  doctrineSkill: DoctrineSkill | null;
  buildOrders: BuildOrder[];
  trainingOrders: TrainingOrder[];
  missions: MissionProgress[];
  abilityCooldowns: AbilityCooldown[];
  rebellion: Rebellion | null;
}

export interface BattleReportPrivate {
  battleId: BattleId;
  /** Exact powers/losses, only for involved factions after resolution. */
  attackerPower: number;
  defenderPower: number;
  attackerLosses: UnitCounts;
  defenderLosses: UnitCounts;
  attackerMultipliers: BattleMultipliers;
  defenderMultipliers: BattleMultipliers;
}

export interface StateView {
  public: PublicWorldState;
  /** Own and allied provinces only. */
  exactProvinces: Record<string, ExactProvince>;
  /** Own and allied armies only. */
  exactArmies: Record<string, ExactArmy>;
  ownFaction: PrivateOwnFaction | null;
  ownProvinceDetails: Record<string, ProvincePrivate>;
  battleReports: Record<string, BattleReportPrivate>;
}

/* -------------------------------------------------------------------------- */
/* Static configuration shapes                                                */
/* -------------------------------------------------------------------------- */

export interface UnitDefinition {
  unitType: UnitType;
  era: Era;
  attack: number;
  defense: number;
  marchMinutesPerHop: number;
  rangeHops: number;
  costMoney: UInt;
  costResourceType: ResourceType | null;
  costResourceAmount: UInt;
  trainSeconds: UInt;
  isCombatUnit: boolean;
}

export interface WeaponDefinition {
  weapon: DoctrineWeapon;
  /** Counter multiplier against each opposing unit type. */
  counters: Partial<Record<UnitType, number>>;
}

export interface SkillDefinition {
  skill: DoctrineSkill;
  attackMultiplier: number;
  defenseMultiplier: number;
  marchSpeedMultiplier: number;
}

export interface AbilityDefinition {
  ability: AbilityType;
  era: Era;
  warOnly: boolean;
  cooldownSeconds: UInt;
  costMoney: UInt;
  costResourceType: ResourceType | null;
  costResourceAmount: UInt;
  costGold: UInt;
}

export interface TechDefinition {
  techId: string;
  era: Era;
  branch: "main" | "weapon" | "skill" | "economy";
  prerequisiteTechIds: string[];
  costMoney: UInt;
  costGold: UInt;
  effects: JsonObject;
}

export interface MissionDefinition {
  missionId: string;
  cadence: "daily" | "weekly" | "season";
  target: UInt;
  xp: UInt;
  active: boolean;
  metadata: JsonObject;
}

export interface PassRewardDefinition {
  rewardId: string;
  track: "free" | "premium";
  level: number;
  cosmeticId: string;
  active: boolean;
}

export interface CosmeticDefinition {
  cosmeticId: string;
  slot: CosmeticSlot;
  name: string;
  assetKey: string;
  metadata: JsonObject;
}

export interface GameConfig {
  configVersion: string;
  map: MapDefinition;
  units: UnitDefinition[];
  weapons: WeaponDefinition[];
  skills: SkillDefinition[];
  abilities: AbilityDefinition[];
  techs: TechDefinition[];
  missions: MissionDefinition[];
  passRewards: PassRewardDefinition[];
  cosmetics: CosmeticDefinition[];
  shopItems: ShopItemDefinition[];
}
