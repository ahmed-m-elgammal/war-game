/**
 * Art Anchor Validation
 *
 * Every province needs exactly one art record with icon, label, and capital
 * anchors inside the mask. Anchors are static map data; the renderer converts
 * them to screen positions after applying camera pan and zoom. Issue paths use
 * array indices so they address the malformed record, not just its domain ID.
 */

import type { ProvinceId } from "@wargame/shared";
import type { ProvinceArtMetadata, VardaniaMap } from "../types.js";
import { isPointInBounds } from "./geometry.js";
import { addIssue, type MapValidationIssue } from "./issues.js";

interface ArtRecord {
  readonly art: ProvinceArtMetadata;
  readonly index: number;
}

function validateAnchors(
  art: ProvinceArtMetadata,
  artIndex: number,
  map: VardaniaMap,
  issues: MapValidationIssue[]
): void {
  const anchors: ReadonlyArray<readonly [string, { readonly x: number; readonly y: number }]> = [
    ["iconAnchor", art.iconAnchor],
    ["labelAnchor", art.labelAnchor],
    ["capitalAnchor", art.capitalAnchor]
  ];

  for (const [name, point] of anchors) {
    if (!isPointInBounds(point, map.width, map.height)) {
      addIssue(
        issues,
        "ART_ANCHOR_OUT_OF_BOUNDS",
        `$.art.provinces[${artIndex}].${name}`,
        "Art anchor must be inside the map"
      );
    }
  }
}

export function validateArt(map: VardaniaMap, issues: MapValidationIssue[]): void {
  const artByProvince = new Map<ProvinceId, ArtRecord>();

  for (const [index, art] of map.art.provinces.entries()) {
    if (artByProvince.has(art.provinceId)) {
      addIssue(
        issues,
        "ART_DUPLICATE_PROVINCE",
        `$.art.provinces[${index}]`,
        `Duplicate art metadata for province ${art.provinceId}`
      );
      continue;
    }

    artByProvince.set(art.provinceId, { art, index });
  }

  for (const [provinceIndex, province] of map.provinces.entries()) {
    const record = artByProvince.get(province.provinceId);

    if (record === undefined) {
      addIssue(
        issues,
        "ART_MISSING_PROVINCE",
        `$.provinces[${provinceIndex}]`,
        `Province ${province.provinceId} has no art metadata`
      );
      continue;
    }

    validateAnchors(record.art, record.index, map, issues);
  }

  const provinceIds = new Set(map.provinces.map((province) => province.provinceId));

  for (const [provinceId, record] of artByProvince) {
    if (!provinceIds.has(provinceId)) {
      addIssue(
        issues,
        "ART_UNKNOWN_PROVINCE",
        `$.art.provinces[${record.index}]`,
        `Art metadata references unknown province ${provinceId}`
      );
    }
  }
}
