/**
 * Admin Audit and Moderation Schema
 *
 * Implements immutable administrative audit logs and user-submitted name reports.
 */

import { sql } from "drizzle-orm";
import { bigint, check, index, jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { accounts } from "./accounts.js";
import { gameSchema, reportStateEnum, reportTargetTypeEnum } from "./enums.js";

export const adminAudit = gameSchema.table(
  "admin_audit",
  {
    auditId: bigint("audit_id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    actorAccountId: uuid("actor_account_id")
      .notNull()
      .references(() => accounts.accountId),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [index("admin_audit_created_idx").on(t.createdAt)]
);

export const nameReports = gameSchema.table(
  "name_reports",
  {
    reportId: bigint("report_id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    reporterAccountId: uuid("reporter_account_id")
      .notNull()
      .references(() => accounts.accountId),
    targetType: reportTargetTypeEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    state: reportStateEnum("state").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    reviewedBy: uuid("reviewed_by").references(() => accounts.accountId),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),
    resolution: text("resolution")
  },
  (t) => [
    check(
      "report_review_shape",
      sql`(${t.state} = 'open' and ${t.reviewedBy} is null and ${t.reviewedAt} is null) or (${t.state} <> 'open' and ${t.reviewedBy} is not null and ${t.reviewedAt} is not null)`
    ),
    index("name_reports_state_idx").on(t.state, t.createdAt)
  ]
);
