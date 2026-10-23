/**
 * @wargame/game-rules
 *
 * Public entry point for pure deterministic simulation primitives: seeded PRNG,
 * UTC clock and phase derivation, ordered event comparators, per-world ID
 * allocation, and fixed-point integer arithmetic. Runtime modules import only
 * `@wargame/shared` and each other; they never touch Node, the database,
 * network, React, browser globals, the host clock, or Math.random().
 *
 * Gameplay values and schedules arrive through caller-supplied arguments from
 * the world's pinned config. This package owns mechanisms, not balance numbers.
 */

import { PROTOCOL_VERSION } from "@wargame/shared";

export const RULES_VERSION = PROTOCOL_VERSION;

export * from "./time.js";
export * from "./prng.js";
export * from "./clock.js";
export * from "./event-order.js";
export * from "./id-allocator.js";
export * from "./math.js";
