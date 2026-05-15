import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/utils/queryClient";
import {
  getBlockFloor,
  getIdentityIndex,
  listProposals,
  listVotesByVoter,
  listVotesForProposal,
} from "./repo";
import type { BlockFloor, IdentityIndex, ProposalsListResult, VotesListResult } from "./types";

/* ---------- query configs ---------- */

const IDENTITY_KEY = ["governance", "identity-index"] as const;
const FLOOR_KEY = ["governance", "block-floor"] as const;
const PROPOSALS_KEY = ["governance", "proposals"] as const;
const votesForKey = (proposalId: string) => ["governance", "votes-for", proposalId] as const;
const votesByKey = (voter: string) => ["governance", "votes-by", voter.toLowerCase()] as const;

const identityConfig = () => ({
  queryKey: IDENTITY_KEY,
  queryFn: getIdentityIndex,
  // Identity lookups churn slowly; cache longer.
  staleTime: 5 * 60_000,
});

const floorConfig = () => ({
  queryKey: FLOOR_KEY,
  queryFn: getBlockFloor,
  // Rounds transition ~daily; refresh aggressively in case a long-lived
  // tab is open and a round transitions while a proposal is being viewed.
  staleTime: 60_000,
});

/**
 * Proposals depend on the identity index — both must be in cache before
 * `listProposals(identities)` can run. We compose by reading from cache.
 */
async function fetchProposalsWithIdentities(): Promise<ProposalsListResult> {
  const identities = await queryClient.fetchQuery(identityConfig());
  return listProposals(identities);
}
const proposalsConfig = () => ({
  queryKey: PROPOSALS_KEY,
  queryFn: fetchProposalsWithIdentities,
});

async function fetchVotesForProposal(proposalId: string): Promise<VotesListResult> {
  const identities = await queryClient.fetchQuery(identityConfig());
  return listVotesForProposal(proposalId, identities);
}
const votesForConfig = (proposalId: string) => ({
  queryKey: votesForKey(proposalId),
  queryFn: () => fetchVotesForProposal(proposalId),
});

async function fetchVotesByVoter(voter: string): Promise<VotesListResult> {
  const identities = await queryClient.fetchQuery(identityConfig());
  return listVotesByVoter(voter, identities);
}
const votesByConfig = (voter: string) => ({
  queryKey: votesByKey(voter),
  queryFn: () => fetchVotesByVoter(voter),
});

/* ---------- hooks ---------- */

export function useIdentityIndex(): UseQueryResult<IdentityIndex, Error> {
  return useQuery(identityConfig());
}

export function useBlockFloor(): UseQueryResult<BlockFloor, Error> {
  return useQuery(floorConfig());
}

export function useProposals(): UseQueryResult<ProposalsListResult, Error> {
  return useQuery(proposalsConfig());
}

export function useVotesForProposal(
  proposalId: string | null,
): UseQueryResult<VotesListResult, Error> {
  return useQuery({
    ...votesForConfig(proposalId ?? ""),
    enabled: !!proposalId,
  });
}

export function useVotesByVoter(voter: string | null): UseQueryResult<VotesListResult, Error> {
  return useQuery({
    ...votesByConfig(voter ?? ""),
    enabled: !!voter,
  });
}

/* ---------- loaders ---------- */

/** Warm the cache for the voting history page. */
export async function votingHistoryLoader(_args: LoaderFunctionArgs): Promise<null> {
  await Promise.all([
    queryClient.prefetchQuery(proposalsConfig()),
    queryClient.prefetchQuery(floorConfig()),
  ]);
  return null;
}
