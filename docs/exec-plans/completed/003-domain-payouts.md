# 003 — Domain: payouts

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Port the Reports section of the old UI: landing page, daily/weekly/monthly payout summary pages, and the Top Payout Report. The new API splits the old all-in-one summary endpoint into two halves — `/payouts/summary/{period}/{date}` for aggregates, `/payouts/leaderboard?from=&to=&...` for per-orchestrator rows. The domain composes both into a single page.

Charts (chart.js) and CSV-driven orchestrator-detail enhancements are deliberately deferred.

## Acceptance criteria

- [ ] `src/domains/payouts/` is fully layered (types, config, repo, service, runtime, ui).
- [ ] `repo.ts` imports only from `src/providers/network-explorer`.
- [ ] `/reports` renders 5 cards: Top Payout, Daily Tickets (deferred — link present), Daily, Weekly, Monthly.
- [ ] `/reports/{daily|weekly|monthly}/:date?job_type=both|ai|transcoding` renders a summary stat strip plus a DataGrid leaderboard for the matching window.
- [ ] `/reports/{daily|weekly|monthly}` (no date) redirects to the same with today's date.
- [ ] `/reports/top/payout?from=&to=&sort=&job_type=` renders a DataGrid of leaderboard rows with controllable filters.
- [ ] CSV export buttons on summary and top-payout pages link to `/reports/payouts.csv?...` in a new tab.
- [ ] Date prev/next navigation works on summary pages.
- [ ] Unit tests for period range helpers and formatters.
- [ ] Structural tests still pass.

## Steps

1. Probe live endpoint shapes (done — see decisions log).
2. `types.ts`, `config.ts`, `repo.ts`, `service.ts`.
3. `runtime.ts` with one hook per route shape, plus loaders.
4. UI: `Reports`, `PayoutSummary`, `TopPayout`, `DateInput`, `DateNav`.
5. Wire routes in `src/app/routes.tsx` with the three top-level redirects.
6. Tests under `tests/payouts/service.test.ts`.
7. Write `docs/product-specs/payouts.md`.

## Decisions log

- The new summary endpoint exposes aggregates only (`ticket_count`, `sum_*_native`, `sum_*_usd`, `distinct_gateways`). Per-orchestrator rows come from `/payouts/leaderboard?from=&to=`. The summary page calls both with the same date range and renders them on one screen.
- Native units on the leaderboard are ETH (Arbitrum); UI labels say "ETH".
- Sort keys for the leaderboard, exposed in the UI: `commission_usd`, `face_value_usd`, `ticket_count`. The default `commission_usd` matches the API default.
- Job types: `both`, `ai`, `transcoding`. URL query param `job_type`. Defaults to `both`.
- The list endpoint paginates via `next_cursor`. Phase 3 renders only the first page (100 rows). A "load more" lands in a follow-up.
- CSV export is a plain `<a target="_blank">` to `/api/v1/reports/payouts.csv?from=&to=&job_type=&valuation_version=...` — no fetch dance, no blob assembly. The browser handles it.
- Old UI used `moment`. We do not add it; trivial date math is done with vanilla `Date` + `Intl.DateTimeFormat`.
- The "Daily Winning Tickets Trend" card on the reports landing page links to `/reports/tickets/daily`, but the actual `tickets` domain lands in a later plan. The link is a 404 in Phase 3.

## Test plan

- Unit-test period range helpers (`dailyRange`, `weeklyRange`, `monthlyRange`).
- Unit-test prev/next date math for each period.
- Unit-test formatters.
- After wiring, hit `/reports`, `/reports/daily/2026-05-14`, `/reports/top/payout` against the live API and confirm the summary stats + table render.
