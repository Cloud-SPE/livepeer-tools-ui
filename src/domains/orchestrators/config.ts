import { env } from "@/utils/env";

/**
 * Static configuration for the orchestrators domain. Values that are
 * arbitrary product decisions live here; values that come from the user's
 * environment live in `src/utils/env.ts`.
 */

export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 200;

/** Where the "View on Livepeer" link points. */
export const LIVEPEER_EXPLORER_ORCHESTRATOR_URL = (address: string): string =>
  `https://explorer.livepeer.org/accounts/${address}/orchestrating`;

export const LIVEPEER_EXPLORER_ACCOUNT_URL = (address: string): string =>
  `https://explorer.livepeer.org/accounts/${address}`;

export const LIVEPEER_TREASURY_PROPOSAL_URL = (proposalId: string): string =>
  `https://explorer.livepeer.org/treasury/${proposalId}`;

export function buildOrchestratorRewardsCsvUrl(params: {
  address: string;
  start: string;
  end: string;
}): string {
  const qs = new URLSearchParams({
    orchestrator: params.address,
    start: params.start,
    end: params.end,
  });
  return `${env.networkExplorer.baseUrl}/reports/rewards.csv?${qs.toString()}`;
}

export function buildOrchestratorWinningTicketsCsvUrl(params: {
  address: string;
  start: string;
  end: string;
}): string {
  const qs = new URLSearchParams({
    orchestrator: params.address,
    start: params.start,
    end: params.end,
  });
  return `${env.networkExplorer.baseUrl}/reports/payouts.csv?${qs.toString()}`;
}
