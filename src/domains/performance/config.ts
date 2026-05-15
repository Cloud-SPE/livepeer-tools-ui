/** Sentinel meaning "no region filter" — UI-only; we never send it to the API. */
export const GLOBAL_REGION_ID = "GLOBAL";

export const GLOBAL_REGION = {
  id: GLOBAL_REGION_ID,
  name: "Global",
  type: "any",
} as const;
