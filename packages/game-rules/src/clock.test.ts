/**
 * UTC world clock, daily phase, and era contract tests.
 *
 * Tests use the approved v1 schedule as fixture data while proving the engine
 * itself accepts the schedule through injection. Boundaries are half-open:
 * peace is [cycle_start, war_start), war is [war_start, war_end), and the
 * season freezes at T0 + seasonDays.
 */

import { describe, expect, it } from "vitest";
import {
  dayIndexAt,
  deriveWorldClock,
  eraForDay,
  phaseAt,
  timestampToEpochMs,
  type WorldTimingConfig
} from "./index.js";

const TIMING: WorldTimingConfig = {
  seasonDays: 30,
  peaceHours: 18,
  warHours: 6,
  eraStartDays: [1, 8, 16, 24]
};

const T0 = "2026-01-01T00:00:00.000Z";
const BEFORE_T0 = "2025-12-31T23:59:59.999Z";
const DAY_1_PEACE_END = "2026-01-01T17:59:59.999Z";
const DAY_1_WAR_START = "2026-01-01T18:00:00.000Z";
const DAY_1_WAR_END = "2026-01-01T23:59:59.999Z";
const DAY_2_START = "2026-01-02T00:00:00.000Z";
const DAY_8_START = "2026-01-08T00:00:00.000Z";
const DAY_16_START = "2026-01-16T00:00:00.000Z";
const DAY_24_START = "2026-01-24T00:00:00.000Z";
const DAY_30_START = "2026-01-30T00:00:00.000Z";
const DAY_30_WAR_START = "2026-01-30T18:00:00.000Z";
const SEASON_END = "2026-01-31T00:00:00.000Z";
const AFTER_SEASON_END = "2026-01-31T00:00:00.001Z";

describe("world day index", () => {
  it("clamps the first day and the final day", () => {
    expect(dayIndexAt(T0, BEFORE_T0, TIMING)).toBe(1);
    expect(dayIndexAt(T0, DAY_30_START, TIMING)).toBe(30);
    expect(dayIndexAt(T0, SEASON_END, TIMING)).toBe(30);
    expect(dayIndexAt(T0, AFTER_SEASON_END, TIMING)).toBe(30);
  });

  it("advances at the exact UTC day boundary", () => {
    expect(dayIndexAt(T0, DAY_1_WAR_END, TIMING)).toBe(1);
    expect(dayIndexAt(T0, DAY_2_START, TIMING)).toBe(2);
    expect(dayIndexAt(T0, DAY_8_START, TIMING)).toBe(8);
    expect(dayIndexAt(T0, DAY_16_START, TIMING)).toBe(16);
    expect(dayIndexAt(T0, DAY_24_START, TIMING)).toBe(24);
  });
});

describe("daily phase", () => {
  it("uses half-open war boundaries", () => {
    expect(phaseAt(T0, T0, TIMING)).toBe("peace");
    expect(phaseAt(T0, DAY_1_PEACE_END, TIMING)).toBe("peace");
    expect(phaseAt(T0, DAY_1_WAR_START, TIMING)).toBe("war");
    expect(phaseAt(T0, DAY_1_WAR_END, TIMING)).toBe("war");
    expect(phaseAt(T0, DAY_2_START, TIMING)).toBe("peace");
  });

  it("treats time before the world start as day 1 peace", () => {
    expect(phaseAt(T0, BEFORE_T0, TIMING)).toBe("peace");
  });

  it("is peace at and after the season freeze", () => {
    expect(phaseAt(T0, DAY_30_WAR_START, TIMING)).toBe("war");
    expect(phaseAt(T0, SEASON_END, TIMING)).toBe("peace");
    expect(phaseAt(T0, AFTER_SEASON_END, TIMING)).toBe("peace");
  });
});

describe("era calendar", () => {
  it("opens eras on the locked day boundaries", () => {
    expect(eraForDay(1, TIMING)).toBe(1);
    expect(eraForDay(7, TIMING)).toBe(1);
    expect(eraForDay(8, TIMING)).toBe(2);
    expect(eraForDay(15, TIMING)).toBe(2);
    expect(eraForDay(16, TIMING)).toBe(3);
    expect(eraForDay(23, TIMING)).toBe(3);
    expect(eraForDay(24, TIMING)).toBe(4);
    expect(eraForDay(30, TIMING)).toBe(4);
  });

  it("rejects day indices outside the season", () => {
    expect(() => eraForDay(0, TIMING)).toThrow(RangeError);
    expect(() => eraForDay(31, TIMING)).toThrow(RangeError);
    expect(() => eraForDay(2.5, TIMING)).toThrow(RangeError);
  });
});

describe("derived world clock", () => {
  it("reports the full day, war window, era, and season boundary", () => {
    const derived = deriveWorldClock({
      startedAt: T0,
      now: DAY_1_WAR_START,
      tick: 1080,
      timing: TIMING
    });

    expect(derived).toEqual({
      startedAtMs: timestampToEpochMs(T0),
      nowMs: timestampToEpochMs(DAY_1_WAR_START),
      seasonEndMs: timestampToEpochMs(SEASON_END),
      tick: 1080,
      dayIndex: 1,
      phase: "war",
      era: 1,
      cycleStartMs: timestampToEpochMs(T0),
      warStartMs: timestampToEpochMs(DAY_1_WAR_START),
      warEndMs: timestampToEpochMs(DAY_2_START),
      isSeasonOver: false
    });
  });

  it("derives the final era and freeze state without a day 31", () => {
    const finalWar = deriveWorldClock({
      startedAt: T0,
      now: DAY_30_WAR_START,
      tick: 0,
      timing: TIMING
    });
    const frozen = deriveWorldClock({
      startedAt: T0,
      now: SEASON_END,
      tick: 0,
      timing: TIMING
    });

    expect(finalWar.dayIndex).toBe(30);
    expect(finalWar.era).toBe(4);
    expect(finalWar.phase).toBe("war");
    expect(finalWar.isSeasonOver).toBe(false);
    expect(frozen.dayIndex).toBe(30);
    expect(frozen.era).toBe(4);
    expect(frozen.phase).toBe("peace");
    expect(frozen.isSeasonOver).toBe(true);
  });

  it("rejects an invalid tick", () => {
    expect(() =>
      deriveWorldClock({
        startedAt: T0,
        now: T0,
        tick: -1,
        timing: TIMING
      })
    ).toThrow(RangeError);
  });
});

describe("schedule validation", () => {
  it.each([
    [{ ...TIMING, seasonDays: 0 }],
    [{ ...TIMING, peaceHours: 17 }],
    [{ ...TIMING, warHours: 5 }],
    [{ ...TIMING, eraStartDays: [1, 8, 8, 24] }],
    [{ ...TIMING, seasonDays: 29, eraStartDays: [1, 8, 16, 30] }],
    [{ ...TIMING, eraStartDays: [2, 8, 16, 24] }]
  ])("rejects an inconsistent schedule", (timing) => {
    expect(() => dayIndexAt(T0, T0, timing)).toThrow(RangeError);
  });

  it("rejects timestamps without an explicit UTC offset", () => {
    expect(() => timestampToEpochMs("2026-01-01T00:00:00")).toThrow(RangeError);
    expect(() => timestampToEpochMs("not-a-timestampZ")).toThrow(RangeError);
  });

  it("normalizes explicit offsets to the same UTC instant", () => {
    expect(timestampToEpochMs("2026-01-01T20:00:00.000+02:00")).toBe(
      timestampToEpochMs(DAY_1_WAR_START)
    );
    expect(timestampToEpochMs(BEFORE_T0)).toBeLessThan(timestampToEpochMs(T0));
  });
});
