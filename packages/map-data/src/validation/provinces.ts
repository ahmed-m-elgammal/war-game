/**
 * Province Validation
 *
 * Validates province identity, display metadata, resource domain, refugee
 * count, and mask colour validity/uniqueness. Terrain strings are
 * narrative/visual data and are only required to be non-empty; they never drive
 * game rules.
 */

import { RESOURCE_TYPES, type ProvinceId } from "@wargame/shared";
import { MAX_MASK_PROVINCE_ID, WATER_MASK_COLOR } from "../constants.js";
import type { MapValidationRules } from "../rules.js";
import type { VardaniaMap } from "../types.js";
import { isPointInBounds } from "./geometry.js";
import { addIssue, type MapValidationIssue } from "./issues.js";

const MASK_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function validateProvinces(
  map: VardaniaMap,
  rules: MapValidationRules,
  issues: MapValidationIssue[]
): void {
  if (map.provinces.length < rules.minProvinces || map.provinces.length > rules.maxProvinces) {
    addIssue(
      issues,
      "PROVINCE_COUNT",
      "$.provinces",
      `Expected ${rules.minProvinces}-${rules.maxProvinces} provinces, found ${map.provinces.length}`
    );
  }

  const seenIds = new Set<ProvinceId>();
  const seenColors = new Map<string, ProvinceId>();
  let refugeeCandidates = 0;

  for (const [index, province] of map.provinces.entries()) {
    const path = `$.provinces[${index}]`;
    const provinceId = province.provinceId;

    if (!Number.isInteger(provinceId) || provinceId < 1 || provinceId > MAX_MASK_PROVINCE_ID) {
      addIssue(
        issues,
        "PROVINCE_ID_INVALID",
        path,
        `Province ID ${provinceId} must be an integer from 1 to ${MAX_MASK_PROVINCE_ID}`
      );
    }

    if (seenIds.has(provinceId)) {
      addIssue(issues, "PROVINCE_ID_DUPLICATE", path, `Duplicate province ID ${provinceId}`);
    } else {
      seenIds.add(provinceId);
    }

    if (typeof province.name !== "string" || province.name.trim().length === 0) {
      addIssue(issues, "PROVINCE_NAME_EMPTY", path, "Province name must not be empty");
    }

    if (!RESOURCE_TYPES.includes(province.terrainResource)) {
      addIssue(
        issues,
        "PROVINCE_RESOURCE_INVALID",
        path,
        `Unknown terrain resource ${province.terrainResource}`
      );
    }

    if (!MASK_COLOR_PATTERN.test(province.maskColor)) {
      addIssue(
        issues,
        "PROVINCE_MASK_COLOR_INVALID",
        path,
        `Mask colour ${province.maskColor} must be an opaque six-digit hex colour`
      );
    } else {
      const normalized = province.maskColor.toLowerCase();

      if (normalized === WATER_MASK_COLOR) {
        addIssue(
          issues,
          "PROVINCE_MASK_COLOR_INVALID",
          path,
          `Mask colour ${province.maskColor} is reserved for water`
        );
      } else {
        const owner = seenColors.get(normalized);

        if (owner !== undefined) {
          addIssue(
            issues,
            "PROVINCE_MASK_COLOR_DUPLICATE",
            path,
            `Mask colour ${province.maskColor} is already used by province ${owner}`
          );
        } else {
          seenColors.set(normalized, provinceId);
        }
      }
    }

    if (!isPointInBounds(province.centroid, map.width, map.height)) {
      addIssue(
        issues,
        "PROVINCE_CENTROID_OUT_OF_BOUNDS",
        `${path}.centroid`,
        "Province centroid must be inside the map"
      );
    }

    if (province.isRefugeeCandidate) {
      refugeeCandidates += 1;
    }
  }

  if (
    refugeeCandidates < rules.minRefugeeCandidates ||
    refugeeCandidates > rules.maxRefugeeCandidates
  ) {
    addIssue(
      issues,
      "REFUGEE_COUNT",
      "$.provinces",
      `Expected ${rules.minRefugeeCandidates}-${rules.maxRefugeeCandidates} refugee candidates, found ${refugeeCandidates}`
    );
  }
}
