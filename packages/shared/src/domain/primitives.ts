/**
 * Domain Primitive Conventions and Value Objects
 *
 * Defines core numeric/scalar primitives, JSON representations,
 * resource balances, unit count vectors, and clock state.
 */

import type { ResourceType, UnitType, Phase } from "../protocol/enums.js";
import type {
  FactionId,
  ArmyId,
  BattleId,
  TradeOfferId,
  TradeId,
  AllianceId,
  AllianceMembershipId,
  AllianceInvitationId,
  BuildOrderId,
  TrainingOrderId,
  RebellionId,
  DoctrineChangeId
} from "../protocol/ids.js";

export type Timestamp = string;
export type UInt = number;
export type RateRemainder = number;

export type Era = 1 | 2 | 3 | 4;
export type ProvinceLevel = 1 | 2 | 3 | 4 | 5;
export type QueueSlots = 1 | 2;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export interface ResourceBalance {
  amount: UInt;
  remainder: RateRemainder;
}

export type ResourceStockpile = Record<ResourceType, ResourceBalance>;

export type UnitCounts = Record<UnitType, UInt>;

export interface TroopBand {
  min: UInt;
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
  seed: string;
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
