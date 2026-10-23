/**
 * Approved Config Document Envelope
 *
 * A config document ties a strict `GameConfig` payload to the decision register.
 * Validation fails when the document is not `approved`, when it references an
 * unknown decision, or when any referenced decision is not approved. Missing or
 * malformed config values fail the underlying `gameConfigSchema`.
 *
 * The envelope is the only accepted input for seed config files; gameplay code
 * consumes the validated `GameConfig`, never the raw document.
 */

import { z } from "zod";
import type { GameConfig } from "../../domain/config.js";
import { gameConfigSchema } from "./schema.js";

export const CONFIG_DOCUMENT_STATUSES = ["approved", "proposed", "tbd"] as const;
export type ConfigDocumentStatus = (typeof CONFIG_DOCUMENT_STATUSES)[number];

export const configDocumentSchema = z
  .object({
    status: z.enum(CONFIG_DOCUMENT_STATUSES),
    decisions: z.array(z.string().min(1)).min(1),
    config: gameConfigSchema
  })
  .strict();

export interface DecisionRecord {
  readonly id: string;
  readonly status: string;
}

export type ConfigIssueCode =
  | "CONFIG_SCHEMA_INVALID"
  | "CONFIG_STATUS_NOT_APPROVED"
  | "CONFIG_DECISION_UNKNOWN"
  | "CONFIG_DECISION_NOT_APPROVED";

export interface ConfigIssue {
  readonly path: string;
  readonly code: ConfigIssueCode;
  readonly message: string;
}

export type ConfigDocumentValidation =
  | { readonly ok: true; readonly config: GameConfig }
  | { readonly ok: false; readonly issues: readonly ConfigIssue[] };

const APPROVED_DECISION_STATUS = "approved";

function formatPath(path: readonly PropertyKey[]): string {
  if (path.length === 0) {
    return "$";
  }
  return path.map((segment) => String(segment)).join(".");
}

/**
 * Validates a raw config document against the schema and the decision register.
 * Decision statuses other than `approved` are rejected, including `open`,
 * `proposed`, `tbd`, `deferred`, and `rejected`.
 */
export function validateConfigDocument(
  input: unknown,
  decisions: readonly DecisionRecord[]
): ConfigDocumentValidation {
  const parsed = configDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        path: formatPath(issue.path),
        code: "CONFIG_SCHEMA_INVALID",
        message: issue.message
      }))
    };
  }

  const issues: ConfigIssue[] = [];
  if (parsed.data.status !== APPROVED_DECISION_STATUS) {
    issues.push({
      path: "status",
      code: "CONFIG_STATUS_NOT_APPROVED",
      message: `Config document status is "${parsed.data.status}"; only "approved" documents may ship.`
    });
  }

  const statusById = new Map(decisions.map((decision) => [decision.id, decision.status]));
  for (const decisionId of parsed.data.decisions) {
    const status = statusById.get(decisionId);
    if (status === undefined) {
      issues.push({
        path: "decisions",
        code: "CONFIG_DECISION_UNKNOWN",
        message: `Decision "${decisionId}" is not present in the decision register.`
      });
      continue;
    }
    if (status !== APPROVED_DECISION_STATUS) {
      issues.push({
        path: "decisions",
        code: "CONFIG_DECISION_NOT_APPROVED",
        message: `Decision "${decisionId}" has status "${status}"; config may only cite approved decisions.`
      });
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, config: parsed.data.config };
}

export function formatConfigIssues(issues: readonly ConfigIssue[]): string {
  return issues.map((issue) => `[${issue.code}] ${issue.path}: ${issue.message}`).join("\n");
}
