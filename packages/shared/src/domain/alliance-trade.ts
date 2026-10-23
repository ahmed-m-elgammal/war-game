/**
 * Domain Alliances and Trade Interfaces
 *
 * Defines diplomatic pacts, invitations, member hierarchies,
 * market listings, escrow handling, and daily trade quotas.
 */

import type {
  AllianceId,
  WorldId,
  FactionId,
  AllianceMembershipId,
  AllianceInvitationId,
  TradeOfferId,
  TradeId
} from "../protocol/ids.js";
import type {
  AllianceState,
  AllianceRole,
  LeaveReason,
  InvitationState,
  TradeKind,
  TradeableResource,
  TradeOfferState,
  TradeLogState
} from "../protocol/enums.js";
import type { Timestamp, UInt } from "./primitives.js";

export interface Alliance {
  allianceId: AllianceId;
  worldId: WorldId;
  name: string;
  nameKey: string;
  leaderFactionId: FactionId | null;
  state: AllianceState;
  createdAt: Timestamp;
  dissolvedAt: Timestamp | null;
}

export interface AllianceMembership {
  membershipId: AllianceMembershipId;
  worldId: WorldId;
  allianceId: AllianceId;
  factionId: FactionId;
  role: AllianceRole;
  joinedAt: Timestamp;
  leftAt: Timestamp | null;
  leaveReason: LeaveReason | null;
}

export interface AllianceInvitation {
  invitationId: AllianceInvitationId;
  worldId: WorldId;
  allianceId: AllianceId;
  inviterFactionId: FactionId;
  inviteeFactionId: FactionId;
  state: InvitationState;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  respondedAt: Timestamp | null;
}

export interface TradeOffer {
  offerId: TradeOfferId;
  worldId: WorldId;
  kind: Exclude<TradeKind, "state_exchange">;
  sellerFactionId: FactionId;
  buyerFactionId: FactionId | null;
  resource: TradeableResource;
  amount: UInt;
  priceGold: UInt;
  state: TradeOfferState;
  escrowAmount: UInt;
  taxGold: UInt;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  frozenAt: Timestamp | null;
  resolvedAt: Timestamp | null;
}

export interface TradeLog {
  tradeId: TradeId;
  worldId: WorldId;
  offerId: TradeOfferId | null;
  kind: TradeKind;
  sellerFactionId: FactionId;
  buyerFactionId: FactionId | null;
  resource: TradeableResource;
  amount: UInt;
  gold: UInt;
  taxGold: UInt;
  state: TradeLogState;
  reason: string | null;
  createdAt: Timestamp;
}

export interface TradeDaily {
  worldId: WorldId;
  factionId: FactionId;
  worldDay: number;
  tradesCount: UInt;
  goldMoved: UInt;
  updatedAt: Timestamp;
}
