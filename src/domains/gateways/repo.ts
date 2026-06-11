import { safeAvatarUrl } from "@/utils/avatar";
import { networkExplorer, unwrap } from "@/providers/network-explorer";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAYOUTS_LIMIT, MAX_PAGE_SIZE } from "./config";
import type {
  Gateway,
  GatewayKind,
  GatewayListParams,
  GatewayListResult,
  GatewayPayoutsParams,
  GatewayPayoutsResult,
  IdentityIndex,
  PayoutSemantics,
  RecipientIdentity,
} from "./types";

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

function kindOf(v: unknown): GatewayKind {
  return v === "ai" || v === "transcoding" ? v : "unknown";
}

function semanticsOf(v: unknown): PayoutSemantics {
  if (v === "net" || v === "gross") return v;
  return null;
}

function projectGateway(row: unknown): Gateway {
  const r = row as Record<string, unknown>;
  return {
    address: String(r["address"] ?? "").toLowerCase(),
    displayName: (r["display_name"] as string | null) ?? null,
    avatarUrl: safeAvatarUrl(r["avatar_url"]),
    kind: kindOf(r["kind"]),
    depositEth: num(r["latest_deposit"]),
    reserveEth: num(r["latest_reserve"]),
    reserveClaimedThisRoundEth: num(r["reserve_claimed_in_current_round"]),
    withdrawRound: intOrNull(r["withdraw_round"]),
    unlockInProgress: Boolean(r["unlock_in_progress"]),
    asOfBlock: num(r["as_of_block"]),
  };
}

function projectPayoutRow(row: unknown, identities: IdentityIndex) {
  const r = row as Record<string, unknown>;
  const to = String(r["to_address"] ?? "").toLowerCase();
  return {
    eventId: String(r["event_id"] ?? ""),
    eventName: String(r["event_name"] ?? ""),
    flowKind: String(r["flow_kind"] ?? ""),
    blockNumber: num(r["block_number"]),
    blockTimestamp: (r["block_timestamp"] as string | null) ?? null,
    txHash: String(r["tx_hash"] ?? ""),
    asset: String(r["asset"] ?? "ETH"),
    amountEth: num(r["amount_native"]),
    amountUsd: num(r["amount_usd"]),
    fromAddress: String(r["from_address"] ?? "").toLowerCase(),
    toAddress: to,
    toIdentity: identities.get(to) ?? null,
  };
}

/* ---------- identity hydration ---------- */

/**
 * Fetch the orchestrators list and build a lowercase-address → identity
 * map. Used to hydrate the recipient column on the payouts table.
 * Same pattern as the governance domain.
 */
export async function getIdentityIndex(): Promise<IdentityIndex> {
  const body = (await unwrap(
    networkExplorer.GET("/orchestrators", {
      params: { query: { limit: 500 } },
    }),
  )) as { data?: unknown[] };

  const out = new Map<string, RecipientIdentity>();
  for (const row of body.data ?? []) {
    const r = row as Record<string, unknown>;
    const address = String(r["address"] ?? "").toLowerCase();
    if (!address) continue;
    out.set(address, {
      address,
      displayName: (r["display_name"] as string | null) ?? null,
      avatarUrl: safeAvatarUrl(r["avatar_url"]),
    });
  }
  return out;
}

/* ---------- gateways ---------- */

function clampLimit(limit: number | undefined, fallback = DEFAULT_PAGE_SIZE): number {
  if (!limit || !Number.isFinite(limit)) return fallback;
  return Math.min(Math.max(1, Math.floor(limit)), MAX_PAGE_SIZE);
}

export async function listGateways(params: GatewayListParams = {}): Promise<GatewayListResult> {
  const query: Record<string, string | number> = { limit: clampLimit(params.limit) };
  if (params.cursor) query["cursor"] = params.cursor;

  const body = (await unwrap(networkExplorer.GET("/gateways", { params: { query } }))) as {
    data?: unknown[];
    meta?: { next_cursor?: string | null };
  };

  return {
    data: (body.data ?? []).map(projectGateway),
    meta: { nextCursor: body.meta?.next_cursor ?? null },
  };
}

export async function getGateway(address: string): Promise<Gateway> {
  const row = (await unwrap(
    networkExplorer.GET("/gateways/{address}/profile", {
      params: { path: { address } },
    }),
  )) as unknown;
  return projectGateway(row);
}

/* ---------- payouts ---------- */

export async function listGatewayPayouts(
  params: GatewayPayoutsParams,
  identities: IdentityIndex,
): Promise<GatewayPayoutsResult> {
  const query: Record<string, string | number> = {
    limit: clampLimit(params.limit, DEFAULT_PAYOUTS_LIMIT),
  };
  if (params.cursor) query["cursor"] = params.cursor;

  const body = (await unwrap(
    networkExplorer.GET("/gateways/{gateway}/payouts", {
      params: { path: { gateway: params.address }, query },
    }),
  )) as { gateway_address?: string; data?: unknown[]; semantics?: unknown };

  return {
    gatewayAddress: String(body.gateway_address ?? params.address).toLowerCase(),
    semantics: semanticsOf(body.semantics),
    data: (body.data ?? []).map((row) => projectPayoutRow(row, identities)),
  };
}
