/**
 * Domain Game Configuration Shapes
 *
 * Defines static balance contracts for unit definitions, weapon counters,
 * doctrine skills, special abilities, tech trees, and pass rewards.
 */

import type {
  UnitType,
  ResourceType,
  DoctrineWeapon,
  DoctrineSkill,
  AbilityType,
  CosmeticSlot
} from "../protocol/enums.js";
import type { Era, UInt, JsonObject } from "./primitives.js";
import type { MapDefinition } from "./map-military.js";
import type { ShopItemDefinition } from "./account.js";

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
