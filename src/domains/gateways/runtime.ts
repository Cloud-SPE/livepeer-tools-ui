import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/utils/queryClient";
import { getGateway, getIdentityIndex, listGateways, listGatewayPayouts } from "./repo";
import type {
  Gateway,
  GatewayListParams,
  GatewayListResult,
  GatewayPayoutsResult,
  IdentityIndex,
} from "./types";

/* ---------- keys + configs ---------- */

const IDENTITY_KEY = ["gateways", "identity-index"] as const;
const listKey = (params: GatewayListParams) => ["gateways", "list", params] as const;
const detailKey = (address: string) => ["gateways", "detail", address.toLowerCase()] as const;
const payoutsKey = (address: string) => ["gateways", "payouts", address.toLowerCase()] as const;

const identityConfig = () => ({
  queryKey: IDENTITY_KEY,
  queryFn: getIdentityIndex,
  staleTime: 5 * 60_000,
});

const listConfig = (params: GatewayListParams) => ({
  queryKey: listKey(params),
  queryFn: () => listGateways(params),
});

const detailConfig = (address: string) => ({
  queryKey: detailKey(address),
  queryFn: () => getGateway(address.toLowerCase()),
});

async function fetchGatewayPayouts(address: string): Promise<GatewayPayoutsResult> {
  const identities = await queryClient.fetchQuery(identityConfig());
  return listGatewayPayouts({ address }, identities);
}
const payoutsConfig = (address: string) => ({
  queryKey: payoutsKey(address),
  queryFn: () => fetchGatewayPayouts(address.toLowerCase()),
});

/* ---------- hooks ---------- */

export function useGateways(
  params: GatewayListParams = {},
): UseQueryResult<GatewayListResult, Error> {
  return useQuery(listConfig(params));
}

export function useGateway(address: string): UseQueryResult<Gateway, Error> {
  return useQuery(detailConfig(address));
}

export function useGatewayPayouts(address: string): UseQueryResult<GatewayPayoutsResult, Error> {
  return useQuery(payoutsConfig(address));
}

export function useGatewayIdentityIndex(): UseQueryResult<IdentityIndex, Error> {
  return useQuery(identityConfig());
}

/* ---------- loaders ---------- */

export async function gatewaysLoader(_args: LoaderFunctionArgs): Promise<null> {
  await queryClient.prefetchQuery(listConfig({}));
  return null;
}

export async function gatewayLoader({ params }: LoaderFunctionArgs): Promise<null> {
  const address = params["eth_address"];
  if (!address) throw new Response("Missing eth_address", { status: 400 });
  await Promise.all([
    queryClient.prefetchQuery(detailConfig(address)),
    queryClient.prefetchQuery(payoutsConfig(address)),
  ]);
  return null;
}
