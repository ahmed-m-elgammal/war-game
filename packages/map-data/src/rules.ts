/**
 * Map Validation Rules
 *
 * Rules are versioned caller input, not hidden defaults. `VARDANIA_MAP_RULES`
 * carries the locked v1 values from specs/09 section 6 and section 21. Tests
 * use a smaller synthetic profile so the machinery can be exercised before the
 * D-MAP content decision closes.
 */

import { VARDANIA_MASK_HEIGHT, VARDANIA_MASK_WIDTH } from "./constants.js";

export interface MapValidationRules {
  readonly maskWidth: number;
  readonly maskHeight: number;
  readonly minProvinces: number;
  readonly maxProvinces: number;
  readonly minRefugeeCandidates: number;
  readonly maxRefugeeCandidates: number;
  readonly requireSingleLandComponent: boolean;
  readonly requireEdgeOnlyWater: boolean;
}

export const VARDANIA_MAP_RULES: MapValidationRules = Object.freeze({
  maskWidth: VARDANIA_MASK_WIDTH,
  maskHeight: VARDANIA_MASK_HEIGHT,
  minProvinces: 80,
  maxProvinces: 100,
  minRefugeeCandidates: 4,
  maxRefugeeCandidates: 6,
  requireSingleLandComponent: true,
  requireEdgeOnlyWater: true
});
