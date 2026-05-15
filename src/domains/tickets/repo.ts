import { networkExplorer, unwrap } from "@/providers/network-explorer";
import type { DailyTimeseriesParams, JobType, TicketSeriesPoint, TicketsTimeseries } from "./types";

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function jobTypeOf(v: unknown): JobType {
  return v === "ai" || v === "transcoding" ? v : "both";
}

function projectSeries(rows: unknown): TicketSeriesPoint[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return { date: String(r["date"] ?? ""), count: num(r["count"]) };
  });
}

export async function getDailyTimeseries(
  params: DailyTimeseriesParams,
): Promise<TicketsTimeseries> {
  const jobType: JobType = params.jobType ?? "both";
  const query: Record<string, string> = { start: params.start, end: params.end };
  if (jobType !== "both") query["job_type"] = jobType;

  const body = (await unwrap(
    networkExplorer.GET("/tickets/timeseries/daily", { params: { query } }),
  )) as {
    start?: string;
    end?: string;
    job_type?: string;
    ai?: unknown;
    transcoding?: unknown;
  };

  return {
    start: String(body.start ?? params.start),
    end: String(body.end ?? params.end),
    jobType: jobTypeOf(body.job_type),
    ai: projectSeries(body.ai),
    transcoding: projectSeries(body.transcoding),
  };
}
