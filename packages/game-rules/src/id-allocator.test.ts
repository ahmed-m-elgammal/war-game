/**
 * Per-world deterministic ID allocation tests.
 *
 * `WorldIdCounters` stores the next positive identifier for each entity kind.
 * Allocation is pure: it returns the current id and a new counters object, so
 * the committed world snapshot owns every allocation.
 */

import { describe, expect, it } from "vitest";
import {
  allianceIdSchema,
  allianceInvitationIdSchema,
  allianceMembershipIdSchema,
  armyIdSchema,
  battleIdSchema,
  buildOrderIdSchema,
  doctrineChangeIdSchema,
  factionIdSchema,
  rebellionIdSchema,
  tradeIdSchema,
  tradeOfferIdSchema,
  trainingOrderIdSchema,
  type WorldIdCounters
} from "@wargame/shared";
import { allocateId, type WorldIdCounterKey } from "./index.js";

const COUNTER_KEYS: readonly WorldIdCounterKey[] = [
  "faction",
  "army",
  "battle",
  "tradeOffer",
  "trade",
  "alliance",
  "allianceMembership",
  "allianceInvitation",
  "buildOrder",
  "trainingOrder",
  "rebellion",
  "doctrineChange"
];

describe("deterministic id allocator", () => {
  it("returns the next id and advances only that counter", () => {
    const nextIds = makeCounters({ faction: 7, army: 3 });

    const allocated = allocateId(nextIds, "faction");

    expect(allocated.id).toBe(7);
    expect(allocated.nextIds.faction).toBe(8);
    expect(allocated.nextIds.army).toBe(3);
    expect(allocated.nextIds.battle).toBe(1);
    expect(nextIds.faction).toBe(7);
    expect(allocated.nextIds).not.toBe(nextIds);
  });

  it("is monotonic across repeated allocations", () => {
    let nextIds = makeCounters();
    const ids: number[] = [];

    for (let index = 0; index < 4; index += 1) {
      const allocated = allocateId(nextIds, "army");
      ids.push(allocated.id);
      nextIds = allocated.nextIds;
    }

    expect(ids).toEqual([1, 2, 3, 4]);
    expect(nextIds.army).toBe(5);
  });

  it.each(COUNTER_KEYS)("supports the %s counter", (key) => {
    const nextIds = makeCounters({ [key]: 11 });

    const allocated = allocateId(nextIds, key);

    expect(allocated.id).toBe(11);
    expect(allocated.nextIds[key]).toBe(12);
  });

  it("rejects counters that would hand out a non-positive id", () => {
    expect(() => allocateId(makeCounters({ army: 0 }), "army")).toThrow(RangeError);
  });

  it("rejects malformed counters", () => {
    const negative = { ...makeCounters(), army: -1 as WorldIdCounters["army"] };
    const fractional = { ...makeCounters(), army: 1.5 as WorldIdCounters["army"] };
    const unsafe = {
      ...makeCounters(),
      army: (Number.MAX_SAFE_INTEGER + 1) as WorldIdCounters["army"]
    };

    expect(() => allocateId(negative, "army")).toThrow(RangeError);
    expect(() => allocateId(fractional, "army")).toThrow(RangeError);
    expect(() => allocateId(unsafe, "army")).toThrow(RangeError);
  });
});

function makeCounters(overrides: Partial<Record<WorldIdCounterKey, number>> = {}): WorldIdCounters {
  return {
    faction: factionIdSchema.parse(overrides.faction ?? 1),
    army: armyIdSchema.parse(overrides.army ?? 1),
    battle: battleIdSchema.parse(overrides.battle ?? 1),
    tradeOffer: tradeOfferIdSchema.parse(overrides.tradeOffer ?? 1),
    trade: tradeIdSchema.parse(overrides.trade ?? 1),
    alliance: allianceIdSchema.parse(overrides.alliance ?? 1),
    allianceMembership: allianceMembershipIdSchema.parse(overrides.allianceMembership ?? 1),
    allianceInvitation: allianceInvitationIdSchema.parse(overrides.allianceInvitation ?? 1),
    buildOrder: buildOrderIdSchema.parse(overrides.buildOrder ?? 1),
    trainingOrder: trainingOrderIdSchema.parse(overrides.trainingOrder ?? 1),
    rebellion: rebellionIdSchema.parse(overrides.rebellion ?? 1),
    doctrineChange: doctrineChangeIdSchema.parse(overrides.doctrineChange ?? 1)
  };
}
