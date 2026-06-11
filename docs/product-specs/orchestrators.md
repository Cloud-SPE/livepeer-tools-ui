# Product spec — Orchestrators

The first domain to ship end-to-end. Reference template for every later domain.

## Routes

| URL                          | Component            | Purpose                                             |
| ---------------------------- | -------------------- | --------------------------------------------------- |
| `/orchestrators`             | `Orchestrators`      | List of active orchestrators, ranked by total stake |
| `/orchestrator/:eth_address` | `OrchestratorDetail` | Single orchestrator profile                         |

The detail URL deliberately uses `eth_address` (singular path segment) to preserve link compatibility with the old `livepeer-tools-ui`.

## Data sources

Exactly one provider: `network-explorer`.

- `GET /orchestrators?limit=...&cursor=...` — list endpoint
- `GET /orchestrators/{address}` — single profile
- `GET /transcoders/{transcoder}/delegators/block/{block}` — detail delegators tab

Profile responses ship as `OrchestratorProfileRow` (or a `{ data: OrchestratorProfileRow[], meta }` wrapper). The repo projects them into the domain `Orchestrator` type.

## List view

Renders a responsive MUI `Grid` of `OrchestratorCard`s, three columns at `md+`, two at `sm`, one at `xs`. Cards are click-targets that navigate to the detail view.

Each card shows:

- Avatar (from `avatar_url`) or a single-letter fallback
- Display name (or short-form address when `display_name` is null)
- Truncated address `0x1234...abcd`, tooltipped to full address
- Rank (1-indexed position in the stake-sorted list)
- Active state (Yes / No)
- Reward Cut (%)
- Fee Cut (%)
- Total Stake (LPT)
- "View on Livepeer" button → `https://explorer.livepeer.org/accounts/{address}/orchestrating` in a new tab

Sorting is descending by `total_stake`. The API already returns rows in this order, but the UI re-sorts defensively in case the server ordering changes.

## Detail View

The detail view has tabs for overview, payouts, delegators, performance, voting, and CSV exports.

The delegators tab requests the delegator set at the orchestrator profile's `asOfBlock`. It displays current stake per delegator, defined as `pending_stake` when present and positive, otherwise `bonded_principal`. Rows are sorted descending by that displayed current stake. The tab shows profile `total_stake` as Total Stake and the endpoint's `total_bonded_principal` separately as Bonded Principal.

## States

| Condition  | Render                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Loading    | Centered `CircularProgress`                                            |
| Error      | MUI `Alert severity="error"` with `error.message`                      |
| Empty list | The Grid renders empty (acceptable: API always has rows in production) |
| Detail 404 | MUI `Alert severity="warning": "Orchestrator not found."`              |

## Loaders and caching

The route loaders prefetch via the shared `queryClient`. The hook in the component reads the cache; if the prefetch is still in flight when render begins, the hook waits. `staleTime` is the app-wide 30 s default.

## Out of scope (for this plan)

- Pagination UI. The list endpoint supports `cursor`; we render the first page only for now. A "Load more" button or virtualized scroll lands in a follow-up.
- Search / filter.
- Performance score columns (transcoding success rate, AI pipeline support). These come from the `performance` provider via the future `performance` domain.
- CSV exports and payout charts on the detail page — `payouts` domain.
