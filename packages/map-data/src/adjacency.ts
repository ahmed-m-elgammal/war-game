/**
 * Adjacency Graph Helpers
 *
 * Builds a read-only neighbour index and bounded breadth-first distances from
 * the static province adjacency data. The map graph is authoritative; these
 * helpers perform no gameplay resolution.
 */

import type { MapDefinition, ProvinceId } from "@wargame/shared";

export type AdjacencyIndex = ReadonlyMap<ProvinceId, ReadonlySet<ProvinceId>>;

export function buildAdjacencyIndex(map: Pick<MapDefinition, "provinces">): AdjacencyIndex {
  const index = new Map<ProvinceId, Set<ProvinceId>>();

  for (const province of map.provinces) {
    const neighbours = index.get(province.provinceId) ?? new Set<ProvinceId>();
    for (const neighbour of province.neighbors) {
      neighbours.add(neighbour);
    }
    index.set(province.provinceId, neighbours);
  }

  return index;
}

export function hopDistancesFrom(
  index: AdjacencyIndex,
  from: ProvinceId,
  maxHops: number = Number.POSITIVE_INFINITY
): Map<ProvinceId, number> {
  const distances = new Map<ProvinceId, number>([[from, 0]]);

  if (maxHops < 0) {
    return distances;
  }

  let frontier: ProvinceId[] = [from];

  for (let hop = 1; hop <= maxHops && frontier.length > 0; hop += 1) {
    const next: ProvinceId[] = [];

    for (const provinceId of frontier) {
      for (const neighbour of index.get(provinceId) ?? []) {
        if (!distances.has(neighbour)) {
          distances.set(neighbour, hop);
          next.push(neighbour);
        }
      }
    }

    frontier = next;
  }

  return distances;
}

export function shortestHopDistance(
  index: AdjacencyIndex,
  from: ProvinceId,
  to: ProvinceId
): number | null {
  if (from === to) {
    return 0;
  }

  return hopDistancesFrom(index, from).get(to) ?? null;
}
