import { env } from "@/utils/env";
import {
  aggregatedStatsResponseSchema,
  pipelinesResponseSchema,
  rawStatsResponseSchema,
  regionsResponseSchema,
  type AggregatedStatsResponse,
  type PipelinesResponse,
  type RawStatsResponse,
  type RegionsResponse,
} from "./schemas";

/**
 * Performance API kind. Picks which base URL to call. Both bases expose the
 * same endpoint contract.
 */
export type PerformanceKind = "transcoding" | "ai";

function baseFor(kind: PerformanceKind): string {
  return kind === "ai"
    ? env.performance.aiBaseUrl
    : env.performance.transcodingBaseUrl;
}

export class PerformanceError extends Error {
  public readonly status: number;
  constructor(status: number, message: string) {
    super(`performance ${status}: ${message}`);
    this.name = "PerformanceError";
    this.status = status;
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new PerformanceError(res.status, body.slice(0, 200) || res.statusText);
  }
  return res.json();
}

export async function getRegions(kind: PerformanceKind): Promise<RegionsResponse> {
  const url = `${baseFor(kind)}/api/regions`;
  return regionsResponseSchema.parse(await fetchJson(url));
}

export async function getPipelines(): Promise<PipelinesResponse> {
  const url = `${baseFor("ai")}/api/pipelines`;
  return pipelinesResponseSchema.parse(await fetchJson(url));
}

export interface AggregatedStatsParams {
  kind: PerformanceKind;
  pipeline?: string;
  model?: string;
  region?: string;
}

export async function getAggregatedStats(
  params: AggregatedStatsParams,
): Promise<AggregatedStatsResponse> {
  const qs = new URLSearchParams();
  if (params.pipeline) qs.set("pipeline", params.pipeline);
  if (params.model) qs.set("model", params.model);
  if (params.region) qs.set("region", params.region);
  const q = qs.toString();
  const url = `${baseFor(params.kind)}/api/aggregated_stats${q ? `?${q}` : ""}`;
  return aggregatedStatsResponseSchema.parse(await fetchJson(url));
}

export interface RawStatsParams {
  kind: PerformanceKind;
  orchestrator: string;
  pipeline?: string;
  model?: string;
}

export async function getRawStats(params: RawStatsParams): Promise<RawStatsResponse> {
  const qs = new URLSearchParams();
  qs.set("orchestrator", params.orchestrator);
  if (params.pipeline) qs.set("pipeline", params.pipeline);
  if (params.model) qs.set("model", params.model);
  const url = `${baseFor(params.kind)}/api/raw_stats?${qs.toString()}`;
  return rawStatsResponseSchema.parse(await fetchJson(url));
}
