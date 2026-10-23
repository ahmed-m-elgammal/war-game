/**
 * Deterministic Integer and Fixed-Point Arithmetic
 *
 * Helpers for continuous resource rates, upkeep payment, largest-remainder
 * apportionment, final half-up rounding, and weighted score aggregation. All
 * rates, weights, and fixed-point scales are supplied by the caller from the
 * world's pinned config; this module contains no balance values.
 *
 * Continuous rates use integer subunits per tick. The whole-unit amount and
 * subunit remainder are both part of the committed state, so repeated ticks
 * cannot lose or create resources through floating-point drift. Largest-
 * remainder ties go to the lower input index, which is stable across replay.
 */

import { MILLISECONDS_PER_HOUR } from "./time.js";

export interface FixedPointBalance {
  readonly amount: number;
  readonly remainderUnits: number;
}

export interface UpkeepPayment {
  readonly remaining: number;
  readonly remainderUnits: number;
  readonly paid: number;
  readonly short: boolean;
}

export interface ScoreTerm {
  readonly value: number;
  readonly weight: number;
}

export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError("value must be finite");
  }

  return Math.floor(value + 0.5);
}

export function rateUnitsPerTick(ratePerHour: number, tickMs: number, scale: number): number {
  if (!Number.isFinite(ratePerHour) || ratePerHour < 0) {
    throw new RangeError("ratePerHour must be a finite non-negative number");
  }
  assertPositiveSafeInteger(tickMs, "tickMs");
  assertPositiveSafeInteger(scale, "scale");

  const units = roundHalfUp((ratePerHour * tickMs * scale) / MILLISECONDS_PER_HOUR);
  assertNonNegativeSafeInteger(units, "rateUnitsPerTick");

  return units;
}

export function stepFixedPoint(
  amount: number,
  remainderUnits: number,
  rateUnits: number,
  scale: number
): FixedPointBalance {
  assertNonNegativeSafeInteger(amount, "amount");
  assertPositiveSafeInteger(scale, "scale");
  assertNonNegativeSafeInteger(remainderUnits, "remainderUnits");
  assertNonNegativeSafeInteger(rateUnits, "rateUnits");

  if (remainderUnits >= scale) {
    throw new RangeError("remainderUnits must be less than scale");
  }

  const totalUnits = remainderUnits + rateUnits;
  assertNonNegativeSafeInteger(totalUnits, "totalUnits");

  const applied = Math.floor(totalUnits / scale);
  const nextAmount = amount + applied;
  assertNonNegativeSafeInteger(nextAmount, "nextAmount");

  return {
    amount: nextAmount,
    remainderUnits: totalUnits % scale
  };
}

export function payUpkeepFixedPoint(
  available: number,
  remainderUnits: number,
  rateUnits: number,
  scale: number
): UpkeepPayment {
  assertNonNegativeSafeInteger(available, "available");
  const accrued = stepFixedPoint(0, remainderUnits, rateUnits, scale);

  if (accrued.amount <= available) {
    return {
      remaining: available - accrued.amount,
      remainderUnits: accrued.remainderUnits,
      paid: accrued.amount,
      short: false
    };
  }

  return {
    remaining: 0,
    remainderUnits: 0,
    paid: available,
    short: true
  };
}

export function remainderUnitsToFraction(remainderUnits: number, scale: number): number {
  assertPositiveSafeInteger(scale, "scale");
  assertNonNegativeSafeInteger(remainderUnits, "remainderUnits");

  if (remainderUnits >= scale) {
    throw new RangeError("remainderUnits must be less than scale");
  }

  return remainderUnits / scale;
}

export function fractionToRemainderUnits(remainder: number, scale: number): number {
  assertPositiveSafeInteger(scale, "scale");

  if (!Number.isFinite(remainder) || remainder < 0 || remainder >= 1) {
    throw new RangeError("remainder must be in the half-open interval [0, 1)");
  }

  const units = Math.round(remainder * scale);
  if (units >= scale) {
    throw new RangeError("remainder does not fit the fixed-point scale");
  }

  return units;
}

export function allocateByLargestRemainder(total: number, weights: readonly number[]): number[] {
  assertNonNegativeSafeInteger(total, "total");

  if (weights.length === 0) {
    if (total > 0) {
      throw new RangeError("Cannot apportion a positive total with no weights");
    }
    return [];
  }

  let weightSum = 0;
  for (const weight of weights) {
    assertNonNegativeSafeInteger(weight, "weight");
    weightSum += weight;
    assertNonNegativeSafeInteger(weightSum, "weightSum");
  }

  if (weightSum === 0) {
    if (total > 0) {
      throw new RangeError("Cannot apportion a positive total with zero weights");
    }
    return weights.map(() => 0);
  }

  const shares: number[] = [];
  const remainders: number[] = [];
  let allocated = 0;

  for (const weight of weights) {
    const product = total * weight;
    assertNonNegativeSafeInteger(product, "total * weight");
    const share = Math.floor(product / weightSum);
    shares.push(share);
    remainders.push(product % weightSum);
    allocated += share;
  }

  const leftover = total - allocated;
  if (leftover < 0 || leftover >= weights.length) {
    throw new RangeError("Largest-remainder apportionment invariant failed");
  }

  const order = weights.map((_, index) => index);
  order.sort((left, right) => {
    const remainderOrder = remainders[right] - remainders[left];
    return remainderOrder !== 0 ? remainderOrder : left - right;
  });

  for (let index = 0; index < leftover; index += 1) {
    shares[order[index]] += 1;
  }

  return shares;
}

export function computeWeightedScore(terms: readonly ScoreTerm[]): number {
  let total = 0;

  for (const term of terms) {
    assertNonNegativeSafeInteger(term.value, "score value");
    assertNonNegativeSafeInteger(term.weight, "score weight");
    const contribution = term.value * term.weight;
    assertNonNegativeSafeInteger(contribution, "score contribution");
    total += contribution;
    assertNonNegativeSafeInteger(total, "score total");
  }

  return total;
}

function assertNonNegativeSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
}

function assertPositiveSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
}
