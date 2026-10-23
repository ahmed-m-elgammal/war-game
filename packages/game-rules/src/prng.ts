/**
 * Seeded Deterministic PRNG
 *
 * Derives the initial 32-bit state from a world seed with FNV-1a and advances
 * it with Mulberry32. `RngState.state` is an opaque unsigned-decimal string so
 * the snapshot can persist and replay the exact stream. Every function is pure:
 * it returns a new RngState and never mutates the caller's value.
 *
 * The seed is server-owned. Callers must never source it from a client, the
 * device clock, or Math.random(); the world snapshot is the authority.
 */

import type { RngState } from "@wargame/shared";

const UINT32_MAX = 0xffffffff;
const UINT32_RANGE = 0x100000000;
const MULBERRY_INCREMENT = 0x6d2b79f5;
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export interface RngStep {
  readonly rng: RngState;
  readonly value: number;
}

export function createRngState(seed: string): RngState {
  return {
    seed,
    state: String(fnv1a32(seed))
  };
}

export function nextUint32(rng: RngState): RngStep {
  const state = parseState(rng.state);
  const nextState = (state + MULBERRY_INCREMENT) >>> 0;
  let scrambled = nextState;

  scrambled = Math.imul(scrambled ^ (scrambled >>> 15), scrambled | 1);
  scrambled ^= scrambled + Math.imul(scrambled ^ (scrambled >>> 7), scrambled | 61);

  return {
    rng: { seed: rng.seed, state: String(nextState) },
    value: (scrambled ^ (scrambled >>> 14)) >>> 0
  };
}

export function nextFloat01(rng: RngState): RngStep {
  const draw = nextUint32(rng);
  return {
    rng: draw.rng,
    value: draw.value / UINT32_RANGE
  };
}

export function nextInt(rng: RngState, minInclusive: number, maxExclusive: number): RngStep {
  assertIntegerBound(minInclusive, "minInclusive");
  assertIntegerBound(maxExclusive, "maxExclusive");

  if (maxExclusive <= minInclusive) {
    throw new RangeError("maxExclusive must be greater than minInclusive");
  }

  const range = maxExclusive - minInclusive;
  if (!Number.isSafeInteger(range) || range > UINT32_RANGE) {
    throw new RangeError("Integer range must fit the uint32 draw space");
  }

  const limit = UINT32_RANGE - (UINT32_RANGE % range);
  let current = rng;
  let value: number;

  do {
    const draw = nextUint32(current);
    current = draw.rng;
    value = draw.value;
  } while (value >= limit);

  return {
    rng: current,
    value: minInclusive + (value % range)
  };
}

function assertIntegerBound(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer`);
  }
}

function parseState(state: string): number {
  if (!/^\d+$/.test(state)) {
    throw new RangeError("RngState.state must be an unsigned decimal string");
  }

  const value = Number(state);
  if (!Number.isSafeInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new RangeError("RngState.state must fit an unsigned 32-bit integer");
  }

  return value;
}

function fnv1a32(seed: string): number {
  let hash = FNV_OFFSET_BASIS;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}
