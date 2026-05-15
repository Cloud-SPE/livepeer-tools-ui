import { networkExplorer, unwrap } from "@/providers/network-explorer";
import {
  getAggregatedStats,
  getPipelines,
  getRawStats,
  getRegions,
} from "@/providers/performance";
import { GLOBAL_REGION_ID } from "./config";
import type {
  IdentityIndex,
  LeaderboardParams,
  LeaderboardRow,
  Mode,
  OrchestratorIdentity,
  Pipeline,
  Region,
  StatsParams,
  StatsRow,
} from "./types";

/* ---------- identity ---------- */

/**
 * Build an address → identity index by fetching a page of orchestrator
 * profiles from the network-explorer. Same multi-provider hydration
 * pattern as governance and gateways.
 */
export async function getIdentityIndex(): Promise<IdentityIndex> {
  const body = (await unwrap(
    networkExplorer.GET("/orchestrators", {
      params: { query: { limit: 500 } },
    }),
  )) as { data?: unknown[] };

  const out = new Map<string, OrchestratorIdentity>();
  for (const row of body.data ?? []) {
    const r = row as Record<string, unknown>;
    const address = String(r["address"] ?? "").toLowerCase();
    if (!address) continue;
    out.set(address, {
      address,
      displayName: (r["display_name"] as string | null) ?? null,
      avatarUrl: (r["avatar_url"] as string | null) ?? null,
    });
  }
  return out;
}

/* ---------- reference data ---------- */

export async function listRegions(mode: Mode): Promise<Region[]> {
  const body = await getRegions(mode);
  return body.regions.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
  }));
}

export async function listPipelines(): Promise<Pipeline[]> {
  const body = await getPipelines();
  return body.pipelines.map((p) => ({
    id: p.id,
    models: p.models,
    regions: p.regions,
  }));
}

/* ---------- leaderboard ---------- */

/**
 * Fetch aggregated stats and hydrate with identity in a single call.
 * Composes BOTH providers — performance for the stats, network-explorer
 * for the orchestrator profiles.
 */
export async function listLeaderboard(
  params: LeaderboardParams,
  identities: IdentityIndex,
): Promise<LeaderboardRow[]> {
  const region =
    params.region && params.region !== GLOBAL_REGION_ID ? params.region : undefined;

  const perfParams: Parameters<typeof getAggregatedStats>[0] = {
    kind: params.mode,
    ...(region ? { region } : {}),
  };
  if (params.mode === "ai") {
    if (params.pipeline) perfParams.pipeline = params.pipeline;
    if (params.model) perfParams.model = params.model;
  }

  const stats = await getAggregatedStats(perfParams);

  const rows: LeaderboardRow[] = [];
  for (const [address, regions] of Object.entries(stats)) {
    const regionEntries = Object.values(regions);
    const regionCount = regionEntries.length;
    if (regionCount === 0) continue;
    let sumScore = 0;
    let sumSuccess = 0;
    let sumRoundTrip = 0;
    for (const r of regionEntries) {
      sumScore += r.score;
      sumSuccess += r.success_rate;
      sumRoundTrip += r.round_trip_score;
    }
    const addr = address.toLowerCase();
    rows.push({
      id: addr,
      address: addr,
      identity: identities.get(addr) ?? null,
      totalScore: (sumScore / regionCount) * 10,
      successRate: (sumSuccess / regionCount) * 100,
      latencyScore: (sumRoundTrip / regionCount) * 10,
      regionCount,
    });
  }
  return rows;
}

/* ---------- stats ---------- */

export async function listStats(params: StatsParams): Promise<StatsRow[]> {
  const perfParams: Parameters<typeof getRawStats>[0] = {
    kind: params.mode,
    orchestrator: params.orchestrator,
  };
  if (params.mode === "ai") {
    if (params.pipeline) perfParams.pipeline = params.pipeline;
    if (params.model) perfParams.model = params.model;
  }
  const data = await getRawStats(perfParams);

  const out: StatsRow[] = [];
  for (const [region, records] of Object.entries(data)) {
    records.forEach((record, idx) => {
      const downloadTime = record.download_time ?? null;
      const transcodeTime = record.transcode_time ?? null;
      const segmentsReceived = record.segments_received ?? null;
      const realtime =
        record.seg_duration > record.round_trip_time && record.success_rate > 0;
      out.push({
        id: `${region}-${idx}`,
        region,
        orchestrator: record.orchestrator.toLowerCase(),
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
        inputParameters: record.input_parameters ?? null,
        responsePayload: record.response_payload ?? null,
        errors: (record.errors ?? []).map((e) => ({
          errorCode: e.error_code,
          count: e.count,
        })),
        realtime,
      });
    });
  }
  return out;
}
