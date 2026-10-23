/**
 * Domain Faction, Economy, Support, and Rebellion
 *
 * Defines nation-state entities, AI decision parameters, support tracking,
 * research inventories, and provincial rebellions.
 */

import type {
  FactionId,
  WorldId,
  AccountId,
  ProvinceId,
  DoctrineChangeId,
  RebellionId
} from "../protocol/ids.js";
import type {
  FactionKind,
  FactionState,
  RebellionFactionState,
  RebellionGroupState,
  DoctrineWeapon,
  DoctrineSkill,
  AiArchetype
} from "../protocol/enums.js";
import type { Timestamp, RateRemainder, Era, QueueSlots, ResourceStockpile } from "./primitives.js";

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
  support: number;
  supportRemainder: RateRemainder;
  rebellionState: RebellionFactionState;
  rebellionGraceUntil: Timestamp | null;
  protectionUntil: Timestamp | null;
  era: Era;
  voluntaryRelocationUsed: boolean;
  buildSlots: QueueSlots;
  trainingSlots: QueueSlots;
  doctrineWeapon: DoctrineWeapon | null;
  doctrineSkill: DoctrineSkill | null;
  research: string[];
  resources: ResourceStockpile;
  aiArchetype: AiArchetype | null;
  aiState: AiState | null;
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
