# DD-003 — Proposal status derivation

**Status:** Active
**Last updated:** 2026-05-15

## Context

The old `livepeer-tools-ui` rendered a proposal-status column derived from `governorContract.state(proposalId)` — a direct Arbitrum RPC call via `ethers`. The full state machine is: Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed.

The new protocol-explorer API (`/api/v1/governance/proposals/{id}`) exposes:

- `executed: boolean`
- `executed_at: string | null`
- `vote_tally: VoteTally`
- `vote_start: string | null` (block number)
- `vote_end: string | null` (block number)

There is no explicit `status` enum field.

## Decision

For v0 we derive status client-side from the shape above. **We do not reintroduce `ethers`.** We do not block scaffolding on a server-side change.

The derivation is implemented in the `governance` domain's `service.ts`. Because `/network/stats` does not expose a true `current_block` field, we use `latest_round_started_block` as a conservative **lower bound** on the current block height. Livepeer rounds transition roughly once per 22 hours (~316k blocks on Arbitrum); proposal vote periods last days to weeks, so the lag is materially smaller than the comparison windows the algorithm operates on.

```
let floor = latest_round_started_block   // lower bound on current_block

if executed:                              "Executed"
elif vote_end is null:                    "Unknown"
elif vote_end < floor:                    // DEFINITELY past
    if for > against (and any tally):     "Succeeded"
    else:                                 "Defeated"
elif vote_start > floor:                  "Pending"           // could be near-active; conservative
else:                                     "Active"            // floor in [vote_start, vote_end]
```

Block-number comparisons use `Number()` — Arbitrum block heights are well under `Number.MAX_SAFE_INTEGER`.

## What we lose

The full state machine collapses to a 5-state model: `Executed | Pending | Active | Succeeded | Defeated | Unknown`. We cannot distinguish:

- **Canceled** — proposal was canceled before voting ended
- **Queued** — proposal passed and is in the timelock queue
- **Expired** — proposal queued but never executed before the timelock window closed

For the audience this UI serves (treasury voters checking results), this loss is acceptable. Canceled and Expired are rare; Queued is transient.

Additionally, the `floor`-vs-`current_block` slack means a freshly-started proposal can render as `Pending` for up to ~22 hours after `vote_start` until the next round transition advances `latest_round_started_block` past `vote_start`. The UI ships a tooltip explaining this on the status chip.

## Follow-up

Track upstream issue: "expose derived proposal status in `ProposalRow`" against the `livepeer-protocol-explorer` repo. Once that ships, this doc gets superseded and we drop the client-side derivation.
