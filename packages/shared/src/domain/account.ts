/**
 * Domain Account, Entitlements, and Meta-State
 *
 * Defines user account identity, cosmetics, pass progression,
 * store definitions, and moderation reports.
 */

import type { AccountId, WorldId, FactionId } from "../protocol/ids.js";
import type {
  AccountStatus,
  EntitlementKind,
  EntitlementSource,
  EntitlementStatus,
  CosmeticSlot,
  PassPeriodStatus,
  PassRewardState,
  MissionState,
  ShopItemKind,
  RevenueCatStatus,
  ReportTargetType,
  ReportState
} from "../protocol/enums.js";
import type { Timestamp, UInt, JsonObject } from "./primitives.js";

export interface Account {
  accountId: AccountId;
  displayName: string;
  displayNameKey: string;
  status: AccountStatus;
  isGuest: boolean;
  mergedInto: AccountId | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSeenAt: Timestamp | null;
  bannedUntil: Timestamp | null;
  banReason: string | null;
  version: number;
}

export interface AccountEntitlement {
  entitlementId: string;
  accountId: AccountId;
  kind: EntitlementKind;
  catalogId: string;
  source: EntitlementSource;
  sourceEventId: string | null;
  grantedAt: Timestamp;
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
  priceUsdCents: UInt;
  storeProductId: string | null;
  active: boolean;
  metadata: JsonObject;
}

export interface RevenueCatEvent {
  eventId: string;
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
  isLinked: boolean;
  isConqueror: boolean;
  isBestNation: boolean;
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
