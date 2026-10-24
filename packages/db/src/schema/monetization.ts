/**
 * Monetization, Shop, and Missions Schema
 *
 * Implements catalog items, RevenueCat webhook audit log, and pass missions.
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts.js";
import {
  cosmeticSlotEnum,
  gameSchema,
  missionStateEnum,
  revenuecatStatusEnum,
  shopItemKindEnum
} from "./enums.js";

export const missions = gameSchema.table(
  "missions",
  {
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.accountId),
    missionId: text("mission_id").notNull(),
    periodKey: text("period_key").notNull(),
    progress: integer("progress").notNull().default(0),
    target: integer("target").notNull(),
    state: missionStateEnum("state").notNull().default("active"),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
    claimedAt: timestamp("claimed_at", { withTimezone: true, mode: "string" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.accountId, t.missionId, t.periodKey] }),
    check("mission_progress_nonneg", sql`${t.progress} >= 0`),
    check("mission_target_pos", sql`${t.target} > 0`),
    check(
      "mission_completed_time",
      sql`(${t.state} in ('completed', 'claimed') and ${t.completedAt} is not null) or (${t.state} = 'active' and ${t.completedAt} is null) or ${t.state} = 'expired'`
    ),
    check(
      "mission_claimed_time",
      sql`(${t.state} = 'claimed' and ${t.claimedAt} is not null) or (${t.state} <> 'claimed' and ${t.claimedAt} is null)`
    )
  ]
);

export const shopItems = gameSchema.table(
  "shop_items",
  {
    itemId: text("item_id").primaryKey(),
    kind: shopItemKindEnum("kind").notNull(),
    slot: cosmeticSlotEnum("slot"),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    priceUsdCents: integer("price_usd_cents").notNull(),
    storeProductId: text("store_product_id"),
    active: boolean("active").notNull().default(true),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    check("shop_items_price_nonneg", sql`${t.priceUsdCents} >= 0`),
    check(
      "shop_item_slot",
      sql`(${t.kind} = 'cosmetic' and ${t.slot} is not null) or (${t.kind} = 'pass' and ${t.slot} is null)`
    ),
    uniqueIndex("shop_items_store_product_idx")
      .on(t.storeProductId)
      .where(sql`${t.storeProductId} is not null`)
  ]
);

export const revenuecatEvents = gameSchema.table(
  "revenuecat_events",
  {
    eventId: text("event_id").primaryKey(),
    accountId: uuid("account_id").references(() => accounts.accountId),
    appUserId: text("app_user_id").notNull(),
    eventType: text("event_type").notNull(),
    productId: text("product_id"),
    entitlementIds: text("entitlement_ids")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    eventAt: timestamp("event_at", { withTimezone: true, mode: "string" }).notNull(),
    payload: jsonb("payload").notNull(),
    status: revenuecatStatusEnum("status").notNull().default("received"),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "string" }),
    error: text("error")
  },
  (t) => [
    check(
      "revenuecat_processed_time",
      sql`(${t.status} in ('processed', 'ignored') and ${t.processedAt} is not null) or (${t.status} in ('received', 'failed') and ${t.processedAt} is null)`
    ),
    index("revenuecat_events_account_idx").on(t.accountId, t.eventAt)
  ]
);
