/**
 * Alliances and Trade Schema
 *
 * Implements diplomatic alliances, membership lifecycle, invitations,
 * marketplace trade listings, direct offers, and daily trading caps.
 */

import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import {
  allianceRoleEnum,
  allianceStateEnum,
  gameSchema,
  invitationStateEnum,
  leaveReasonEnum,
  tradeableResourceEnum,
  tradeKindEnum,
  tradeLogStateEnum,
  tradeOfferStateEnum
} from "./enums.js";
import { factions } from "./factions.js";
import { worlds } from "./worlds.js";

export const alliances = gameSchema.table(
  "alliances",
  {
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.worldId),
    allianceId: bigint("alliance_id", { mode: "number" }).notNull(),
    name: text("name").notNull(),
    nameKey: text("name_key").notNull(),
    leaderFactionId: bigint("leader_faction_id", { mode: "number" }),
    state: allianceStateEnum("state").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    dissolvedAt: timestamp("dissolved_at", { withTimezone: true, mode: "string" })
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.allianceId] }),
    foreignKey({
      columns: [t.worldId, t.leaderFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("alliance_id_pos", sql`${t.allianceId} > 0`),
    check("alliance_name_len", sql`char_length(${t.name}) between 1 and 32`),
    check(
      "alliance_dissolved_time",
      sql`(${t.state} = 'dissolved' and ${t.dissolvedAt} is not null) or (${t.state} = 'active' and ${t.dissolvedAt} is null)`
    ),
    uniqueIndex("alliances_active_name_idx")
      .on(t.worldId, t.nameKey)
      .where(sql`${t.state} = 'active'`)
  ]
);

export const allianceMembers = gameSchema.table(
  "alliance_members",
  {
    worldId: uuid("world_id").notNull(),
    membershipId: bigint("membership_id", { mode: "number" }).notNull(),
    allianceId: bigint("alliance_id", { mode: "number" }).notNull(),
    factionId: bigint("faction_id", { mode: "number" }).notNull(),
    role: allianceRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true, mode: "string" }),
    leaveReason: leaveReasonEnum("leave_reason")
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.membershipId] }),
    foreignKey({
      columns: [t.worldId, t.allianceId],
      foreignColumns: [alliances.worldId, alliances.allianceId]
    }),
    foreignKey({
      columns: [t.worldId, t.factionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("membership_id_pos", sql`${t.membershipId} > 0`),
    check(
      "alliance_member_leave_shape",
      sql`(${t.leftAt} is null and ${t.leaveReason} is null) or (${t.leftAt} is not null and ${t.leaveReason} is not null)`
    ),
    uniqueIndex("alliance_members_one_active_idx")
      .on(t.worldId, t.factionId)
      .where(sql`${t.leftAt} is null`),
    uniqueIndex("alliance_members_one_leader_idx")
      .on(t.worldId, t.allianceId)
      .where(sql`${t.role} = 'leader' and ${t.leftAt} is null`),
    index("alliance_members_alliance_idx")
      .on(t.worldId, t.allianceId)
      .where(sql`${t.leftAt} is null`)
  ]
);

export const allianceInvitations = gameSchema.table(
  "alliance_invitations",
  {
    worldId: uuid("world_id").notNull(),
    invitationId: bigint("invitation_id", { mode: "number" }).notNull(),
    allianceId: bigint("alliance_id", { mode: "number" }).notNull(),
    inviterFactionId: bigint("inviter_faction_id", { mode: "number" }).notNull(),
    inviteeFactionId: bigint("invitee_faction_id", { mode: "number" }).notNull(),
    state: invitationStateEnum("state").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true, mode: "string" })
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.invitationId] }),
    foreignKey({
      columns: [t.worldId, t.allianceId],
      foreignColumns: [alliances.worldId, alliances.allianceId]
    }),
    foreignKey({
      columns: [t.worldId, t.inviterFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.inviteeFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("invitation_id_pos", sql`${t.invitationId} > 0`),
    check("invitation_time_order", sql`${t.expiresAt} > ${t.createdAt}`),
    check(
      "invitation_response_time",
      sql`(${t.state} = 'pending' and ${t.respondedAt} is null) or (${t.state} <> 'pending' and ${t.respondedAt} is not null)`
    ),
    check("invitation_not_self", sql`${t.inviterFactionId} <> ${t.inviteeFactionId}`),
    uniqueIndex("alliance_invitations_one_pending_idx")
      .on(t.worldId, t.inviteeFactionId)
      .where(sql`${t.state} = 'pending'`)
  ]
);

export const tradeOffers = gameSchema.table(
  "trade_offers",
  {
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.worldId),
    offerId: bigint("offer_id", { mode: "number" }).notNull(),
    kind: tradeKindEnum("kind").notNull(),
    sellerFactionId: bigint("seller_faction_id", { mode: "number" }).notNull(),
    buyerFactionId: bigint("buyer_faction_id", { mode: "number" }),
    resource: tradeableResourceEnum("resource").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    priceGold: bigint("price_gold", { mode: "number" }).notNull(),
    state: tradeOfferStateEnum("state").notNull(),
    escrowAmount: bigint("escrow_amount", { mode: "number" }).notNull().default(0),
    taxGold: bigint("tax_gold", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
    frozenAt: timestamp("frozen_at", { withTimezone: true, mode: "string" }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "string" })
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.offerId] }),
    foreignKey({
      columns: [t.worldId, t.sellerFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.buyerFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("trade_offers_id_pos", sql`${t.offerId} > 0`),
    check("trade_offer_kind_valid", sql`${t.kind} in ('market_listing', 'direct_offer')`),
    check("trade_offer_amount_pos", sql`${t.amount} > 0`),
    check("trade_offer_price_gold_pos", sql`${t.priceGold} > 0`),
    check("trade_offer_escrow_amount_nonneg", sql`${t.escrowAmount} >= 0`),
    check("trade_offer_tax_gold_nonneg", sql`${t.taxGold} >= 0`),
    check("trade_offer_time_order", sql`${t.expiresAt} > ${t.createdAt}`),
    check(
      "trade_offer_buyer_shape",
      sql`(${t.kind} = 'market_listing' and ${t.buyerFactionId} is null) or (${t.kind} = 'direct_offer' and ${t.buyerFactionId} is not null)`
    ),
    check(
      "trade_offer_not_self",
      sql`${t.buyerFactionId} is null or ${t.buyerFactionId} <> ${t.sellerFactionId}`
    ),
    check(
      "trade_offer_escrow_shape",
      sql`${t.state} not in ('open', 'pending') or ${t.escrowAmount} = ${t.amount}`
    ),
    check(
      "trade_offer_escrow_zero",
      sql`${t.state} in ('open', 'pending') or ${t.escrowAmount} = 0`
    ),
    index("trade_offers_open_idx").on(t.worldId, t.state, t.resource, t.expiresAt),
    index("trade_offers_seller_idx").on(t.worldId, t.sellerFactionId)
  ]
);

export const tradeLog = gameSchema.table(
  "trade_log",
  {
    worldId: uuid("world_id")
      .notNull()
      .references(() => worlds.worldId),
    tradeId: bigint("trade_id", { mode: "number" }).notNull(),
    offerId: bigint("offer_id", { mode: "number" }),
    kind: tradeKindEnum("kind").notNull(),
    sellerFactionId: bigint("seller_faction_id", { mode: "number" }).notNull(),
    buyerFactionId: bigint("buyer_faction_id", { mode: "number" }),
    resource: tradeableResourceEnum("resource").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    gold: bigint("gold", { mode: "number" }).notNull(),
    taxGold: bigint("tax_gold", { mode: "number" }).notNull().default(0),
    state: tradeLogStateEnum("state").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.tradeId] }),
    foreignKey({
      columns: [t.worldId, t.offerId],
      foreignColumns: [tradeOffers.worldId, tradeOffers.offerId]
    }),
    foreignKey({
      columns: [t.worldId, t.sellerFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    foreignKey({
      columns: [t.worldId, t.buyerFactionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("trade_log_id_pos", sql`${t.tradeId} > 0`),
    check("trade_log_amount_pos", sql`${t.amount} > 0`),
    check("trade_log_gold_nonneg", sql`${t.gold} >= 0`),
    check("trade_log_tax_gold_nonneg", sql`${t.taxGold} >= 0`),
    check(
      "trade_log_offer_shape",
      sql`(${t.kind} = 'state_exchange' and ${t.offerId} is null) or (${t.kind} <> 'state_exchange' and ${t.offerId} is not null)`
    ),
    check(
      "trade_log_buyer_null_only_system",
      sql`${t.buyerFactionId} is not null or ${t.kind} = 'state_exchange'`
    )
  ]
);

export const tradeDaily = gameSchema.table(
  "trade_daily",
  {
    worldId: uuid("world_id").notNull(),
    factionId: bigint("faction_id", { mode: "number" }).notNull(),
    worldDay: smallint("world_day").notNull(),
    tradesCount: integer("trades_count").notNull().default(0),
    goldMoved: bigint("gold_moved", { mode: "number" }).notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.worldId, t.factionId, t.worldDay] }),
    foreignKey({
      columns: [t.worldId, t.factionId],
      foreignColumns: [factions.worldId, factions.factionId]
    }),
    check("trade_daily_world_day_range", sql`${t.worldDay} between 1 and 30`),
    check("trade_daily_trades_count_nonneg", sql`${t.tradesCount} >= 0`),
    check("trade_daily_gold_moved_nonneg", sql`${t.goldMoved} >= 0`)
  ]
);
