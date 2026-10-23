/**
 * Map Validation Tests
 *
 * Covers the structural map invariants: dimensions, province identity,
 * mask/colour consistency, adjacency symmetry, connectivity, refugee count,
 * and art anchors. The fixture is synthetic and test-only.
 */

import { describe, expect, it } from "vitest";
import { toProvinceId } from "@wargame/shared";
import { validateMap } from "./index.js";
import { TEST_MAP_RULES, createTestMap } from "../testing/fixtures.js";
import type { MapPoint, ProvinceMask, VardaniaMap } from "../types.js";

function issueCodes(map: VardaniaMap): readonly string[] {
  return validateMap(map, TEST_MAP_RULES).issues.map((issue) => issue.code);
}

describe("validateMap", () => {
  it("accepts the valid synthetic fixture", () => {
    const report = validateMap(createTestMap(), TEST_MAP_RULES);

    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("rejects a map whose dimensions do not match the rules", () => {
    const map = createTestMap();
    map.width = 13;

    expect(issueCodes(map)).toContain("MAP_SIZE_MISMATCH");
  });

  it("rejects a mask whose dimensions do not match the map", () => {
    const map = createTestMap();
    const mask: ProvinceMask = { width: 11, height: 6, pixels: map.mask.pixels };

    expect(issueCodes({ ...map, mask })).toContain("MASK_SIZE_MISMATCH");
  });

  it("rejects a mask with the wrong pixel count", () => {
    const map = createTestMap();
    const mask: ProvinceMask = {
      width: 12,
      height: 6,
      pixels: map.mask.pixels.slice(0, 10)
    };

    expect(issueCodes({ ...map, mask })).toContain("MASK_LENGTH_MISMATCH");
  });

  it("rejects a province count outside the rules", () => {
    const map = createTestMap();
    const report = validateMap(map, { ...TEST_MAP_RULES, minProvinces: 6 });

    expect(report.issues.map((issue) => issue.code)).toContain("PROVINCE_COUNT");
  });

  it("rejects duplicate province IDs", () => {
    const map = createTestMap();
    map.provinces[1].provinceId = toProvinceId(1);

    expect(issueCodes(map)).toContain("PROVINCE_ID_DUPLICATE");
  });

  it("rejects an empty province name", () => {
    const map = createTestMap();
    map.provinces[0].name = "   ";

    expect(issueCodes(map)).toContain("PROVINCE_NAME_EMPTY");
  });

  it("reports a missing province name instead of throwing", () => {
    const map = createTestMap();
    map.provinces[1].name = undefined as unknown as string;

    const report = validateMap(map, TEST_MAP_RULES);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "PROVINCE_NAME_EMPTY",
          path: "$.provinces[1]"
        })
      ])
    );
  });

  it("rejects duplicate mask colors", () => {
    const map = createTestMap();
    map.provinces[1].maskColor = map.provinces[0].maskColor;

    expect(issueCodes(map)).toContain("PROVINCE_MASK_COLOR_DUPLICATE");
  });

  it("rejects an invalid mask color", () => {
    const map = createTestMap();
    map.provinces[0].maskColor = "not-a-color";

    expect(issueCodes(map)).toContain("PROVINCE_MASK_COLOR_INVALID");
  });

  it("rejects the water mask colour for a province", () => {
    const map = createTestMap();
    map.provinces[0].maskColor = "#000000";

    const report = validateMap(map, TEST_MAP_RULES);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "PROVINCE_MASK_COLOR_INVALID",
          path: "$.provinces[0]"
        })
      ])
    );
  });

  it("reports a missing centroid instead of throwing", () => {
    const map = createTestMap();
    map.provinces[0].centroid = undefined as unknown as MapPoint;

    const report = validateMap(map, TEST_MAP_RULES);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "PROVINCE_CENTROID_OUT_OF_BOUNDS",
          path: "$.provinces[0].centroid"
        })
      ])
    );
  });

  it("rejects a mask pixel that references an unknown province", () => {
    const map = createTestMap();
    map.mask.pixels[1 * map.mask.width + 1] = 6;

    expect(issueCodes(map)).toContain("MASK_UNKNOWN_PROVINCE");
  });

  it("rejects a province with no mask pixels", () => {
    const map = createTestMap();
    for (let index = 0; index < map.mask.pixels.length; index += 1) {
      if (map.mask.pixels[index] === 5) {
        map.mask.pixels[index] = 4;
      }
    }

    expect(issueCodes(map)).toContain("MASK_PROVINCE_UNCOVERED");
  });

  it("rejects a mask with no land", () => {
    const map = createTestMap();
    map.mask.pixels.fill(0);

    expect(issueCodes(map)).toContain("MASK_NO_LAND");
  });

  it("rejects disconnected land", () => {
    const map = createTestMap();
    for (let y = 1; y < map.height - 1; y += 1) {
      map.mask.pixels[y * map.mask.width + 6] = 0;
    }

    expect(issueCodes(map)).toContain("MASK_LAND_NOT_CONTIGUOUS");
  });

  it("rejects interior water", () => {
    const map = createTestMap();
    map.mask.pixels[2 * map.mask.width + 5] = 0;

    expect(issueCodes(map)).toContain("MASK_INTERIOR_WATER");
  });

  it("rejects an asymmetric adjacency entry", () => {
    const map = createTestMap();
    map.provinces[0].neighbors = [toProvinceId(2)];
    map.provinces[1].neighbors = [toProvinceId(3)];

    expect(issueCodes(map)).toContain("ADJACENCY_ASYMMETRIC");
  });

  it("rejects a neighbour that does not exist", () => {
    const map = createTestMap();
    map.provinces[0].neighbors = [toProvinceId(2), toProvinceId(99)];

    expect(issueCodes(map)).toContain("ADJACENCY_UNKNOWN_PROVINCE");
  });

  it("rejects a self-loop", () => {
    const map = createTestMap();
    map.provinces[0].neighbors = [toProvinceId(1), toProvinceId(2)];

    expect(issueCodes(map)).toContain("ADJACENCY_SELF_LOOP");
  });

  it("rejects a duplicate adjacency entry", () => {
    const map = createTestMap();
    map.provinces[0].neighbors = [toProvinceId(2), toProvinceId(2)];

    expect(issueCodes(map)).toContain("ADJACENCY_DUPLICATE_EDGE");
  });

  it("does not repeat asymmetric errors for duplicate edges", () => {
    const map = createTestMap();
    map.provinces[0].neighbors = [toProvinceId(2), toProvinceId(2)];
    map.provinces[1].neighbors = [toProvinceId(3)];

    const report = validateMap(map, TEST_MAP_RULES);
    const asymmetric = report.issues.filter(
      (issue) => issue.code === "ADJACENCY_ASYMMETRIC" && issue.path === "$.provinces[0].neighbors"
    );

    expect(asymmetric).toHaveLength(1);
  });

  it("rejects a disconnected adjacency graph", () => {
    const map = createTestMap();
    map.provinces[3].neighbors = [toProvinceId(3)];
    map.provinces[4].neighbors = [];

    expect(issueCodes(map)).toContain("ADJACENCY_DISCONNECTED");
  });

  it("rejects a refugee count outside the rules", () => {
    const map = createTestMap();
    map.provinces[4].isRefugeeCandidate = false;

    expect(issueCodes(map)).toContain("REFUGEE_COUNT");
  });

  it("rejects missing art metadata", () => {
    const map = createTestMap();
    map.art.provinces.pop();

    const report = validateMap(map, TEST_MAP_RULES);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "ART_MISSING_PROVINCE",
          path: "$.provinces[4]"
        })
      ])
    );
  });

  it("rejects an out-of-bounds art anchor", () => {
    const map = createTestMap();
    const art = map.art.provinces[0];

    map.art.provinces[0] = {
      ...art,
      labelAnchor: { x: map.width, y: art.labelAnchor.y }
    };

    const report = validateMap(map, TEST_MAP_RULES);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "ART_ANCHOR_OUT_OF_BOUNDS",
          path: "$.art.provinces[0].labelAnchor"
        })
      ])
    );
  });

  it("reports a missing art anchor instead of throwing", () => {
    const map = createTestMap();
    const art = map.art.provinces[0];

    map.art.provinces[0] = {
      ...art,
      labelAnchor: null as unknown as MapPoint
    };

    const report = validateMap(map, TEST_MAP_RULES);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "ART_ANCHOR_OUT_OF_BOUNDS",
          path: "$.art.provinces[0].labelAnchor"
        })
      ])
    );
  });

  it("uses the duplicate art record index in issue paths", () => {
    const map = createTestMap();
    const art = map.art.provinces[0];

    map.art.provinces.push({ ...art });

    const report = validateMap(map, TEST_MAP_RULES);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "ART_DUPLICATE_PROVINCE",
          path: "$.art.provinces[5]"
        })
      ])
    );
  });

  it("uses the unknown art record index in issue paths", () => {
    const map = createTestMap();

    map.art.provinces.push({
      provinceId: toProvinceId(99),
      iconAnchor: { x: 1, y: 1 },
      labelAnchor: { x: 1, y: 1 },
      capitalAnchor: { x: 1, y: 1 }
    });

    const report = validateMap(map, TEST_MAP_RULES);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "ART_UNKNOWN_PROVINCE",
          path: "$.art.provinces[5]"
        })
      ])
    );
  });
});
