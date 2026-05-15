import { networkExplorer, unwrap } from "@/providers/network-explorer";
import { DEFAULT_ROUNDS_LIMIT, MAX_ROUNDS_LIMIT } from "./config";
import type { NetworkStats, Round, RoundsListParams, RoundsListResult } from "./types";

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function intOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function projectStats(row: unknown): NetworkStats {
  const r = row as Record<string, unknown>;
  return {
    chainId: String(r["chain_id"] ?? ""),
    latestRound: intOrNull(r["latest_round"]),
    latestRoundStartedBlock: intOrNull(r["latest_round_started_block"]),
    latestRoundStartedAt: (r["latest_round_started_at"] as string | null) ?? null,
    activeOrchestrators: num(r["active_orchestrators"]),
    totalLptStaked: num(r["total_lpt_staked"]),
    gatewaysKnown: num(r["gateways_known"]),
    payoutsUsd24h: num(r["payouts_usd_24h"]),
    rewardsUsd24h: num(r["rewards_usd_24h"]),
    gasBurnedEth24h: num(r["gas_burned_eth_24h"]),
    activeDelegators: num(r["active_delegators"]),
    totalDelegations: num(r["total_delegations"]),
    orchestratorProfileRefreshedAt:
      (r["orchestrator_profile_refreshed_at"] as string | null) ?? null,
    broadcasterProfileRefreshedAt: (r["broadcaster_profile_refreshed_at"] as string | null) ?? null,
  };
}

function projectRound(row: unknown): Round {
  const r = row as Record<string, unknown>;
  return {
    round: num(r["round"]),
    startedBlock: num(r["started_block"]),
    startedAt: String(r["started_at"] ?? ""),
    activeOrchestrators: num(r["active_orchestrators"]),
    totalLptStaked: num(r["total_lpt_staked"]),
    payoutsUsdOnDay: num(r["payouts_usd_on_day"]),
    rewardsUsdOnDay: num(r["rewards_usd_on_day"]),
  };
}

function clampLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULT_ROUNDS_LIMIT;
  return Math.min(Math.max(1, Math.floor(limit)), MAX_ROUNDS_LIMIT);
}

export async function getNetworkStats(): Promise<NetworkStats> {
  const body = (await unwrap(networkExplorer.GET("/network/stats", {}))) as unknown;
  return projectStats(body);
}

export async function listRounds(params: RoundsListParams = {}): Promise<RoundsListResult> {
  const query: Record<string, string | number> = { limit: clampLimit(params.limit) };
  if (params.cursor) query["cursor"] = params.cursor;

  const body = (await unwrap(networkExplorer.GET("/rounds", { params: { query } }))) as {
    data?: unknown[];
    meta?: { next_cursor?: string | null };
  };

  return {
    data: (body.data ?? []).map(projectRound),
    meta: { nextCursor: body.meta?.next_cursor ?? null },
  };
}
