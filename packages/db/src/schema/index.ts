/**
 * Database Schema Barrel
 *
 * Single export seam for all PostgreSQL schema tables, enums, views, and
 * constraints under the `game` schema.
 */

export * from "./enums.js";
export * from "./meta.js";
export * from "./accounts.js";
export * from "./monetization.js";
export * from "./worlds.js";
export * from "./factions.js";
export * from "./regions.js";
export * from "./military.js";
export * from "./diplomacy.js";
export * from "./queues.js";
export * from "./events.js";
export * from "./admin.js";
export * from "./views.js";
export * from "./deferred-constraints.js";
