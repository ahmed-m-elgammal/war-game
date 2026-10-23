/**
 * Approved Config Document Tests
 *
 * Proves that only `approved` documents citing approved decisions pass, and
 * that missing values fail through the underlying strict config schema.
 */

import { describe, expect, it } from "vitest";
import { createTestConfigDocument, createTestGameConfig } from "./fixtures.js";
import type { DecisionRecord } from "./document.js";
import { formatConfigIssues, validateConfigDocument } from "./document.js";

const DECISIONS: readonly DecisionRecord[] = [
  { id: "D-PD", status: "approved" },
  { id: "D-CONFIG-PIN", status: "approved" },
  { id: "D-TBD-ECON", status: "open" }
];

describe("validateConfigDocument", () => {
  it("accepts an approved document citing approved decisions", () => {
    const result = validateConfigDocument(createTestConfigDocument(), DECISIONS);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config).toEqual(createTestGameConfig());
    }
  });

  it("rejects a document marked proposed", () => {
    const result = validateConfigDocument(
      { ...createTestConfigDocument(), status: "proposed" },
      DECISIONS
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.code)).toContain("CONFIG_STATUS_NOT_APPROVED");
    }
  });

  it("rejects a document marked tbd", () => {
    const result = validateConfigDocument(
      { ...createTestConfigDocument(), status: "tbd" },
      DECISIONS
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a document that cites a decision still open", () => {
    const result = validateConfigDocument(
      { ...createTestConfigDocument(), decisions: ["D-TBD-ECON"] },
      DECISIONS
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.code)).toContain("CONFIG_DECISION_NOT_APPROVED");
    }
  });

  it("rejects a document that cites an unknown decision", () => {
    const result = validateConfigDocument(
      { ...createTestConfigDocument(), decisions: ["D-NOT-REAL"] },
      DECISIONS
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.code)).toContain("CONFIG_DECISION_UNKNOWN");
    }
  });

  it("fails when a required value is missing", () => {
    const document = createTestConfigDocument();
    const config = createTestGameConfig();
    document.config = {
      ...config,
      weapons: [{ ...config.weapons[0], counters: undefined }]
    };

    const result = validateConfigDocument(document, DECISIONS);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.code)).toContain("CONFIG_SCHEMA_INVALID");
      expect(formatConfigIssues(result.issues)).toContain("config.weapons.0.counters");
    }
  });

  it("fails when the decision list is empty", () => {
    const result = validateConfigDocument(
      { ...createTestConfigDocument(), decisions: [] },
      DECISIONS
    );
    expect(result.ok).toBe(false);
  });
});
