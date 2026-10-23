/**
 * Map Validation Issue Contract
 *
 * Validation returns structured machine codes rather than throwing. Callers
 * decide whether a report is fatal; tests and future loaders can inspect each
 * issue without parsing prose. Messages are developer-facing diagnostics.
 */

export const MAP_VALIDATION_ISSUE_CODES = [
  "MAP_SIZE_MISMATCH",
  "MASK_SIZE_MISMATCH",
  "MASK_LENGTH_MISMATCH",
  "MASK_NO_LAND",
  "MASK_UNKNOWN_PROVINCE",
  "MASK_PROVINCE_UNCOVERED",
  "MASK_LAND_NOT_CONTIGUOUS",
  "MASK_INTERIOR_WATER",
  "PROVINCE_COUNT",
  "PROVINCE_ID_INVALID",
  "PROVINCE_ID_DUPLICATE",
  "PROVINCE_NAME_EMPTY",
  "PROVINCE_RESOURCE_INVALID",
  "PROVINCE_MASK_COLOR_INVALID",
  "PROVINCE_MASK_COLOR_DUPLICATE",
  "PROVINCE_CENTROID_OUT_OF_BOUNDS",
  "REFUGEE_COUNT",
  "ADJACENCY_SELF_LOOP",
  "ADJACENCY_UNKNOWN_PROVINCE",
  "ADJACENCY_DUPLICATE_EDGE",
  "ADJACENCY_ASYMMETRIC",
  "ADJACENCY_DISCONNECTED",
  "ART_MISSING_PROVINCE",
  "ART_UNKNOWN_PROVINCE",
  "ART_DUPLICATE_PROVINCE",
  "ART_ANCHOR_OUT_OF_BOUNDS",
  "SPAWN_CAPITAL_UNKNOWN",
  "SPAWN_CAPITAL_DUPLICATE",
  "SPAWN_CAPITAL_REFUGEE",
  "SPAWN_RESOURCE_MISSING",
  "SPAWN_WEAK_TARGET_INVALID",
  "SPAWN_WEAK_TARGET_MISSING",
  "SPAWN_CAPITALS_ADJACENT",
  "SPAWN_CAPITAL_SPACING"
] as const;

export type MapValidationIssueCode = (typeof MAP_VALIDATION_ISSUE_CODES)[number];

export interface MapValidationIssue {
  readonly code: MapValidationIssueCode;
  readonly path: string;
  readonly message: string;
}

export interface MapValidationReport {
  readonly ok: boolean;
  readonly issues: readonly MapValidationIssue[];
}

export function buildValidationReport(issues: readonly MapValidationIssue[]): MapValidationReport {
  return { ok: issues.length === 0, issues };
}

export function addIssue(
  issues: MapValidationIssue[],
  code: MapValidationIssueCode,
  path: string,
  message: string
): void {
  issues.push({ code, path, message });
}
