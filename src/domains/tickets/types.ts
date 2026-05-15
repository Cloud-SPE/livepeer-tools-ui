export type JobType = "both" | "ai" | "transcoding";
export type Granularity = "auto" | "daily" | "weekly" | "monthly";
export type EffectiveGranularity = "daily" | "weekly" | "monthly";

export interface TicketSeriesPoint {
  date: string; // ISO YYYY-MM-DD (or YYYY-MM-DD week-start, or YYYY-MM month)
  count: number;
}

export interface TicketsTimeseries {
  start: string;
  end: string;
  jobType: JobType;
  ai: TicketSeriesPoint[];
  transcoding: TicketSeriesPoint[];
}

export interface DailyTimeseriesParams {
  start: string;
  end: string;
  jobType?: JobType;
}
