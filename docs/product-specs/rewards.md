# Product spec — Rewards

Fifth domain. Adds new routes the old UI never had — the protocol-explorer's `/rewards/*` endpoints didn't exist when the old UI was built, so we're filling in a gap.

The domain mirrors the payouts domain structurally. They are deliberately kept as parallel domains; no shared base.

## Routes

| URL                              | Component                                     | Purpose                                     |
| -------------------------------- | --------------------------------------------- | ------------------------------------------- |
| `/reports/rewards/leaderboard`   | `RewardLeaderboard`                           | Configurable date range + sort, top-N table |
| `/reports/rewards/daily`         | redirect → `/reports/rewards/daily/{today}`   |                                             |
| `/reports/rewards/weekly`        | redirect → `/reports/rewards/weekly/{today}`  |                                             |
| `/reports/rewards/monthly`       | redirect → `/reports/rewards/monthly/{today}` |                                             |
| `/reports/rewards/daily/:date`   | `RewardSummary kind="daily"`                  | One-day aggregate + leaderboard             |
| `/reports/rewards/weekly/:date`  | `RewardSummary kind="weekly"`                 | One-ISO-week aggregate + leaderboard        |
| `/reports/rewards/monthly/:date` | `RewardSummary kind="monthly"`                | One-calendar-month aggregate + leaderboard  |

The `/reports` landing page (owned by the payouts domain) gains four new cards pointing here.

## Data sources

Exactly one provider: `network-explorer`.

- `GET /rewards/summary/daily/{date}` / `/weekly/{date}` / `/monthly/{date}` — aggregates only.
- `GET /rewards/leaderboard?from=&to=&sort=&limit=&cursor=` — per-orchestrator rows.
- `GET /reports/rewards.csv?from=&to=` — CSV export.

## Summary page

Header: "{Daily|Weekly|Monthly} Reward Report: {date}".

Four summary stats:

1. Reward Calls (count)
2. Total Tokens (LPT + USD)
3. Orchestrator Share (LPT + USD)
4. Delegators Share (LPT + USD)

Leaderboard DataGrid columns: Rank, Orchestrator (avatar + label), Reward Calls, Total (LPT/USD/%), Orch (LPT/USD/%). Row click navigates to `/orchestrator/:address`.

Prev/Next navigation at the bottom preserves query string.

## Leaderboard page

Header: "Top Rewards Report". Three filter controls (start date, end date, sort). Sort keys: `orch_tokens_usd` (default), `total_tokens_usd`, `reward_event_count`. CSV download button beside the table.

Columns: Rank, Orchestrator, Reward Calls, Total (LPT/USD), Orch (LPT/USD), Delegators (LPT/USD), Events.

## Units

All token amounts come from the API as decimal LPT strings (not wei). The repo projects them to numbers; the UI labels them "LPT". USD values are decimals from the live LPT-WETH-USD TWAP × Chainlink valuation pipeline.

## States

| Condition           | Render                                       |
| ------------------- | -------------------------------------------- |
| Summary loading     | `CircularProgress` inside the summary card   |
| Summary error       | `Alert severity="error"` above the card      |
| Leaderboard loading | DataGrid shimmer                             |
| Leaderboard error   | `Alert severity="error"` replacing the table |
| Invalid date param  | `Alert severity="error"` at the top          |

## Cross-domain interactions

- Row navigation to `/orchestrator/:address` (URL link, not import).
- The reports landing page lives in the payouts domain; this plan adds rewards links to its static array. No code imports cross the boundary.

## Out of scope

- Charts.
- Pagination beyond the first 100 rows.
- Server-side filter persistence (URL is canonical via React Router).
- `job_type` filter (the rewards endpoints don't accept it).
- Custom CSV column subsets.
