/**
 * Game Config Schema Tests
 *
 * Proves the schema round-trips a complete config, rejects missing and unknown
 * values, and stays type-identical to the domain `GameConfig` contract.
 */

import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import type { GameConfig } from "../../domain/config.js";
import { createTestGameConfig } from "./fixtures.js";
import { gameConfigSchema } from "./schema.js";

describe("gameConfigSchema", () => {
  it("parses a complete config document body", () => {
    const result = gameConfigSchema.safeParse(createTestGameConfig());
    expect(result.success).toBe(true);
  });

  it("stays type-identical to the domain GameConfig contract", () => {
    expectTypeOf<z.infer<typeof gameConfigSchema>>().toEqualTypeOf<GameConfig>();
  });

  it("fails when a required balance value is missing", () => {
    const config = createTestGameConfig();
    const incomplete = {
      ...config,
      units: [{ ...config.units[0], attack: undefined }]
    };

    const result = gameConfigSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("units.0.attack");
    }
  });

  it("fails on unknown config keys", () => {
    const result = gameConfigSchema.safeParse({
      ...createTestGameConfig(),
      extraBalance: 1
    });
    expect(result.success).toBe(false);
  });

  it("fails on an empty config version", () => {
    const result = gameConfigSchema.safeParse({ ...createTestGameConfig(), configVersion: "" });
    expect(result.success).toBe(false);
  });

  it("fails on a negative unsigned cost", () => {
    const config = createTestGameConfig();
    const invalid = {
      ...config,
      units: [{ ...config.units[0], costMoney: -1 }]
    };
    expect(gameConfigSchema.safeParse(invalid).success).toBe(false);
  });

  it("fails when metadata is not JSON data", () => {
    const config = createTestGameConfig();
    const invalid = {
      ...config,
      techs: [{ ...config.techs[0], effects: { callback: () => undefined } }]
    };
    expect(gameConfigSchema.safeParse(invalid).success).toBe(false);
  });

  it("fails when a province id is not a branded number", () => {
    const config = createTestGameConfig();
    const invalid = {
      ...config,
      map: {
        ...config.map,
        provinces: [{ ...config.map.provinces[0], provinceId: "province-1" }]
      }
    };
    expect(gameConfigSchema.safeParse(invalid).success).toBe(false);
  });
});
