/**
 * Orchestrator domain types.
 *
 * Provider responses (network-explorer's OrchestratorProfileRow) ship in
 * string-encoded form for big amounts and percentages. The domain type
 * carries the values the UI actually consumes — addresses lowercased, LPT
 * amounts and percentages as numbers — so the UI never reasons about the
 * wire format.
 */

export interface Orchestrator {
  address: string;
  displayName: string | null;
  avatarUrl: string | null;
  serviceUri: string | null;
  isActive: boolean;
  totalStakeLpt: number;
  rewardCutPct: number;
  feeCutPct: number;
  feeSharePct: number;
  asOfBlock: number;
  asOfRound: number | null;
  lastLifecycleEventAt: string | null;
}

export interface OrchestratorListParams {
  limit?: number;
  cursor?: string;
}

export interface OrchestratorListMeta {
  nextCursor: string | null;
  total: number | null;
}

export interface OrchestratorListResult {
  data: Orchestrator[];
  meta: OrchestratorListMeta;
}

export interface OrchestratorDelegator {
  delegatorAddress: string;
  bondedPrincipalLpt: number;
  pendingStakeLpt: number | null;
  pendingFeesEth: number | null;
  asOfBlock: number;
  asOfTimestamp: string;
}

export interface OrchestratorDelegatorsResult {
  data: OrchestratorDelegator[];
  nextCursor: string | null;
}

export interface OrchestratorTicket {
  eventId: string;
  txHash: string;
  blockTimestamp: string;
  gatewayAddress: string;
  faceValueEth: number;
  faceValueUsd: number;
}

export interface OrchestratorTicketsResult {
  start: string;
  end: string;
  data: OrchestratorTicket[];
  nextCursor: string | null;
}

export type VoteSupport = "For" | "Against" | "Abstain";

export interface OrchestratorVote {
  proposalId: string;
  support: VoteSupport;
  stakeLpt: number;
  reason: string | null;
  blockTimestamp: string | null;
  txHash: string;
}

export interface OrchestratorVotesResult {
  data: OrchestratorVote[];
  nextCursor: string | null;
}

export interface DelegatorDelegation {
  delegateAddress: string;
  bondedPrincipalLpt: number;
  pendingStakeLpt: number | null;
  pendingFeesEth: number | null;
  asOfBlock: number;
  asOfTimestamp: string;
}

export interface DelegatorDetail {
  address: string;
  isActive: boolean;
  firstBondBlock: number;
  lastSeenBlock: number;
  delegations: DelegatorDelegation[];
}

export type PerformanceMode = "transcoding" | "ai";

export interface PerformancePipeline {
  id: string;
  models: string[];
}

export interface OrchestratorPerformanceRow {
  id: string;
  region: string;
  timestamp: number;
  successRate: number;
  roundTripTime: number;
  segDuration: number;
  segmentsSent: number;
  segmentsReceived: number | null;
  uploadTime: number;
  downloadTime: number | null;
  transcodeTime: number | null;
  pipeline: string | null;
  model: string | null;
  modelIsWarm: boolean | null;
  realtime: boolean;
}
