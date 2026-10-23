/**
 * Shared Monorepo Package Root
 *
 * Exposes core protocol schemas, domain models, branded IDs, DTOs, network envelopes,
 * and environment configuration contracts for server and client packages.
 */

export * from "./protocol/index.js";
export * from "./domain/index.js";
export * from "./config/env.js";
export * from "./config/game-config/index.js";
