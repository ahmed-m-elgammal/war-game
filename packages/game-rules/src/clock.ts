/**
 * Pure UTC World Clock, Phase, and Era Engine
 *
 * Derives the day, daily peace/war phase, era, and season freeze from injected
 * timestamps. The schedule is caller-supplied from the world's pinned config;
 * this module contains no balance values. Intervals follow the lock:
 * peace is [cycle_start, war_start), war is [war_start, war_end), and the
 * season freezes at T0 + seasonDays. Era advancement is calendar-gated only;
 * tech state never moves the calendar era.
 */

import type { Era, Phase, Timestamp } from "@wargame/shared";
import { MILLISECONDS_PER_DAY, MILLISECONDS_PER_HOUR, timestampToEpochMs } from "./time.js";

export interface WorldTimingConfig {
  readonly seasonDays: number;
  readonly peaceHours: number;
  readonly warHours: number;
  readonly eraStartDays: readonly number[];
}

export interface WorldClockInput {
  readonly startedAt: Timestamp;
  readonly now: Timestamp;
  readonly tick: number;
  readonly timing: WorldTimingConfig;
}

export interface DerivedWorldClock {
  readonly startedAtMs: number;
  readonly nowMs: number;
  readonly seasonEndMs: number;
  readonly tick: number;
  readonly dayIndex: number;
  readonly phase: Phase;
  readonly era: Era;
  readonly cycleStartMs: number;
  readonly warStartMs: number;
  readonly warEndMs: number;
  readonly isSeasonOver: boolean;
}

export function dayIndexAt(
  startedAt: Timestamp,
  now: Timestamp,
  timing: WorldTimingConfig
): number {
  validateTiming(timing);
  const startedAtMs = timestampToEpochMs(startedAt);
  const nowMs = timestampToEpochMs(now);
  return clampedDayIndex(startedAtMs, nowMs, timing.seasonDays);
}

export function phaseAt(startedAt: Timestamp, now: Timestamp, timing: WorldTimingConfig): Phase {
  validateTiming(timing);
  const startedAtMs = timestampToEpochMs(startedAt);
  const nowMs = timestampToEpochMs(now);
  return phaseFor(startedAtMs, nowMs, timing);
}

export function eraForDay(dayIndex: number, timing: WorldTimingConfig): Era {
  validateTiming(timing);
  return eraForValidatedDay(dayIndex, timing);
}

export function deriveWorldClock(input: WorldClockInput): DerivedWorldClock {
  validateTiming(input.timing);
  assertSafeInteger(input.tick, "tick", 0);

  const startedAtMs = timestampToEpochMs(input.startedAt);
  const nowMs = timestampToEpochMs(input.now);
  const cycle = dailyWindowAt(startedAtMs, nowMs, input.timing);
  const seasonEndMs = startedAtMs + MILLISECONDS_PER_DAY * input.timing.seasonDays;

  return {
    startedAtMs,
    nowMs,
    seasonEndMs,
    tick: input.tick,
    dayIndex: cycle.dayIndex,
    phase: phaseForWindow(cycle, nowMs),
    era: eraForValidatedDay(cycle.dayIndex, input.timing),
    cycleStartMs: cycle.cycleStartMs,
    warStartMs: cycle.warStartMs,
    warEndMs: cycle.warEndMs,
    isSeasonOver: nowMs >= seasonEndMs
  };
}

interface DailyWindow {
  readonly dayIndex: number;
  readonly cycleStartMs: number;
  readonly warStartMs: number;
  readonly warEndMs: number;
}

function dailyWindowAt(startedAtMs: number, nowMs: number, timing: WorldTimingConfig): DailyWindow {
  const dayIndex = clampedDayIndex(startedAtMs, nowMs, timing.seasonDays);
  const cycleStartMs = startedAtMs + MILLISECONDS_PER_DAY * (dayIndex - 1);

  return {
    dayIndex,
    cycleStartMs,
    warStartMs: cycleStartMs + MILLISECONDS_PER_HOUR * timing.peaceHours,
    warEndMs: cycleStartMs + MILLISECONDS_PER_HOUR * (timing.peaceHours + timing.warHours)
  };
}

function clampedDayIndex(startedAtMs: number, nowMs: number, seasonDays: number): number {
  const elapsedDays = Math.floor((nowMs - startedAtMs) / MILLISECONDS_PER_DAY);
  return Math.min(Math.max(elapsedDays + 1, 1), seasonDays);
}

function phaseFor(startedAtMs: number, nowMs: number, timing: WorldTimingConfig): Phase {
  return phaseForWindow(dailyWindowAt(startedAtMs, nowMs, timing), nowMs);
}

function phaseForWindow(cycle: DailyWindow, nowMs: number): Phase {
  return nowMs >= cycle.warStartMs && nowMs < cycle.warEndMs ? "war" : "peace";
}

function eraForValidatedDay(dayIndex: number, timing: WorldTimingConfig): Era {
  if (!Number.isSafeInteger(dayIndex) || dayIndex < 1 || dayIndex > timing.seasonDays) {
    throw new RangeError("dayIndex must be an integer inside the season");
  }

  const era2Start = timing.eraStartDays[1];
  const era3Start = timing.eraStartDays[2];
  const era4Start = timing.eraStartDays[3];

  if (dayIndex >= era4Start) {
    return 4;
  }
  if (dayIndex >= era3Start) {
    return 3;
  }
  if (dayIndex >= era2Start) {
    return 2;
  }
  return 1;
}

function validateTiming(timing: WorldTimingConfig): void {
  assertSafeInteger(timing.seasonDays, "seasonDays", 1);
  assertSafeInteger(timing.peaceHours, "peaceHours", 0);
  assertSafeInteger(timing.warHours, "warHours", 1);

  if (timing.peaceHours + timing.warHours !== 24) {
    throw new RangeError("peaceHours + warHours must equal 24");
  }

  if (!Array.isArray(timing.eraStartDays) || timing.eraStartDays.length !== 4) {
    throw new RangeError("eraStartDays must contain exactly four day numbers");
  }

  if (timing.eraStartDays[0] !== 1) {
    throw new RangeError("eraStartDays[0] must open era 1 on day 1");
  }

  for (let index = 0; index < timing.eraStartDays.length; index += 1) {
    const day = timing.eraStartDays[index];
    assertSafeInteger(day, `eraStartDays[${index}]`, 1);

    if (day > timing.seasonDays) {
      throw new RangeError("eraStartDays entries must be inside the season");
    }
    if (index > 0 && day <= timing.eraStartDays[index - 1]) {
      throw new RangeError("eraStartDays must be strictly increasing");
    }
  }
}

function assertSafeInteger(value: number, name: string, minimum: number): void {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new RangeError(`${name} must be a safe integer >= ${minimum}`);
  }
}
