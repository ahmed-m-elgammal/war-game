/**
 * Mask Hit-Test Tests
 *
 * Proves mask coordinates resolve to province IDs with water and out-of-bounds
 * reads returning null. The synthetic fixture is test-only.
 */

import { describe, expect, it } from "vitest";
import { toProvinceId } from "@wargame/shared";
import { hitTestMask } from "./index.js";
import { createTestMap } from "./testing/fixtures.js";

describe("hitTestMask", () => {
  it("returns the province ID at a land pixel", () => {
    const { mask } = createTestMap();

    expect(hitTestMask(mask, 1, 1)).toBe(toProvinceId(1));
    expect(hitTestMask(mask, 5, 2)).toBe(toProvinceId(3));
    expect(hitTestMask(mask, 10, 4)).toBe(toProvinceId(5));
  });

  it("returns null for water", () => {
    const { mask } = createTestMap();

    expect(hitTestMask(mask, 0, 0)).toBeNull();
    expect(hitTestMask(mask, 11, 3)).toBeNull();
  });

  it("returns null outside the mask", () => {
    const { mask } = createTestMap();

    expect(hitTestMask(mask, -1, 0)).toBeNull();
    expect(hitTestMask(mask, 12, 0)).toBeNull();
    expect(hitTestMask(mask, 0, -1)).toBeNull();
    expect(hitTestMask(mask, 0, 6)).toBeNull();
  });

  it("floors fractional coordinates", () => {
    const { mask } = createTestMap();

    expect(hitTestMask(mask, 2.9, 1.9)).toBe(toProvinceId(1));
    expect(hitTestMask(mask, 4.01, 4.99)).toBe(toProvinceId(2));
  });

  it("returns null for non-finite coordinates", () => {
    const { mask } = createTestMap();

    expect(hitTestMask(mask, Number.NaN, 1)).toBeNull();
    expect(hitTestMask(mask, 1, Number.POSITIVE_INFINITY)).toBeNull();
  });
});
