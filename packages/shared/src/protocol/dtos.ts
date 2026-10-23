/**
 * StateView and Public DTO Schemas
 *
 * Implements authoritative view projections sent from server to client.
 * Public projections band enemy troop counts to prevent client-side data leakage.
 * All schemas enforce strict object shape checking (.strict()).
 */

import { z } from "zod";
import {
  worldIdSchema,
  factionIdSchema,
  provinceIdSchema,
  armyIdSchema,
  allianceIdSchema,
  tradeOfferIdSchema,
  battleIdSchema,
  buildOrderIdSchema,
  trainingOrderIdSchema,
  rebellionIdSchema
} from "./ids.js";
import {
  worldStatusSchema,
  operationalStateSchema,
  phaseSchema,
  factionKindSchema,
  factionStateSchema,
  controllerTypeSchema,
  resourceTypeSchema,
  tradeableResourceSchema,
  allianceStateSchema,
  tradeOfferStateSchema,
  doctrineWeaponSchema,
  doctrineSkillSchema,
  unitTypeSchema,
  abilityTypeSchema,
  battleResultSchema,
  rebellionGroupStateSchema
} from "./enums.js";
import { unitCountsSchema } from "./commands.js";

export const troopBandSchema = z
  .object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative().nullable()
  })
  .strict();

export const publicFactionSchema = z
  .object({
    factionId: factionIdSchema,
    name: z.string().min(1),
    emblemId: z.string().min(1),
    colorId: z.string().min(1),
    kind: factionKindSchema,
    state: factionStateSchema,
    allianceId: allianceIdSchema.nullable(),
    provinceCount: z.number().int().nonnegative(),
    publicScore: z.number().int().nonnegative(),
    support: z.number().int(),
    protectionUntil: z.string().datetime().nullable(),
    isAiControlled: z.boolean()
  })
  .strict();

export const publicRegionSchema = z
  .object({
    provinceId: provinceIdSchema,
    ownerFactionId: factionIdSchema.nullable(),
    controllerType: controllerTypeSchema,
    level: z.number().int().min(1).max(5),
    terrainResource: resourceTypeSchema,
    isCapital: z.boolean(),
    isProtected: z.boolean(),
    troopBand: troopBandSchema
  })
  .strict();

export const publicArmySchema = z
  .object({
    armyId: armyIdSchema,
    ownerFactionId: factionIdSchema.nullable(),
    originProvinceId: provinceIdSchema.nullable(),
    targetProvinceId: provinceIdSchema.nullable(),
    departAt: z.string().datetime().nullable(),
    arriveAt: z.string().datetime().nullable(),
    troopBand: troopBandSchema
  })
  .strict();

export const publicAllianceSchema = z
  .object({
    allianceId: allianceIdSchema,
    name: z.string().min(1),
    leaderFactionId: factionIdSchema.nullable(),
    memberFactionIds: z.array(factionIdSchema),
    state: allianceStateSchema
  })
  .strict();

export const publicTradeOfferSchema = z
  .object({
    offerId: tradeOfferIdSchema,
    kind: z.union([z.literal("market_listing"), z.literal("direct_offer")]),
    sellerFactionId: factionIdSchema,
    buyerFactionId: factionIdSchema.nullable(),
    resource: tradeableResourceSchema,
    amount: z.number().int().positive(),
    priceGold: z.number().int().positive(),
    state: tradeOfferStateSchema,
    expiresAt: z.string().datetime(),
    frozen: z.boolean()
  })
  .strict();

export const worldSummaryDtoSchema = z
  .object({
    worldId: worldIdSchema,
    name: z.string().min(1),
    status: worldStatusSchema,
    operationalState: operationalStateSchema.nullable(),
    currentTick: z.number().int().nonnegative(),
    phase: phaseSchema,
    era: z.number().int().min(1).max(4),
    playerCount: z.number().int().nonnegative(),
    maxHumans: z.number().int().positive(),
    startedAt: z.string().datetime().nullable(),
    joinDeadline: z.string().datetime().nullable(),
    seasonEnd: z.string().datetime().nullable(),
    configVersion: z.string().min(1),
    configHash: z.string().length(64),
    mapId: z.string().min(1),
    mapHash: z.string().length(64)
  })
  .strict();

export type WorldSummaryDto = z.infer<typeof worldSummaryDtoSchema>;

export const resourceBalanceSchema = z
  .object({
    amount: z.number().int().nonnegative(),
    remainder: z.number().min(0).max(1)
  })
  .strict();

export const resourceStockpileSchema = z
  .object({
    money: resourceBalanceSchema,
    gold: resourceBalanceSchema,
    food: resourceBalanceSchema,
    water: resourceBalanceSchema,
    oil: resourceBalanceSchema
  })
  .strict();

export const worldClockSchema = z
  .object({
    day: z.number().int().min(1).max(30),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    tickNumber: z.number().int().nonnegative(),
    seasonDay: z.number().int().min(1).max(30),
    warWindowActive: z.boolean(),
    isSeasonEnded: z.boolean(),
    lastTickTimestamp: z.string().datetime()
  })
  .strict();

export const publicBattleSummarySchema = z
  .object({
    battleId: battleIdSchema,
    provinceId: provinceIdSchema,
    attackerControllerType: z.enum(["player", "ai", "rebel"]),
    attackerFactionId: factionIdSchema.nullable(),
    defenderControllerType: controllerTypeSchema,
    defenderFactionId: factionIdSchema.nullable(),
    result: battleResultSchema,
    resolvedAt: z.string().datetime(),
    summary: z.record(z.string(), z.unknown())
  })
  .strict();

export const publicWorldStateSchema = z
  .object({
    clock: worldClockSchema,
    version: z.number().int().nonnegative(),
    factions: z.record(z.string(), publicFactionSchema),
    regions: z.record(z.string(), publicRegionSchema),
    armies: z.record(z.string(), publicArmySchema),
    alliances: z.record(z.string(), publicAllianceSchema),
    tradeOffers: z.record(z.string(), publicTradeOfferSchema),
    battleSummaries: z.record(z.string(), publicBattleSummarySchema)
  })
  .strict();

export const exactProvinceSchema = z
  .object({
    provinceId: provinceIdSchema,
    units: unitCountsSchema
  })
  .strict();

export const exactArmySchema = z
  .object({
    armyId: armyIdSchema,
    units: unitCountsSchema
  })
  .strict();

export const provincePrivateSchema = z
  .object({
    provinceId: provinceIdSchema,
    buildOrderId: buildOrderIdSchema.nullable(),
    trainingOrderIds: z.array(trainingOrderIdSchema)
  })
  .strict();

export const buildOrderSchema = z
  .object({
    orderId: buildOrderIdSchema,
    provinceId: provinceIdSchema,
    targetLevel: z.number().int().min(2).max(5),
    costMoney: z.number().int().nonnegative(),
    costOil: z.number().int().nonnegative(),
    startTick: z.number().int().nonnegative(),
    completesAtTick: z.number().int().nonnegative(),
    slot: z.number().int().min(1).max(2)
  })
  .strict();

export const trainingOrderSchema = z
  .object({
    orderId: trainingOrderIdSchema,
    provinceId: provinceIdSchema,
    unitType: unitTypeSchema,
    count: z.number().int().positive(),
    costMoney: z.number().int().nonnegative(),
    costResource: z.number().int().nonnegative(),
    resourceType: tradeableResourceSchema,
    startTick: z.number().int().nonnegative(),
    completesAtTick: z.number().int().nonnegative(),
    slot: z.number().int().min(1).max(2)
  })
  .strict();

export const missionProgressSchema = z
  .object({
    missionId: z.string().min(1),
    progress: z.number().int().nonnegative(),
    completed: z.boolean(),
    claimed: z.boolean()
  })
  .strict();

export const abilityCooldownSchema = z
  .object({
    ability: abilityTypeSchema,
    readyAtTick: z.number().int().nonnegative(),
    lastUsedAtTick: z.number().int().nonnegative()
  })
  .strict();

export const rebellionSchema = z
  .object({
    rebellionId: rebellionIdSchema,
    provinceId: provinceIdSchema,
    state: rebellionGroupStateSchema,
    progress: z.number().min(0).max(100),
    units: unitCountsSchema
  })
  .strict();

export const privateOwnFactionSchema = z
  .object({
    factionId: factionIdSchema,
    resources: resourceStockpileSchema,
    research: z.array(z.string()),
    doctrineWeapon: doctrineWeaponSchema.nullable(),
    doctrineSkill: doctrineSkillSchema.nullable(),
    buildOrders: z.array(buildOrderSchema),
    trainingOrders: z.array(trainingOrderSchema),
    missions: z.array(missionProgressSchema),
    abilityCooldowns: z.array(abilityCooldownSchema),
    rebellion: rebellionSchema.nullable()
  })
  .strict();

export const battleMultipliersSchema = z
  .object({
    techMultiplier: z.number().positive(),
    doctrineMultiplier: z.number().positive(),
    terrainMultiplier: z.number().positive(),
    combinedMultiplier: z.number().positive()
  })
  .strict();

export const battleReportPrivateSchema = z
  .object({
    battleId: battleIdSchema,
    attackerPower: z.number().nonnegative(),
    defenderPower: z.number().nonnegative(),
    attackerLosses: unitCountsSchema,
    defenderLosses: unitCountsSchema,
    attackerMultipliers: battleMultipliersSchema,
    defenderMultipliers: battleMultipliersSchema
  })
  .strict();

export const stateViewSchema = z
  .object({
    public: publicWorldStateSchema,
    exactProvinces: z.record(z.string(), exactProvinceSchema),
    exactArmies: z.record(z.string(), exactArmySchema),
    ownFaction: privateOwnFactionSchema.nullable(),
    ownProvinceDetails: z.record(z.string(), provincePrivateSchema),
    battleReports: z.record(z.string(), battleReportPrivateSchema)
  })
  .strict();
