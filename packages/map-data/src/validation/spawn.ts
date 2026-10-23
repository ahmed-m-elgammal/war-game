/**
 * Spawn Placement Validation
 *
 * Validates the per-world spawn assignment against the static map. It proves
 * every player capital is known and non-refugee, has food and water within two
 * land hops, has an adjacent designated weak neutral target, and is not adjacent
 * to another player capital. A capital's effective resource is money, so its own
 * terrain resource does not satisfy the food/water guarantee. An approved
 * minimum spacing can be supplied without inventing a D-MAP value in code.
 */

import type { ProvinceId } from "@wargame/shared";
import {
  buildAdjacencyIndex,
  hopDistancesFrom,
  shortestHopDistance,
  type AdjacencyIndex
} from "../adjacency.js";
import { SPAWN_RESOURCE_HOPS } from "../constants.js";
import type { SpawnAssignment, SpawnValidationOptions, VardaniaMap } from "../types.js";
import {
  addIssue,
  buildValidationReport,
  type MapValidationIssue,
  type MapValidationReport
} from "./issues.js";

function hasResourceWithinHops(
  provinces: ReadonlyMap<ProvinceId, VardaniaMap["provinces"][number]>,
  adjacency: AdjacencyIndex,
  from: ProvinceId,
  resource: "food" | "water"
): boolean {
  const distances = hopDistancesFrom(adjacency, from, SPAWN_RESOURCE_HOPS);

  for (const [provinceId, distance] of distances) {
    if (distance === 0 || distance > SPAWN_RESOURCE_HOPS) {
      continue;
    }

    if (provinces.get(provinceId)?.terrainResource === resource) {
      return true;
    }
  }

  return false;
}

export function validateSpawnPlacement(
  map: VardaniaMap,
  assignment: SpawnAssignment,
  options: SpawnValidationOptions = {}
): MapValidationReport {
  const issues: MapValidationIssue[] = [];
  const provinces = new Map(
    map.provinces.map((province) => [province.provinceId, province] as const)
  );
  const provinceIds = new Set(provinces.keys());
  const capitalIds = new Set<ProvinceId>();
  const weakTargetIds = new Set<ProvinceId>();
  const validWeakTargets = new Set<ProvinceId>();
  const adjacency = buildAdjacencyIndex(map);

  for (const capitalId of assignment.playerCapitalProvinceIds) {
    if (capitalIds.has(capitalId)) {
      addIssue(
        issues,
        "SPAWN_CAPITAL_DUPLICATE",
        "$.playerCapitalProvinceIds",
        `Capital ${capitalId} is assigned more than once`
      );
      continue;
    }

    capitalIds.add(capitalId);

    if (!provinceIds.has(capitalId)) {
      addIssue(
        issues,
        "SPAWN_CAPITAL_UNKNOWN",
        "$.playerCapitalProvinceIds",
        `Capital ${capitalId} does not exist on the map`
      );
      continue;
    }

    const province = provinces.get(capitalId);
    if (province?.isRefugeeCandidate === true) {
      addIssue(
        issues,
        "SPAWN_CAPITAL_REFUGEE",
        "$.playerCapitalProvinceIds",
        `Capital ${capitalId} is a refugee candidate`
      );
    }
  }

  for (const targetId of assignment.weakNeutralProvinceIds) {
    if (weakTargetIds.has(targetId)) {
      continue;
    }

    weakTargetIds.add(targetId);

    if (!provinceIds.has(targetId)) {
      addIssue(
        issues,
        "SPAWN_WEAK_TARGET_INVALID",
        "$.weakNeutralProvinceIds",
        `Weak target ${targetId} does not exist on the map`
      );
      continue;
    }

    const province = provinces.get(targetId);
    if (capitalIds.has(targetId) || province?.isRefugeeCandidate === true) {
      addIssue(
        issues,
        "SPAWN_WEAK_TARGET_INVALID",
        "$.weakNeutralProvinceIds",
        `Weak target ${targetId} must be a neutral non-refugee province`
      );
      continue;
    }

    validWeakTargets.add(targetId);
  }

  for (const capitalId of capitalIds) {
    if (!provinceIds.has(capitalId)) {
      continue;
    }

    const province = provinces.get(capitalId);
    if (province === undefined) {
      continue;
    }

    for (const resource of ["food", "water"] as const) {
      if (!hasResourceWithinHops(provinces, adjacency, capitalId, resource)) {
        addIssue(
          issues,
          "SPAWN_RESOURCE_MISSING",
          `$.playerCapitalProvinceIds[${capitalId}]`,
          `Capital ${capitalId} has no ${resource} within ${SPAWN_RESOURCE_HOPS} hops`
        );
      }
    }

    if (!province.neighbors.some((neighbour) => validWeakTargets.has(neighbour))) {
      addIssue(
        issues,
        "SPAWN_WEAK_TARGET_MISSING",
        `$.playerCapitalProvinceIds[${capitalId}]`,
        `Capital ${capitalId} has no adjacent weak neutral target`
      );
    }
  }

  const capitals = [...capitalIds].filter((capitalId) => provinceIds.has(capitalId));

  for (let first = 0; first < capitals.length; first += 1) {
    for (let second = first + 1; second < capitals.length; second += 1) {
      const from = capitals[first];
      const to = capitals[second];

      if (from === undefined || to === undefined) {
        continue;
      }

      const distance = shortestHopDistance(adjacency, from, to);
      if (distance === null) {
        continue;
      }

      if (distance < 2) {
        addIssue(
          issues,
          "SPAWN_CAPITALS_ADJACENT",
          "$.playerCapitalProvinceIds",
          `Player capitals ${from} and ${to} are adjacent`
        );
      } else if (
        options.minimumCapitalSpacingHops !== undefined &&
        distance < options.minimumCapitalSpacingHops
      ) {
        addIssue(
          issues,
          "SPAWN_CAPITAL_SPACING",
          "$.playerCapitalProvinceIds",
          `Player capitals ${from} and ${to} are ${distance} hops apart; minimum is ${options.minimumCapitalSpacingHops}`
        );
      }
    }
  }

  return buildValidationReport(issues);
}
