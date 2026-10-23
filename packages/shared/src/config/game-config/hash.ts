/**
 * Game Config Content Hashing and World Pinning
 *
 * Implements decision D-CONFIG-PIN: a world pins the config version plus a
 * SHA-256 hash of the canonical config content. Hashing is environment-neutral
 * through Web Crypto so the same canonical payload hashes identically in Node,
 * the browser, and the mobile wrapper.
 *
 * Canonical JSON sorts object keys and rejects non-JSON values. Arrays keep
 * their order because order is meaningful for config lists.
 */

import type { GameConfig } from "../../domain/config.js";

export interface ConfigPin {
  readonly configVersion: string;
  readonly configHash: string;
}

export class ConfigPinMismatchError extends Error {
  readonly code = "CONFIG_PIN_MISMATCH";
  readonly pinned: ConfigPin;
  readonly actual: ConfigPin;

  constructor(pinned: ConfigPin, actual: ConfigPin) {
    super(
      `Config pin mismatch: world pinned ${pinned.configVersion}/${pinned.configHash}, ` +
        `loaded ${actual.configVersion}/${actual.configHash}`
    );
    this.name = "ConfigPinMismatchError";
    this.pinned = pinned;
    this.actual = actual;
  }
}

function serializeJson(value: unknown, path: string): string {
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        throw new Error(`Cannot canonicalize non-finite number at ${path}`);
      }
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) {
        return `[${value
          .map((entry, index) => serializeJson(entry, `${path}[${index}]`))
          .join(",")}]`;
      }
      const record = value as Record<string, unknown>;
      const entries = Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${serializeJson(record[key], `${path}.${key}`)}`);
      return `{${entries.join(",")}}`;
    }
    default:
      throw new Error(`Cannot canonicalize ${typeof value} at ${path}`);
  }
}

export function canonicalJsonStringify(value: unknown): string {
  return serializeJson(value, "$");
}

export async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle === undefined) {
    throw new Error("Web Crypto is unavailable; cannot hash the game config");
  }
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function computeConfigHash(config: GameConfig): Promise<string> {
  return sha256Hex(canonicalJsonStringify(config));
}

export async function pinGameConfig(config: GameConfig): Promise<ConfigPin> {
  return {
    configVersion: config.configVersion,
    configHash: await computeConfigHash(config)
  };
}

export async function configPinMatches(config: GameConfig, pin: ConfigPin): Promise<boolean> {
  const actual = await pinGameConfig(config);
  return actual.configVersion === pin.configVersion && actual.configHash === pin.configHash;
}

export async function assertConfigPin(config: GameConfig, pin: ConfigPin): Promise<void> {
  if (!(await configPinMatches(config, pin))) {
    throw new ConfigPinMismatchError(pin, await pinGameConfig(config));
  }
}
