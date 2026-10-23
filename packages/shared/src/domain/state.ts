/**
 * Domain World State and Client StateView Interfaces
 *
 * Defines complete serializable world simulation snapshots and asymmetric
 * client projections (Public vs Private) to enforce StateView fog-of-war.
 */

import type {
  WorldId,
  FactionId,
  ProvinceId,
  ArmyId,
  AllianceId,
  TradeOfferId,
  BattleId,
  BuildOrderId,
  TrainingOrderId
} from "../protocol/ids.js";
import type {
  FactionKind,
  FactionState,
  ControllerType,
  ResourceType,
  AllianceState,
  TradeKind,
  TradeableResource,
  TradeOfferState,
  BattleResult,
  DoctrineWeapon,
  DoctrineSkill
} from "../protocol/enums.js";
import type {
  WorldClock,
  RngState,
  WorldIdCounters,
  UnitCounts,
  Timestamp,
  ProvinceLevel,
  TroopBand,
  ResourceStockpile,
  JsonObject
} from "./primitives.js";
import type { Faction, Rebellion, SupportDaily } from "./faction.js";
import type { WorldRegion, Army, BattleMultipliers } from "./map-military.js";
import type {
  Alliance,
  AllianceMembership,
  AllianceInvitation,
  TradeOffer,
  TradeDaily
} from "./alliance-trade.js";
import type { BuildOrder, TrainingOrder, AbilityCooldown, ExAllyCooldown } from "./queues.js";
import type { MissionProgress } from "./account.js";

export interface WorldState {
  schemaVersion: number;
  worldId: WorldId;
  configVersion: string;
  configHash: string;
  mapId: string;
  mapHash: string;
  clock: WorldClock;
  rng: RngState;
  version: number;
  lastEventSeq: number;
  nextIds: WorldIdCounters;
  factions: Record<string, Faction>;
  regions: Record<string, WorldRegion>;
  armies: Record<string, Army>;
  neutralGarrisons: Record<string, UnitCounts>;
  alliances: Record<string, Alliance>;
  allianceMembers: Record<string, AllianceMembership>;
  allianceInvitations: Record<string, AllianceInvitation>;
  tradeOffers: Record<string, TradeOffer>;
  tradeDaily: Record<string, TradeDaily>;
  rebellions: Record<string, Rebellion>;
  buildOrders: Record<string, BuildOrder>;
  trainingOrders: Record<string, TrainingOrder>;
  abilityCooldowns: Record<string, AbilityCooldown>;
  exAllyCooldowns: Record<string, ExAllyCooldown>;
  supportDaily: Record<string, SupportDaily>;
}

export interface PublicFaction {
  factionId: FactionId;
  name: string;
  emblemId: string;
  colorId: string;
  kind: FactionKind;
  state: FactionState;
  allianceId: AllianceId | null;
  provinceCount: number;
  publicScore: number;
  support: number;
  protectionUntil: Timestamp | null;
  isAiControlled: boolean;
}

export interface PublicRegion {
  provinceId: ProvinceId;
  ownerFactionId: FactionId | null;
  controllerType: ControllerType;
  level: ProvinceLevel;
  terrainResource: ResourceType;
  isCapital: boolean;
  isProtected: boolean;
  troopBand: TroopBand;
}

export interface PublicArmy {
  armyId: ArmyId;
  ownerFactionId: FactionId | null;
  originProvinceId: ProvinceId | null;
  targetProvinceId: ProvinceId | null;
  departAt: Timestamp | null;
  arriveAt: Timestamp | null;
  troopBand: TroopBand;
}

export interface PublicAlliance {
  allianceId: AllianceId;
  name: string;
  leaderFactionId: FactionId | null;
  memberFactionIds: FactionId[];
  state: AllianceState;
}

export interface PublicTradeOffer {
  offerId: TradeOfferId;
  kind: Exclude<TradeKind, "state_exchange">;
  sellerFactionId: FactionId;
  buyerFactionId: FactionId | null;
  resource: TradeableResource;
  amount: number;
  priceGold: number;
  state: TradeOfferState;
  expiresAt: Timestamp;
  frozen: boolean;
}

export interface PublicBattleSummary {
  battleId: BattleId;
  provinceId: ProvinceId;
  attackerControllerType: Exclude<ControllerType, "none">;
  attackerFactionId: FactionId | null;
  defenderControllerType: ControllerType;
  defenderFactionId: FactionId | null;
  result: BattleResult;
  resolvedAt: Timestamp;
  summary: JsonObject;
}

export interface PublicWorldState {
  clock: WorldClock;
  version: number;
  factions: Record<string, PublicFaction>;
  regions: Record<string, PublicRegion>;
  armies: Record<string, PublicArmy>;
  alliances: Record<string, PublicAlliance>;
  tradeOffers: Record<string, PublicTradeOffer>;
  battleSummaries: Record<string, PublicBattleSummary>;
}

export interface ExactProvince {
  provinceId: ProvinceId;
  units: UnitCounts;
}

export interface ExactArmy {
  armyId: ArmyId;
  units: UnitCounts;
}

export interface ProvincePrivate {
  provinceId: ProvinceId;
  buildOrderId: BuildOrderId | null;
  trainingOrderIds: TrainingOrderId[];
}

export interface PrivateOwnFaction {
  factionId: FactionId;
  resources: ResourceStockpile;
  research: string[];
  doctrineWeapon: DoctrineWeapon | null;
  doctrineSkill: DoctrineSkill | null;
  buildOrders: BuildOrder[];
  trainingOrders: TrainingOrder[];
  missions: MissionProgress[];
  abilityCooldowns: AbilityCooldown[];
  rebellion: Rebellion | null;
}

export interface BattleReportPrivate {
  battleId: BattleId;
  attackerPower: number;
  defenderPower: number;
  attackerLosses: UnitCounts;
  defenderLosses: UnitCounts;
  attackerMultipliers: BattleMultipliers;
  defenderMultipliers: BattleMultipliers;
}

export interface StateView {
  public: PublicWorldState;
  exactProvinces: Record<string, ExactProvince>;
  exactArmies: Record<string, ExactArmy>;
  ownFaction: PrivateOwnFaction | null;
  ownProvinceDetails: Record<string, ProvincePrivate>;
  battleReports: Record<string, BattleReportPrivate>;
}
