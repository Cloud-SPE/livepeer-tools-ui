import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/utils/queryClient";
import { getSummary, listLeaderboard } from "./repo";
import { rangeFor, todayIso } from "./service";
import type {
  JobType,
  LeaderboardParams,
  PayoutLeaderboardResult,
  PayoutSummary,
  PeriodKind,
  SortKey,
} from "./types";

/* ---------- query configs ---------- */

const summaryKey = (kind: PeriodKind, date: string, jobType: JobType) =>
  ["payouts", "summary", kind, date, jobType] as const;

const leaderboardKey = (params: LeaderboardParams) =>
  [
    "payouts",
    "leaderboard",
    params.from,
    params.to,
    params.jobType ?? "both",
    params.sort ?? "commission_usd",
    params.limit ?? null,
    params.cursor ?? null,
  ] as const;

const summaryConfig = (kind: PeriodKind, date: string, jobType: JobType) => ({
  queryKey: summaryKey(kind, date, jobType),
  queryFn: () => getSummary(kind, date, jobType),
});

const leaderboardConfig = (params: LeaderboardParams) => ({
  queryKey: leaderboardKey(params),
  queryFn: () => listLeaderboard(params),
});

/* ---------- hooks ---------- */

export function useReportSummary(
  kind: PeriodKind,
  date: string,
  jobType: JobType = "both",
): UseQueryResult<PayoutSummary, Error> {
  return useQuery(summaryConfig(kind, date, jobType));
}

export function useLeaderboard(
  params: LeaderboardParams,
): UseQueryResult<PayoutLeaderboardResult, Error> {
  return useQuery({
    ...leaderboardConfig(params),
    enabled: Boolean(params.from && params.to),
  });
}

/* ---------- URL param helpers ---------- */

function jobTypeFromSearch(search: URLSearchParams): JobType {
  const j = search.get("job_type");
  return j === "ai" || j === "transcoding" ? j : "both";
}

function sortFromSearch(search: URLSearchParams): SortKey {
  const s = search.get("sort");
  if (s === "face_value_usd" || s === "ticket_count") return s;
  return "commission_usd";
}

/* ---------- loaders ---------- */

/**
 * Loader for /reports/{daily|weekly|monthly}/:date — prefetches both the
 * summary and the period-windowed leaderboard. Reads job_type from query
 * string so the URL is the source of truth.
 */
function makeSummaryLoader(kind: PeriodKind) {
  return async function loader({ request, params }: LoaderFunctionArgs): Promise<null> {
    const date = params["date"];
    if (!date) throw new Response("Missing date", { status: 400 });
    const search = new URL(request.url).searchParams;
    const jobType = jobTypeFromSearch(search);
    const range = rangeFor(kind, date);
    if (!range) throw new Response("Invalid date", { status: 400 });

    await Promise.all([
      queryClient.prefetchQuery(summaryConfig(kind, date, jobType)),
      queryClient.prefetchQuery(
        leaderboardConfig({
          from: range.from,
          to: range.to,
          jobType,
          sort: "commission_usd",
        }),
      ),
    ]);
    return null;
  };
}

export const dailySummaryLoader = makeSummaryLoader("daily");
export const weeklySummaryLoader = makeSummaryLoader("weekly");
export const monthlySummaryLoader = makeSummaryLoader("monthly");

/**
 * Loader for /reports/top/payout — reads all filter inputs from the query
 * string and prefetches the leaderboard. Defaults to a 7-day window
 * ending today (matches the old UI default).
 */
export async function topPayoutLoader({ request }: LoaderFunctionArgs): Promise<null> {
  const search = new URL(request.url).searchParams;
  const today = todayIso();
  const sevenAgo = (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString().slice(0, 10);
  })();
  const from = search.get("from") ?? sevenAgo;
  const to = search.get("to") ?? today;
  const jobType = jobTypeFromSearch(search);
  const sort = sortFromSearch(search);

  await queryClient.prefetchQuery(leaderboardConfig({ from, to, jobType, sort }));
  return null;
}

/** Bare /reports landing — nothing to prefetch. */
export async function reportsLandingLoader(): Promise<null> {
  return null;
}
