import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/utils/queryClient";
import { getOrchestrator, listOrchestrators } from "./repo";
import type { Orchestrator, OrchestratorListParams, OrchestratorListResult } from "./types";

/**
 * Cache key convention: [domain, action, ...args].
 * Same key for the loader prefetch and the hook read.
 */
const listKey = (params: OrchestratorListParams) => ["orchestrators", "list", params] as const;
const detailKey = (address: string) => ["orchestrators", "detail", address.toLowerCase()] as const;

const listConfig = (params: OrchestratorListParams) => ({
  queryKey: listKey(params),
  queryFn: () => listOrchestrators(params),
});
const detailConfig = (address: string) => ({
  queryKey: detailKey(address),
  queryFn: () => getOrchestrator(address.toLowerCase()),
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
