export interface NetworkStats {
  chainId: string;
  latestRound: number | null;
  latestRoundStartedBlock: number | null;
  latestRoundStartedAt: string | null;
  activeOrchestrators: number;
  totalLptStaked: number;
  gatewaysKnown: number;
  payoutsUsd24h: number;
  rewardsUsd24h: number;
  gasBurnedEth24h: number;
  activeDelegators: number;
  totalDelegations: number;
  orchestratorProfileRefreshedAt: string | null;
  broadcasterProfileRefreshedAt: string | null;
}

export interface Round {
  round: number;
  startedBlock: number;
  startedAt: string;
  activeOrchestrators: number;
  totalLptStaked: number;
  payoutsUsdOnDay: number;
  rewardsUsdOnDay: number;
}

export interface RoundsListMeta {
  nextCursor: string | null;
}

export interface RoundsListResult {
  data: Round[];
  meta: RoundsListMeta;
}

export interface RoundsListParams {
  limit?: number;
  cursor?: string;
}
