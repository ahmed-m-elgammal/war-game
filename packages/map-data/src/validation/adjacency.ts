/**
 * Adjacency Validation
 *
 * Enforces the v1 map graph invariants: every neighbour exists, no self-loops
 * or duplicate edges, adjacency is symmetric, and the surviving graph is
 * connected so every province is land-reachable.
 */

import type { ProvinceId } from "@wargame/shared";
import type { VardaniaMap } from "../types.js";
import { addIssue, type MapValidationIssue } from "./issues.js";

export function validateAdjacency(map: VardaniaMap, issues: MapValidationIssue[]): void {
  const provinceById = new Map<ProvinceId, VardaniaMap["provinces"][number]>();

  for (const province of map.provinces) {
    if (!provinceById.has(province.provinceId)) {
      provinceById.set(province.provinceId, province);
    }
  }

  for (const [index, province] of map.provinces.entries()) {
    const path = `$.provinces[${index}].neighbors`;
    const seen = new Set<ProvinceId>();

    for (const neighbour of province.neighbors) {
      if (neighbour === province.provinceId) {
        addIssue(issues, "ADJACENCY_SELF_LOOP", path, "A province cannot neighbour itself");
      }

      if (seen.has(neighbour)) {
        addIssue(issues, "ADJACENCY_DUPLICATE_EDGE", path, `Duplicate neighbour ${neighbour}`);
        continue;
      }

      seen.add(neighbour);

      const other = provinceById.get(neighbour);

      if (other === undefined) {
        addIssue(
          issues,
          "ADJACENCY_UNKNOWN_PROVINCE",
          path,
          `Neighbour ${neighbour} does not exist`
        );
        continue;
      }

      if (!other.neighbors.includes(province.provinceId)) {
        addIssue(
          issues,
          "ADJACENCY_ASYMMETRIC",
          path,
          `Province ${province.provinceId} lists ${neighbour}, but the reverse edge is missing`
        );
      }
    }
  }

  const provinceIds = [...provinceById.keys()];

  if (provinceIds.length === 0) {
    return;
  }

  const start = provinceIds[0];
  if (start === undefined) {
    return;
  }

  const visited = new Set<ProvinceId>([start]);
  const queue: ProvinceId[] = [start];

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (current === undefined) {
      continue;
    }

    for (const neighbour of provinceById.get(current)?.neighbors ?? []) {
      if (provinceById.has(neighbour) && !visited.has(neighbour)) {
        visited.add(neighbour);
        queue.push(neighbour);
      }
    }
  }

  if (visited.size !== provinceIds.length) {
    addIssue(
      issues,
      "ADJACENCY_DISCONNECTED",
      "$.provinces",
      "Every province must be reachable through land adjacency"
    );
  }
}
