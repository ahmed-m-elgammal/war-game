/**
 * UTC time conversion and comparison tests.
 *
 * Verifies that explicit-offset ISO timestamps parse deterministically into
 * epoch milliseconds, reject timestamps lacking explicit offsets, and normalize
 * equivalent instants with different offsets.
 */

import { describe, expect, it } from "vitest";
import {
  compareTimestamps,
  MILLISECONDS_PER_DAY,
  MILLISECONDS_PER_HOUR,
  MILLISECONDS_PER_MINUTE,
  MILLISECONDS_PER_SECOND,
  timestampToEpochMs
} from "./index.js";

const T0 = "2026-01-01T00:00:00.000Z";
const T0_PLUS_2H = "2026-01-01T02:00:00.000+02:00";
const T0_MINUS_5H = "2025-12-31T19:00:00.000-05:00";
const LATER = "2026-01-01T12:00:00.000Z";
const EARLIER = "2025-12-31T12:00:00.000Z";

describe("time constants", () => {
  it("defines standard millisecond units", () => {
    expect(MILLISECONDS_PER_SECOND).toBe(1_000);
    expect(MILLISECONDS_PER_MINUTE).toBe(60_000);
    expect(MILLISECONDS_PER_HOUR).toBe(3_600_000);
    expect(MILLISECONDS_PER_DAY).toBe(86_400_000);
  });
});

describe("timestampToEpochMs", () => {
  it("parses explicit Z offset", () => {
    expect(timestampToEpochMs(T0)).toBe(1767225600000);
  });

  it("normalizes different explicit timezone offsets representing the same instant", () => {
    const epochZ = timestampToEpochMs(T0);
    const epochPlus = timestampToEpochMs(T0_PLUS_2H);
    const epochMinus = timestampToEpochMs(T0_MINUS_5H);

    expect(epochPlus).toBe(epochZ);
    expect(epochMinus).toBe(epochZ);
  });

  it("parses millisecond-precision timestamps", () => {
    expect(timestampToEpochMs("2026-01-01T00:00:00.123Z")).toBe(1767225600123);
  });

  it.each([
    ["2026-01-01T00:00:00", "missing offset"],
    ["2026-01-01 00:00:00", "space separator without offset"],
    ["2026-01-01T00:00:00+0200", "missing colon in offset"],
    ["2026-01-01T00:00:00Z extra", "trailing garbage"],
    ["not-a-timestampZ", "invalid date with Z suffix"],
    ["", "empty string"]
  ])("rejects invalid timestamp: %s (%s)", (timestamp) => {
    expect(() => timestampToEpochMs(timestamp)).toThrow(RangeError);
  });
});

describe("compareTimestamps", () => {
  it("orders earlier and later instants", () => {
    expect(compareTimestamps(EARLIER, LATER)).toBe(-1);
    expect(compareTimestamps(LATER, EARLIER)).toBe(1);
  });

  it("returns 0 for equivalent instants across different offsets", () => {
    expect(compareTimestamps(T0, T0_PLUS_2H)).toBe(0);
    expect(compareTimestamps(T0_PLUS_2H, T0_MINUS_5H)).toBe(0);
  });
});
