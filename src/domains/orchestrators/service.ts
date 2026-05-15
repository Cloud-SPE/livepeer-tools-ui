import type { Orchestrator } from "./types";

/**
 * Domain-level business logic. Pure functions — no fetches, no React.
 * The UI layer calls these for derived/computed values; tests cover them
 * in isolation.
 */

/** "0x1234...abcd" — the standard short form used in cards and tables. */
export function shortAddress(address: string): string {
  if (!address || address.length < 10) return address ?? "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * What to render as the orchestrator's name. Falls back to the short
 * address when the API has no ENS / display name.
 */
export function displayLabel(orch: Orchestrator): string {
  const name = orch.displayName?.trim();
  if (name) return name;
  return shortAddress(orch.address);
}

/** First-letter avatar fallback, matches the old MUI <Avatar /> behavior. */
export function avatarInitial(orch: Orchestrator): string {
  const label = displayLabel(orch);
  return label.charAt(0).toUpperCase();
}

/**
 * Compact LPT amount string with thousands separators and at most 2
 * decimals. Matches the old UI's "X LPT" rendering.
 */
export function formatLpt(amount: number): string {
  if (!Number.isFinite(amount)) return "0 LPT";
  const fixed = amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${fixed} LPT`;
}

/** Percent rendering: takes 0..100 and renders with up to 2 decimals + "%". */
export function formatPercent(pct: number): string {
  if (!Number.isFinite(pct)) return "0%";
  const fixed = pct.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${fixed}%`;
}

/**
 * Sort orchestrators by total stake descending (the canonical ranking the
 * old UI used). Stable: ties preserve input order.
 */
export function rankByStake(orchs: ReadonlyArray<Orchestrator>): Orchestrator[] {
  return [...orchs].sort((a, b) => b.totalStakeLpt - a.totalStakeLpt);
}
