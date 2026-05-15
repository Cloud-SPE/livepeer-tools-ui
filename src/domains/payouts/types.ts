export type PeriodKind = "daily" | "weekly" | "monthly";
export type JobType = "both" | "ai" | "transcoding";
export type SortKey = "commission_usd" | "face_value_usd" | "ticket_count";

/** Inclusive-from / exclusive-to half-open range, both ISO YYYY-MM-DD. */
export interface DateRange {
  from: string;
  to: string;
}

/**
 * Aggregate summary for a date range. Backed by /payouts/summary/{period}/{date}.
 * Numbers come over the wire as decimal strings; we parse on the boundary.
 */
export interface PayoutSummary {
  periodStart: string;
  periodEnd: string;
  jobType: JobType;
  ticketCount: number;
  totalEth: number;
  totalUsd: number;
  commissionEth: number;
  commissionUsd: number;
  delegatorsShareEth: number;
  delegatorsShareUsd: number;
  distinctGateways: number;
}

/** One orchestrator's payout slice. Backed by /payouts/leaderboard. */
export interface PayoutLeaderboardRow {
  orchestratorAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  ticketCount: number;
  faceValueEth: number;
  faceValueUsd: number;
  commissionEth: number;
  commissionUsd: number;
  delegatorsShareEth: number;
  delegatorsShareUsd: number;
  distinctGateways: number;
}

export interface PayoutLeaderboardMeta {
  from: string;
  to: string;
  jobType: JobType;
  sort: SortKey;
  nextCursor: string | null;
}

export interface PayoutLeaderboardResult {
  data: PayoutLeaderboardRow[];
  meta: PayoutLeaderboardMeta;
}

export interface LeaderboardParams {
  from: string;
  to: string;
  jobType?: JobType;
  sort?: SortKey;
  limit?: number;
  cursor?: string;
}
