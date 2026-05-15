import { env } from "@/utils/env";
import type { PeriodKind, SortKey } from "./types";

export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 500;

export const SORT_KEYS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "orch_tokens_usd", label: "Orchestrator Tokens (USD)" },
  { value: "total_tokens_usd", label: "Total Tokens (USD)" },
  { value: "reward_event_count", label: "Reward Calls" },
];

export const PERIOD_LABELS: Record<PeriodKind, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function buildRewardsCsvUrl(params: {
  from: string;
  to: string;
  orchestrator?: string;
}): string {
  const qs = new URLSearchParams({ from: params.from, to: params.to });
  if (params.orchestrator) qs.set("orchestrator", params.orchestrator);
  return `${env.networkExplorer.baseUrl}/reports/rewards.csv?${qs.toString()}`;
}
