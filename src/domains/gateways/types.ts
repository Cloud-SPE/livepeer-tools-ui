/**
 * Gateways domain types.
 *
 * Provider rows (`GatewayProfileRow`, `GatewayFlowRow`) are projected into
 * these shapes by `repo.ts` so the UI works with plain numbers and
 * already-lowercased addresses.
 */

export type GatewayKind = "ai" | "transcoding" | "unknown";

export interface Gateway {
  address: string;
  displayName: string | null;
  avatarUrl: string | null;
  kind: GatewayKind;
  depositEth: number;
  reserveEth: number;
  reserveClaimedThisRoundEth: number;
  withdrawRound: number | null;
  unlockInProgress: boolean;
  asOfBlock: number;
}

export interface GatewayPayoutRow {
  eventId: string;
  eventName: string;
  flowKind: string;
  blockNumber: number;
  blockTimestamp: string | null;
  txHash: string;
  asset: string;
  amountEth: number;
  amountUsd: number;
  fromAddress: string;
  toAddress: string;
  /** Hydrated from /orchestrators when available. */
  toIdentity: RecipientIdentity | null;
}

export interface RecipientIdentity {
  address: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export type IdentityIndex = ReadonlyMap<string, RecipientIdentity>;

export type PayoutSemantics = "net" | "gross" | null;

export interface GatewayListMeta {
  nextCursor: string | null;
}

export interface GatewayListResult {
  data: Gateway[];
  meta: GatewayListMeta;
}

export interface GatewayPayoutsResult {
  gatewayAddress: string;
  semantics: PayoutSemantics;
  data: GatewayPayoutRow[];
}

export interface GatewayListParams {
  limit?: number;
  cursor?: string;
}

export interface GatewayPayoutsParams {
  address: string;
  limit?: number;
  cursor?: string;
}
