import type { Gateway, GatewayKind, GatewayPayoutRow } from "./types";

/* ---------- formatters ---------- */

export function formatEth(value: number, fractionDigits = 4): string {
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

export function shortAddress(address: string): string {
  if (!address || address.length < 10) return address ?? "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function gatewayLabel(g: Gateway): string {
  const n = g.displayName?.trim();
  return n ? n : shortAddress(g.address);
}

export function avatarInitial(g: Gateway): string {
  const label = gatewayLabel(g);
  return label.charAt(0).toUpperCase();
}

export function kindLabel(kind: GatewayKind): string {
  if (kind === "ai") return "AI";
  if (kind === "transcoding") return "Transcoding";
  return "Unknown";
}

/** What to render in the recipient column on a payouts row. */
export function recipientLabel(row: GatewayPayoutRow): string {
  const n = row.toIdentity?.displayName?.trim();
  return n ? n : shortAddress(row.toAddress);
}
