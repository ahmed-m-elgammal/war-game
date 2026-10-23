/**
 * Command Payload Schemas
 *
 * Defines strictly validated input schemas for all client-to-server game actions.
 * Every schema enforces .strict() to reject unknown or malicious attributes.
 * Includes COMMAND_PAYLOAD_SCHEMAS registry and parseCommandPayload helper.
 */

import { z } from "zod";
import {
  provinceIdSchema,
  armyIdSchema,
  factionIdSchema,
  buildOrderIdSchema,
  trainingOrderIdSchema,
  tradeOfferIdSchema,
  allianceIdSchema,
  allianceInvitationIdSchema
} from "./ids.js";
import {
  CommandType,
  armyPurposeSchema,
  unitTypeSchema,
  tradeableResourceSchema,
  doctrineWeaponSchema,
  doctrineSkillSchema,
  abilityTypeSchema
} from "./enums.js";
import { AppError } from "./errors.js";

export const unitCountsSchema = z
  .object({
    infantry: z.number().int().nonnegative().default(0),
    tank: z.number().int().nonnegative().default(0),
    aircraft: z.number().int().nonnegative().default(0),
    artillery: z.number().int().nonnegative().default(0)
  })
  .strict();

export const joinWorldPayloadSchema = z
  .object({
    emblemId: z.string().min(1).max(64),
    colorId: z.string().min(1).max(64)
  })
  .strict();

export const launchArmyPayloadSchema = z
  .object({
    originProvinceId: provinceIdSchema,
    targetProvinceId: provinceIdSchema,
    purpose: armyPurposeSchema,
    units: unitCountsSchema
  })
  .strict();

export const recallArmyPayloadSchema = z
  .object({
    armyId: armyIdSchema
  })
  .strict();

export const splitArmyPayloadSchema = z
  .object({
    sourceArmyId: armyIdSchema,
    units: unitCountsSchema
  })
  .strict();

export const mergeArmyPayloadSchema = z
  .object({
    sourceArmyIds: z.array(armyIdSchema).min(1),
    targetArmyId: armyIdSchema
  })
  .strict();

export const retreatGarrisonPayloadSchema = z
  .object({
    provinceId: provinceIdSchema,
    targetProvinceId: provinceIdSchema,
    units: unitCountsSchema
  })
  .strict();

export const reinforceProvincePayloadSchema = z
  .object({
    sourceProvinceId: provinceIdSchema,
    targetProvinceId: provinceIdSchema,
    units: unitCountsSchema
  })
  .strict();

export const enqueueBuildPayloadSchema = z
  .object({
    provinceId: provinceIdSchema,
    targetLevel: z.number().int().min(2).max(5)
  })
  .strict();

export const cancelBuildPayloadSchema = z
  .object({
    buildOrderId: buildOrderIdSchema
  })
  .strict();

export const enqueueTrainingPayloadSchema = z
  .object({
    provinceId: provinceIdSchema,
    unitType: unitTypeSchema,
    count: z.number().int().positive()
  })
  .strict();

export const cancelTrainingPayloadSchema = z
  .object({
    trainingOrderId: trainingOrderIdSchema
  })
  .strict();

export const purchaseTechPayloadSchema = z
  .object({
    techId: z.string().min(1).max(64)
  })
  .strict();

export const changeDoctrinePayloadSchema = z
  .object({
    weapon: doctrineWeaponSchema,
    skill: doctrineSkillSchema
  })
  .strict();

export const createMarketListingPayloadSchema = z
  .object({
    resource: tradeableResourceSchema,
    amount: z.number().int().positive(),
    priceGold: z.number().int().positive()
  })
  .strict();

export const createDirectOfferPayloadSchema = z
  .object({
    buyerFactionId: factionIdSchema,
    resource: tradeableResourceSchema,
    amount: z.number().int().positive(),
    priceGold: z.number().int().positive()
  })
  .strict();

export const acceptTradePayloadSchema = z
  .object({
    offerId: tradeOfferIdSchema
  })
  .strict();

export const declineTradePayloadSchema = z
  .object({
    offerId: tradeOfferIdSchema
  })
  .strict();

export const cancelTradePayloadSchema = z
  .object({
    offerId: tradeOfferIdSchema
  })
  .strict();

export const stateExchangePayloadSchema = z
  .object({
    buyerFactionId: factionIdSchema,
    resourceGive: tradeableResourceSchema,
    amountGive: z.number().int().positive(),
    resourceReceive: tradeableResourceSchema,
    amountReceive: z.number().int().positive()
  })
  .strict();

export const createAlliancePayloadSchema = z
  .object({
    name: z.string().min(3).max(32)
  })
  .strict();

export const inviteToAlliancePayloadSchema = z
  .object({
    targetFactionId: factionIdSchema
  })
  .strict();

export const acceptAllianceInvitePayloadSchema = z
  .object({
    invitationId: allianceInvitationIdSchema
  })
  .strict();

export const leaveAlliancePayloadSchema = z
  .object({
    allianceId: allianceIdSchema
  })
  .strict();

export const kickFromAlliancePayloadSchema = z
  .object({
    allianceId: allianceIdSchema,
    targetFactionId: factionIdSchema
  })
  .strict();

export const useAbilityPayloadSchema = z
  .object({
    ability: abilityTypeSchema,
    targetProvinceId: provinceIdSchema
  })
  .strict();

export const COMMAND_PAYLOAD_SCHEMAS: Record<CommandType, z.ZodTypeAny> = {
  join_world: joinWorldPayloadSchema,
  launch_army: launchArmyPayloadSchema,
  recall_army: recallArmyPayloadSchema,
  split_army: splitArmyPayloadSchema,
  merge_army: mergeArmyPayloadSchema,
  retreat_garrison: retreatGarrisonPayloadSchema,
  reinforce_province: reinforceProvincePayloadSchema,
  enqueue_build: enqueueBuildPayloadSchema,
  cancel_build: cancelBuildPayloadSchema,
  enqueue_training: enqueueTrainingPayloadSchema,
  cancel_training: cancelTrainingPayloadSchema,
  purchase_tech: purchaseTechPayloadSchema,
  change_doctrine: changeDoctrinePayloadSchema,
  create_market_listing: createMarketListingPayloadSchema,
  create_direct_offer: createDirectOfferPayloadSchema,
  accept_trade: acceptTradePayloadSchema,
  decline_trade: declineTradePayloadSchema,
  cancel_trade: cancelTradePayloadSchema,
  state_exchange: stateExchangePayloadSchema,
  create_alliance: createAlliancePayloadSchema,
  invite_to_alliance: inviteToAlliancePayloadSchema,
  accept_alliance_invite: acceptAllianceInvitePayloadSchema,
  leave_alliance: leaveAlliancePayloadSchema,
  kick_from_alliance: kickFromAlliancePayloadSchema,
  use_ability: useAbilityPayloadSchema
};

export function parseCommandPayload(type: CommandType, payload: unknown): unknown {
  const schema = COMMAND_PAYLOAD_SCHEMAS[type];
  if (!schema) {
    throw new AppError("COMMAND_INVALID", `Unknown command type: "${type}"`);
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      fieldErrors[issue.path.join(".") || "payload"] = issue.message;
    }
    throw new AppError("COMMAND_INVALID", `Invalid payload for command "${type}"`, { fieldErrors });
  }

  return result.data;
}
