# 008 — Domain: performance (first multi-provider)

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Port the dead `/performance/leaderboard` and `/performance/stats` menu items. This is the **first domain whose `repo.ts` composes two providers** — `network-explorer` for orchestrator identity, `performance` for stats. Validates that the architecture survives multi-provider use without leaking abstractions.

## Acceptance criteria

- [ ] `src/domains/performance/` is fully layered.
- [ ] `repo.ts` imports from `@/providers/performance` AND `@/providers/network-explorer`. No other layer imports from providers.
- [ ] `/performance/leaderboard` renders three cascading filters (region → pipeline → model) and a DataGrid of orchestrators with derived score columns. Default mode: Transcoding. Selecting a pipeline + model switches to AI mode.
- [ ] `/performance/stats` renders an orchestrator-address input + pipeline/model selectors + a DataGrid with AI-mode-aware columns and a JSON-blob modal.
- [ ] Identity hydration: leaderboard rows show display name + avatar, joined from `/orchestrators`.
- [ ] Structural tests still pass — performance does NOT import from any other domain.
- [ ] At least 6 unit tests for service helpers (region filter, leaderboard aggregation math, AI/transcoding mode detection).

## Steps

1. Extend `providers/performance/schemas.ts` raw_stats row with optional AI fields.
2. types/config/repo/service.
3. runtime + ui (Leaderboard, Stats, payload modal).
4. Wire routes.
5. Tests + spec.
6. Verify all gates + probe all top-level routes via dev server.

## Decisions log

- The leaderboard aggregation math (mean per region, scale by 10 for scores, 100 for success rate) matches the old UI exactly. Recomputing client-side is correct here — the perf API doesn't ship pre-aggregated.
- `region === "GLOBAL"` is a UI sentinel meaning "all regions, no filter". We do NOT pass it to the perf API; the API expects either no region (= all) or a specific region id.
- AI mode requires BOTH `pipeline` and `model`. Empty `pipeline` means transcoding mode regardless of model. Matches old UI.
- The Stats response is a `Record<region, Row[]>` map. Service flattens it to a flat row list with `id = ${region}-${index}` for the DataGrid.
- The JSON-blob fields (`input_parameters`, `response_payload`) ship as JSON strings; we parse client-side on modal open.
- Identity hydration uses the same pattern as governance and gateways: repo fetches `/orchestrators` directly. No cross-domain imports.

## Test plan

- Unit-test `aggregateLeaderboard` against a synthetic 2-orchestrator, 3-region dataset.
- Unit-test mode detection (`detectMode({pipeline, model})`).
- Unit-test region filter helper (`filterRegions(regions, mode)`).
- Unit-test row flattening (`flattenRawStats`).
- Unit-test format helpers.
- After wiring, probe `/`, `/orchestrators`, `/vote/history`, `/reports`, `/rounds`, `/performance/leaderboard`, `/performance/stats` against the live API.
