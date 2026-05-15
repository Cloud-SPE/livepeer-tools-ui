import type { BlockFloor, Proposal, ProposalStatus, TallyAmounts, Vote } from "./types";

/**
 * Pure derivation functions for the governance domain. No fetches, no React.
 * All UI logic that doesn't belong inside JSX lives here so it can be
 * unit-tested in isolation.
 */

/** First non-empty line of the proposal description, stripping a leading "#". */
export function getTitle(description: string): string {
  if (!description) return "Untitled Proposal";
  for (const raw of description.split("\n")) {
    const line = raw.replace(/^#+\s*/, "").trim();
    if (line) return line;
  }
  return "Untitled Proposal";
}

/** "0x1234...abcd" — same convention as the orchestrators domain. */
export function shortAddress(address: string): string {
  if (!address || address.length < 10) return address ?? "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** What to render for a proposer / voter when identity may be missing. */
export function identityLabel(address: string | null, displayName: string | null): string {
  const name = displayName?.trim();
  if (name) return name;
  if (address) return shortAddress(address);
  return "Unknown";
}

/**
 * Derive a proposal status from the API shape plus the network's
 * conservative block floor. See DD-003 for the rules.
 */
export function deriveStatus(p: Proposal, blockFloor: BlockFloor): ProposalStatus {
  if (p.executed) return "Executed";
  if (p.voteEndBlock == null) return "Unknown";

  const floor = blockFloor.floor;
  if (floor == null) {
    // Without a floor we can only resolve executed; everything else is
    // "Unknown" rather than guessing wrong.
    return "Unknown";
  }

  if (p.voteEndBlock < floor) {
    // Definitely past. Pick succeeded vs defeated from the tally.
    const tally = p.tally;
    const total = tally.forLpt + tally.againstLpt + tally.abstainLpt;
    if (total === 0) return "Defeated";
    return tally.forLpt > tally.againstLpt ? "Succeeded" : "Defeated";
  }
  if (p.voteStartBlock != null && p.voteStartBlock > floor) return "Pending";
  return "Active";
}

/* ---------- tally breakdown ---------- */

export interface TallyBreakdown {
  totalLpt: number;
  forPct: number;
  againstPct: number;
  abstainPct: number;
  /** For / (For + Against), in percent. Excludes abstain. */
  totalSupportPct: number;
}

export function tallyBreakdown(tally: TallyAmounts): TallyBreakdown {
  const total = tally.forLpt + tally.againstLpt + tally.abstainLpt;
  const safe = (n: number, d: number): number => (d > 0 ? (n / d) * 100 : 0);
  const forAgainst = tally.forLpt + tally.againstLpt;
  return {
    totalLpt: total,
    forPct: safe(tally.forLpt, total),
    againstPct: safe(tally.againstLpt, total),
    abstainPct: safe(tally.abstainLpt, total),
    totalSupportPct: safe(tally.forLpt, forAgainst),
  };
}

/* ---------- formatters ---------- */

export function formatLpt(amount: number): string {
  if (!Number.isFinite(amount)) return "0";
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(pct: number, fractionDigits = 2): string {
  if (!Number.isFinite(pct)) return "0%";
  return `${pct.toFixed(fractionDigits)}%`;
}

/**
 * Hydrate the title field on a list of proposals. Repo returns them with
 * `title: ""`; this is the place that decides what to show.
 */
export function hydrateTitles(proposals: ReadonlyArray<Proposal>): Proposal[] {
  return proposals.map((p) => ({ ...p, title: getTitle(p.description) }));
}

/** Sort newest-first by created_block. Stable for ties. */
export function rankByCreatedDesc(proposals: ReadonlyArray<Proposal>): Proposal[] {
  return [...proposals].sort((a, b) => b.createdBlock - a.createdBlock);
}

/** Per-voter share-of-vote percentage within a single proposal's tally. */
export function voteSharePct(vote: Vote, totalLpt: number): number {
  if (totalLpt <= 0) return 0;
  return (vote.stakeLpt / totalLpt) * 100;
}
