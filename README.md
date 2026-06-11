# livepeer-tools-ui

[![CI](https://github.com/Cloud-SPE/livepeer-tools-ui/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Cloud-SPE/livepeer-tools-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MUI](https://img.shields.io/badge/MUI-9-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/code_style-prettier-F7B93E?logo=prettier&logoColor=black)](https://prettier.io/)

A browser-only React/TypeScript SPA that visualizes the Livepeer protocol and ecosystem. It is a thin presentation layer over two independent external data providers — the [Protocol Explorer API](https://livepeer-network-api.cloudspe.com/openapi.json) and the Performance/Leaderboard services. There is no backend of our own; everything is fetched at runtime from the browser.

This codebase is agent-generated: every line — application logic, tests, CI, docs — is meant to be writable and reviewable by a coding agent. The architecture exists to make that possible.

## Highlights

- **Network**: orchestrator and gateway lists, governance, payouts, rewards, tickets, ticket / round economics.
- **Performance**: leaderboards for transcoding and AI pipelines, region and model breakdowns.

## Architecture at a glance

```
src/
├── app/          MUI shell, route table, theme, entry point
├── domains/<n>/  Business modules. Internal layer order is enforced.
├── providers/<n>/ One per external system (network-explorer, performance, gateway)
├── generated/    OpenAPI-generated types (committed; CI fails on drift)
└── utils/        env (Zod-validated), QueryClient singleton
```

Three layering rules are enforced by **both** ESLint (`eslint-rules/no-cross-layer-imports.js`) and runtime structural tests (`tests/structural/*.test.ts`):

1. Within a domain, imports flow one way: `types → config → repo → service → runtime → ui`.
2. No cross-domain imports. Sharing happens through `src/utils/` (pure) or a provider (transport).
3. Only a domain's `repo.ts` may import from `src/providers/`. Providers may not import any domain.

A new contributor (human or agent) should read **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** first — it covers components, the layering rule, the three providers, sequence diagrams for page loads / streaming inference / startup env validation, and where to add new code. The [`AGENTS.md`](./AGENTS.md) index points to the rest of the design docs under `docs/`.

## Prerequisites

- **Node.js 22.x** (matches CI).
- **npm 10+** (ships with Node 22).
- A modern browser. The app is browser-only — no SSR.

## Configuration

The app reads its endpoints from `VITE_*` environment variables, validated at module load by `src/utils/env.ts`. Missing or invalid values fail loudly with a list of what's wrong; there are no fallbacks.

Copy the example file:

```bash
cp .env.example .env
```

Required variables:

| Variable                                | Purpose                              | Default in `.env.example`                          |
| --------------------------------------- | ------------------------------------ | -------------------------------------------------- |
| `VITE_NETWORK_EXPLORER_BASE_URL`        | Protocol Explorer API base           | `https://livepeer-network-api.cloudspe.com/api/v1` |
| `VITE_PERFORMANCE_TRANSCODING_BASE_URL` | Leaderboard service for transcoding  | `https://leaderboard-serverless.vercel.app`        |
| `VITE_PERFORMANCE_AI_BASE_URL`          | Leaderboard service for AI pipelines | `https://lpc-leaderboard-serverless.vercel.app`    |

## Install and run

```bash
npm ci             # install exactly per package-lock.json
npm run dev        # Vite dev server on http://localhost:5173
```

Build a production bundle:

```bash
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve dist/ locally
```

## Scripts

| Command                   | What it does                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`             | Vite dev server (HMR, port 5173)                                         |
| `npm run build`           | TypeScript project build, then `vite build`                              |
| `npm run preview`         | Serve the production build for a smoke check                             |
| `npm run typecheck`       | `tsc -b --noEmit`                                                        |
| `npm run lint`            | ESLint (includes the custom layering rule)                               |
| `npm run fmt`             | Format the repo with Prettier                                            |
| `npm run fmt:check`       | Verify formatting (CI uses this)                                         |
| `npm run test`            | Vitest — unit + structural tests                                         |
| `npm run test:watch`      | Vitest in watch mode                                                     |
| `npm run gen:api`         | Regenerate `src/generated/api-types.ts` from the live OpenAPI spec       |
| `npm run check:api-drift` | Fail if the committed generated types drift from the live spec (CI gate) |

A Lefthook `pre-commit` hook runs `typecheck`, `lint` (on staged `.ts/.tsx/.js`), and `prettier --check` (on staged supported files) in parallel. Don't bypass it — investigate failures instead.

## Testing

```bash
npm run test
```

Two flavors of tests live side-by-side:

- **Unit tests** under `tests/<domain>/service.test.ts` exercise pure functions from each domain's `service.ts`.
- **Structural tests** under `tests/structural/` walk `src/` at runtime and fail the build if any file violates the layering rules. They are a backstop for the ESLint rule and catch dynamic-import shenanigans.

If you change shared rules (layering, naming) update both the ESLint rule and the structural tests.

## Conventions

Mechanically enforced (CI will block):

- **Layered imports.** `types → config → repo → service → runtime → ui` within a domain; no cross-domain imports; `repo.ts` is the only file that may import providers; `src/app/` may only import a domain's `runtime` or `ui`. Enforced by `eslint-rules/no-cross-layer-imports.js` and `tests/structural/`.
- **Generated types committed.** `src/generated/api-types.ts` is checked in and CI fails on drift against the live OpenAPI spec. Run `npm run gen:api`, commit the diff.
- **Parse at the boundary.** Provider responses without an OpenAPI spec (performance, gateway) are validated with Zod in `schemas.ts`. The OpenAPI-typed network-explorer is trusted at compile-time; runtime parsing applies to error envelopes via `unwrap()`.

Stylistic, but expected:

- **File casing.** Components are `PascalCase.tsx`. Non-component modules (`repo.ts`, `service.ts`, `runtime.ts`, `types.ts`, `config.ts`) are camelCase. Domain directories are kebab-case.
- **Cache keys.** `[domain, action, ...args]`, with normalized args (e.g., lowercase addresses). Same key for loader prefetch and hook read.
- **Errors.** Each provider exports a `<Provider>Error` class carrying status and a truncated body. Domain repos let those propagate; UI catches and renders.
- **Pure services.** Functions in `service.ts` must be pure — no I/O, no React, no TanStack Query. They are tested in isolation.
- **Persistence.** Only `localStorage`, and only via a provider's `settings.ts` module.

If you find yourself wanting to bend a rule, the right move is usually a redesign — extract to `src/utils/`, introduce a new provider, or split the domain. See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the "where new code goes" table.

## Repository map

```
src/                    Application source (see docs/ARCHITECTURE.md)
tests/                  Unit + structural tests
docs/                   Design docs and execution plans (start at AGENTS.md)
eslint-rules/           Custom ESLint rule(s)
scripts/                regen-api-types.sh, check-api-drift.sh
.github/workflows/      CI (validate + api-drift jobs)
.env.example            Required environment variables
AGENTS.md               Table of contents for the repo
```

## Continuous integration

`.github/workflows/ci.yml` runs on every PR and on pushes to `main`:

- **`validate`** — install, format check, typecheck, lint, test, build (Node 22).
- **`api-drift`** — fails if `src/generated/api-types.ts` is out of sync with the live OpenAPI spec.

Both jobs cancel in-progress runs on the same ref.

## Further reading

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — components, layering, providers, flows, sequence diagrams.
- [`AGENTS.md`](./AGENTS.md) — table of contents for the whole repo.
- [`docs/DESIGN.md`](./docs/DESIGN.md), [`docs/FRONTEND.md`](./docs/FRONTEND.md), [`docs/design-docs/`](./docs/design-docs/) — the long-form design.

## License

[MIT](./LICENSE)
