// @wargame/web
// React HUD + Phaser 3.90 Map Canvas Client
import { PROTOCOL_VERSION } from "@wargame/shared";
import { COLORS } from "@wargame/ui";
import { MAP_ID } from "@wargame/map-data";

export function getClientConfig() {
  return {
    protocol: PROTOCOL_VERSION,
    theme: COLORS,
    map: MAP_ID
  };
}
