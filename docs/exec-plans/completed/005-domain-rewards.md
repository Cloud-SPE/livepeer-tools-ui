# 005 — Domain: rewards

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Add a rewards domain that mirrors payouts structurally but with different vocabulary (LPT tokens instead of ETH, no `job_type` filter, no `distinct_gateways`). The old `livepeer-tools-ui` did not have stand-alone rewards routes — rewards data only surfaced through the orchestrator-detail CSV download. The new API exposes summary + leaderboard endpoints; we add new routes for them and four new cards on `/reports`.

This is also a deliberate test of how cheap a near-clone domain port is. We resist abstracting payouts and rewards into a shared base — three similar lines beat a premature abstraction.

## Acceptance criteria

- [ ] `src/domains/rewards/` is fully layered.
- [ ] `repo.ts` imports only from `src/providers/network-explorer`.
- [ ] `/reports/rewards/{daily|weekly|monthly}/:date` renders aggregate stats + leaderboard for the period.
- [ ] `/reports/rewards/leaderboard?from=&to=&sort=` renders a configurable leaderboard.
- [ ] `/reports/rewards/{period}` (no date) redirects to `/reports/rewards/{period}/{today}`.
- [ ] `/reports` landing page gains four new cards linking to the rewards reports.
- [ ] At least 6 unit tests for service helpers.
- [ ] Structural tests still pass — rewards does not import from payouts or any other domain.

## Steps

1. types/config/repo/service.
2. runtime + ui (cards + reports landing updates).
3. Register routes.
4. Tests + spec.
5. Verify + close.

## Decisions log

- Rewards are denominated in LPT (string decimals from the API). UI says "LPT" everywhere.
- No `job_type` filter — rewards endpoints don't accept it.
- Sort keys: `orch_tokens_usd` (default), `total_tokens_usd`, `reward_event_count`.
- New routes live under `/reports/rewards/...` to keep payouts at the legacy URLs.
- We deliberately do NOT factor a shared base between payouts and rewards. Even though they're structurally similar, the field names, units, and filter shapes diverge enough that a shared base would leak abstractions.
- The Reports landing page in the payouts domain owns the page. Adding rewards cards there means payouts/ui/Reports.tsx grows — that's fine, it's a static link list, not a cross-domain coupling.

## Test plan

- Unit-test formatters (LPT, percentages).
- Unit-test the rewards-specific service helpers (rowLabel, identityLabel reuse pattern).
- After wiring, hit `/reports/rewards/daily/2026-05-14` and `/reports/rewards/leaderboard` against the live API and confirm rendering.
