import { networkExplorer, unwrap } from "@/providers/network-explorer";
import { getPipelines, getRawStats } from "@/providers/performance";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./config";
import type {
  DelegatorDelegation,
  DelegatorDetail,
  Orchestrator,
  OrchestratorDelegator,
  OrchestratorDelegatorsResult,
  OrchestratorListParams,
  OrchestratorListResult,
  OrchestratorTicket,
  OrchestratorTicketsResult,
  OrchestratorVote,
  OrchestratorVotesResult,
  OrchestratorPerformanceRow,
  PerformanceMode,
  PerformancePipeline,
  VoteSupport,
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

function nullableNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function supportLabelFromCode(code: unknown): VoteSupport {
  const n = typeof code === "number" ? code : Number(code);
  if (n === 1) return "For";
  if (n === 2) return "Abstain";
  return "Against";
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
    lastLifecycleEventAt: (r["last_lifecycle_event_at"] as string | null) ?? null,
  };
}

function projectDelegator(row: unknown): OrchestratorDelegator {
  const r = row as Record<string, unknown>;
  return {
    delegatorAddress: String(r["delegator_address"] ?? "").toLowerCase(),
    bondedPrincipalLpt: num(r["bonded_principal"] as string | number | null | undefined),
    pendingStakeLpt: nullableNum(r["pending_stake"]),
    pendingFeesEth: nullableNum(r["pending_fees"]),
    asOfBlock: num(r["as_of_block"] as string | number | null | undefined),
    asOfTimestamp: String(r["as_of_timestamp"] ?? ""),
  };
}

function projectTicket(row: unknown): OrchestratorTicket {
  const r = row as Record<string, unknown>;
  return {
    eventId: String(r["event_id"] ?? ""),
    txHash: String(r["tx_hash"] ?? ""),
    blockTimestamp: String(r["block_timestamp"] ?? ""),
    gatewayAddress: String(r["gateway_address"] ?? "").toLowerCase(),
    faceValueEth: num(r["face_value"] as string | number | null | undefined),
    faceValueUsd: num(r["face_value_usd"] as string | number | null | undefined),
  };
}

function projectVote(row: unknown): OrchestratorVote {
  const r = row as Record<string, unknown>;
  return {
    proposalId: String(r["proposal_id"] ?? ""),
    support: supportLabelFromCode(r["support"]),
    stakeLpt: num(r["weight"] as string | number | null | undefined) / 1e18,
    reason: (r["reason"] as string | null) ?? null,
    blockTimestamp: (r["block_timestamp"] as string | null) ?? null,
    txHash: String(r["tx_hash"] ?? ""),
  };
}

function projectDelegation(row: unknown): DelegatorDelegation {
  const r = row as Record<string, unknown>;
  return {
    delegateAddress: String(r["delegate_address"] ?? "").toLowerCase(),
    bondedPrincipalLpt: num(r["bonded_principal"] as string | number | null | undefined),
    pendingStakeLpt: nullableNum(r["pending_stake"]),
    pendingFeesEth: nullableNum(r["pending_fees"]),
    asOfBlock: num(r["as_of_block"] as string | number | null | undefined),
    asOfTimestamp: String(r["as_of_timestamp"] ?? ""),
  };
}

function projectDelegatorDetail(row: unknown): DelegatorDetail {
  const r = row as Record<string, unknown>;
  const delegations = Array.isArray(r["delegations"]) ? r["delegations"] : [];
  return {
    address: String(r["delegator_address"] ?? "").toLowerCase(),
    isActive: Boolean(r["is_active"]),
    firstBondBlock: num(r["first_bond_block"] as string | number | null | undefined),
    lastSeenBlock: num(r["last_seen_block"] as string | number | null | undefined),
    delegations: delegations.map(projectDelegation),
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

export async function listOrchestratorDelegators(
  address: string,
  limit = 100,
): Promise<OrchestratorDelegatorsResult> {
  const body = (await unwrap(
    networkExplorer.GET("/orchestrators/{address}/delegators", {
      params: { path: { address }, query: { limit } },
    }),
  )) as { data?: unknown[]; meta?: { next_cursor?: string | null } };
  return {
    data: (body.data ?? []).map(projectDelegator),
    nextCursor: body.meta?.next_cursor ?? null,
  };
}

export async function listOrchestratorTickets(params: {
  address: string;
  start: string;
  end: string;
  limit?: number;
}): Promise<OrchestratorTicketsResult> {
  const body = (await unwrap(
    networkExplorer.GET("/orchestrators/{address}/tickets/latest", {
      params: {
        path: { address: params.address },
        query: { start: params.start, end: params.end, limit: params.limit ?? 500 },
      },
    }),
  )) as { data?: unknown[]; next_cursor?: string | null };
  return {
    start: params.start,
    end: params.end,
    data: (body.data ?? []).map(projectTicket),
    nextCursor: body.next_cursor ?? null,
  };
}

export async function listOrchestratorVotes(
  address: string,
  limit = 100,
): Promise<OrchestratorVotesResult> {
  const body = (await unwrap(
    networkExplorer.GET("/governance/votes", {
      params: { query: { voter: address, limit } },
    }),
  )) as { data?: unknown[]; next_cursor?: string | null };
  return {
    data: (body.data ?? []).map(projectVote),
    nextCursor: body.next_cursor ?? null,
  };
}

export async function getDelegator(address: string): Promise<DelegatorDetail> {
  const row = (await unwrap(
    networkExplorer.GET("/delegators/{address}", {
      params: { path: { address } },
    }),
  )) as unknown;
  return projectDelegatorDetail(row);
}

export async function listPerformancePipelines(): Promise<PerformancePipeline[]> {
  const body = await getPipelines();
  return body.pipelines.map((p) => ({
    id: p.id,
    models: p.models,
  }));
}

export async function listOrchestratorPerformance(params: {
  address: string;
  mode: PerformanceMode;
  pipeline?: string;
  model?: string;
}): Promise<OrchestratorPerformanceRow[]> {
  const raw = await getRawStats({
    kind: params.mode,
    orchestrator: params.address,
    ...(params.mode === "ai" && params.pipeline ? { pipeline: params.pipeline } : {}),
    ...(params.mode === "ai" && params.model ? { model: params.model } : {}),
  });

  const out: OrchestratorPerformanceRow[] = [];
  for (const [region, records] of Object.entries(raw)) {
    records.forEach((record, idx) => {
      const downloadTime = record.download_time ?? null;
      const transcodeTime = record.transcode_time ?? null;
      const segmentsReceived = record.segments_received ?? null;
      out.push({
        id: `${region}-${record.timestamp}-${idx}`,
        region,
        timestamp: record.timestamp,
        successRate: record.success_rate,
        roundTripTime: record.round_trip_time,
        segDuration: record.seg_duration,
        segmentsSent: record.segments_sent,
        segmentsReceived,
        uploadTime: record.upload_time,
        downloadTime,
        transcodeTime,
        pipeline: record.pipeline ?? null,
        model: record.model ?? null,
        modelIsWarm: record.model_is_warm ?? null,
        realtime: record.seg_duration > record.round_trip_time && record.success_rate > 0,
      });
    });
  }
  return out;
}
