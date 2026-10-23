/**
 * Protocol Schemas Unit Tests
 *
 * Verifies that the shared protocol package strictly enforces schema invariants:
 * - Explicit protocol version agreement
 * - Unknown field rejection across command payloads and envelopes (.strict())
 * - Branded ID format validation & zero-cost casting helpers
 * - StateView and DTO serialization roundtrips
 * - Error code coverage, AppError, and formatZodError helpers
 * - Command payload registry and parseCommandPayload helper
 */

import { describe, it, expect } from "vitest";
import { z, ZodError } from "zod";
import {
  PROTOCOL_VERSION,
  protocolVersionSchema,
  accountIdSchema,
  worldIdSchema,
  provinceIdSchema,
  commandIdSchema,
  factionIdSchema,
  armyIdSchema,
  toProvinceId,
  toFactionId,
  launchArmyPayloadSchema,
  joinWorldPayloadSchema,
  enqueueBuildPayloadSchema,
  useAbilityPayloadSchema,
  commandEnvelopeSchema,
  errorEnvelopeSchema,
  ERROR_CODES,
  errorCodeSchema,
  AppError,
  formatZodError,
  parseCommandPayload,
  createSuccessResponse,
  createErrorResponse,
  worldSummaryDtoSchema,
  troopBandSchema,
  publicRegionSchema
} from "./index.js";

describe("Protocol Version Contract", () => {
  it("defines an explicit protocol version", () => {
    expect(PROTOCOL_VERSION).toBe("1.0.0");
    expect(protocolVersionSchema.parse("1.0.0")).toBe("1.0.0");
    expect(() => protocolVersionSchema.parse("2.0.0")).toThrow(ZodError);
  });
});

describe("Branded IDs Validation & Fast Casting", () => {
  it("validates well-formed branded IDs", () => {
    const accId = accountIdSchema.parse("acc-12345");
    const wId = worldIdSchema.parse("w-01");
    const pId = provinceIdSchema.parse(42);
    const cmdId = commandIdSchema.parse("cmd-abc-789");
    const fId = factionIdSchema.parse(3);
    const aId = armyIdSchema.parse(10);

    expect(accId).toBe("acc-12345");
    expect(wId).toBe("w-01");
    expect(pId).toBe(42);
    expect(cmdId).toBe("cmd-abc-789");
    expect(fId).toBe(3);
    expect(aId).toBe(10);
  });

  it("rejects invalid ID primitives", () => {
    expect(() => accountIdSchema.parse("")).toThrow(ZodError);
    expect(() => provinceIdSchema.parse(0)).toThrow(ZodError);
    expect(() => provinceIdSchema.parse(-5)).toThrow(ZodError);
    expect(() => factionIdSchema.parse(-1)).toThrow(ZodError);
  });

  it("supports zero-cost brand casting in internal loops", () => {
    const provinceId = toProvinceId(12);
    const factionId = toFactionId(1);
    expect(provinceId).toBe(12);
    expect(factionId).toBe(1);
  });
});

describe("Unknown Field Rejection (.strict())", () => {
  it("rejects unknown properties in command payloads", () => {
    const validLaunch = {
      originProvinceId: 10,
      targetProvinceId: 11,
      purpose: "attack" as const,
      units: { infantry: 50, tank: 0, aircraft: 0, artillery: 0 }
    };
    expect(() => launchArmyPayloadSchema.parse(validLaunch)).not.toThrow();

    const withExtra = {
      ...validLaunch,
      cheatGodMode: true
    };
    expect(() => launchArmyPayloadSchema.parse(withExtra)).toThrow(ZodError);
  });

  it("rejects unknown properties in join payload", () => {
    const validJoin = { emblemId: "eagle", colorId: "color-crimson" };
    expect(() => joinWorldPayloadSchema.parse(validJoin)).not.toThrow();

    const withExtra = { ...validJoin, clientAdminBypass: true };
    expect(() => joinWorldPayloadSchema.parse(withExtra)).toThrow(ZodError);
  });

  it("rejects unknown properties in command envelope", () => {
    const validEnvelope = {
      commandId: "cmd-1",
      worldId: "w-01",
      factionId: 1,
      type: "launch_army" as const,
      worldVersion: 100,
      clientTimestamp: new Date().toISOString(),
      payload: {}
    };
    expect(() => commandEnvelopeSchema.parse(validEnvelope)).not.toThrow();

    const withExtra = { ...validEnvelope, rogueHeader: "intercept" };
    expect(() => commandEnvelopeSchema.parse(withExtra)).toThrow(ZodError);
  });

  it("rejects unknown properties in error envelope", () => {
    const validError = {
      code: "INSUFFICIENT_RESOURCES" as const,
      message: "Not enough food to train units"
    };
    expect(() => errorEnvelopeSchema.parse(validError)).not.toThrow();

    const withExtra = { ...validError, leakInternalStack: "at eval..." };
    expect(() => errorEnvelopeSchema.parse(withExtra)).toThrow(ZodError);
  });
});

describe("Command Payload Schemas & Parse Helper", () => {
  it("validates build queue constraints", () => {
    expect(() => enqueueBuildPayloadSchema.parse({ provinceId: 1, targetLevel: 2 })).not.toThrow();
    expect(() => enqueueBuildPayloadSchema.parse({ provinceId: 1, targetLevel: 5 })).not.toThrow();
    // Level 1 cannot be built into (starts at 1)
    expect(() => enqueueBuildPayloadSchema.parse({ provinceId: 1, targetLevel: 1 })).toThrow(
      ZodError
    );
    // Level 6 exceeds maximum
    expect(() => enqueueBuildPayloadSchema.parse({ provinceId: 1, targetLevel: 6 })).toThrow(
      ZodError
    );
  });

  it("validates special abilities payloads", () => {
    expect(() =>
      useAbilityPayloadSchema.parse({ ability: "airstrike", targetProvinceId: 25 })
    ).not.toThrow();
    expect(() =>
      useAbilityPayloadSchema.parse({
        ability: "invalid_ability" as unknown as "airstrike",
        targetProvinceId: 25
      })
    ).toThrow(ZodError);
  });

  it("dispatches and parses payloads safely with parseCommandPayload", () => {
    const validPayload = {
      originProvinceId: 10,
      targetProvinceId: 11,
      purpose: "attack" as const,
      units: { infantry: 50, tank: 0, aircraft: 0, artillery: 0 }
    };

    const parsed = parseCommandPayload("launch_army", validPayload);
    expect(parsed).toEqual(validPayload);

    // Invalid payload throws AppError with field-level details
    expect(() => parseCommandPayload("launch_army", { invalidField: 123 })).toThrow(AppError);
  });
});

describe("DTOs and StateView Projections", () => {
  it("validates world summary with config and map hashes", () => {
    const validSummary = {
      worldId: "w-01",
      name: "Vardania Season 1",
      status: "running" as const,
      operationalState: null,
      currentTick: 120,
      phase: "war" as const,
      era: 2 as const,
      playerCount: 18,
      maxHumans: 24,
      startedAt: new Date().toISOString(),
      joinDeadline: new Date().toISOString(),
      seasonEnd: new Date().toISOString(),
      configVersion: "1.0.0",
      configHash: "a".repeat(64),
      mapId: "vardania-classic",
      mapHash: "b".repeat(64)
    };

    const parsed = worldSummaryDtoSchema.parse(validSummary);
    expect(parsed.configHash).toBe("a".repeat(64));
    expect(parsed.seasonEnd).toBeDefined();

    // Rejects invalid hash length
    expect(() => worldSummaryDtoSchema.parse({ ...validSummary, configHash: "too-short" })).toThrow(
      ZodError
    );
  });

  it("validates public troop banding on regions", () => {
    expect(() => troopBandSchema.parse({ min: 10, max: 20 })).not.toThrow();
    expect(() => troopBandSchema.parse({ min: -1, max: 20 })).toThrow(ZodError);

    const validRegion = {
      provinceId: 5,
      ownerFactionId: 2,
      controllerType: "player" as const,
      level: 3 as const,
      terrainResource: "food" as const,
      isCapital: false,
      isProtected: false,
      troopBand: { min: 50, max: 100 }
    };
    expect(() => publicRegionSchema.parse(validRegion)).not.toThrow();

    // Open-ended band with null max
    const openBandRegion = {
      ...validRegion,
      troopBand: { min: 1000, max: null }
    };
    expect(() => publicRegionSchema.parse(openBandRegion)).not.toThrow();
  });
});

describe("Error Codes & Handling Helpers", () => {
  it("covers required domain error categories", () => {
    expect(ERROR_CODES).toContain("AUTH_UNAUTHORIZED");
    expect(ERROR_CODES).toContain("COMMAND_INVALID");
    expect(ERROR_CODES).toContain("INSUFFICIENT_RESOURCES");
    expect(ERROR_CODES).toContain("WAR_ONLY_ACTION");
    expect(ERROR_CODES).toContain("TRADE_WAR_FROZEN");
    expect(ERROR_CODES).toContain("ALLIANCE_NOT_LEADER");

    expect(errorCodeSchema.parse("COMMAND_INVALID")).toBe("COMMAND_INVALID");
    expect(() => errorCodeSchema.parse("MADE_UP_ERROR")).toThrow(ZodError);
  });

  it("converts AppError into standardized ErrorEnvelope", () => {
    const error = new AppError("INSUFFICIENT_RESOURCES", "Not enough gold", {
      shortage: 50
    });
    const envelope = error.toEnvelope();
    expect(envelope.code).toBe("INSUFFICIENT_RESOURCES");
    expect(envelope.message).toBe("Not enough gold");
    expect(envelope.details?.shortage).toBe(50);
  });

  it("formats ZodError into client-friendly ErrorEnvelope with fieldErrors", () => {
    const dummySchema = z.object({ age: z.number().positive(), name: z.string().min(1) });
    const result = dummySchema.safeParse({ age: -10, name: "" });
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted.code).toBe("COMMAND_INVALID");
      expect(formatted.details?.issueCount).toBe(2);
      expect((formatted.details?.fieldErrors as Record<string, string>)?.age).toBeDefined();
    }
  });

  it("creates standard success and error response envelopes", () => {
    const successRes = createSuccessResponse({ hello: "world" });
    expect(successRes.success).toBe(true);
    expect(successRes.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(successRes.data.hello).toBe("world");

    const errorRes = createErrorResponse({
      code: "RATE_LIMITED",
      message: "Too many requests"
    });
    expect(errorRes.success).toBe(false);
    expect(errorRes.error.code).toBe("RATE_LIMITED");
  });
});
