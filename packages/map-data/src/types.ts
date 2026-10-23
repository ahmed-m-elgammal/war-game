/**
 * Static Map Data Contracts
 *
 * Defines the in-memory shape for Vardania map content. `VardaniaMap` extends
 * the shared `MapDefinition` contract with the mask pixel index and static art
 * anchors required by plan/05. The mask is row-major, one byte per pixel:
 * 0 is water and 1-254 is a province ID.
 *
 * These types describe land provinces only. Vardania has no naval province in
 * v1; water exists solely as mask pixels outside the contiguous landmass.
 */

import type { MapDefinition, ProvinceId } from "@wargame/shared";

export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export interface ProvinceArtMetadata {
  readonly provinceId: ProvinceId;
  readonly iconAnchor: MapPoint;
  readonly labelAnchor: MapPoint;
  readonly capitalAnchor: MapPoint;
}

export interface MapArtMetadata {
  readonly provinces: ProvinceArtMetadata[];
}

export interface ProvinceMask {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

export interface VardaniaMap extends MapDefinition {
  readonly mask: ProvinceMask;
  readonly art: MapArtMetadata;
}

export interface SpawnAssignment {
  readonly playerCapitalProvinceIds: readonly ProvinceId[];
  readonly weakNeutralProvinceIds: readonly ProvinceId[];
}

export interface SpawnValidationOptions {
  /**
   * Optional minimum land-hop spacing between player capitals from approved
   * world config. Adjacent capitals are always rejected. The separate neutral/
   * AI buffer guarantee depends on per-world ownership and is not represented by
   * this static-map option.
   */
  readonly minimumCapitalSpacingHops?: number;
}
