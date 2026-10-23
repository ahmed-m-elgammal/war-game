/**
 * Standard Error Codes and Envelope Schemas
 *
 * Defines machine-readable error codes and stable error envelopes returned across
 * REST endpoints and WebSocket/Colyseus command acknowledgments.
 * Includes AppError class and formatZodError helper for production error handling.
 */

import { z } from "zod";

export const ERROR_CODES = [
  // Auth & Account
  "AUTH_UNAUTHORIZED",
  "AUTH_FORBIDDEN",
  "AUTH_TOKEN_EXPIRED",
  "ACCOUNT_NOT_FOUND",
  "ACCOUNT_BANNED",
  "ACCOUNT_MERGE_CONFLICT",

  // World & Lifecycle
  "WORLD_NOT_FOUND",
  "WORLD_FULL",
  "WORLD_NOT_OPEN",
  "WORLD_PAUSED",
  "WORLD_FINISHED",

  // Command & Protocol
  "COMMAND_INVALID",
  "COMMAND_DUPLICATE",
  "COMMAND_EXPIRED",
  "STALE_WORLD_VERSION",
  "PROTOCOL_MISMATCH",
  "RATE_LIMITED",

  // Faction & Ownership
  "FACTION_NOT_FOUND",
  "FACTION_ELIMINATED",
  "NOT_FACTION_OWNER",
  "FACTION_ALREADY_SPAWNED",

  // Economy & Trade
  "INSUFFICIENT_RESOURCES",
  "TRADE_NOT_FOUND",
  "TRADE_INVALID_STATE",
  "TRADE_WAR_FROZEN",
  "TRADE_SELF_DEALING",

  // Military & Movement
  "PROVINCE_NOT_FOUND",
  "PROVINCE_NOT_ADJACENT",
  "ARMY_NOT_FOUND",
  "ARMY_CANNOT_RECALL",
  "PEACETIME_RESTRICTION",
  "WAR_ONLY_ACTION",
  "GARRISON_MINIMUM_REQUIRED",

  // Queues, Tech, & Doctrine
  "QUEUE_FULL",
  "TECH_PREREQUISITES_NOT_MET",
  "TECH_ALREADY_RESEARCHED",
  "COOLDOWN_ACTIVE",
  "ERA_LOCKED",

  // Alliances
  "ALLIANCE_NOT_FOUND",
  "ALLIANCE_FULL",
  "ALLIANCE_NOT_LEADER",
  "ALLIANCE_WAR_FROZEN",
  "ALLIANCE_ALREADY_MEMBER",

  // Generic / System
  "INTERNAL_SERVER_ERROR",
  "DATABASE_ERROR",
  "SERVICE_UNAVAILABLE"
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = (typeof ERROR_CODES)[number];

export const errorEnvelopeSchema = z
  .object({
    code: errorCodeSchema,
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional()
  })
  .strict();

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }

  public toEnvelope(): ErrorEnvelope {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {})
    };
  }
}

export function createErrorEnvelope(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ErrorEnvelope {
  return {
    code,
    message,
    ...(details ? { details } : {})
  };
}

export function formatZodError(error: z.ZodError): ErrorEnvelope {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "payload";
    fieldErrors[path] = issue.message;
  }

  return {
    code: "COMMAND_INVALID",
    message: `Validation failed: ${error.issues.length} invalid field(s)`,
    details: {
      fieldErrors,
      issueCount: error.issues.length
    }
  };
}
