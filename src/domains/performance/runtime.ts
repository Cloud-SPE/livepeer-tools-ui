import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/utils/queryClient";
import { getIdentityIndex, listLeaderboard, listPipelines, listRegions, listStats } from "./repo";
import { detectMode } from "./service";
import type {
  IdentityIndex,
  LeaderboardParams,
  LeaderboardRow,
  Mode,
  Pipeline,
  Region,
  StatsParams,
  StatsRow,
} from "./types";

const IDENTITY_KEY = ["performance", "identity-index"] as const;
const regionsKey = (mode: Mode) => ["performance", "regions", mode] as const;
const pipelinesKey = ["performance", "pipelines"] as const;
const leaderboardKey = (params: LeaderboardParams) =>
  [
    "performance",
    "leaderboard",
    params.mode,
    params.region ?? null,
    params.pipeline ?? null,
    params.model ?? null,
  ] as const;
const statsKey = (params: StatsParams) =>
  [
    "performance",
    "stats",
    params.mode,
    params.orchestrator.toLowerCase(),
    params.pipeline ?? null,
    params.model ?? null,
  ] as const;

const identityConfig = () => ({
  queryKey: IDENTITY_KEY,
  queryFn: getIdentityIndex,
  staleTime: 5 * 60_000,
});

const regionsConfig = (mode: Mode) => ({
  queryKey: regionsKey(mode),
  queryFn: () => listRegions(mode),
  staleTime: 5 * 60_000,
});

const pipelinesConfig = () => ({
  queryKey: pipelinesKey,
  queryFn: listPipelines,
  staleTime: 5 * 60_000,
});

async function fetchLeaderboard(params: LeaderboardParams): Promise<LeaderboardRow[]> {
  const identities = await queryClient.fetchQuery(identityConfig());
  return listLeaderboard(params, identities);
}
const leaderboardConfig = (params: LeaderboardParams) => ({
  queryKey: leaderboardKey(params),
  queryFn: () => fetchLeaderboard(params),
});

const statsConfig = (params: StatsParams) => ({
  queryKey: statsKey(params),
  queryFn: () => listStats(params),
});

/* ---------- hooks ---------- */

export function useIdentityIndex(): UseQueryResult<IdentityIndex, Error> {
  return useQuery(identityConfig());
}

export function useRegions(mode: Mode): UseQueryResult<Region[], Error> {
  return useQuery(regionsConfig(mode));
}

export function usePipelines(): UseQueryResult<Pipeline[], Error> {
  return useQuery(pipelinesConfig());
}

export function useLeaderboard(params: LeaderboardParams): UseQueryResult<LeaderboardRow[], Error> {
  return useQuery(leaderboardConfig(params));
}

export function useStats(params: StatsParams): UseQueryResult<StatsRow[], Error> {
  return useQuery({
    ...statsConfig(params),
    enabled: Boolean(params.orchestrator),
  });
}

/* ---------- loaders ---------- */

function modeFromSearch(search: URLSearchParams): Mode {
  return detectMode({ pipeline: search.get("pipeline"), model: search.get("model") });
}

export async function leaderboardLoader({ request }: LoaderFunctionArgs): Promise<null> {
  const search = new URL(request.url).searchParams;
  const mode = modeFromSearch(search);
  const params: LeaderboardParams = {
    mode,
    region: search.get("region") ?? undefined,
    pipeline: mode === "ai" ? (search.get("pipeline") ?? undefined) : undefined,
    model: mode === "ai" ? (search.get("model") ?? undefined) : undefined,
  };
  await Promise.all([
    queryClient.prefetchQuery(regionsConfig(mode)),
    queryClient.prefetchQuery(pipelinesConfig()),
    queryClient.prefetchQuery(leaderboardConfig(params)),
  ]);
  return null;
}

export async function statsLoader({ request }: LoaderFunctionArgs): Promise<null> {
  const search = new URL(request.url).searchParams;
  const mode = modeFromSearch(search);
  await queryClient.prefetchQuery(pipelinesConfig());
  const orchestrator = search.get("orchestrator");
  if (!orchestrator) return null;
  await queryClient.prefetchQuery(
    statsConfig({
      mode,
      orchestrator,
      pipeline: mode === "ai" ? (search.get("pipeline") ?? undefined) : undefined,
      model: mode === "ai" ? (search.get("model") ?? undefined) : undefined,
    }),
  );
  return null;
}
