# DESIGN.md

The architectural shape of this codebase. Read this before touching `src/`.

## One sentence

A React + Vite + TypeScript SPA where every business domain lives in `src/domains/<name>/` with a fixed internal layer order, and every external data source enters through exactly one provider in `src/providers/`.

## Layered domain architecture

```
                        ┌──────────────────────────────┐
                        │  Utils  (pure, side-effect-  │
                        │  free helpers; depended on   │
                        │  from anywhere)              │
                        └──────────────┬───────────────┘
                                       ▼
                ┌─────────────────────────────────────────┐
                │   Providers  (cross-cutting transport)  │
                │   network-explorer / performance /      │
                │   gateway                                │
                └────────────┬────────────────────────────┘
                             ▼
   ┌────────────────────────────────────────────────────────────┐
   │  Per-domain stack — same shape for every domain            │
   │                                                            │
   │     types  →  config  →  repo  →  service  →  runtime  →  ui │
   │                                                            │
   │  • types: pure domain types                                │
   │  • config: constants, page sizes, defaults                 │
   │  • repo:   composes providers, returns domain types         │
   │  • service: derived/computed values, sorting, formatting    │
   │  • runtime: TanStack Query hooks + react-router loaders    │
   │  • ui:     route components, presentational components     │
   └────────────────────────────────────────────────────────────┘
                             ▼
                ┌────────────────────────────────────────┐
                │  App  (routes, theme, shell)            │
                └────────────────────────────────────────┘
```

## Dependency rules (enforced)

1. Within a domain, imports flow only down the stack: `ui → runtime → service → repo → config → types`. Never up.
2. Cross-domain imports are forbidden. If two domains need to share something, it goes in `src/utils/` (if pure) or becomes a third provider boundary.
3. Only `repo.ts` files may import from `src/providers/`. This is the one and only data-boundary in the domain.
4. Providers may not import from `src/domains/`. They are transport, not business logic.
5. `src/app/` may import any domain's `runtime.ts` (for hooks) or `ui/` (for routes). It may not import a domain's `repo` or `service` directly.

Violations fail `npm run test` via the structural tests in `tests/structural/` and fail `npm run lint` via the custom ESLint rule.

## Providers — the three transports

Each provider is its own subdirectory of `src/providers/`. Each owns:

- A typed `client` (function or singleton)
- A `schemas.ts` if the source has no OpenAPI spec (zod), or imports from `src/generated/api-types.ts` if it does
- Its own `index.ts` re-exporting only the public surface
- Authentication, base URL, and retry concerns

| Provider | Source | Auth | Validation |
| --- | --- | --- | --- |
| `network-explorer` | `livepeer-network-api.cloudspe.com/api/v1` | None | Generated types from `openapi.json`; trusted at compile-time |
| `performance` | `leaderboard-serverless.vercel.app` (transcoding) + `lpc-leaderboard-serverless.vercel.app` (AI) | None | Zod at boundary |
| `gateway` | `dream-gateway.livepeer.cloud` + `openai-gateway.livepeer.cloud/v1` + user-overridable | Bearer token | Zod at boundary |

`src/utils/env.ts` parses `import.meta.env.VITE_*` into a typed config object once at startup. Anything that needs an environment value imports from there — providers, domain configs, UI. It is a `utils/` module rather than a provider because it is read-only configuration, not transport.

## What is NOT in this codebase

The old `livepeer-tools-ui` had:

- **Dexie / IndexedDB cache** — replaced by `@tanstack/react-query`. The new API is canonical.
- **ethers + Arbitrum RPC** — replaced by the network-explorer provider, which exposes governance state.
- **Direct cross-cutting `DataService` singleton** — replaced by per-domain `repo.ts` files.

If you find yourself wanting to add any of the above, write a design doc first.

## How to add a new domain

1. Open an exec plan in `docs/exec-plans/active/NNN-domain-<name>.md`.
2. Create `src/domains/<name>/` with `types.ts`, `config.ts`, `repo.ts`, `service.ts`, `runtime.ts`, `ui/`.
3. The `repo.ts` calls one or more providers. It returns `types.ts` shapes only.
4. Register the route in `src/app/routes.tsx`.
5. Add a smoke test under `tests/<domain>/`.
6. Move the exec plan to `docs/exec-plans/completed/`.

The orchestrators domain is the reference template.
