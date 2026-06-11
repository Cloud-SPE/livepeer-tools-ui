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
