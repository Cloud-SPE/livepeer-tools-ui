# DD-001 — Core beliefs

**Status:** Active
**Last updated:** 2026-05-15

The opinionated principles this codebase is organized around. These are mechanical, not aspirational — each one shows up in a lint, a structural test, or a CI gate. Updating any of them requires a successor design doc.

## 1. Agent legibility is the goal

Anything that affects how the code works must live in the repository in a form a coding agent can read without out-of-band context. No Google Docs, no Slack threads, no tacit knowledge. If a decision matters, it lives in `docs/`.

## 2. Parse at the boundary; trust within

Every shape that crosses a provider edge has a schema or a generated type. Inside the code, those types are trusted absolutely — no defensive nullability, no `as unknown as`, no shape-probing. If the boundary parse fails, the request fails loudly.

The two flavors:

- **Provider with OpenAPI** (`network-explorer`) — types are generated from the spec; we trust them at compile-time. Runtime parsing applies only to error envelopes.
- **Provider without OpenAPI** (`performance`, `gateway`) — zod schemas at the boundary, always-on in dev and prod.

## 3. Enforce invariants, don't micromanage implementations

The shape of the code (which file imports which, where validation happens, where data crosses layers) is enforced mechanically by lints and structural tests. Within the shape, implementers — human or agent — choose freely.

This is the difference between "all components must use X library" (micromanagement) and "no component may import a provider directly" (invariant). We do the latter.

## 4. Layered domain architecture

Each business domain has the same internal layer order: `types → config → repo → service → runtime → ui`. Cross-cutting concerns enter through `src/providers/`. See [DD-002](providers-and-boundaries.md) and `DESIGN.md`.

## 5. Throughput beats perfection

Short-lived branches. Small PRs. Fix-forward over revert. The test suite must be fast enough that the cost of running it on every change is negligible.

When test flakes appear, the default fix is to retry once and file a follow-up — not to block the queue.

## 6. No surprise dependencies

Dependencies are added through an exec plan. The standing list of accepted deps is in `package.json`; the rationale for each non-obvious one is in its plan. We do not add a lib to "try it out."

## 7. Code is disposable; contracts are not

We will rewrite the body of any function without ceremony. The shape of a provider response, the contract of a domain repo, the route URL — those have weight. Changes there go through a design doc.

## 8. Repository-local artifacts only

State that needs to survive a reload (user-configured gateway URL, table sort preferences) uses `localStorage`. We do not introduce IndexedDB, service workers, or in-memory long-lived singletons.
