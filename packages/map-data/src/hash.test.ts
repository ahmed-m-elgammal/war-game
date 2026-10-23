/**
 * Map Hash Tests
 *
 * Proves the map hash is deterministic, order-canonical, and sensitive to mask
 * and art changes. The fixture is synthetic and test-only.
 */

import { describe, expect, it } from "vitest";
import { computeMapHash } from "./index.js";
import { createTestMap } from "./testing/fixtures.js";

describe("computeMapHash", () => {
  it("returns a stable SHA-256 hex digest", async () => {
    const first = await computeMapHash(createTestMap());
    const second = await computeMapHash(createTestMap());

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).toBe(second);
  });

  it("matches the pinned golden digest for the synthetic fixture", async () => {
    expect(await computeMapHash(createTestMap())).toBe(
      "dc72ef84dc770e5904aa14a2b6e54ddaa0339f70352d90c07e8ce13af0da6fca"
    );
  });

  it("is insensitive to province, neighbour, and art ordering", async () => {
    const original = createTestMap();
    const reordered = createTestMap();

    reordered.provinces.reverse();
    reordered.art.provinces.reverse();
    for (const province of reordered.provinces) {
      province.neighbors.reverse();
    }

    expect(await computeMapHash(reordered)).toBe(await computeMapHash(original));
  });

  it("changes when a mask pixel changes", async () => {
    const original = createTestMap();
    const changed = createTestMap();

    changed.mask.pixels[1] = 2;

    expect(await computeMapHash(changed)).not.toBe(await computeMapHash(original));
  });

  it("changes when an art anchor changes", async () => {
    const original = createTestMap();
    const changed = createTestMap();
    const art = changed.art.provinces[0];

    changed.art.provinces[0] = {
      ...art,
      iconAnchor: { x: 0, y: 0 }
    };

    expect(await computeMapHash(changed)).not.toBe(await computeMapHash(original));
  });
});
