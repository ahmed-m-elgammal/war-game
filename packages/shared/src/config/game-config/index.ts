/**
 * Game Config Module
 *
 * Public exports for strict game-config validation, the approved-document
 * envelope, and canonical version/hash pinning. Seed values intentionally live
 * in approved config documents under packages/shared/config/game-config.
 */

export * from "./schema.js";
export * from "./document.js";
export * from "./hash.js";
