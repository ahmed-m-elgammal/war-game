/**
 * Account and Battle Pass Schema
 *
 * Implements user identity profiles, entitlements, cosmetics, and rolling pass
 * progression. All tables belong to the `game` schema.
 */

import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import {
  accountStatusEnum,
  cosmeticSlotEnum,
  entitlementKindEnum,
  entitlementSourceEnum,
  entitlementStatusEnum,
  gameSchema,
  passPeriodStatusEnum,
  passRewardStateEnum
} from "./enums.js";

export const accounts = gameSchema.table(
  "accounts",
  {
    accountId: uuid("account_id").primaryKey(),
    displayName: text("display_name").notNull(),
    displayNameKey: text("display_name_key").notNull(),
    status: accountStatusEnum("status").notNull().default("active"),
    isGuest: boolean("is_guest").notNull().default(true),
    mergedInto: uuid("merged_into").references((): AnyPgColumn => accounts.accountId),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "string" }),
    bannedUntil: timestamp("banned_until", { withTimezone: true, mode: "string" }),
    banReason: text("ban_reason"),
    version: bigint("version", { mode: "number" }).notNull().default(0)
  },
  (t) => [
    check("accounts_display_name_len", sql`char_length(${t.displayName}) between 1 and 32`),
    check(
      "accounts_merged_self",
      sql`${t.mergedInto} is null or ${t.mergedInto} <> ${t.accountId}`
    ),
    check(
      "accounts_merged_status",
      sql`(${t.status} = 'merged' and ${t.mergedInto} is not null) or (${t.status} <> 'merged' and ${t.mergedInto} is null)`
    ),
    check("accounts_ban_reason", sql`${t.status} <> 'banned' or ${t.bannedUntil} is not null`),
    check("accounts_version_nonneg", sql`${t.version} >= 0`),
    index("accounts_display_name_key_idx").on(t.displayNameKey),
    index("accounts_last_seen_idx").on(t.lastSeenAt)
  ]
);

export const accountEntitlements = gameSchema.table(
  "account_entitlements",
  {
    entitlementId: uuid("entitlement_id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.accountId),
    kind: entitlementKindEnum("kind").notNull(),
    catalogId: text("catalog_id").notNull(),
    source: entitlementSourceEnum("source").notNull(),
    sourceEventId: text("source_event_id"),
    grantedAt: timestamp("granted_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    status: entitlementStatusEnum("status").notNull().default("active"),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
    revocationReason: text("revocation_reason"),
    metadata: jsonb("metadata").notNull().default({})
  },
  (t) => [
    check("entitlement_time_order", sql`${t.expiresAt} is null or ${t.expiresAt} > ${t.grantedAt}`),
    check("entitlement_pass_expiry", sql`${t.kind} <> 'pass' or ${t.expiresAt} is not null`),
    check(
      "entitlement_revenuecat_event",
      sql`${t.source} <> 'revenuecat' or ${t.sourceEventId} is not null`
    ),
    check(
      "entitlement_revoked_time",
      sql`(${t.status} = 'revoked' and ${t.revokedAt} is not null) or (${t.status} <> 'revoked' and ${t.revokedAt} is null)`
    ),
    uniqueIndex("account_entitlements_source_event_idx")
      .on(t.accountId, t.sourceEventId, t.catalogId)
      .where(sql`${t.sourceEventId} is not null`),
    unique("account_entitlement_owner_unique").on(t.accountId, t.entitlementId),
    uniqueIndex("account_entitlements_one_active_cosmetic_idx")
      .on(t.accountId, t.catalogId)
      .where(sql`${t.kind} = 'cosmetic' and ${t.status} = 'active'`),
    index("account_entitlements_account_status_idx").on(t.accountId, t.status, t.kind),
    index("account_entitlements_expiry_idx")
      .on(t.expiresAt)
      .where(sql`${t.status} = 'active' and ${t.expiresAt} is not null`)
  ]
);

export const accountCosmetics = gameSchema.table(
  "account_cosmetics",
  {
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.accountId),
    slot: cosmeticSlotEnum("slot").notNull(),
    catalogId: text("catalog_id").notNull(),
    equippedAt: timestamp("equipped_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [primaryKey({ columns: [t.accountId, t.slot] })]
);

export const passPeriods = gameSchema.table(
  "pass_periods",
  {
    passPeriodId: uuid("pass_period_id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.accountId),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "string" }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "string" }).notNull(),
    sourceEntitlementId: uuid("source_entitlement_id").notNull(),
    status: passPeriodStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    foreignKey({
      name: "pass_period_entitlement_owner_fk",
      columns: [t.accountId, t.sourceEntitlementId],
      foreignColumns: [accountEntitlements.accountId, accountEntitlements.entitlementId]
    }),
    check("pass_period_time_order", sql`${t.endsAt} > ${t.startsAt}`),
    unique("pass_period_source_unique").on(t.sourceEntitlementId)
  ]
);

export const passProgress = gameSchema.table(
  "pass_progress",
  {
    passPeriodId: uuid("pass_period_id")
      .primaryKey()
      .references(() => passPeriods.passPeriodId),
    xp: bigint("xp", { mode: "number" }).notNull().default(0),
    level: integer("level").notNull().default(0),
    premiumUnlocked: boolean("premium_unlocked").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    check("pass_progress_xp_nonneg", sql`${t.xp} >= 0`),
    check("pass_progress_level_nonneg", sql`${t.level} >= 0`)
  ]
);

export const passRewardClaims = gameSchema.table(
  "pass_reward_claims",
  {
    passPeriodId: uuid("pass_period_id")
      .notNull()
      .references(() => passPeriods.passPeriodId),
    rewardId: text("reward_id").notNull(),
    state: passRewardStateEnum("state").notNull().default("locked"),
    claimedAt: timestamp("claimed_at", { withTimezone: true, mode: "string" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.passPeriodId, t.rewardId] }),
    check(
      "pass_reward_claimed_time",
      sql`(${t.state} in ('claimed', 'auto_claimed') and ${t.claimedAt} is not null) or (${t.state} in ('locked', 'claimable') and ${t.claimedAt} is null)`
    )
  ]
);
