import { networkExplorer, unwrap } from "@/providers/network-explorer";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./config";
import type {
  LeaderboardParams,
  PeriodKind,
  RewardLeaderboardResult,
  RewardSummary,
  SortKey,
} from "./types";

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function sortOf(v: unknown): SortKey {
  if (v === "total_tokens_usd" || v === "reward_event_count") return v;
  return "orch_tokens_usd";
}

function projectSummary(row: unknown): RewardSummary {
  const r = row as Record<string, unknown>;
  return {
    periodStart: String(r["period_start"] ?? ""),
    periodEnd: String(r["period_end"] ?? ""),
    rewardEventCount: num(r["reward_event_count"]),
    totalLpt: num(r["sum_total_tokens"]),
    totalUsd: num(r["sum_total_tokens_usd"]),
    orchLpt: num(r["sum_orch_tokens"]),
    orchUsd: num(r["sum_orch_tokens_usd"]),
    delegatorsLpt: num(r["sum_delegators_tokens"]),
    delegatorsUsd: num(r["sum_delegators_tokens_usd"]),
  };
}

function projectLeaderboardRow(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    orchestratorAddress: String(r["orchestrator_address"] ?? "").toLowerCase(),
    displayName: (r["display_name"] as string | null) ?? null,
    avatarUrl: (r["avatar_url"] as string | null) ?? null,
    rewardEventCount: num(r["reward_event_count"]),
    totalLpt: num(r["sum_total_tokens"]),
    totalUsd: num(r["sum_total_tokens_usd"]),
    orchLpt: num(r["sum_orch_tokens"]),
    orchUsd: num(r["sum_orch_tokens_usd"]),
    delegatorsLpt: num(r["sum_delegators_tokens"]),
    delegatorsUsd: num(r["sum_delegators_tokens_usd"]),
  };
}

function summaryPath(kind: PeriodKind): "/rewards/summary/daily/{date}" |
  "/rewards/summary/weekly/{date}" |
  "/rewards/summary/monthly/{date}" {
  if (kind === "weekly") return "/rewards/summary/weekly/{date}";
  if (kind === "monthly") return "/rewards/summary/monthly/{date}";
  return "/rewards/summary/daily/{date}";
}

export async function getSummary(kind: PeriodKind, date: string): Promise<RewardSummary> {
  const body = (await unwrap(
    networkExplorer.GET(summaryPath(kind), { params: { path: { date } } }),
  )) as unknown;
  return projectSummary(body);
}

function clampLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, Math.floor(limit)), MAX_PAGE_SIZE);
}

export async function listLeaderboard(
  params: LeaderboardParams,
): Promise<RewardLeaderboardResult> {
  const query: Record<string, string | number> = {
    from: params.from,
    to: params.to,
    limit: clampLimit(params.limit),
  };
  if (params.sort) query["sort"] = params.sort;
  if (params.cursor) query["cursor"] = params.cursor;

  const body = (await unwrap(
    networkExplorer.GET("/rewards/leaderboard", { params: { query } }),
  )) as { data?: unknown[]; meta?: Record<string, unknown> };

  return {
    data: (body.data ?? []).map(projectLeaderboardRow),
    meta: {
      from: String(body.meta?.["from"] ?? params.from),
      to: String(body.meta?.["to"] ?? params.to),
      sort: sortOf(body.meta?.["sort"] ?? params.sort),
      nextCursor: (body.meta?.["next_cursor"] as string | null) ?? null,
    },
  };
}
