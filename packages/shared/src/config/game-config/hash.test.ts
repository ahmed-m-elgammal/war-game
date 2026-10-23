/**
 * Game Config Hash and Pin Tests
 *
 * Proves canonical serialization is order-stable, rejects non-JSON values,
 * matches a known SHA-256 vector, and detects any content or version drift
 * against a world's pinned config.
 */

import { describe, expect, it } from "vitest";
import type { World } from "../../domain/world.js";
import { createTestGameConfig } from "./fixtures.js";
import {
  ConfigPinMismatchError,
  assertConfigPin,
  canonicalJsonStringify,
  computeConfigHash,
  configPinMatches,
  pinGameConfig,
  sha256Hex
} from "./hash.js";

describe("canonicalJsonStringify", () => {
  it("sorts object keys and preserves array order", () => {
    const canonical = canonicalJsonStringify({
      b: 1,
      a: { d: 2, c: [3, 4] },
      list: [{ y: 1, x: 2 }]
    });

    expect(canonical).toBe('{"a":{"c":[3,4],"d":2},"b":1,"list":[{"x":2,"y":1}]}');
  });

  it("produces the same string regardless of key insertion order", () => {
    expect(canonicalJsonStringify({ a: 1, b: 2 })).toBe(canonicalJsonStringify({ b: 2, a: 1 }));
  });

  it("rejects undefined, functions, and non-finite numbers", () => {
    expect(() => canonicalJsonStringify({ value: undefined })).toThrowError(/undefined/);
    expect(() => canonicalJsonStringify({ value: () => 1 })).toThrowError(/function/);
    expect(() => canonicalJsonStringify({ value: Number.POSITIVE_INFINITY })).toThrowError(
      /non-finite/
    );
  });
});

describe("sha256Hex", () => {
  it("matches the known SHA-256 vector for abc", async () => {
    await expect(sha256Hex("abc")).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });
});

describe("config pinning", () => {
  it("derives a stable 64-character hash from the config content", async () => {
    const config = createTestGameConfig();
    const first = await computeConfigHash(config);
    const second = await computeConfigHash(createTestGameConfig());

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toBe(first);
  });

  it("changes the hash when any config value changes", async () => {
    const original = createTestGameConfig();
    const changed = createTestGameConfig();
    changed.units[0].attack = 2;

    expect(await computeConfigHash(changed)).not.toBe(await computeConfigHash(original));
  });

  it("pins the config version together with the content hash", async () => {
    const config = createTestGameConfig();
    const pin = await pinGameConfig(config);

    expect(pin.configVersion).toBe(config.configVersion);
    await expect(configPinMatches(config, pin)).resolves.toBe(true);
  });

  it("produces a pin assignable to a world's config fields", async () => {
    const pin = await pinGameConfig(createTestGameConfig());
    const worldFields: Pick<World, "configVersion" | "configHash"> = pin;

    expect(worldFields.configVersion).toBe("test-config-1");
    expect(worldFields.configHash).toBe(pin.configHash);
  });

  it("rejects a pin whose version differs", async () => {
    const config = createTestGameConfig();
    const pin = await pinGameConfig(config);

    await expect(
      configPinMatches(config, { ...pin, configVersion: "other-version" })
    ).resolves.toBe(false);
  });

  it("rejects a pin whose content hash no longer matches", async () => {
    const config = createTestGameConfig();
    const pin = await pinGameConfig(config);
    const mutated = createTestGameConfig();
    mutated.units[0].defense = 2;

    await expect(configPinMatches(mutated, pin)).resolves.toBe(false);
    await expect(assertConfigPin(mutated, pin)).rejects.toBeInstanceOf(ConfigPinMismatchError);
  });
});
