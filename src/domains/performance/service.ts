import { GLOBAL_REGION, GLOBAL_REGION_ID } from "./config";
import type { LeaderboardRow, Mode, Region } from "./types";

/**
 * Determine whether the user has selected AI mode.
 * Matches the old UI: AI requires BOTH pipeline and model to be set.
 */
export function detectMode(input: { pipeline?: string | null; model?: string | null }): Mode {
  return input.pipeline && input.model ? "ai" : "transcoding";
}

/**
 * Filter the API region list to those that apply to the current mode,
 * sort alphabetically by name, and prepend the GLOBAL sentinel.
 */
export function regionOptions(apiRegions: ReadonlyArray<Region>, mode: Mode): Region[] {
  const filtered =
    mode === "ai"
      ? apiRegions.filter((r) => r.type === "ai")
      : apiRegions.filter((r) => r.type !== "ai");
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  return [GLOBAL_REGION, ...sorted];
}

export function isGlobalRegion(regionId: string | null | undefined): boolean {
  return !regionId || regionId === GLOBAL_REGION_ID;
}

/* ---------- formatters ---------- */

export function formatScore(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

export function formatTimestamp(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return "—";
  const d = new Date(unixSeconds * 1000);
  return d.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function formatDecimal(value: number | null, fractionDigits = 3): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(fractionDigits);
}

export function shortAddress(address: string): string {
  if (!address || address.length < 10) return address ?? "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function rowLabel(row: LeaderboardRow): string {
  const n = row.identity?.displayName?.trim();
  return n ? n : shortAddress(row.address);
}

/** Default leaderboard sort: total score descending. Stable for ties. */
export function rankByScore(rows: ReadonlyArray<LeaderboardRow>): LeaderboardRow[] {
  return [...rows].sort((a, b) => b.totalScore - a.totalScore);
}

/** Pretty-print an unknown JSON payload string. */
export function prettyJson(raw: string | null): string {
  if (!raw) return "";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
