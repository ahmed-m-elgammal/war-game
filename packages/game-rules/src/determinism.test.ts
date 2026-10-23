/**
 * Replay-trace determinism tests for the primitive layer.
 *
 * The test composes PRNG draws, the derived clock, and event ordering, then
 * hashes the trace with a test-local FNV-1a function. Identical seed, clock,
 * and input order must produce an identical trace hash; changing the seed
 * must change the stochastic trace.
 */

import { describe, expect, it } from "vitest";
import { toWorldId, type WorldEvent } from "@wargame/shared";
import {
  createRngState,
  deriveWorldClock,
  nextUint32,
  orderWorldEvents,
  type WorldTimingConfig
} from "./index.js";

const TIMING: WorldTimingConfig = {
  seasonDays: 30,
  peaceHours: 18,
  warHours: 6,
  eraStartDays: [1, 8, 16, 24]
};

const T0 = "2026-01-01T00:00:00.000Z";
const T1 = "2026-01-01T18:00:00.000Z";
const T2 = "2026-01-09T04:30:00.000Z";

describe("primitive replay determinism", () => {
  it("produces the same trace for the same seed and ordered inputs", () => {
    const first = runReplay("replay-seed");
    const second = runReplay("replay-seed");

    expect(first).toEqual(second);
    expect(hashTrace(first)).toBe(hashTrace(second));
  });

  it("changes the stochastic trace when the seed changes", () => {
    const first = runReplay("replay-seed");
    const second = runReplay("replay-seed-2");

    expect(first.draws).not.toEqual(second.draws);
    expect(hashTrace(first)).not.toBe(hashTrace(second));
  });
});

function runReplay(seed: string) {
  let rng = createRngState(seed);
  const draws: number[] = [];

  for (let index = 0; index < 12; index += 1) {
    const draw = nextUint32(rng);
    draws.push(draw.value);
    rng = draw.rng;
  }

  const start = deriveWorldClock({
    startedAt: T0,
    now: T1,
    tick: 65,
    timing: TIMING
  });
  const later = deriveWorldClock({
    startedAt: T0,
    now: T2,
    tick: 2_700,
    timing: TIMING
  });
  const ordered = orderWorldEvents([
    makeEvent({ seq: 3, effectiveAt: T1, priority: 20, payload: { army: 3 } }),
    makeEvent({ seq: 1, effectiveAt: T0, priority: 80, payload: { phase: "peace" } }),
    makeEvent({ seq: 2, effectiveAt: T0, priority: 10, payload: { phase: "war" } })
  ]);

  return {
    draws,
    rng,
    start,
    later,
    ordered: ordered.map((event) => ({ seq: event.seq, payload: event.payload }))
  };
}

function makeEvent(overrides: Partial<WorldEvent>): WorldEvent {
  return {
    worldId: toWorldId("world-replay"),
    seq: 1,
    type: "system",
    commandType: null,
    actorType: "system",
    actorAccountId: null,
    actorFactionId: null,
    commandId: null,
    effectiveAt: T0,
    priority: 0,
    payload: {},
    leaseVersion: 1,
    createdAt: T0,
    ...overrides
  };
}

function hashTrace(value: unknown): number {
  const text = JSON.stringify(value);
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}
