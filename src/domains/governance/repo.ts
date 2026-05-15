import { networkExplorer, unwrap } from "@/providers/network-explorer";
import { DEFAULT_PROPOSALS_LIMIT, DEFAULT_VOTES_LIMIT } from "./config";
import type {
  BlockFloor,
  IdentityIndex,
  Proposal,
  ProposalsListResult,
  SupportLabel,
  TallyAmounts,
  Vote,
  VoterIdentity,
  VotesListResult,
} from "./types";

/* ---------- helpers ---------- */

function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function intOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function supportLabelFromCode(code: unknown): SupportLabel {
  const n = typeof code === "number" ? code : Number(code);
  if (n === 1) return "For";
  if (n === 2) return "Abstain";
  return "Against";
}

/* ---------- projections ---------- */

function projectTally(raw: unknown): TallyAmounts {
  const t = (raw ?? {}) as Record<string, unknown>;
  // Live API ships weights as wei-scale (1 LPT = 1e18) decimal strings.
  return {
    forLpt: num(t["for_weight"]) / 1e18,
    againstLpt: num(t["against_weight"]) / 1e18,
    abstainLpt: num(t["abstain_weight"]) / 1e18,
  };
}

function projectProposal(row: unknown, identities: IdentityIndex): Proposal {
  const r = row as Record<string, unknown>;
  const proposer = ((r["proposer"] as string | null) ?? null)?.toLowerCase() ?? null;
  return {
    id: String(r["proposal_id"] ?? ""),
    title: "", // populated by service.getTitle
    description: (r["description"] as string | null) ?? "",
    proposer,
    proposerIdentity: proposer ? (identities.get(proposer) ?? null) : null,
    createdAt: String(r["created_at"] ?? ""),
    createdBlock: num(r["created_block"]),
    executed: Boolean(r["executed"]),
    executedAt: (r["executed_at"] as string | null) ?? null,
    voteStartBlock: intOrNull(r["vote_start"]),
    voteEndBlock: intOrNull(r["vote_end"]),
    tally: projectTally(r["vote_tally"]),
  };
}

function projectVote(row: unknown, identities: IdentityIndex): Vote {
  const r = row as Record<string, unknown>;
  const voter = String(r["voter"] ?? "").toLowerCase();
  // The API ships LPT weight as a wei-scale decimal string (1 LPT = 1e18).
  // Convert here so the domain works in whole LPT.
  const weightWei = num(r["weight"]);
  return {
    proposalId: String(r["proposal_id"] ?? ""),
    voterAddress: voter,
    voterIdentity: identities.get(voter) ?? null,
    support: supportLabelFromCode(r["support"]),
    stakeLpt: weightWei / 1e18,
    reason: (r["reason"] as string | null) ?? null,
    blockTimestamp: (r["block_timestamp"] as string | null) ?? null,
  };
}

/* ---------- identity index ---------- */

/**
 * Fetch the orchestrators list and build a lowercase-address → identity
 * map. Used to hydrate proposers and voters. Best-effort: callers must
 * tolerate addresses missing from the index (we fall back to short-form).
 */
export async function getIdentityIndex(): Promise<IdentityIndex> {
  const body = (await unwrap(
    networkExplorer.GET("/orchestrators", { params: { query: { limit: 500 } } }),
  )) as { data?: unknown[] };

  const out = new Map<string, VoterIdentity>();
  for (const row of body.data ?? []) {
    const r = row as Record<string, unknown>;
    const address = String(r["address"] ?? "").toLowerCase();
    if (!address) continue;
    out.set(address, {
      address,
      displayName: (r["display_name"] as string | null) ?? null,
      avatarUrl: (r["avatar_url"] as string | null) ?? null,
    });
  }
  return out;
}

/* ---------- block floor ---------- */

export async function getBlockFloor(): Promise<BlockFloor> {
  const body = (await unwrap(networkExplorer.GET("/network/stats", {}))) as {
    latest_round_started_block?: string | null;
  };
  return { floor: intOrNull(body.latest_round_started_block) };
}

/* ---------- proposals ---------- */

export async function listProposals(identities: IdentityIndex): Promise<ProposalsListResult> {
  const body = (await unwrap(
    networkExplorer.GET("/governance/proposals", {
      params: { query: { limit: DEFAULT_PROPOSALS_LIMIT } },
    }),
  )) as { data?: unknown[] };
  return {
    data: (body.data ?? []).map((row) => projectProposal(row, identities)),
  };
}

export async function getProposal(
  proposalId: string,
  identities: IdentityIndex,
): Promise<Proposal> {
  const row = (await unwrap(
    networkExplorer.GET("/governance/proposals/{proposal_id}", {
      params: { path: { proposal_id: proposalId } },
    }),
  )) as unknown;
  return projectProposal(row, identities);
}

/* ---------- votes ---------- */

export async function listVotesForProposal(
  proposalId: string,
  identities: IdentityIndex,
): Promise<VotesListResult> {
  const body = (await unwrap(
    networkExplorer.GET("/governance/votes", {
      params: {
        query: { proposal_id: proposalId, limit: DEFAULT_VOTES_LIMIT },
      },
    }),
  )) as { data?: unknown[] };
  return {
    data: (body.data ?? []).map((row) => projectVote(row, identities)),
  };
}

export async function listVotesByVoter(
  voter: string,
  identities: IdentityIndex,
): Promise<VotesListResult> {
  const body = (await unwrap(
    networkExplorer.GET("/governance/votes", {
      params: { query: { voter, limit: DEFAULT_VOTES_LIMIT } },
    }),
  )) as { data?: unknown[] };
  return {
    data: (body.data ?? []).map((row) => projectVote(row, identities)),
  };
}
