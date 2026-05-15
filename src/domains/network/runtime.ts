import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/utils/queryClient";
import { getNetworkStats, listRounds } from "./repo";
import type { NetworkStats, RoundsListParams, RoundsListResult } from "./types";

const STATS_KEY = ["network", "stats"] as const;
const roundsKey = (params: RoundsListParams) => ["network", "rounds", params] as const;

const statsConfig = () => ({
  queryKey: STATS_KEY,
  queryFn: getNetworkStats,
  staleTime: 60_000,
});

const roundsConfig = (params: RoundsListParams) => ({
  queryKey: roundsKey(params),
  queryFn: () => listRounds(params),
});

export function useNetworkStats(): UseQueryResult<NetworkStats, Error> {
  return useQuery(statsConfig());
}

export function useRounds(params: RoundsListParams = {}): UseQueryResult<RoundsListResult, Error> {
  return useQuery(roundsConfig(params));
}

export async function networkStatsLoader(_args: LoaderFunctionArgs): Promise<null> {
  await queryClient.prefetchQuery(statsConfig());
  return null;
}

export async function roundsLoader(_args: LoaderFunctionArgs): Promise<null> {
  await queryClient.prefetchQuery(roundsConfig({}));
  return null;
}
