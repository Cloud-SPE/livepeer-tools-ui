import { networkExplorer, unwrap } from "@/providers/network-explorer";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./config";
import type {
  Orchestrator,
  OrchestratorListParams,
  OrchestratorListResult,
} from "./types";

/**
 * Parse a numeric-string field from the API, defaulting to 0 when missing
 * or unparseable. The protocol-explorer ships big amounts as decimal strings;
 * the domain consumes plain numbers (precision is sufficient for display).
 */
function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function intOrNull(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Project a raw OrchestratorProfileRow into the domain type. This is the
 * boundary between the network-explorer vocabulary and the domain
 * vocabulary — everywhere downstream uses `Orchestrator`.
 *
 * Typed loosely against `unknown` because the post-processed `operations`
 * type loses per-endpoint precision (see docs/generated/api-types-baseline.md).
 * The fields below are stable per the OpenAPI spec.
 */
function projectRow(row: unknown): Orchestrator {
  const r = row as Record<string, unknown>;
  return {
    address: String(r["address"] ?? "").toLowerCase(),
    displayName: (r["display_name"] as string | null) ?? null,
    avatarUrl: (r["avatar_url"] as string | null) ?? null,
    serviceUri: (r["service_uri"] as string | null) ?? null,
    isActive: Boolean(r["is_active"]),
    totalStakeLpt: num(r["total_stake"] as string | number | null | undefined),
    rewardCutPct: num(r["reward_cut_percent"] as string | number | null | undefined),
    feeCutPct: num(r["fee_cut_percent"] as string | number | null | undefined),
    feeSharePct: num(r["fee_share_percent"] as string | number | null | undefined),
    asOfBlock: num(r["as_of_block"] as string | number | null | undefined),
    asOfRound: intOrNull(r["as_of_round"] as string | number | null | undefined),
    lastLifecycleEventAt:
      (r["last_lifecycle_event_at"] as string | null) ?? null,
  };
}

function clampLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, Math.floor(limit)), MAX_PAGE_SIZE);
}

export async function listOrchestrators(
  params: OrchestratorListParams = {},
): Promise<OrchestratorListResult> {
  const limit = clampLimit(params.limit);
  const query: Record<string, string | number> = { limit };
  if (params.cursor) query["cursor"] = params.cursor;

  const body = (await unwrap(
    networkExplorer.GET("/orchestrators", {
      params: { query },
    }),
  )) as { data?: unknown[]; meta?: { next_cursor?: string | null; total?: number | null } };

  const data = Array.isArray(body.data) ? body.data.map(projectRow) : [];
  return {
    data,
    meta: {
      nextCursor: body.meta?.next_cursor ?? null,
      total: body.meta?.total ?? null,
    },
  };
}

export async function getOrchestrator(address: string): Promise<Orchestrator> {
  const row = (await unwrap(
    networkExplorer.GET("/orchestrators/{address}", {
      params: { path: { address } },
    }),
  )) as unknown;
  return projectRow(row);
}
