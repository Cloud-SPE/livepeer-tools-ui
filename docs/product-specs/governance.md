# Product spec — Governance

The second domain to ship. Replaces the old `/vote/history` route. Reference for any domain that needs to compose multiple endpoints from a single provider.

## Routes

| URL | Component | Purpose |
| --- | --- | --- |
| `/vote/history` | `VotingHistory` | Treasury proposals with vote breakdown |

## Data sources

Exactly one provider: `network-explorer`. Four endpoints:

- `GET /governance/proposals` — proposal index
- `GET /governance/proposals/{proposal_id}` — single proposal (unused by this route; reserved)
- `GET /governance/votes?proposal_id={id}` — votes for the selected proposal
- `GET /governance/votes?voter={address}` — all votes by a voter, used by the dialog
- `GET /orchestrators?limit=500` — proposer / voter identity hydration
- `GET /network/stats` — `latest_round_started_block` used as conservative current-block floor

## Layout

Two-pane, identical to the old UI:

- **Left** (30% on md+, full-width on xs) — proposal list. Each row shows the title (first line of the description, leading `#` stripped) and the derived status, with a colored left border keyed to the status.
- **Right** (70% on md+) — selected proposal detail card. On first load shows a placeholder ("Select a proposal from the list to view details.").

Status colors:

| Status | Tone | Source |
| --- | --- | --- |
| Executed, Succeeded | success | derived from `executed` + tally |
| Defeated | error | derived from tally past `vote_end` |
| Active, Pending | info | derived from block floor vs vote window |
| Unknown | grey | when block floor or vote_end is missing |

## Detail card

When a proposal is selected:

1. Title with Ballot icon.
2. Status chip.
3. Proposer (orchestrator display name when known, else short-address). Backed by `/orchestrators` identity hydration.
4. "View on Livepeer" button → `https://explorer.livepeer.org/treasury/{id}` (new tab).
5. Total stake voted (sum of all three tally buckets).
6. Total support % — For / (For + Against), four decimal places, with caption explaining the formula.
7. Breakdown rows for For / Against / Abstain showing percentages (four decimals) and LPT amounts.
8. Votes table with five columns: Voter (avatar + label), Support, Stake (LPT), % of Vote, Reason. Row background tinted by support type.

## All Votes by Voter dialog

Clicking any voter row opens a `Dialog` (max-width md). Title shows the avatar + label of the selected voter. Body table lists every proposal the voter participated in: Proposal Title, Status, Support, Stake. Status and Support cells are background-tinted using the same palette as the parent page.

The dialog calls `GET /governance/votes?voter={address}` on open (cached per voter). Proposal titles are resolved from the same `useProposals()` query the parent page already uses.

## Proposal status derivation

Computed client-side in `service.deriveStatus(proposal, blockFloor)` per [DD-003](../design-docs/proposal-status-derivation.md). The `blockFloor` is `latest_round_started_block` from `/network/stats`, a conservative lower bound on the current chain head.

Edge cases:

- A freshly-started proposal may render as `Pending` for up to ~22 hours after `vote_start` until the next round transition advances the floor. Acceptable for an audience reviewing primarily historical proposals.
- Canceled / Queued / Expired states from the on-chain governor are not reproduced; collapsed into `Defeated` / `Succeeded` / `Executed`. See DD-003 for the upstream fix that would lift this.

## States

| Condition | Render |
| --- | --- |
| Proposals loading | Centered `CircularProgress` |
| Proposals error | `Alert severity="error"` with `error.message` |
| No proposal selected | Placeholder card on the right |
| Votes loading (after selection) | Centered `CircularProgress` inside the card |
| Votes error | `Alert severity="error"` inside the card |
| Empty votes | "No votes found for this proposal." row in the table |

## Cross-domain rules

Governance does **not** import from the `orchestrators` domain. Identity hydration is done by calling `/orchestrators` directly from the governance repo — both are network-explorer provider calls. The `Orchestrator` domain type and the `VoterIdentity` type are distinct on purpose.

## Out of scope (for this plan)

- Direct linking to a specific proposal URL (e.g. `/vote/history/123`). The selected proposal lives in component state.
- Filtering or searching the proposals list.
- Sorting other than newest-first.
- Showing the proposer's full orchestrator profile inline. The address is rendered as text; following the orchestrators link is a follow-up.
- CSV export of votes.
