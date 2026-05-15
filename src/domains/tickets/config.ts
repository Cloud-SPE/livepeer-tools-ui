import type { JobType } from "./types";

/** Hard upper bound on selectable span. Matches the old UI. */
export const MAX_SPAN_DAYS = 730;

/** Default date range when the URL has none. */
export const DEFAULT_RANGE_DAYS = 30;

/** Chart line colors. Match the old UI. */
export const AI_COLOR = "rgba(75, 192, 192, 1)";
export const TRANSCODING_COLOR = "rgba(153, 102, 255, 1)";

export const JOB_TYPES: ReadonlyArray<{ value: JobType; label: string }> = [
  { value: "both", label: "Both" },
  { value: "ai", label: "AI" },
  { value: "transcoding", label: "Transcoding" },
];
