/**
 * Deterministic Event and Arrival Ordering
 *
 * World events follow the ordered input log contract:
 * (effective_at, priority, seq). Battle arrivals follow the stricter combat
 * contract: (arrive_at, priority, army_id, seq), so simultaneous attacks resolve
 * in ascending army order before the input sequence breaks a remaining tie.
 *
 * Comparators parse injected UTC timestamps and never use the host clock. All
 * sort helpers return a new array so callers cannot accidentally reorder the
 * committed input log or the live army set.
 */

import type { ArmyId, Timestamp, WorldEvent } from "@wargame/shared";
import { compareTimestamps } from "./time.js";

export interface BattleArrivalOrder {
  readonly arriveAt: Timestamp;
  readonly priority: number;
  readonly armyId: ArmyId;
  readonly seq: number;
}

export function compareWorldEvents(left: WorldEvent, right: WorldEvent): number {
  return (
    compareTimestamps(left.effectiveAt, right.effectiveAt) ||
    compareNumbers(left.priority, right.priority) ||
    compareNumbers(left.seq, right.seq)
  );
}

export function compareBattleArrivals(left: BattleArrivalOrder, right: BattleArrivalOrder): number {
  return (
    compareTimestamps(left.arriveAt, right.arriveAt) ||
    compareNumbers(left.priority, right.priority) ||
    compareNumbers(left.armyId, right.armyId) ||
    compareNumbers(left.seq, right.seq)
  );
}

export function orderWorldEvents(events: readonly WorldEvent[]): WorldEvent[] {
  return [...events].sort(compareWorldEvents);
}

export function orderBattleArrivals<T extends BattleArrivalOrder>(arrivals: readonly T[]): T[] {
  return [...arrivals].sort(compareBattleArrivals);
}

function compareNumbers(left: number, right: number): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
