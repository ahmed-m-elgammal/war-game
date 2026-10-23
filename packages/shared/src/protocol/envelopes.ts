/**
 * Network Communication Envelopes
 *
 * Provides standardized, strict schemas for REST API envelopes, durable event envelopes,
 * command envelopes, and command receipts.
 * Unknown properties are strictly rejected (.strict()).
 * Includes zero-overhead factory functions (createSuccessResponse, createErrorResponse).
 */

import { z } from "zod";
import { PROTOCOL_VERSION } from "./version.js";
import { accountIdSchema, worldIdSchema, factionIdSchema, commandIdSchema } from "./ids.js";
import { commandTypeSchema, worldEventTypeSchema, eventActorTypeSchema } from "./enums.js";
import { errorEnvelopeSchema, ErrorEnvelope } from "./errors.js";

export const apiSuccessEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z
    .object({
      success: z.literal(true),
      data: dataSchema,
      protocolVersion: z.literal(PROTOCOL_VERSION),
      timestamp: z.string().datetime()
    })
    .strict();

export const apiErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: errorEnvelopeSchema,
    protocolVersion: z.literal(PROTOCOL_VERSION),
    timestamp: z.string().datetime()
  })
  .strict();

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  protocolVersion: typeof PROTOCOL_VERSION;
  timestamp: string;
}

export function createSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    protocolVersion: PROTOCOL_VERSION,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(error: ErrorEnvelope): ApiErrorResponse {
  return {
    success: false,
    error,
    protocolVersion: PROTOCOL_VERSION,
    timestamp: new Date().toISOString()
  };
}

export const commandEnvelopeSchema = z
  .object({
    commandId: commandIdSchema,
    worldId: worldIdSchema,
    factionId: factionIdSchema.nullable(),
    type: commandTypeSchema,
    worldVersion: z.number().int().nonnegative(),
    clientTimestamp: z.string().datetime(),
    payload: z.record(z.string(), z.unknown())
  })
  .strict();

export const commandReceiptSchema = z
  .object({
    accountId: accountIdSchema,
    commandId: commandIdSchema,
    worldId: worldIdSchema,
    factionId: factionIdSchema.nullable(),
    commandType: commandTypeSchema,
    resultCode: z.string(),
    resultPayload: z.record(z.string(), z.unknown()),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime()
  })
  .strict();

export const worldEventSchema = z
  .object({
    worldId: worldIdSchema,
    seq: z.number().int().nonnegative(),
    type: worldEventTypeSchema,
    commandType: commandTypeSchema.nullable(),
    actorType: eventActorTypeSchema,
    actorAccountId: accountIdSchema.nullable(),
    actorFactionId: factionIdSchema.nullable(),
    commandId: commandIdSchema.nullable(),
    effectiveAt: z.string().datetime(),
    priority: z.number().int(),
    payload: z.record(z.string(), z.unknown()),
    leaseVersion: z.number().int().nonnegative(),
    createdAt: z.string().datetime()
  })
  .strict();
