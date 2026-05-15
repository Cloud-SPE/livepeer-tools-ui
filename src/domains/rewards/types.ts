export type PeriodKind = "daily" | "weekly" | "monthly";
export type SortKey = "orch_tokens_usd" | "total_tokens_usd" | "reward_event_count";

export interface DateRange {
  from: string;
  to: string;
}

/** Aggregate summary for a date range. Backed by /rewards/summary/{period}/{date}. */
export interface RewardSummary {
  periodStart: string;
  periodEnd: string;
  rewardEventCount: number;
  totalLpt: number;
  totalUsd: number;
  orchLpt: number;
  orchUsd: number;
  delegatorsLpt: number;
  delegatorsUsd: number;
}

/** One orchestrator's reward slice. Backed by /rewards/leaderboard. */
export interface RewardLeaderboardRow {
  orchestratorAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  rewardEventCount: number;
  totalLpt: number;
  totalUsd: number;
  orchLpt: number;
  orchUsd: number;
  delegatorsLpt: number;
  delegatorsUsd: number;
}

export interface RewardLeaderboardMeta {
  from: string;
  to: string;
  sort: SortKey;
  nextCursor: string | null;
}

export interface RewardLeaderboardResult {
  data: RewardLeaderboardRow[];
  meta: RewardLeaderboardMeta;
}

export interface LeaderboardParams {
  from: string;
  to: string;
  sort?: SortKey;
  limit?: number;
  cursor?: string;
}
