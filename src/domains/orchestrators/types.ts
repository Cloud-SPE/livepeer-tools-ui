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
