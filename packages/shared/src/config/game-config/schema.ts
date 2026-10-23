/**
 * Game Configuration Zod Schemas
 *
 * Runtime boundary for the static balance/config document. The shapes mirror the
 * domain `GameConfig` interfaces exactly; every object is strict so unknown or
 * removed keys fail validation instead of being silently ignored.
 *
 * This module defines shape and structural constraints only. It contains no
 * balance values: every number arrives from an approved config document.
 */

import { z } from "zod";
import { provinceIdSchema } from "../../protocol/ids.js";
import {
  abilityTypeSchema,
  cosmeticSlotSchema,
  doctrineSkillSchema,
  doctrineWeaponSchema,
  resourceTypeSchema,
  shopItemKindSchema,
  unitTypeSchema
} from "../../protocol/enums.js";
import type { JsonObject, JsonValue } from "../../domain/primitives.js";

export const eraSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const uintSchema = z.number().int().nonnegative();

export const configVersionSchema = z.string().min(1).max(128);

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) {
    return true;
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      return false;
    }
    return Object.values(value).every(isJsonValue);
  }
  return false;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value) && isJsonValue(value);
}

export const jsonObjectSchema = z.custom<JsonObject>(isJsonObject, {
  message: "Expected a plain JSON object"
});

export const mapProvinceSchema = z
  .object({
    provinceId: provinceIdSchema,
    name: z.string().min(1),
    terrain: z.string().min(1),
    terrainResource: resourceTypeSchema,
    neighbors: z.array(provinceIdSchema),
    maskColor: z.string().min(1),
    centroid: z
      .object({
        x: z.number(),
        y: z.number()
      })
      .strict(),
    isRefugeeCandidate: z.boolean()
  })
  .strict();

export const mapDefinitionSchema = z
  .object({
    mapId: z.string().min(1),
    version: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    maskAsset: z.string().min(1),
    provinces: z.array(mapProvinceSchema)
  })
  .strict();

export const unitDefinitionSchema = z
  .object({
    unitType: unitTypeSchema,
    era: eraSchema,
    attack: z.number(),
    defense: z.number(),
    marchMinutesPerHop: z.number(),
    rangeHops: uintSchema,
    costMoney: uintSchema,
    costResourceType: resourceTypeSchema.nullable(),
    costResourceAmount: uintSchema,
    trainSeconds: uintSchema,
    isCombatUnit: z.boolean()
  })
  .strict();

export const weaponDefinitionSchema = z
  .object({
    weapon: doctrineWeaponSchema,
    counters: z.partialRecord(unitTypeSchema, z.number())
  })
  .strict();

export const skillDefinitionSchema = z
  .object({
    skill: doctrineSkillSchema,
    attackMultiplier: z.number(),
    defenseMultiplier: z.number(),
    marchSpeedMultiplier: z.number()
  })
  .strict();

export const abilityDefinitionSchema = z
  .object({
    ability: abilityTypeSchema,
    era: eraSchema,
    warOnly: z.boolean(),
    cooldownSeconds: uintSchema,
    costMoney: uintSchema,
    costResourceType: resourceTypeSchema.nullable(),
    costResourceAmount: uintSchema,
    costGold: uintSchema
  })
  .strict();

export const techDefinitionSchema = z
  .object({
    techId: z.string().min(1),
    era: eraSchema,
    branch: z.enum(["main", "weapon", "skill", "economy"]),
    prerequisiteTechIds: z.array(z.string().min(1)),
    costMoney: uintSchema,
    costGold: uintSchema,
    effects: jsonObjectSchema
  })
  .strict();

export const missionDefinitionSchema = z
  .object({
    missionId: z.string().min(1),
    cadence: z.enum(["daily", "weekly", "season"]),
    target: uintSchema,
    xp: uintSchema,
    active: z.boolean(),
    metadata: jsonObjectSchema
  })
  .strict();

export const passRewardDefinitionSchema = z
  .object({
    rewardId: z.string().min(1),
    track: z.enum(["free", "premium"]),
    level: uintSchema,
    cosmeticId: z.string().min(1),
    active: z.boolean()
  })
  .strict();

export const cosmeticDefinitionSchema = z
  .object({
    cosmeticId: z.string().min(1),
    slot: cosmeticSlotSchema,
    name: z.string().min(1),
    assetKey: z.string().min(1),
    metadata: jsonObjectSchema
  })
  .strict();

export const shopItemDefinitionSchema = z
  .object({
    itemId: z.string().min(1),
    kind: shopItemKindSchema,
    slot: cosmeticSlotSchema.nullable(),
    name: z.string().min(1),
    description: z.string().min(1),
    priceUsdCents: uintSchema,
    storeProductId: z.string().min(1).nullable(),
    active: z.boolean(),
    metadata: jsonObjectSchema
  })
  .strict();

export const gameConfigSchema = z
  .object({
    configVersion: configVersionSchema,
    map: mapDefinitionSchema,
    units: z.array(unitDefinitionSchema),
    weapons: z.array(weaponDefinitionSchema),
    skills: z.array(skillDefinitionSchema),
    abilities: z.array(abilityDefinitionSchema),
    techs: z.array(techDefinitionSchema),
    missions: z.array(missionDefinitionSchema),
    passRewards: z.array(passRewardDefinitionSchema),
    cosmetics: z.array(cosmeticDefinitionSchema),
    shopItems: z.array(shopItemDefinitionSchema)
  })
  .strict();
