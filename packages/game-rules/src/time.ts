/**
 * UTC Time Conversion Helpers
 *
 * Converts explicit-offset ISO timestamps into epoch milliseconds and compares
 * instants without reading the host clock. The caller injects every timestamp;
 * this module never calls Date.now(), constructs a Date, or depends on the
 * process time zone. A timestamp without an explicit UTC offset is rejected so
 * replay cannot vary by machine locale.
 */

import type { Timestamp } from "@wargame/shared";

export const MILLISECONDS_PER_SECOND = 1_000;
export const MILLISECONDS_PER_MINUTE = 60_000;
export const MILLISECONDS_PER_HOUR = 3_600_000;
export const MILLISECONDS_PER_DAY = 86_400_000;

const EXPLICIT_OFFSET_SUFFIX = /(?:Z|[+-]\d{2}:\d{2})$/;

export function timestampToEpochMs(timestamp: Timestamp): number {
  if (!EXPLICIT_OFFSET_SUFFIX.test(timestamp)) {
    throw new RangeError(`Timestamp must include an explicit UTC offset: ${timestamp}`);
  }

  const epochMs = Date.parse(timestamp);
  if (!Number.isFinite(epochMs)) {
    throw new RangeError(`Timestamp is not a valid ISO instant: ${timestamp}`);
  }

  return epochMs;
}

export function compareTimestamps(left: Timestamp, right: Timestamp): number {
  const leftMs = timestampToEpochMs(left);
  const rightMs = timestampToEpochMs(right);
  return leftMs < rightMs ? -1 : leftMs > rightMs ? 1 : 0;
}
