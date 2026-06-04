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

export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatEth(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function formatDecimal(value: number | null, fractionDigits = 3): string {
  if (value == null || !Number.isFinite(value)) return "";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatInt(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Math.trunc(value).toLocaleString();
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

export function parseIsoDate(iso: string): Date | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return dt;
}

export function formatIsoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function lastCalendarYearRange(now: Date = new Date()): { start: string; end: string } {
  const year = now.getUTCFullYear() - 1;
  return {
    start: formatIsoDate(new Date(Date.UTC(year, 0, 1))),
    end: formatIsoDate(new Date(Date.UTC(year, 11, 31))),
  };
}

export function todayIso(now: Date = new Date()): string {
  return formatIsoDate(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
  );
}

export function daysAgoIso(days: number, now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - days);
  return formatIsoDate(d);
}

export function trailingThirtyDaysRange(now: Date = new Date()): { start: string; end: string } {
  return {
    start: daysAgoIso(29, now),
    end: todayIso(now),
  };
}

export function isValidDateRange(start: string, end: string): boolean {
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  return Boolean(s && e && e.getTime() >= s.getTime());
}

export function formatDateTime(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().replace("T", " ").slice(0, 19);
}

export function formatUnixTimestamp(value: number): string {
  if (!Number.isFinite(value)) return "";
  return formatDateTime(new Date(value * 1000).toISOString());
}

export function aggregateTicketCountsByDate(
  tickets: ReadonlyArray<{ blockTimestamp: string }>,
): Array<{ date: string; count: number }> {
  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    const date = ticket.blockTimestamp.slice(0, 10);
    if (!parseIsoDate(date)) continue;
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, count]) => ({ date, count }));
}

export function filterTicketsByDateRange<T extends { blockTimestamp: string }>(
  tickets: ReadonlyArray<T>,
  start: string,
  end: string,
): T[] {
  if (!isValidDateRange(start, end)) return [];
  return tickets.filter((ticket) => {
    const date = ticket.blockTimestamp.slice(0, 10);
    if (!parseIsoDate(date)) return false;
    return date >= start && date <= end;
  });
}

/**
 * Sort orchestrators by total stake descending (the canonical ranking the
 * old UI used). Stable: ties preserve input order.
 */
export function rankByStake(orchs: ReadonlyArray<Orchestrator>): Orchestrator[] {
  return [...orchs].sort((a, b) => b.totalStakeLpt - a.totalStakeLpt);
}
