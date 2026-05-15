# 000 — Phase 0 scaffold

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Get this empty repository to a state where:

- `npm install && npm run dev` boots an MUI shell visually identical to the old `livepeer-tools-ui`.
- All architectural invariants from `docs/DESIGN.md` are mechanically enforced by lints and tests.
- The OpenAPI client is generated and committed.
- CI is green on a no-op PR.

No business domains are implemented in Phase 0. That happens in plan 001.

## Acceptance criteria

- [ ] `npm install` succeeds.
- [ ] `npm run gen:api` produces `src/generated/api-types.ts` from the live `openapi.json`.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes (includes the layered-import custom rule).
- [ ] `npm run test` passes (includes structural tests in `tests/structural/`).
- [ ] `npm run build` produces a working bundle.
- [ ] `npm run dev` renders the MUI Drawer + AppBar shell at `/` with the same drawer items the old UI had.
- [ ] CI workflow `.github/workflows/ci.yml` runs all of the above on PR.

## Steps

1. Root config files: `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `lefthook.yml`, `.env.example`, `.gitignore`, `index.html`.
2. Docs skeleton (this file + the rest of `docs/`).
3. Scripts: `scripts/regen-api-types.sh`, `scripts/check-api-drift.sh`.
4. Providers: `env.ts`, `network-explorer/`, `performance/`, `gateway/`.
5. App shell: `src/app/App.tsx`, `main.tsx`, `routes.tsx`, `theme.ts`.
6. Structural tests in `tests/structural/`.
7. CI workflow.
8. Run the acceptance criteria locally; fix any failures.

## Decisions log

- Drop Dexie, ethers, RxJS — protocol-explorer API supersedes them.
- TS strict from day one.
- `openapi-fetch` + `openapi-typescript` over hand-rolled clients.
- TanStack Query for server state; localStorage for user settings.
- Custom ESLint rule + structural Vitest test for layered imports.

## Test plan

- After step 7, push a no-op PR to confirm CI green.
- Manually verify the shell renders by opening `http://localhost:5173` and confirming drawer items match the old UI.
