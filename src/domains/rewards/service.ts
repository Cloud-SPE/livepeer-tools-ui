import type { DateRange, PeriodKind, RewardLeaderboardRow } from "./types";

/* ---------- date helpers (mirror payouts) ---------- */

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

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

function startOfIsoWeek(d: Date): Date {
  const dow = d.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDays(d, offset);
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfNextMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

export function rangeFor(kind: PeriodKind, iso: string): DateRange | null {
  const d = parseIsoDate(iso);
  if (!d) return null;
  if (kind === "daily") {
    return { from: formatIsoDate(d), to: formatIsoDate(addDays(d, 1)) };
  }
  if (kind === "weekly") {
    const mon = startOfIsoWeek(d);
    return { from: formatIsoDate(mon), to: formatIsoDate(addDays(mon, 7)) };
  }
  return { from: formatIsoDate(startOfMonth(d)), to: formatIsoDate(startOfNextMonth(d)) };
}

export function shiftPeriod(kind: PeriodKind, iso: string, direction: -1 | 1): string {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  if (kind === "daily") return formatIsoDate(addDays(d, direction));
  if (kind === "weekly") return formatIsoDate(addDays(d, 7 * direction));
  const mo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + direction, d.getUTCDate()));
  return formatIsoDate(mo);
}

/* ---------- formatters ---------- */

export function formatLpt(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatInt(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Math.trunc(value).toLocaleString();
}

export function formatPercent(pct: number, fractionDigits = 2): string {
  if (!Number.isFinite(pct)) return "0%";
  return `${pct.toFixed(fractionDigits)}%`;
}

export function shortAddress(address: string): string {
  if (!address || address.length < 10) return address ?? "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function rowLabel(row: RewardLeaderboardRow): string {
  const n = row.displayName?.trim();
  return n ? n : shortAddress(row.orchestratorAddress);
}

export function formatHumanDate(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
