/**
 * Domain Queues and Cooldown Interfaces
 *
 * Defines build queues, unit training queues, ability cooldown timers,
 * and ex-ally diplomatic cooldown restrictions.
 */

import type {
  BuildOrderId,
  WorldId,
  FactionId,
  ProvinceId,
  TrainingOrderId
} from "../protocol/ids.js";
import type {
  QueueState,
  ResourceType,
  UnitType,
  AbilityType,
  LeaveReason
} from "../protocol/enums.js";
import type { Timestamp, ProvinceLevel, UInt } from "./primitives.js";

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
  factionAId: FactionId;
  factionBId: FactionId;
  until: Timestamp;
  reason: Exclude<LeaveReason, "abandoned" | "dissolved">;
}
