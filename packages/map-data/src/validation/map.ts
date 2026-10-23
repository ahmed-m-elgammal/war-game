/**
 * Map Validator
 *
 * Composes the structural validators into one report. Content validation is
 * intentionally separate from spawn placement: a map may be structurally valid
 * while a particular world assignment is not.
 */

import { VARDANIA_MAP_RULES, type MapValidationRules } from "../rules.js";
import type { VardaniaMap } from "../types.js";
import { validateAdjacency } from "./adjacency.js";
import { validateArt } from "./art.js";
import {
  addIssue,
  buildValidationReport,
  type MapValidationIssue,
  type MapValidationReport
} from "./issues.js";
import { validateMask } from "./mask.js";
import { validateProvinces } from "./provinces.js";

export function validateMap(
  map: VardaniaMap,
  rules: MapValidationRules = VARDANIA_MAP_RULES
): MapValidationReport {
  const issues: MapValidationIssue[] = [];

  if (
    map.width !== rules.maskWidth ||
    map.height !== rules.maskHeight ||
    !Number.isInteger(map.width) ||
    !Number.isInteger(map.height)
  ) {
    addIssue(
      issues,
      "MAP_SIZE_MISMATCH",
      "$",
      `Expected a ${rules.maskWidth}x${rules.maskHeight} map, found ${map.width}x${map.height}`
    );
  }

  validateProvinces(map, rules, issues);
  validateMask(map, rules, issues);
  validateAdjacency(map, issues);
  validateArt(map, issues);

  return buildValidationReport(issues);
}
