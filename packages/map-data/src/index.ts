/**
 * Map Data Package
 *
 * Public contracts for static Vardania map content. No production map values
 * are exported while D-MAP is open; the package currently provides validation,
 * mask hit-testing, adjacency helpers, deterministic hashing, and test-only
 * synthetic fixtures.
 */

export const MAP_ID = "vardania_v1";

export * from "./constants.js";
export * from "./types.js";
export * from "./rules.js";
export * from "./mask.js";
export * from "./adjacency.js";
export * from "./hash.js";
export * from "./validation/index.js";
