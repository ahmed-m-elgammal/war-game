// @wargame/admin
// Internal moderation and operational dashboard
import { PROTOCOL_VERSION } from "@wargame/shared";
import { COLORS } from "@wargame/ui";

export function getAdminConfig() {
  return {
    protocol: PROTOCOL_VERSION,
    theme: COLORS
  };
}
