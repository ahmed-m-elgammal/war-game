/**
 * Deterministic Map Hash
 *
 * Hashes canonicalized map content so a world can pin the exact map revision.
 * Province, neighbour, and art arrays are sorted, and mask bytes are encoded as
 * lowercase hex. The shared canonical JSON and SHA-256 helpers keep the result
 * identical in Node, the browser, and the mobile wrapper.
 */

import { canonicalJsonStringify, sha256Hex, type ProvinceId } from "@wargame/shared";
import type { VardaniaMap } from "./types.js";

function compareIds(left: ProvinceId, right: ProvinceId): number {
  return left - right;
}

function pixelsToHex(pixels: Uint8Array): string {
  let hex = "";

  for (const byte of pixels) {
    hex += byte.toString(16).padStart(2, "0");
  }

  return hex;
}

export async function computeMapHash(map: VardaniaMap): Promise<string> {
  const provinces = [...map.provinces]
    .sort((left, right) => compareIds(left.provinceId, right.provinceId))
    .map((province) => ({
      provinceId: province.provinceId,
      name: province.name,
      terrain: province.terrain,
      terrainResource: province.terrainResource,
      neighbors: [...province.neighbors].sort(compareIds),
      maskColor: province.maskColor.toLowerCase(),
      centroid: { x: province.centroid.x, y: province.centroid.y },
      isRefugeeCandidate: province.isRefugeeCandidate
    }));

  const art = [...map.art.provinces]
    .sort((left, right) => compareIds(left.provinceId, right.provinceId))
    .map((province) => ({
      provinceId: province.provinceId,
      iconAnchor: { x: province.iconAnchor.x, y: province.iconAnchor.y },
      labelAnchor: { x: province.labelAnchor.x, y: province.labelAnchor.y },
      capitalAnchor: { x: province.capitalAnchor.x, y: province.capitalAnchor.y }
    }));

  const payload = {
    mapId: map.mapId,
    version: map.version,
    width: map.width,
    height: map.height,
    maskAsset: map.maskAsset,
    provinces,
    art,
    mask: {
      width: map.mask.width,
      height: map.mask.height,
      pixelsHex: pixelsToHex(map.mask.pixels)
    }
  };

  return sha256Hex(canonicalJsonStringify(payload));
}
