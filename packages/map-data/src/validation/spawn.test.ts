/**
 * Spawn Invariant Tests
 *
 * Covers the v1 spawn guarantees: known capitals, at least one adjacent weak
 * neutral target per capital, food and water within two hops, non-adjacent
 * player capitals, and optional approved capital spacing. The fixture is
 * synthetic and test-only.
 */

import { describe, expect, it } from "vitest";
import { toProvinceId } from "@wargame/shared";
import { validateSpawnPlacement } from "./index.js";
import { createTestMap, createTestSpawnAssignment } from "../testing/fixtures.js";
import type { SpawnAssignment, VardaniaMap } from "../types.js";

function issueCodes(
  map: VardaniaMap,
  assignment: SpawnAssignment,
  minimumCapitalSpacingHops?: number
): readonly string[] {
  return validateSpawnPlacement(map, assignment, { minimumCapitalSpacingHops }).issues.map(
    (issue) => issue.code
  );
}

describe("validateSpawnPlacement", () => {
  it("accepts the valid synthetic fixture", () => {
    const report = validateSpawnPlacement(createTestMap(), createTestSpawnAssignment());

    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("rejects a capital without food within two hops", () => {
    const map = createTestMap();
    map.provinces[1].terrainResource = "oil";

    expect(issueCodes(map, createTestSpawnAssignment())).toContain("SPAWN_RESOURCE_MISSING");
  });

  it("rejects a capital without water within two hops", () => {
    const map = createTestMap();
    map.provinces[3].terrainResource = "oil";

    expect(issueCodes(map, createTestSpawnAssignment())).toContain("SPAWN_RESOURCE_MISSING");
  });

  it("rejects a capital with no adjacent weak neutral target", () => {
    const assignment = createTestSpawnAssignment();

    expect(issueCodes(createTestMap(), { ...assignment, weakNeutralProvinceIds: [] })).toContain(
      "SPAWN_WEAK_TARGET_MISSING"
    );
  });

  it("rejects a weak target that is not a valid neutral province", () => {
    const assignment = createTestSpawnAssignment();

    expect(
      issueCodes(createTestMap(), {
        ...assignment,
        weakNeutralProvinceIds: [toProvinceId(5)]
      })
    ).toContain("SPAWN_WEAK_TARGET_INVALID");
  });

  it("rejects adjacent player capitals", () => {
    const assignment = createTestSpawnAssignment();

    expect(
      issueCodes(createTestMap(), {
        ...assignment,
        playerCapitalProvinceIds: [toProvinceId(1), toProvinceId(2)]
      })
    ).toContain("SPAWN_CAPITALS_ADJACENT");
  });

  it("applies approved minimum capital spacing when supplied", () => {
    expect(issueCodes(createTestMap(), createTestSpawnAssignment(), 3)).toContain(
      "SPAWN_CAPITAL_SPACING"
    );
    expect(issueCodes(createTestMap(), createTestSpawnAssignment(), 2)).not.toContain(
      "SPAWN_CAPITAL_SPACING"
    );
  });

  it("rejects a refugee candidate as a capital", () => {
    const assignment = createTestSpawnAssignment();

    expect(
      issueCodes(createTestMap(), {
        ...assignment,
        playerCapitalProvinceIds: [toProvinceId(1), toProvinceId(3), toProvinceId(5)]
      })
    ).toContain("SPAWN_CAPITAL_REFUGEE");
  });

  it("rejects an unknown capital province", () => {
    const assignment = createTestSpawnAssignment();

    expect(
      issueCodes(createTestMap(), {
        ...assignment,
        playerCapitalProvinceIds: [toProvinceId(1), toProvinceId(99)]
      })
    ).toContain("SPAWN_CAPITAL_UNKNOWN");
  });

  it("rejects duplicate capital IDs", () => {
    const assignment = createTestSpawnAssignment();

    expect(
      issueCodes(createTestMap(), {
        ...assignment,
        playerCapitalProvinceIds: [toProvinceId(1), toProvinceId(1), toProvinceId(3)]
      })
    ).toContain("SPAWN_CAPITAL_DUPLICATE");
  });

  it("rejects a weak target that is also a capital", () => {
    const assignment = createTestSpawnAssignment();

    expect(
      issueCodes(createTestMap(), {
        ...assignment,
        weakNeutralProvinceIds: [toProvinceId(2), toProvinceId(3), toProvinceId(4)]
      })
    ).toContain("SPAWN_WEAK_TARGET_INVALID");
  });
});
