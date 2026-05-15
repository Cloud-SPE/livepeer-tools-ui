# 001 — Domain: orchestrators (reference template)

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Implement the `orchestrators` domain end-to-end as the reference template that every subsequent domain will copy. Covers two routes: list view (`/orchestrators`) and detail view (`/orchestrator/:eth_address`).

## Acceptance criteria

- [ ] `src/domains/orchestrators/` contains `types.ts`, `config.ts`, `repo.ts`, `service.ts`, `runtime.ts`, and `ui/{Orchestrators.tsx,OrchestratorDetail.tsx,index.ts}`.
- [ ] `repo.ts` imports only from `src/providers/network-explorer` (no other providers in Phase 1).
- [ ] `runtime.ts` exposes `useOrchestrators`, `useOrchestrator`, and the matching loaders.
- [ ] Routes registered in `src/app/routes.tsx`.
- [ ] List route renders an MUI DataGrid with paginated orchestrator profiles sorted by total stake, matching the visual of the old UI.
- [ ] Detail route renders stake, cuts, lifecycle, service URI, ENS name/avatar.
- [ ] Structural tests still pass.
- [ ] At least one Vitest unit test for `service.ts` (e.g., the sorting/derived-fields logic).

## Steps

1. Define `types.ts` — `Orchestrator`, `OrchestratorListParams`, `OrchestratorListResponse`.
2. Define `config.ts` — `DEFAULT_PAGE_SIZE = 25`, sort keys.
3. Write `repo.ts` — `listOrchestrators`, `getOrchestrator`. Project from `OrchestratorProfileRow` to `Orchestrator`.
4. Write `service.ts` — formatting (LPT amounts, percentages), display name fallback, status badge.
5. Write `runtime.ts` — `useOrchestrators(params)`, `useOrchestrator(addr)`, `orchestratorsLoader`, `orchestratorLoader`.
6. Write `ui/Orchestrators.tsx` and `ui/OrchestratorDetail.tsx`. Use `@mui/x-data-grid` for the list.
7. Register routes in `src/app/routes.tsx`.
8. Add tests under `tests/orchestrators/`.

## Decisions log

- Use generated types from `network-explorer` as the basis for `Orchestrator`. Projection in `repo.ts` is mostly renaming + camelCasing + parsing string-encoded bigints.
- LPT amounts arrive from the API as decimal strings — parse with `dnum` (already in the broader Livepeer ecosystem) or just `Number` for v0. Choose `Number` for simplicity; revisit if precision matters.
