/**
 * Mask Hit-Test
 *
 * Converts world coordinates to the province ID stored in the row-major mask.
 * The caller supplies whole or fractional mask coordinates; out-of-bounds,
 * non-finite, and water reads return null.
 */

import { toProvinceId, type ProvinceId } from "@wargame/shared";
import { MAX_MASK_PROVINCE_ID, WATER_PIXEL } from "./constants.js";
import type { ProvinceMask } from "./types.js";

export function hitTestMask(mask: ProvinceMask, x: number, y: number): ProvinceId | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  const pixelX = Math.floor(x);
  const pixelY = Math.floor(y);

  if (pixelX < 0 || pixelY < 0 || pixelX >= mask.width || pixelY >= mask.height) {
    return null;
  }

  const index = pixelY * mask.width + pixelX;
  const value = mask.pixels[index];

  if (value === undefined || value === WATER_PIXEL || value > MAX_MASK_PROVINCE_ID) {
    return null;
  }

  return toProvinceId(value);
}
