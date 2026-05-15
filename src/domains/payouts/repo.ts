import { networkExplorer, unwrap } from "@/providers/network-explorer";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./config";
import type {
  JobType,
  LeaderboardParams,
  PayoutLeaderboardResult,
  PayoutSummary,
  PeriodKind,
} from "./types";

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function jobTypeOf(v: unknown): JobType {
  return v === "ai" || v === "transcoding" ? v : "both";
}

function projectSummary(row: unknown): PayoutSummary {
  const r = row as Record<string, unknown>;
  return {
    periodStart: String(r["period_start"] ?? ""),
    periodEnd: String(r["period_end"] ?? ""),
    jobType: jobTypeOf(r["job_type"]),
    ticketCount: num(r["ticket_count"]),
    totalEth: num(r["sum_face_value_native"]),
    totalUsd: num(r["sum_face_value_usd"]),
    commissionEth: num(r["sum_commission_native"]),
    commissionUsd: num(r["sum_commission_usd"]),
    delegatorsShareEth: num(r["sum_delegators_share_native"]),
    delegatorsShareUsd: num(r["sum_delegators_share_usd"]),
    distinctGateways: num(r["distinct_gateways"]),
  };
}

function projectLeaderboardRow(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    orchestratorAddress: String(r["orchestrator_address"] ?? "").toLowerCase(),
    displayName: (r["display_name"] as string | null) ?? null,
    avatarUrl: (r["avatar_url"] as string | null) ?? null,
    ticketCount: num(r["ticket_count"]),
    faceValueEth: num(r["sum_face_value_native"]),
    faceValueUsd: num(r["sum_face_value_usd"]),
    commissionEth: num(r["sum_commission_native"]),
    commissionUsd: num(r["sum_commission_usd"]),
    delegatorsShareEth: num(r["sum_delegators_share_native"]),
    delegatorsShareUsd: num(r["sum_delegators_share_usd"]),
    distinctGateways: num(r["distinct_gateways"]),
  };
}

function summaryPath(
  kind: PeriodKind,
):
  | "/payouts/summary/daily/{date}"
  | "/payouts/summary/weekly/{date}"
  | "/payouts/summary/monthly/{date}" {
  if (kind === "weekly") return "/payouts/summary/weekly/{date}";
  if (kind === "monthly") return "/payouts/summary/monthly/{date}";
  return "/payouts/summary/daily/{date}";
}

export async function getSummary(
  kind: PeriodKind,
  date: string,
  jobType: JobType = "both",
): Promise<PayoutSummary> {
  const path = summaryPath(kind);
  const query: Record<string, string> = {};
  if (jobType !== "both") query["job_type"] = jobType;

  const body = (await unwrap(
    networkExplorer.GET(path, {
      params: { path: { date }, query },
    }),
  )) as unknown;
  return projectSummary(body);
}

function clampLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, Math.floor(limit)), MAX_PAGE_SIZE);
}

export async function listLeaderboard(params: LeaderboardParams): Promise<PayoutLeaderboardResult> {
  const query: Record<string, string | number> = {
    from: params.from,
    to: params.to,
    limit: clampLimit(params.limit),
  };
  if (params.jobType && params.jobType !== "both") query["job_type"] = params.jobType;
  if (params.sort) query["sort"] = params.sort;
  if (params.cursor) query["cursor"] = params.cursor;

  const body = (await unwrap(
    networkExplorer.GET("/payouts/leaderboard", { params: { query } }),
  )) as { data?: unknown[]; meta?: Record<string, unknown> };

  return {
    data: (body.data ?? []).map(projectLeaderboardRow),
    meta: {
      from: String(body.meta?.["from"] ?? params.from),
      to: String(body.meta?.["to"] ?? params.to),
      jobType: jobTypeOf(body.meta?.["job_type"]),
      sort: (body.meta?.["sort"] as never) ?? params.sort ?? "commission_usd",
      nextCursor: (body.meta?.["next_cursor"] as string | null) ?? null,
    },
  };
}
