/**
 * Pure Per-World ID Allocation
 *
 * `WorldIdCounters` stores the next positive identifier for each simulation
 * entity kind. Allocation returns the current id plus a freshly copied counter
 * object, so the committed snapshot owns the step and replay never depends on a
 * database sequence, UUID generator, or wall clock. Zero is never allocated;
 * every persisted entity id is positive.
 */

import type { WorldIdCounters } from "@wargame/shared";

export type WorldIdCounterKey = keyof WorldIdCounters;

export interface AllocatedWorldId<K extends WorldIdCounterKey> {
  readonly id: WorldIdCounters[K];
  readonly nextIds: WorldIdCounters;
}

export function allocateId<K extends WorldIdCounterKey>(
  nextIds: Readonly<WorldIdCounters>,
  key: K
): AllocatedWorldId<K> {
  const current = nextIds[key];

  if (!Number.isSafeInteger(current) || current < 1) {
    throw new RangeError(`nextIds.${key} must be a positive safe integer`);
  }
  if (current >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`nextIds.${key} cannot advance beyond the safe integer range`);
  }

  const next = (current + 1) as WorldIdCounters[K];
  const updated: WorldIdCounters = { ...nextIds, [key]: next };

  return {
    id: current,
    nextIds: updated
  };
}
