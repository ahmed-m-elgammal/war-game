/**
 * Branded Identifier Schemas and Types
 *
 * Implements nominal/branded types for domain entities to prevent accidental
 * mixing of raw strings or integers (e.g. passing a ProvinceId where a FactionId is expected).
 * All boundary payloads validate IDs through these schemas.
 * Includes zero-cost internal casting helpers (toProvinceId, etc.) for trusted tick loops.
 */

import { z } from "zod";

export type Brand<T, B extends string> = T & { readonly __brand: B };

export const accountIdSchema = z.string().min(1).brand<"AccountId">();
export type AccountId = z.infer<typeof accountIdSchema>;

export const worldIdSchema = z.string().min(1).brand<"WorldId">();
export type WorldId = z.infer<typeof worldIdSchema>;

export const provinceIdSchema = z.number().int().positive().brand<"ProvinceId">();
export type ProvinceId = z.infer<typeof provinceIdSchema>;

export const commandIdSchema = z.string().min(1).brand<"CommandId">();
export type CommandId = z.infer<typeof commandIdSchema>;

export const factionIdSchema = z.number().int().nonnegative().brand<"FactionId">();
export type FactionId = z.infer<typeof factionIdSchema>;

export const armyIdSchema = z.number().int().nonnegative().brand<"ArmyId">();
export type ArmyId = z.infer<typeof armyIdSchema>;

export const battleIdSchema = z.number().int().nonnegative().brand<"BattleId">();
export type BattleId = z.infer<typeof battleIdSchema>;

export const tradeOfferIdSchema = z.number().int().nonnegative().brand<"TradeOfferId">();
export type TradeOfferId = z.infer<typeof tradeOfferIdSchema>;

export const tradeIdSchema = z.number().int().nonnegative().brand<"TradeId">();
export type TradeId = z.infer<typeof tradeIdSchema>;

export const allianceIdSchema = z.number().int().nonnegative().brand<"AllianceId">();
export type AllianceId = z.infer<typeof allianceIdSchema>;

export const allianceMembershipIdSchema = z
  .number()
  .int()
  .nonnegative()
  .brand<"AllianceMembershipId">();
export type AllianceMembershipId = z.infer<typeof allianceMembershipIdSchema>;

export const allianceInvitationIdSchema = z
  .number()
  .int()
  .nonnegative()
  .brand<"AllianceInvitationId">();
export type AllianceInvitationId = z.infer<typeof allianceInvitationIdSchema>;

export const buildOrderIdSchema = z.number().int().nonnegative().brand<"BuildOrderId">();
export type BuildOrderId = z.infer<typeof buildOrderIdSchema>;

export const trainingOrderIdSchema = z.number().int().nonnegative().brand<"TrainingOrderId">();
export type TrainingOrderId = z.infer<typeof trainingOrderIdSchema>;

export const rebellionIdSchema = z.number().int().nonnegative().brand<"RebellionId">();
export type RebellionId = z.infer<typeof rebellionIdSchema>;

export const doctrineChangeIdSchema = z.number().int().nonnegative().brand<"DoctrineChangeId">();
export type DoctrineChangeId = z.infer<typeof doctrineChangeIdSchema>;

// Zero-cost casting helpers for trusted internal loops and DB hydration
export const toAccountId = (id: string): AccountId => id as AccountId;
export const toWorldId = (id: string): WorldId => id as WorldId;
export const toProvinceId = (id: number): ProvinceId => id as ProvinceId;
export const toFactionId = (id: number): FactionId => id as FactionId;
export const toArmyId = (id: number): ArmyId => id as ArmyId;
export const toCommandId = (id: string): CommandId => id as CommandId;
