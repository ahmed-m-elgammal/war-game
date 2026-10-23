// @wargame/server (Composition root)
// Fastify REST + Colyseus Realtime Room Runtime
import { PROTOCOL_VERSION } from "@wargame/shared";
import { RULES_VERSION } from "@wargame/game-rules";
import { MAP_ID } from "@wargame/map-data";
import { DB_SCHEMA_VERSION } from "@wargame/db";

export function getBootStatus() {
  return {
    protocol: PROTOCOL_VERSION,
    rules: RULES_VERSION,
    map: MAP_ID,
    schema: DB_SCHEMA_VERSION,
    ready: true
  };
}
