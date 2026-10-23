/**
 * Mask Validation
 *
 * Checks mask dimensions, byte length, province coverage, single landmass
 * contiguity, and edge-only water. The mask is the pixel-level source for
 * hit-testing; province metadata is validated separately.
 */

import { toProvinceId, type ProvinceId } from "@wargame/shared";
import { WATER_PIXEL } from "../constants.js";
import type { MapValidationRules } from "../rules.js";
import type { VardaniaMap } from "../types.js";
import { addIssue, type MapValidationIssue } from "./issues.js";

interface MaskScan {
  readonly landCount: number;
  readonly counts: ReadonlyMap<ProvinceId, number>;
  readonly unknownCounts: ReadonlyMap<number, number>;
}

function scanMask(map: VardaniaMap, provinceIds: ReadonlySet<ProvinceId>): MaskScan {
  const counts = new Map<ProvinceId, number>();
  const unknownCounts = new Map<number, number>();
  let landCount = 0;

  for (const value of map.mask.pixels) {
    if (value === WATER_PIXEL) {
      continue;
    }

    landCount += 1;
    const provinceId = toProvinceId(value);
    counts.set(provinceId, (counts.get(provinceId) ?? 0) + 1);

    if (!provinceIds.has(provinceId)) {
      unknownCounts.set(value, (unknownCounts.get(value) ?? 0) + 1);
    }
  }

  return { landCount, counts, unknownCounts };
}

function forEachLandNeighbour(
  width: number,
  height: number,
  index: number,
  visit: (neighbourIndex: number) => void
): void {
  const x = index % width;
  const y = Math.floor(index / width);

  if (x > 0) {
    visit(index - 1);
  }
  if (x < width - 1) {
    visit(index + 1);
  }
  if (y > 0) {
    visit(index - width);
  }
  if (y < height - 1) {
    visit(index + width);
  }
}

function countLandComponents(map: VardaniaMap): number {
  const { width, height, pixels } = map.mask;
  const visited = new Uint8Array(pixels.length);
  let components = 0;

  for (let start = 0; start < pixels.length; start += 1) {
    if (pixels[start] === WATER_PIXEL || visited[start] === 1) {
      continue;
    }

    components += 1;
    visited[start] = 1;
    const queue = [start];

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      if (current === undefined) {
        continue;
      }

      forEachLandNeighbour(width, height, current, (neighbour) => {
        if (pixels[neighbour] !== WATER_PIXEL && visited[neighbour] === 0) {
          visited[neighbour] = 1;
          queue.push(neighbour);
        }
      });
    }
  }

  return components;
}

function countInteriorWater(map: VardaniaMap): number {
  const { width, height, pixels } = map.mask;
  const visited = new Uint8Array(pixels.length);
  const queue: number[] = [];
  let waterCount = 0;

  for (const pixel of pixels) {
    if (pixel === WATER_PIXEL) {
      waterCount += 1;
    }
  }

  const seed = (index: number): void => {
    if (pixels[index] === WATER_PIXEL && visited[index] === 0) {
      visited[index] = 1;
      queue.push(index);
    }
  };

  for (let x = 0; x < width; x += 1) {
    seed(x);
    seed((height - 1) * width + x);
  }

  for (let y = 0; y < height; y += 1) {
    seed(y * width);
    seed(y * width + width - 1);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (current === undefined) {
      continue;
    }

    forEachLandNeighbour(width, height, current, (neighbour) => {
      if (pixels[neighbour] === WATER_PIXEL && visited[neighbour] === 0) {
        visited[neighbour] = 1;
        queue.push(neighbour);
      }
    });
  }

  return waterCount - queue.length;
}

export function validateMask(
  map: VardaniaMap,
  rules: MapValidationRules,
  issues: MapValidationIssue[]
): void {
  const { mask } = map;

  if (
    !Number.isInteger(mask.width) ||
    !Number.isInteger(mask.height) ||
    mask.width <= 0 ||
    mask.height <= 0 ||
    mask.width !== map.width ||
    mask.height !== map.height
  ) {
    addIssue(
      issues,
      "MASK_SIZE_MISMATCH",
      "$.mask",
      "Mask dimensions must be positive integers and match the map dimensions"
    );
    return;
  }

  if (mask.pixels.length !== mask.width * mask.height) {
    addIssue(
      issues,
      "MASK_LENGTH_MISMATCH",
      "$.mask.pixels",
      `Expected ${mask.width * mask.height} pixels, found ${mask.pixels.length}`
    );
    return;
  }

  const provinceIds = new Set(map.provinces.map((province) => province.provinceId));
  const scan = scanMask(map, provinceIds);

  for (const [provinceId, count] of scan.unknownCounts) {
    addIssue(
      issues,
      "MASK_UNKNOWN_PROVINCE",
      "$.mask.pixels",
      `Mask contains ${count} pixel(s) for unknown province ${provinceId}`
    );
  }

  for (const [index, province] of map.provinces.entries()) {
    if (!scan.counts.has(province.provinceId)) {
      addIssue(
        issues,
        "MASK_PROVINCE_UNCOVERED",
        `$.provinces[${index}]`,
        `Province ${province.provinceId} has no mask pixels`
      );
    }
  }

  if (scan.landCount === 0) {
    addIssue(issues, "MASK_NO_LAND", "$.mask.pixels", "Mask has no land pixels");
    return;
  }

  if (rules.requireSingleLandComponent && countLandComponents(map) !== 1) {
    addIssue(
      issues,
      "MASK_LAND_NOT_CONTIGUOUS",
      "$.mask.pixels",
      "Land pixels must form one contiguous landmass"
    );
  }

  if (rules.requireEdgeOnlyWater && countInteriorWater(map) > 0) {
    addIssue(issues, "MASK_INTERIOR_WATER", "$.mask.pixels", "Water may only touch the map edge");
  }
}
