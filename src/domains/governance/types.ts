/**
 * Governance domain types.
 *
 * The repo projects provider rows (`ProposalRow`, `VoteRow`) into these
 * shapes so the UI never reasons about wire formats — strings are parsed
 * into numbers, support codes into labels, descriptions into titles.
 */

export type ProposalStatus =
  | "Executed"
  | "Succeeded"
  | "Defeated"
  | "Active"
  | "Pending"
  | "Unknown";

export type SupportLabel = "For" | "Against" | "Abstain";

export interface TallyAmounts {
  forLpt: number;
  againstLpt: number;
  abstainLpt: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string | null;
  proposerIdentity: VoterIdentity | null;
  createdAt: string;
  createdBlock: number;
  executed: boolean;
  executedAt: string | null;
  voteStartBlock: number | null;
  voteEndBlock: number | null;
  tally: TallyAmounts;
}

export interface Vote {
  proposalId: string;
  voterAddress: string;
  voterIdentity: VoterIdentity | null;
  support: SupportLabel;
  stakeLpt: number;
  reason: string | null;
  blockTimestamp: string | null;
}

export interface VoterIdentity {
  address: string;
  displayName: string | null;
  avatarUrl: string | null;
}

/** Map of lowercased eth address → identity, used to hydrate proposers/voters. */
export type IdentityIndex = ReadonlyMap<string, VoterIdentity>;

export interface ProposalsListResult {
  data: Proposal[];
}

export interface VotesListResult {
  data: Vote[];
}

/** Conservative lower bound on the current arbitrum block. See DD-003. */
export interface BlockFloor {
  floor: number | null;
}
