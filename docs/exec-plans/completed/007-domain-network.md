# 007 — Domain: network

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Add a network domain that surfaces the protocol-explorer's `/network/stats` snapshot and `/rounds` index. Use the snapshot to enrich the previously-placeholder Home page with a live KPI strip, alongside the welcome banner + 5 feature cards that match the old UI's Home.jsx layout. Add a dedicated `/rounds` route for the rounds browser.

## Acceptance criteria

- [ ] `src/domains/network/` is fully layered.
- [ ] `repo.ts` imports only from `src/providers/network-explorer`.
- [ ] `src/app/Home.tsx` renders: welcome banner, `<NetworkStatsStrip />`, then the 5 feature cards.
- [ ] `<NetworkStatsStrip />` shows 8 KPIs in a responsive grid: latest round, active orchestrators, active delegators, gateways known, total LPT staked, payouts USD 24h, rewards USD 24h, gas burned ETH 24h.
- [ ] `/rounds` renders a DataGrid of recent rounds (Round, Started At, Started Block, Active Orchestrators, Total LPT, Payouts USD, Rewards USD).
- [ ] Structural tests still pass — app imports only from `@/domains/network/ui`.
- [ ] At least 4 unit tests for formatters/projections.

## Steps

1. Probe `/network/stats` and `/rounds` shapes (done — see decisions log).
2. types/config/repo/service.
3. runtime + ui.
4. Replace `src/app/Home.tsx` (currently a placeholder) with the rich variant from the old UI plus the live stats strip.
5. Register `/rounds` in `src/app/routes.tsx`.
6. Tests + spec.
7. Verify + close.

## Decisions log

- Home stays in `src/app/` (not in network/ui) because it composes multiple domains' navigation. It only imports from the network domain's `ui/`. No domain-to-domain coupling.
- The KPI strip lives in `src/domains/network/ui/NetworkStatsStrip.tsx` so it can be embedded anywhere — currently Home, possibly /reports landing later.
- The rounds list is cursor-paginated; Phase 7 renders the first 100 rows. Pagination "load more" is a follow-up.
- USD/LPT amounts come as decimal strings on the wire. Service formats them as `$N,N.NN` and `N,N.NN LPT`.
- The 24h windows (`payouts_usd_24h`, `rewards_usd_24h`, `gas_burned_eth_24h`) are server-defined; we just display them.
- We do NOT add round detail (`/rounds/:id`) in this plan. The endpoint exists; deferring keeps scope tight.

## Test plan

- Unit-test formatters (LPT, USD, ETH, integers).
- Unit-test projection of `/network/stats` and `/rounds` row.
- After wiring, hit `/` and `/rounds` against the live API and confirm the stats strip + DataGrid render.
