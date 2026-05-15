import type { EffectiveGranularity, Granularity, TicketSeriesPoint } from "./types";

/* ---------- date helpers ---------- */

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

export function todayIso(now: Date = new Date()): string {
  return formatIsoDate(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
  );
}

export function daysAgoIso(n: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - n);
  return formatIsoDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
}

/**
 * Inclusive span in days between two ISO date strings. Returns null on
 * invalid input or when end is before start.
 */
export function spanInDays(start: string, end: string): number | null {
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  if (!s || !e) return null;
  if (e.getTime() < s.getTime()) return null;
  return Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
}

/* ---------- granularity ---------- */

export function resolveGranularity(
  setting: Granularity,
  spanDays: number | null,
): EffectiveGranularity {
  if (setting !== "auto") return setting;
  if (spanDays == null || spanDays <= 90) return "daily";
  if (spanDays <= 540) return "weekly";
  return "monthly";
}

/** ISO Monday of the week containing date `d` (UTC). */
function startOfIsoWeek(d: Date): Date {
  const dow = d.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + offset);
  return out;
}

function bucketKey(dateStr: string, kind: EffectiveGranularity): string {
  if (kind === "daily") return dateStr;
  const d = parseIsoDate(dateStr);
  if (!d) return dateStr;
  if (kind === "weekly") return formatIsoDate(startOfIsoWeek(d));
  // monthly — YYYY-MM
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Aggregate a daily series into the requested granularity. Daily input
 * passes through unchanged; weekly/monthly groups by ISO Monday / calendar
 * month and sums counts. Output is sorted ascending by bucket key.
 */
export function aggregateByGranularity(
  series: ReadonlyArray<TicketSeriesPoint>,
  kind: EffectiveGranularity,
): TicketSeriesPoint[] {
  if (kind === "daily") return [...series];
  const sums = new Map<string, number>();
  for (const { date, count } of series) {
    const key = bucketKey(date, kind);
    sums.set(key, (sums.get(key) ?? 0) + count);
  }
  return Array.from(sums.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, count]) => ({ date, count }));
}

/* ---------- labels ---------- */

export function granularityYAxisLabel(kind: EffectiveGranularity): string {
  if (kind === "weekly") return "Tickets / week";
  if (kind === "monthly") return "Tickets / month";
  return "Tickets / day";
}

export function granularityChartTitle(kind: EffectiveGranularity): string {
  if (kind === "weekly") return "Winning Tickets — Weekly (ISO week, starts Mon)";
  if (kind === "monthly") return "Winning Tickets — Monthly";
  return "Winning Tickets — Daily";
}
