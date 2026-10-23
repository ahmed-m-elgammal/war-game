/**
 * Protocol Version Contract
 *
 * Defines the immutable protocol version exchanged across REST and WebSocket boundaries.
 * Both client and server must agree on the protocol version or fail during handshake.
 */

import { z } from "zod";

export const PROTOCOL_VERSION = "1.0.0" as const;
export type ProtocolVersion = typeof PROTOCOL_VERSION;

export const protocolVersionSchema = z.literal(PROTOCOL_VERSION);
