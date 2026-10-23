/**
 * Test-only Game Config Fixture
 *
 * Supplies a shape-complete `GameConfig` so schema, document, and hash tests can
 * exercise structure without importing any production balance value. Numbers
 * here are placeholders for tests; they are never loaded by the server and are
 * not a balance source.
 */

import type { GameConfig } from "../../domain/config.js";
import { toProvinceId } from "../../protocol/ids.js";

export function createTestGameConfig(): GameConfig {
  return {
    configVersion: "test-config-1",
    map: {
      mapId: "test-map",
      version: "test-map-1",
      width: 1,
      height: 1,
      maskAsset: "test-mask",
      provinces: [
        {
          provinceId: toProvinceId(1),
          name: "Test Province",
          terrain: "plain",
          terrainResource: "food",
          neighbors: [],
          maskColor: "neutral",
          centroid: { x: 0, y: 0 },
          isRefugeeCandidate: false
        }
      ]
    },
    units: [
      {
        unitType: "infantry",
        era: 1,
        attack: 1,
        defense: 1,
        marchMinutesPerHop: 1,
        rangeHops: 1,
        costMoney: 1,
        costResourceType: "food",
        costResourceAmount: 1,
        trainSeconds: 1,
        isCombatUnit: true
      }
    ],
    weapons: [{ weapon: "rifles", counters: { infantry: 1 } }],
    skills: [
      { skill: "defender", attackMultiplier: 1, defenseMultiplier: 1, marchSpeedMultiplier: 1 }
    ],
    abilities: [
      {
        ability: "mobilization",
        era: 1,
        warOnly: false,
        cooldownSeconds: 1,
        costMoney: 1,
        costResourceType: null,
        costResourceAmount: 0,
        costGold: 0
      }
    ],
    techs: [
      {
        techId: "test-tech",
        era: 1,
        branch: "main",
        prerequisiteTechIds: [],
        costMoney: 1,
        costGold: 0,
        effects: {}
      }
    ],
    missions: [
      {
        missionId: "test-mission",
        cadence: "daily",
        target: 1,
        xp: 1,
        active: true,
        metadata: {}
      }
    ],
    passRewards: [
      {
        rewardId: "test-reward",
        track: "free",
        level: 1,
        cosmeticId: "test-cosmetic",
        active: true
      }
    ],
    cosmetics: [
      {
        cosmeticId: "test-cosmetic",
        slot: "flag",
        name: "Test Cosmetic",
        assetKey: "test-asset",
        metadata: {}
      }
    ],
    shopItems: [
      {
        itemId: "test-item",
        kind: "pass",
        slot: null,
        name: "Test Item",
        description: "Test Item",
        priceUsdCents: 1,
        storeProductId: null,
        active: true,
        metadata: {}
      }
    ]
  };
}

export function createTestConfigDocument(): Record<string, unknown> {
  return {
    status: "approved",
    decisions: ["D-PD"],
    config: createTestGameConfig()
  };
}
