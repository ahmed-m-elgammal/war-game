/**
 * Map Constants
 *
 * Fixed v1 map dimensions and the mask encoding boundary. Province IDs are
 * constrained to one byte because the mask stores one province ID per pixel.
 * Pixel 0 is water, so the matching #000000 mask colour is reserved and cannot
 * be assigned to a province. The locked v1 spawn guarantee keeps food and water
 * within two land hops.
 */

export const VARDANIA_MASK_WIDTH = 320;
export const VARDANIA_MASK_HEIGHT = 180;

export const WATER_PIXEL = 0;
export const WATER_MASK_COLOR = `#${WATER_PIXEL.toString(16).padStart(6, "0")}`;
export const MAX_MASK_PROVINCE_ID = 254;

export const SPAWN_RESOURCE_HOPS = 2;
