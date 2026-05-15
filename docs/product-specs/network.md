# Product spec — Network

Seventh domain. Surfaces the protocol-explorer's network-wide snapshot and rounds index. Enriches the previously-placeholder Home page with a live KPI strip; adds a dedicated `/rounds` browser.

## Routes

| URL       | Component              | Purpose                                                    |
| --------- | ---------------------- | ---------------------------------------------------------- |
| `/`       | `Home` (in `src/app/`) | Welcome banner + `<NetworkStatsStrip />` + 5 feature cards |
| `/rounds` | `RoundsIndex`          | DataGrid of recent protocol rounds                         |

`Home` lives in `src/app/Home.tsx` because it composes navigation across multiple domains (it has feature cards pointing at orchestrators, gateways, reports, governance, rounds). It only imports from `@/domains/network/ui`, which is allowed for the app layer.

## Data sources

Exactly one provider: `network-explorer`.

- `GET /network/stats` — snapshot used by the strip
- `GET /rounds?limit=&cursor=` — paginated rounds list

## NetworkStatsStrip

8 KPIs in a responsive grid (2/3/4 columns depending on breakpoint):

| Label                | Source field                                               |
| -------------------- | ---------------------------------------------------------- |
| Latest Round         | `latest_round` (helper tooltip: `latest_round_started_at`) |
| Active Orchestrators | `active_orchestrators`                                     |
| Active Delegators    | `active_delegators` (helper tooltip: `total_delegations`)  |
| Gateways Known       | `gateways_known`                                           |
| Total LPT Staked     | `total_lpt_staked` (LPT, 0 decimals)                       |
| Payouts (24h)        | `payouts_usd_24h`                                          |
| Rewards (24h)        | `rewards_usd_24h`                                          |
| Gas Burned (24h)     | `gas_burned_eth_24h` (ETH, 6 decimals)                     |

Footer caption: chain id + last orchestrator-profile refresh timestamp.

## /rounds

DataGrid columns: Round, Started At (UTC), Started Block, Active Orchs, Total LPT Staked, Payouts (USD), Rewards (USD). Default sort: round desc. Default page size 25.

## States

| Condition      | Render                                       |
| -------------- | -------------------------------------------- |
| Stats loading  | `CircularProgress` inside the card           |
| Stats error    | `Alert severity="error"` inside the card     |
| Rounds loading | DataGrid shimmer                             |
| Rounds error   | `Alert severity="error"` replacing the table |

## Out of scope

- Round detail (`/rounds/:id`) and round-events views — endpoints exist; deferring.
- Live polling (uses TanStack Query's 60s staleTime).
- Charts of historical stats over rounds.
- Cursor-paginated "Load more" on rounds.
