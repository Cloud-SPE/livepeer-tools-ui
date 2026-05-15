import { env } from "@/utils/env";
import type { JobType, PeriodKind, SortKey } from "./types";

export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 500;

export const JOB_TYPES: ReadonlyArray<{ value: JobType; label: string }> = [
  { value: "both", label: "Both (AI + Transcoding)" },
  { value: "ai", label: "AI" },
  { value: "transcoding", label: "Transcoding" },
];

export const SORT_KEYS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "commission_usd", label: "Commission (USD)" },
  { value: "face_value_usd", label: "Total (USD)" },
  { value: "ticket_count", label: "Tickets Won" },
];

export const PERIOD_LABELS: Record<PeriodKind, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

/**
 * Build the URL for the network-explorer CSV export. We do NOT fetch this
 * client-side — the browser handles the download via a regular anchor tag.
 */
export function buildPayoutsCsvUrl(params: {
  from: string;
  to: string;
  jobType?: JobType;
  orchestrator?: string;
}): string {
  const qs = new URLSearchParams({ from: params.from, to: params.to });
  if (params.jobType && params.jobType !== "both") qs.set("job_type", params.jobType);
  if (params.orchestrator) qs.set("orchestrator", params.orchestrator);
  return `${env.networkExplorer.baseUrl}/reports/payouts.csv?${qs.toString()}`;
}
