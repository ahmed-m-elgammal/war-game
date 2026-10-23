/**
 * Deterministic event and battle-arrival ordering tests.
 *
 * World events use (effective_at, priority, seq). Battle arrivals use
 * (arrive_at, priority, army_id, seq), so simultaneous attacks resolve in
 * ascending army order before their input sequence breaks any remaining tie.
 */

import { describe, expect, it } from "vitest";
import type { WorldEvent } from "@wargame/shared";
import { toArmyId, toWorldId } from "@wargame/shared";
import {
  compareBattleArrivals,
  compareWorldEvents,
  orderBattleArrivals,
  orderWorldEvents
} from "./index.js";

const T0 = "2026-01-01T00:00:00.000Z";
const T1 = "2026-01-01T18:00:00.000Z";

describe("world event ordering", () => {
  it("orders by effective time, then priority, then sequence", () => {
    const early = makeEvent({ seq: 9, effectiveAt: T0, priority: 80 });
    const laterPriority = makeEvent({ seq: 1, effectiveAt: T1, priority: 10 });
    const highPrioritySeq = makeEvent({ seq: 7, effectiveAt: T1, priority: 20 });
    const lowPrioritySeq = makeEvent({ seq: 2, effectiveAt: T1, priority: 20 });

    expect(compareWorldEvents(early, laterPriority)).toBeLessThan(0);
    expect(compareWorldEvents(laterPriority, highPrioritySeq)).toBeLessThan(0);
    expect(compareWorldEvents(lowPrioritySeq, highPrioritySeq)).toBeLessThan(0);
    expect(compareWorldEvents(highPrioritySeq, highPrioritySeq)).toBe(0);
  });

  it("normalizes explicit UTC offsets before comparing", () => {
    const zulu = makeEvent({ seq: 1, effectiveAt: T1, priority: 20 });
    const offset = makeEvent({
      seq: 1,
      effectiveAt: "2026-01-01T20:00:00.000+02:00",
      priority: 20
    });

    expect(compareWorldEvents(zulu, offset)).toBe(0);
  });

  it("returns a new array and preserves the input order", () => {
    const events = [
      makeEvent({ seq: 3, effectiveAt: T1, priority: 20 }),
      makeEvent({ seq: 1, effectiveAt: T0, priority: 80 }),
      makeEvent({ seq: 2, effectiveAt: T0, priority: 10 })
    ];
    const originalOrder = events.map((event) => event.seq);

    const ordered = orderWorldEvents(events);

    expect(ordered.map((event) => event.seq)).toEqual([2, 1, 3]);
    expect(events.map((event) => event.seq)).toEqual(originalOrder);
    expect(ordered).not.toBe(events);
  });

  it("rejects malformed effective timestamps", () => {
    const valid = makeEvent({ seq: 1, effectiveAt: T1, priority: 20 });
    const invalid = makeEvent({ seq: 2, effectiveAt: "not-a-time", priority: 20 });

    expect(() => compareWorldEvents(valid, invalid)).toThrow(RangeError);
  });
});

describe("battle arrival ordering", () => {
  it("orders by arrival time, priority, army id, then sequence", () => {
    const base = arrival(T1, 20, 5, 100);
    const earlier = arrival(T0, 80, 99, 200);
    const higherPriority = arrival(T1, 10, 99, 200);
    const lowerArmy = arrival(T1, 20, 4, 200);
    const lowerSeq = arrival(T1, 20, 5, 99);

    expect(compareBattleArrivals(earlier, base)).toBeLessThan(0);
    expect(compareBattleArrivals(higherPriority, base)).toBeLessThan(0);
    expect(compareBattleArrivals(lowerArmy, base)).toBeLessThan(0);
    expect(compareBattleArrivals(lowerSeq, base)).toBeLessThan(0);
    expect(compareBattleArrivals(base, base)).toBe(0);
  });

  it("keeps extra fields while sorting a copy", () => {
    const arrivals = [
      { ...arrival(T1, 20, 8, 1), label: "third" },
      { ...arrival(T1, 20, 2, 2), label: "second" },
      { ...arrival(T0, 80, 1, 3), label: "first" }
    ];

    const ordered = orderBattleArrivals(arrivals);

    expect(ordered.map((entry) => entry.label)).toEqual(["first", "second", "third"]);
    expect(arrivals.map((entry) => entry.label)).toEqual(["third", "second", "first"]);
    expect(ordered).not.toBe(arrivals);
  });
});

function makeEvent(overrides: Partial<WorldEvent>): WorldEvent {
  return {
    worldId: toWorldId("world-1"),
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

function arrival(arriveAt: string, priority: number, armyId: number, seq: number) {
  return {
    arriveAt,
    priority,
    armyId: toArmyId(armyId),
    seq
  };
}
