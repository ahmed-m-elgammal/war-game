/**
 * Seeded PRNG contract tests.
 *
 * The public seam is the package entry point. Tests lock the deterministic
 * algorithm and verify that state transitions return a new RngState without
 * mutating the caller's value.
 */

import { describe, expect, it } from "vitest";
import type { RngState } from "@wargame/shared";
import { createRngState, nextFloat01, nextInt, nextUint32 } from "./index.js";

const GOLDEN_SEED = "wargame-alpha";
const GOLDEN_INITIAL_STATE = "3707065254";
const GOLDEN_UINT32 = [236184670, 2148930887, 1770524976, 3171346337, 948983551, 1481329061];
const GOLDEN_D6 = [5, 6, 1, 6, 2, 6, 2, 5];

describe("seeded PRNG", () => {
  it("derives a stable initial state from the seed", () => {
    expect(createRngState(GOLDEN_SEED)).toEqual({
      seed: GOLDEN_SEED,
      state: GOLDEN_INITIAL_STATE
    });
  });

  it("emits the locked Mulberry32 sequence for a known seed", () => {
    let rng = createRngState(GOLDEN_SEED);
    const values: number[] = [];

    for (let index = 0; index < GOLDEN_UINT32.length; index += 1) {
      const draw = nextUint32(rng);
      values.push(draw.value);
      rng = draw.rng;
    }

    expect(values).toEqual(GOLDEN_UINT32);
    expect(rng.state).toBe("1811558244");
  });

  it("returns a fresh state and never mutates the input", () => {
    const rng = createRngState(GOLDEN_SEED);
    const snapshot: RngState = { ...rng };

    const draw = nextUint32(rng);

    expect(rng).toEqual(snapshot);
    expect(draw.rng).not.toBe(rng);
    expect(draw.rng.seed).toBe(GOLDEN_SEED);
    expect(draw.rng.state).toBe("1243663771");
  });

  it("produces the same sequence for the same seed", () => {
    const first = collectUint32(createRngState("replay-seed"), 32);
    const second = collectUint32(createRngState("replay-seed"), 32);

    expect(first).toEqual(second);
  });

  it("separates different seeds", () => {
    const first = collectUint32(createRngState("seed-a"), 16);
    const second = collectUint32(createRngState("seed-b"), 16);

    expect(first).not.toEqual(second);
  });

  it("maps uint32 draws into the unit interval", () => {
    let rng = createRngState(GOLDEN_SEED);

    for (let index = 0; index < 64; index += 1) {
      const draw = nextFloat01(rng);
      expect(draw.value).toBeGreaterThanOrEqual(0);
      expect(draw.value).toBeLessThan(1);
      rng = draw.rng;
    }
  });

  it("maps draws into a half-open integer range", () => {
    let rng = createRngState(GOLDEN_SEED);
    const values: number[] = [];

    for (let index = 0; index < GOLDEN_D6.length; index += 1) {
      const draw = nextInt(rng, 1, 7);
      values.push(draw.value);
      rng = draw.rng;
    }

    expect(values).toEqual(GOLDEN_D6);
  });

  it("handles negative and zero-crossing integer ranges", () => {
    let rng = createRngState(GOLDEN_SEED);

    for (let index = 0; index < 32; index += 1) {
      const draw = nextInt(rng, -5, 5);
      expect(draw.value).toBeGreaterThanOrEqual(-5);
      expect(draw.value).toBeLessThan(5);
      rng = draw.rng;
    }
  });

  it.each([
    ["abc", "non-numeric state"],
    ["-1", "negative state"],
    ["1.5", "fractional state"],
    ["4294967296", "state beyond uint32"]
  ])("rejects a malformed state: %s", (state) => {
    expect(() => nextUint32({ seed: GOLDEN_SEED, state })).toThrow(RangeError);
  });

  it.each([
    [7, 7],
    [7, 6],
    [1.5, 7],
    [1, 2.5],
    [0, 4294967297]
  ])("rejects an invalid integer range: [%s, %s)", (minInclusive, maxExclusive) => {
    expect(() => nextInt(createRngState(GOLDEN_SEED), minInclusive, maxExclusive)).toThrow(
      RangeError
    );
  });
});

function collectUint32(rng: RngState, count: number): number[] {
  const values: number[] = [];
  let current = rng;

  for (let index = 0; index < count; index += 1) {
    const draw = nextUint32(current);
    values.push(draw.value);
    current = draw.rng;
  }

  return values;
}
