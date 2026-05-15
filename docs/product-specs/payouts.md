# Product spec — Payouts

Third domain. Replaces the old `/reports/...` section. Reference template for a domain whose UI composes two endpoints (aggregate + leaderboard) on a single page.

## Routes

| URL                      | Component                             | Purpose                                               |
| ------------------------ | ------------------------------------- | ----------------------------------------------------- |
| `/reports`               | `Reports`                             | Landing — links to each report                        |
| `/reports/top/payout`    | `TopPayout`                           | Configurable date range + sort + job type leaderboard |
| `/reports/daily`         | redirect → `/reports/daily/{today}`   |                                                       |
| `/reports/weekly`        | redirect → `/reports/weekly/{today}`  |                                                       |
| `/reports/monthly`       | redirect → `/reports/monthly/{today}` |                                                       |
| `/reports/daily/:date`   | `PayoutSummary kind="daily"`          | One-day aggregate + leaderboard                       |
| `/reports/weekly/:date`  | `PayoutSummary kind="weekly"`         | One-ISO-week aggregate + leaderboard                  |
| `/reports/monthly/:date` | `PayoutSummary kind="monthly"`        | One-calendar-month aggregate + leaderboard            |

All summary routes accept `?job_type=both|ai|transcoding`. Top-payout accepts `?from=&to=&sort=&job_type=`.

## Data sources

Exactly one provider: `network-explorer`.

- `GET /payouts/summary/daily/{date}` and `/weekly/{date}` and `/monthly/{date}` — aggregates only.
- `GET /payouts/leaderboard?from=&to=&job_type=&sort=&limit=&cursor=` — per-orchestrator rows.
- `GET /reports/payouts.csv?from=&to=&job_type=` — CSV export (browser handles via `<a>`).

## Summary page (daily / weekly / monthly)

Layout:

1. **Header** — "{Daily|Weekly|Monthly} Summary Report: {date} ({job label})"
2. **Filter strip** — date input + job-type selector + "Download CSV" button.
3. **Summary card** — four columns:
   - Number of Winning Tickets
   - Distinct Gateways
   - Total Fees (ETH + USD)
   - Orch Commission (ETH + USD)
4. **Leaderboard DataGrid** — Rank, Orchestrator (avatar + display name or short address), Tickets Won, Total (ETH/USD/%), Commission (ETH/USD/%).
   - "% of total" columns computed client-side using the summary aggregates as denominator.
   - Clicking a row navigates to `/orchestrator/{address}` (composes with the orchestrators domain via the URL).
5. **Prev / Next** navigation at the bottom — preserves the current `job_type` query.

## Top payout page

Layout:

1. Header: "Top Payout Report"
2. Filter grid — Start Date, End Date, Sort By, Job Type. URL is the source of truth; changing any control updates `?from/?to/?sort/?job_type` and the table re-fetches.
3. "Download CSV" button (same window-aligned filters).
4. Leaderboard DataGrid — Rank, Orchestrator, Tickets Won, Total (ETH/USD), Commission (ETH/USD), Distinct Gateways. No per-row navigation (purely a payouts read).

## States

| Condition           | Render                                            |
| ------------------- | ------------------------------------------------- |
| Summary loading     | `CircularProgress` inside the summary card        |
| Summary error       | `Alert severity="error"` above the card           |
| Leaderboard loading | DataGrid's built-in loading shimmer               |
| Leaderboard error   | `Alert severity="error"` in place of the DataGrid |
| Invalid date param  | `Alert severity="error"` at the top               |

## Period semantics

- **Daily** — calendar day in UTC. `from=date`, `to=date+1`.
- **Weekly** — ISO week (Monday 00:00 UTC – next Monday 00:00 UTC). `from`/`to` snap to Monday irrespective of which weekday the input was.
- **Monthly** — calendar month in UTC. `from=first-of-month`, `to=first-of-next-month`.

## Cross-domain interactions

- Clicking an orchestrator row in the summary table navigates to `/orchestrator/{address}` — owned by the orchestrators domain. This is a URL link, not an import.
- The Reports landing card "Daily Winning Tickets Trend" links to `/reports/tickets/daily`. That URL is currently a 404; the tickets domain lands in a later plan.

## Out of scope (for this plan)

- Charts (ETH/USD horizontal bar, tickets bar). Defer to a chart-introduction plan that also covers the orchestrator detail page.
- Pagination beyond the first 100 rows on the leaderboard.
- Server-side sort persistence in the summary tables (the DataGrid sort is client-side only).
- CSV with custom column subsets.
