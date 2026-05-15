# 002 — Domain: governance

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Port the old `/vote/history` route to the new architecture as the second business domain. Match the old two-pane visual (proposal list on the left, selected proposal detail on the right with the votes table and per-voter dialog) exactly. Implement the client-side proposal status derivation from [DD-003](../design-docs/proposal-status-derivation.md).

## Acceptance criteria

- [ ] `src/domains/governance/` exists with the full layered stack.
- [ ] `repo.ts` imports only from `src/providers/network-explorer`.
- [ ] The route `/vote/history` renders two panes: proposals on the left, detail on the right.
- [ ] Proposals show their derived status with the correct color from the old UI.
- [ ] Detail pane shows: title, status chip, proposer (name when known, address fallback), "View on Livepeer" link to `https://explorer.livepeer.org/treasury/{id}`, total stake voted, tally breakdown (For/Against/Abstain with stake + percentage), votes table.
- [ ] Clicking a voter row opens a Dialog listing all votes by that voter across proposals.
- [ ] Proposer and voter identity (display name + avatar) is hydrated from `/orchestrators`.
- [ ] Structural tests still pass — governance does NOT cross-import the orchestrators domain.
- [ ] At least 6 unit tests for `service.ts` (status derivation cases, tally math, title extraction, support label).

## Steps

1. Update [DD-003](../design-docs/proposal-status-derivation.md) to specify the `latest_round_started_block` heuristic.
2. `types.ts` — `Proposal`, `Vote`, `VoterIdentity`, `ProposalStatus`, `TallyBreakdown`, `ProposalsListResult`, `VotesListResult`.
3. `config.ts` — status colors, treasury URL builder.
4. `repo.ts` — `listProposals`, `getProposal`, `listVotesForProposal`, `listVotesByVoter`, `getNetworkBlockFloor`, `getIdentityIndex`.
5. `service.ts` — `deriveStatus`, `supportLabel`, `getTitle`, `formatStake`, `shortAddress`, `tallyBreakdown`.
6. `runtime.ts` — `useProposals`, `useProposal`, `useVotesForProposal`, `useVotesByVoter`, `useNetworkBlockFloor`, `useIdentityIndex`, `votingHistoryLoader`.
7. `ui/VotingHistory.tsx`, `ProposalDetailPane.tsx`, `VotesTable.tsx`, `AllVotesByVoterDialog.tsx`, `ui/index.tsx` with the Route fragment.
8. Wire into `src/app/routes.tsx`.
9. Tests in `tests/governance/service.test.ts`.
10. Write `docs/product-specs/governance.md`.

## Decisions log

- Proposer + voter identity hydration is done by calling `/orchestrators` directly from the governance repo. Governance does NOT import from the orchestrators domain — both are provider consumers, and the identity join is part of the governance vocabulary.
- The dialog "All Votes by Voter" fetches `GET /governance/votes?voter={address}` on open rather than scanning the proposals cache. Server-side filter is canonical.
- Proposal status is computed in `service.deriveStatus(proposal, floor)`, not in `repo`. Repo returns raw shape; service derives.
- All identity hydration is best-effort. If the API has no matching orchestrator, fall back to the short address. The UI never blocks on identity.

## Test plan

- Unit-test the status derivation against all six cases (Executed / Pending / Active / Succeeded / Defeated / Unknown).
- Unit-test `getTitle` against multi-line descriptions, leading hash, empty input.
- Unit-test `tallyBreakdown` for zero-totals, all-yes, all-no, mixed.
- After wiring, hit `/vote/history` and confirm the layout renders against the live API.
