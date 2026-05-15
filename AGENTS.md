# AGENTS.md

A table of contents, not an encyclopedia. The repository under `docs/` is the system of record. Read the document linked under each heading before acting on anything in that area.

## What this is

A web UI for the Livepeer protocol and ecosystem. It is a thin presentation layer over three independent data providers — the [Protocol Explorer API](https://livepeer-network-api.cloudspe.com/openapi.json), the external Performance/Leaderboard service, and live Livepeer Gateways (for AI inference). The UI's purpose is to make Livepeer protocol economics legible to humans.

This codebase is agent-generated. Every line — application logic, tests, CI, docs — should be writable and reviewable by a coding agent. See `docs/design-docs/core-beliefs.md`.

## Where things live

| Need to                                              | Read                                           |
| ---------------------------------------------------- | ---------------------------------------------- |
| Understand the layered architecture                  | `docs/DESIGN.md`                               |
| Understand frontend conventions (MUI, routes, theme) | `docs/FRONTEND.md`                             |
| Find what plans are active / completed               | `docs/PLANS.md`                                |
| Understand product intent and non-goals              | `docs/PRODUCT_SENSE.md`                        |
| Find a design decision history                       | `docs/design-docs/index.md`                    |
| Find a currently-running execution plan              | `docs/exec-plans/active/`                      |
| Find a finished execution plan                       | `docs/exec-plans/completed/`                   |
| Understand provider boundaries and validation rules  | `docs/design-docs/providers-and-boundaries.md` |
| Regenerate API types from the OpenAPI spec           | `docs/generated/api-types-baseline.md`         |

## Rules that are enforced mechanically

These are checked by `npm run lint`, `npm run test`, and the CI workflow. They will fail the build if violated. Don't try to work around them — fix the underlying issue or open a design doc to amend the rule.

1. **Per-domain layering.** Within `src/domains/<name>/`, files may only import in the order: `types → config → repo → service → runtime → ui`. Higher layers may import lower layers in the same domain. Lower layers may not import higher layers. Cross-domain imports between sibling domains are forbidden.
2. **Providers are cross-cutting.** Only `repo.ts` files may import from `src/providers/`. UI/service/runtime/config/types may not. The reverse direction (providers importing from a domain) is always forbidden.
3. **Generated types are committed.** `src/generated/api-types.ts` is checked in. Drift between the live `openapi.json` and the committed file fails CI. To update: `npm run gen:api`, commit the diff.
4. **Boundary validation.** Provider responses from sources without an OpenAPI spec (performance, gateway) are parsed with Zod at the boundary. The generated OpenAPI client is trusted at compile-time; runtime parsing applies only to error envelopes.
5. **No chain RPC, no IndexedDB.** This UI talks to the three providers above and nothing else. State that needs to survive a reload uses `localStorage`.

## Core beliefs (one-line versions)

The full list is in `docs/design-docs/core-beliefs.md`. The most load-bearing:

- **Agent legibility is the goal.** If a coding agent cannot find it by reading the repo, it does not exist.
- **Parse at the boundary; trust within.** Every shape that crosses a provider edge has a schema or a generated type. After that, code uses the type and trusts it.
- **Enforce invariants, don't micromanage implementations.** Lints and structural tests enforce the _shape_ of the code. Within the shape, choose freely.
- **Throughput beats perfection.** Small PRs, short-lived branches, fix-forward over revert.

## Conventions

- TypeScript strict mode; no `any` without a `// @ts-expect-error` and a comment explaining why.
- React function components; no class components.
- Data fetched via `@tanstack/react-query` hooks owned by each domain's `runtime.ts`.
- Routes registered in `src/app/routes.tsx` only; domains export route descriptors, the app composes them.
- One folder per domain. The list of domains is in `docs/PRODUCT_SENSE.md`.
