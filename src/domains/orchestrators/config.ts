/**
 * Static configuration for the orchestrators domain. Values that are
 * arbitrary product decisions live here; values that come from the user's
 * environment live in `src/providers/env.ts`.
 */

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

/** Where the "View on Livepeer" link points. */
export const LIVEPEER_EXPLORER_ORCHESTRATOR_URL = (address: string): string =>
  `https://explorer.livepeer.org/accounts/${address}/orchestrating`;
