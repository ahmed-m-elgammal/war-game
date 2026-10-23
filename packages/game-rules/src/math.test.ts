/**
 * Deterministic integer and fixed-point arithmetic tests.
 *
 * Rates and scales are injected. The fixed-point helpers keep a per-tick
 * remainder as integer subunits so a 10/hour rate applied on a 60-second tick
 * produces exactly one unit after six ticks, with no floating drift.
 */

import { describe, expect, it } from "vitest";
import {
  allocateByLargestRemainder,
  computeWeightedScore,
  fractionToRemainderUnits,
  payUpkeepFixedPoint,
  rateUnitsPerTick,
  remainderUnitsToFraction,
  roundHalfUp,
  stepFixedPoint
} from "./index.js";

const MINUTE_MS = 60_000;
const SCALE = 600;

describe("roundHalfUp", () => {
  it.each([
    [0, 0],
    [0.49, 0],
    [0.5, 1],
    [1.49, 1],
    [1.5, 2],
    [2.5, 3]
  ])("rounds %s half up to %s", (value, expected) => {
    expect(roundHalfUp(value)).toBe(expected);
  });

  it("rejects non-finite values", () => {
    expect(() => roundHalfUp(Number.NaN)).toThrow(RangeError);
    expect(() => roundHalfUp(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("fixed-point production rates", () => {
  it("converts an hourly rate into integer units per tick", () => {
    expect(rateUnitsPerTick(10, MINUTE_MS, SCALE)).toBe(100);
    expect(rateUnitsPerTick(5, MINUTE_MS, SCALE)).toBe(50);
    expect(rateUnitsPerTick(0.3, MINUTE_MS, SCALE)).toBe(3);
    expect(rateUnitsPerTick(0.2, MINUTE_MS, SCALE)).toBe(2);
    expect(rateUnitsPerTick(0, MINUTE_MS, SCALE)).toBe(0);
  });

  it("produces one whole unit after exactly six 60-second ticks at 10/hour", () => {
    const rate = rateUnitsPerTick(10, MINUTE_MS, SCALE);
    let balance = { amount: 0, remainderUnits: 0 };

    for (let tick = 0; tick < 5; tick += 1) {
      balance = stepFixedPoint(balance.amount, balance.remainderUnits, rate, SCALE);
    }

    expect(balance).toEqual({ amount: 0, remainderUnits: 500 });

    balance = stepFixedPoint(balance.amount, balance.remainderUnits, rate, SCALE);

    expect(balance).toEqual({ amount: 1, remainderUnits: 0 });
  });

  it("carries whole units when a rate exceeds the scale", () => {
    expect(stepFixedPoint(2, 0, 1200, SCALE)).toEqual({ amount: 4, remainderUnits: 0 });
  });

  it("converts between the shared fractional remainder and fixed-point subunits", () => {
    expect(remainderUnitsToFraction(100, SCALE)).toBeCloseTo(1 / 6, 15);
    expect(fractionToRemainderUnits(1 / 6, SCALE)).toBe(100);
    expect(fractionToRemainderUnits(0, SCALE)).toBe(0);
  });

  it("round-trips every subunit through the shared fractional remainder", () => {
    for (let units = 0; units < SCALE; units += 1) {
      const fraction = remainderUnitsToFraction(units, SCALE);
      expect(fractionToRemainderUnits(fraction, SCALE)).toBe(units);
    }
  });

  it("rejects malformed fixed-point inputs", () => {
    expect(() => stepFixedPoint(0, 0, 1, 0)).toThrow(RangeError);
    expect(() => stepFixedPoint(0, -1, 1, SCALE)).toThrow(RangeError);
    expect(() => stepFixedPoint(0, SCALE, 1, SCALE)).toThrow(RangeError);
    expect(() => stepFixedPoint(-1, 0, 1, SCALE)).toThrow(RangeError);
    expect(() => stepFixedPoint(0, 0, -1, SCALE)).toThrow(RangeError);
    expect(() => rateUnitsPerTick(-1, MINUTE_MS, SCALE)).toThrow(RangeError);
    expect(() => rateUnitsPerTick(10, 0, SCALE)).toThrow(RangeError);
    expect(() => fractionToRemainderUnits(1, SCALE)).toThrow(RangeError);
    expect(() => remainderUnitsToFraction(SCALE, SCALE)).toThrow(RangeError);
  });
});

describe("fixed-point upkeep", () => {
  it("pays the accrued whole amount and keeps the fractional remainder", () => {
    expect(payUpkeepFixedPoint(5, 0, 600, SCALE)).toEqual({
      remaining: 4,
      remainderUnits: 0,
      paid: 1,
      short: false
    });
  });

  it("carries a fractional remainder across ticks", () => {
    expect(payUpkeepFixedPoint(5, 300, 300, SCALE)).toEqual({
      remaining: 4,
      remainderUnits: 0,
      paid: 1,
      short: false
    });
  });

  it("pays what it can and carries no debt when short", () => {
    expect(payUpkeepFixedPoint(1, 0, 1200, SCALE)).toEqual({
      remaining: 0,
      remainderUnits: 0,
      paid: 1,
      short: true
    });
    expect(payUpkeepFixedPoint(0, 300, 300, SCALE)).toEqual({
      remaining: 0,
      remainderUnits: 0,
      paid: 0,
      short: true
    });
  });

  it("handles a zero rate and a fully affordable rate", () => {
    expect(payUpkeepFixedPoint(5, 0, 0, SCALE)).toEqual({
      remaining: 5,
      remainderUnits: 0,
      paid: 0,
      short: false
    });
    expect(payUpkeepFixedPoint(5, 0, 1200, SCALE)).toEqual({
      remaining: 3,
      remainderUnits: 0,
      paid: 2,
      short: false
    });
  });
});

describe("largest-remainder apportionment", () => {
  it("distributes leftover units to the largest fractional shares", () => {
    expect(allocateByLargestRemainder(10, [1, 1, 1])).toEqual([4, 3, 3]);
    expect(allocateByLargestRemainder(5, [2, 1])).toEqual([3, 2]);
  });

  it("handles zero total, zero weights, and a single non-zero weight", () => {
    expect(allocateByLargestRemainder(0, [1, 2, 3])).toEqual([0, 0, 0]);
    expect(allocateByLargestRemainder(0, [])).toEqual([]);
    expect(allocateByLargestRemainder(7, [0, 0, 1])).toEqual([0, 0, 7]);
  });

  it("rejects an impossible apportionment", () => {
    expect(() => allocateByLargestRemainder(1, [0, 0])).toThrow(RangeError);
    expect(() => allocateByLargestRemainder(-1, [1])).toThrow(RangeError);
    expect(() => allocateByLargestRemainder(1, [-1])).toThrow(RangeError);
    expect(() => allocateByLargestRemainder(1.5, [1])).toThrow(RangeError);
  });

  it("conserves the total across deterministic property cases", () => {
    const weightSets = [[1], [1, 1], [1, 2, 3], [0, 1, 4], [5, 0, 0, 1], [2, 7, 11, 13]];

    for (let total = 0; total <= 50; total += 1) {
      for (const weights of weightSets) {
        const shares = allocateByLargestRemainder(total, weights);
        expect(shares).toHaveLength(weights.length);
        expect(shares.reduce((sum, value) => sum + value, 0)).toBe(total);
        expect(shares.every((value) => value >= 0)).toBe(true);
      }
    }
  });
});

describe("integer score aggregation", () => {
  it("sums weighted integer score components without rounding", () => {
    expect(
      computeWeightedScore([
        { value: 12, weight: 10 },
        { value: 50, weight: 1 },
        { value: 30, weight: 1 },
        { value: 60, weight: 1 }
      ])
    ).toBe(260);
  });

  it("returns zero for an empty score", () => {
    expect(computeWeightedScore([])).toBe(0);
  });

  it("rejects malformed score terms", () => {
    expect(() => computeWeightedScore([{ value: -1, weight: 1 }])).toThrow(RangeError);
    expect(() => computeWeightedScore([{ value: 1, weight: 1.5 }])).toThrow(RangeError);
    expect(() => computeWeightedScore([{ value: 1.5, weight: 1 }])).toThrow(RangeError);
  });
});
