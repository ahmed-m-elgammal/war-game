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
  tradeOfferIdSchema
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
  doctrineSkillSchema
} from "./enums.js";
import { unitCountsSchema } from "./commands.js";

export const troopBandSchema = z
  .object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative().nullable()
  })
  .strict();

export type TroopBand = z.infer<typeof troopBandSchema>;

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

export type PublicFaction = z.infer<typeof publicFactionSchema>;

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

export type PublicRegion = z.infer<typeof publicRegionSchema>;

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

export type PublicArmy = z.infer<typeof publicArmySchema>;

export const publicAllianceSchema = z
  .object({
    allianceId: allianceIdSchema,
    name: z.string().min(1),
    leaderFactionId: factionIdSchema.nullable(),
    memberFactionIds: z.array(factionIdSchema),
    state: allianceStateSchema
  })
  .strict();

export type PublicAlliance = z.infer<typeof publicAllianceSchema>;

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

export type PublicTradeOffer = z.infer<typeof publicTradeOfferSchema>;

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

export const privateFactionStateSchema = z
  .object({
    resources: z
      .object({
        money: resourceBalanceSchema,
        gold: resourceBalanceSchema,
        food: resourceBalanceSchema,
        water: resourceBalanceSchema,
        oil: resourceBalanceSchema
      })
      .strict(),
    exactGarrisons: z.record(z.string(), unitCountsSchema),
    exactArmies: z.record(
      z.string(),
      z
        .object({
          armyId: armyIdSchema,
          units: unitCountsSchema
        })
        .strict()
    ),
    activeDoctrine: z
      .object({
        weapon: doctrineWeaponSchema,
        skill: doctrineSkillSchema
      })
      .strict(),
    activeCooldowns: z.record(z.string(), z.string().datetime())
  })
  .strict();

export type PrivateFactionState = z.infer<typeof privateFactionStateSchema>;

export const stateViewSchema = z
  .object({
    world: worldSummaryDtoSchema,
    factions: z.record(z.string(), publicFactionSchema),
    regions: z.record(z.string(), publicRegionSchema),
    armies: z.record(z.string(), publicArmySchema),
    alliances: z.record(z.string(), publicAllianceSchema),
    marketOffers: z.array(publicTradeOfferSchema),
    privateState: privateFactionStateSchema.nullable()
  })
  .strict();

export type StateView = z.infer<typeof stateViewSchema>;
