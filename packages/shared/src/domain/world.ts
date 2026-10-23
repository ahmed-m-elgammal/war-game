/**
 * Domain World, Persistence, and Command Envelopes
 *
 * Defines authoritative world instances, leases, snapshots, and event/receipt records.
 * Incorporates pinned cryptographic hashes (configHash, mapHash) per decision D-CONFIG-PIN.
 */

import type { AccountId, WorldId, FactionId, CommandId } from "../protocol/ids.js";
import type {
  WorldStatus,
  OperationalState,
  WorldEventType,
  EventActorType,
  CommandType
} from "../protocol/enums.js";
import type { Timestamp, JsonObject } from "./primitives.js";
import type { WorldState } from "./state.js";

export interface World {
  worldId: WorldId;
  name: string;
  mapId: string;
  mapHash: string;
  configVersion: string;
  configHash: string;
  status: WorldStatus;
  operationalState: OperationalState | null;
  startedAt: Timestamp | null;
  joinDeadline: Timestamp | null;
  seasonEnd: Timestamp | null;
  maxHumans: number;
  aiCount: number;
  provinceCount: number;
  version: number;
  lastTick: number;
  lastEventSeq: number;
  finalSnapshotSeq: number | null;
  createdAt: Timestamp;
  finishedAt: Timestamp | null;
}

export interface WorldLease {
  worldId: WorldId;
  ownerId: string;
  leaseVersion: number;
  leaseExpiresAt: Timestamp;
  heartbeatAt: Timestamp;
  acquiredAt: Timestamp;
}

export interface WorldSnapshotMeta {
  worldId: WorldId;
  seq: number;
  tick: number;
  effectiveAt: Timestamp;
  stateHash: string;
  lastEventSeq: number;
  configVersion: string;
  configHash: string;
  mapId: string;
  mapHash: string;
  leaseVersion: number;
  createdAt: Timestamp;
}

export interface WorldSnapshot {
  meta: WorldSnapshotMeta;
  state: WorldState;
}

export interface WorldEvent {
  worldId: WorldId;
  seq: number;
  type: WorldEventType;
  commandType: CommandType | null;
  actorType: EventActorType;
  actorAccountId: AccountId | null;
  actorFactionId: FactionId | null;
  commandId: CommandId | null;
  effectiveAt: Timestamp;
  priority: number;
  payload: JsonObject;
  leaseVersion: number;
  createdAt: Timestamp;
}

export interface CommandReceipt {
  accountId: AccountId;
  commandId: CommandId;
  worldId: WorldId;
  factionId: FactionId | null;
  commandType: CommandType;
  resultCode: string;
  resultPayload: JsonObject;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface CommandEnvelope<T extends JsonObject = JsonObject> {
  commandId: CommandId;
  type: CommandType;
  worldVersion: number;
  payload: T;
}
