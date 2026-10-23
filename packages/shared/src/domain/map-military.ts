/**
 * Domain Map and Military Interfaces
 *
 * Defines geographic regions, marching armies, battle calculations,
 * and combat resolution logs.
 */

import type {
  ProvinceId,
  WorldId,
  FactionId,
  RebellionId,
  ArmyId,
  BattleId
} from "../protocol/ids.js";
import type {
  ResourceType,
  ControllerType,
  ArmyState,
  ArmyPurpose,
  MovementMode,
  BattleResult
} from "../protocol/enums.js";
import type { Timestamp, ProvinceLevel, UnitCounts, JsonObject } from "./primitives.js";

export interface MapProvince {
  provinceId: ProvinceId;
  name: string;
  terrain: string;
  terrainResource: ResourceType;
  neighbors: ProvinceId[];
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
  lastAttackerFactionId: FactionId | null;
  level: ProvinceLevel;
  terrainResource: ResourceType;
  isCapital: boolean;
  isRefugee: boolean;
  capturedAt: Timestamp | null;
  updatedAt: Timestamp;
}

export interface Army {
  armyId: ArmyId;
  worldId: WorldId;
  ownerFactionId: FactionId | null;
  rebelGroupId: RebellionId | null;
  state: ArmyState;
  purpose: ArmyPurpose | null;
  mode: MovementMode | null;
  locationProvinceId: ProvinceId | null;
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
