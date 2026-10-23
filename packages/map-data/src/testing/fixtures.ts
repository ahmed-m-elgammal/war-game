/**
 * Test-Only Synthetic Map Fixture
 *
 * This is deliberately not Vardania and is never exported from the package
 * root. It exists only to exercise mask, adjacency, spawn, and hash machinery
 * while the D-MAP content decision remains open. Province names, terrain,
 * resources, geometry, and colors here are placeholders.
 */

import { toProvinceId, type ResourceType } from "@wargame/shared";
import type { MapValidationRules } from "../rules.js";
import type { MapPoint, ProvinceMask, SpawnAssignment, VardaniaMap } from "../types.js";

const TEST_WIDTH = 12;
const TEST_HEIGHT = 6;
const TEST_PROVINCE_IDS = [1, 2, 3, 4, 5] as const;
const TEST_RESOURCES: readonly ResourceType[] = ["money", "food", "water", "water", "oil"];
const TEST_NEIGHBORS: readonly (readonly number[])[] = [[2], [1, 3], [2, 4], [3, 5], [4]];

export const TEST_MAP_RULES: MapValidationRules = Object.freeze({
  maskWidth: TEST_WIDTH,
  maskHeight: TEST_HEIGHT,
  minProvinces: TEST_PROVINCE_IDS.length,
  maxProvinces: TEST_PROVINCE_IDS.length,
  minRefugeeCandidates: 1,
  maxRefugeeCandidates: 1,
  requireSingleLandComponent: true,
  requireEdgeOnlyWater: true
});

function testMaskColor(provinceId: number): string {
  return `#${provinceId.toString(16).padStart(6, "0")}`;
}

function buildTestMask(): ProvinceMask {
  const pixels = new Uint8Array(TEST_WIDTH * TEST_HEIGHT);

  for (let y = 1; y < TEST_HEIGHT - 1; y += 1) {
    for (let x = 1; x < TEST_WIDTH - 1; x += 1) {
      const strip = Math.min(TEST_PROVINCE_IDS.length - 1, Math.floor((x - 1) / 2));
      pixels[y * TEST_WIDTH + x] = TEST_PROVINCE_IDS[strip] ?? 0;
    }
  }

  return { width: TEST_WIDTH, height: TEST_HEIGHT, pixels };
}

function centroidFor(mask: ProvinceMask, provinceId: number): MapPoint {
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if (mask.pixels[y * mask.width + x] === provinceId) {
        sumX += x;
        sumY += y;
        count += 1;
      }
    }
  }

  return { x: Math.round(sumX / count), y: Math.round(sumY / count) };
}

export function createTestMap(): VardaniaMap {
  const mask = buildTestMask();

  const provinces = TEST_PROVINCE_IDS.map((provinceId, index) => {
    const centroid = centroidFor(mask, provinceId);

    return {
      provinceId: toProvinceId(provinceId),
      name: `Test Province ${provinceId}`,
      terrain: "test-plain",
      terrainResource: TEST_RESOURCES[index] ?? "money",
      neighbors: (TEST_NEIGHBORS[index] ?? []).map(toProvinceId),
      maskColor: testMaskColor(provinceId),
      centroid,
      isRefugeeCandidate: provinceId === 5
    };
  });

  return {
    mapId: "test-map",
    version: "test-map-1",
    width: TEST_WIDTH,
    height: TEST_HEIGHT,
    maskAsset: "test-mask",
    provinces,
    mask,
    art: {
      provinces: provinces.map((province) => ({
        provinceId: province.provinceId,
        iconAnchor: { ...province.centroid },
        labelAnchor: { ...province.centroid },
        capitalAnchor: { ...province.centroid }
      }))
    }
  };
}

export function createTestSpawnAssignment(): SpawnAssignment {
  return {
    playerCapitalProvinceIds: [toProvinceId(1), toProvinceId(3)],
    weakNeutralProvinceIds: [toProvinceId(2), toProvinceId(4)]
  };
}
