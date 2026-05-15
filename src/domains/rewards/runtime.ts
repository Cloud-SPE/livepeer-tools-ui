import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/utils/queryClient";
import { getSummary, listLeaderboard } from "./repo";
import { rangeFor, todayIso } from "./service";
import type {
  LeaderboardParams,
  PeriodKind,
  RewardLeaderboardResult,
  RewardSummary,
  SortKey,
} from "./types";

const summaryKey = (kind: PeriodKind, date: string) => ["rewards", "summary", kind, date] as const;

const leaderboardKey = (params: LeaderboardParams) =>
  [
    "rewards",
    "leaderboard",
    params.from,
    params.to,
    params.sort ?? "orch_tokens_usd",
    params.limit ?? null,
    params.cursor ?? null,
  ] as const;

const summaryConfig = (kind: PeriodKind, date: string) => ({
  queryKey: summaryKey(kind, date),
  queryFn: () => getSummary(kind, date),
});

const leaderboardConfig = (params: LeaderboardParams) => ({
  queryKey: leaderboardKey(params),
  queryFn: () => listLeaderboard(params),
});

export function useRewardSummary(
  kind: PeriodKind,
  date: string,
): UseQueryResult<RewardSummary, Error> {
  return useQuery(summaryConfig(kind, date));
}

export function useRewardLeaderboard(
  params: LeaderboardParams,
): UseQueryResult<RewardLeaderboardResult, Error> {
  return useQuery({
    ...leaderboardConfig(params),
    enabled: Boolean(params.from && params.to),
  });
}

function sortFromSearch(search: URLSearchParams): SortKey {
  const s = search.get("sort");
  if (s === "total_tokens_usd" || s === "reward_event_count") return s;
  return "orch_tokens_usd";
}

function makeSummaryLoader(kind: PeriodKind) {
  return async function loader({ params }: LoaderFunctionArgs): Promise<null> {
    const date = params["date"];
    if (!date) throw new Response("Missing date", { status: 400 });
    const range = rangeFor(kind, date);
    if (!range) throw new Response("Invalid date", { status: 400 });
    await Promise.all([
      queryClient.prefetchQuery(summaryConfig(kind, date)),
      queryClient.prefetchQuery(
        leaderboardConfig({
          from: range.from,
          to: range.to,
          sort: "orch_tokens_usd",
        }),
      ),
    ]);
    return null;
  };
}

export const dailyRewardSummaryLoader = makeSummaryLoader("daily");
export const weeklyRewardSummaryLoader = makeSummaryLoader("weekly");
export const monthlyRewardSummaryLoader = makeSummaryLoader("monthly");

export async function topRewardsLoader({ request }: LoaderFunctionArgs): Promise<null> {
  const search = new URL(request.url).searchParams;
  const today = todayIso();
  const sevenAgo = (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString().slice(0, 10);
  })();
  const from = search.get("from") ?? sevenAgo;
  const to = search.get("to") ?? today;
  const sort = sortFromSearch(search);
  await queryClient.prefetchQuery(leaderboardConfig({ from, to, sort }));
  return null;
}
