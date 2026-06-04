import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/utils/queryClient";
import {
  getDelegator,
  getOrchestrator,
  listOrchestratorPerformance,
  listOrchestratorDelegators,
  listOrchestratorTickets,
  listOrchestratorVotes,
  listPerformancePipelines,
  listOrchestrators,
} from "./repo";
import type {
  DelegatorDetail,
  Orchestrator,
  OrchestratorDelegatorsResult,
  OrchestratorListParams,
  OrchestratorListResult,
  OrchestratorPerformanceRow,
  OrchestratorTicketsResult,
  OrchestratorVotesResult,
  PerformanceMode,
  PerformancePipeline,
} from "./types";

/**
 * Cache key convention: [domain, action, ...args].
 * Same key for the loader prefetch and the hook read.
 */
const listKey = (params: OrchestratorListParams) => ["orchestrators", "list", params] as const;
const detailKey = (address: string) => ["orchestrators", "detail", address.toLowerCase()] as const;
const delegatorsKey = (address: string) =>
  ["orchestrators", "delegators", address.toLowerCase()] as const;
const ticketsKey = (address: string, start: string, end: string) =>
  ["orchestrators", "tickets", address.toLowerCase(), start, end] as const;
const votesKey = (address: string) => ["orchestrators", "votes", address.toLowerCase()] as const;
const delegatorDetailKey = (address: string) =>
  ["orchestrators", "delegator-detail", address.toLowerCase()] as const;
const PERFORMANCE_PIPELINES_KEY = ["orchestrators", "performance-pipelines"] as const;
const performanceKey = (
  address: string,
  mode: PerformanceMode,
  pipeline?: string,
  model?: string,
) =>
  [
    "orchestrators",
    "performance",
    address.toLowerCase(),
    mode,
    pipeline ?? "",
    model ?? "",
  ] as const;

const listConfig = (params: OrchestratorListParams) => ({
  queryKey: listKey(params),
  queryFn: () => listOrchestrators(params),
});
const detailConfig = (address: string) => ({
  queryKey: detailKey(address),
  queryFn: () => getOrchestrator(address.toLowerCase()),
});
const delegatorsConfig = (address: string) => ({
  queryKey: delegatorsKey(address),
  queryFn: () => listOrchestratorDelegators(address.toLowerCase()),
});
const ticketsConfig = (address: string, start: string, end: string) => ({
  queryKey: ticketsKey(address, start, end),
  queryFn: () => listOrchestratorTickets({ address: address.toLowerCase(), start, end }),
});
const votesConfig = (address: string) => ({
  queryKey: votesKey(address),
  queryFn: () => listOrchestratorVotes(address.toLowerCase()),
});
const delegatorDetailConfig = (address: string) => ({
  queryKey: delegatorDetailKey(address),
  queryFn: () => getDelegator(address.toLowerCase()),
});
const performancePipelinesConfig = () => ({
  queryKey: PERFORMANCE_PIPELINES_KEY,
  queryFn: () => listPerformancePipelines(),
});
const performanceConfig = (
  address: string,
  mode: PerformanceMode,
  pipeline?: string,
  model?: string,
) => ({
  queryKey: performanceKey(address, mode, pipeline, model),
  queryFn: () =>
    listOrchestratorPerformance({
      address: address.toLowerCase(),
      mode,
      pipeline,
      model,
    }),
});

/** List hook. Reads from the cache the loader populated. */
export function useOrchestrators(
  params: OrchestratorListParams = {},
): UseQueryResult<OrchestratorListResult, Error> {
  return useQuery(listConfig(params));
}

/** Detail hook. */
export function useOrchestrator(address: string): UseQueryResult<Orchestrator, Error> {
  return useQuery(detailConfig(address));
}

export function useOrchestratorDelegators(
  address: string,
  enabled = true,
): UseQueryResult<OrchestratorDelegatorsResult, Error> {
  return useQuery({ ...delegatorsConfig(address), enabled: enabled && !!address });
}

export function useOrchestratorTickets(
  address: string,
  start: string,
  end: string,
  enabled = true,
): UseQueryResult<OrchestratorTicketsResult, Error> {
  return useQuery({ ...ticketsConfig(address, start, end), enabled: enabled && !!address });
}

export function useOrchestratorVotes(
  address: string,
  enabled = true,
): UseQueryResult<OrchestratorVotesResult, Error> {
  return useQuery({ ...votesConfig(address), enabled: enabled && !!address });
}

export function useDelegator(address: string): UseQueryResult<DelegatorDetail, Error> {
  return useQuery(delegatorDetailConfig(address));
}

export function usePerformancePipelines(
  enabled = true,
): UseQueryResult<PerformancePipeline[], Error> {
  return useQuery({ ...performancePipelinesConfig(), enabled });
}

export function useOrchestratorPerformance(
  address: string,
  mode: PerformanceMode,
  pipeline?: string,
  model?: string,
  enabled = true,
): UseQueryResult<OrchestratorPerformanceRow[], Error> {
  return useQuery({
    ...performanceConfig(address, mode, pipeline, model),
    enabled: enabled && !!address,
  });
}

/**
 * react-router loader for `/orchestrators`. Prefetches the first page and
 * returns null — the page reads from the cache via the hook.
 */
export async function orchestratorsLoader(_args: LoaderFunctionArgs): Promise<null> {
  await queryClient.prefetchQuery(listConfig({}));
  return null;
}

/** react-router loader for `/orchestrator/:eth_address`. */
export async function orchestratorLoader({ params }: LoaderFunctionArgs): Promise<null> {
  const address = params["eth_address"];
  if (!address) throw new Response("Missing eth_address", { status: 400 });
  await queryClient.prefetchQuery(detailConfig(address));
  return null;
}

export async function delegatorLoader({ params }: LoaderFunctionArgs): Promise<null> {
  const address = params["eth_address"];
  if (!address) throw new Response("Missing eth_address", { status: 400 });
  await queryClient.prefetchQuery(delegatorDetailConfig(address));
  return null;
}
