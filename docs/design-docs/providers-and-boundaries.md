# DD-002 — Providers and boundaries

**Status:** Active
**Last updated:** 2026-05-15

How external data enters this codebase. See also `docs/DESIGN.md`.

## The three providers

### `network-explorer`

- **Source:** `https://livepeer-network-api.cloudspe.com/api/v1`
- **Spec:** `https://livepeer-network-api.cloudspe.com/openapi.json`
- **Auth:** none
- **Validation:** generated TypeScript types via `openapi-typescript`. The generated file lives at `src/generated/api-types.ts` and is committed. Drift is detected in CI.
- **Client:** `openapi-fetch`, typed against the generated `paths`.
- **Failure modes:** server errors return an `ErrorEnvelope` shape. The provider parses these and throws a typed `NetworkExplorerError`.

This is the canonical source for protocol state — orchestrators, gateways, governance, payouts, rewards, tickets, prices, stake, transcoders, delegators, network/rounds. **Most domains will only use this provider.**

### `performance`

- **Sources:**
  - Transcoding: `https://leaderboard-serverless.vercel.app`
  - AI: `https://lpc-leaderboard-serverless.vercel.app`
- **Auth:** none
- **Validation:** zod schemas at the boundary, always-on. Same schema set for both bases — the contract is identical.
- **Endpoints used:**
  - `GET /api/regions`
  - `GET /api/pipelines` (AI base only)
  - `GET /api/aggregated_stats?pipeline=&model=&region=`
  - `GET /api/raw_stats?orchestrator=&pipeline=&model=`

Each request takes a `kind: "ai" | "transcoding"` parameter; the client picks the base URL accordingly.

### `gateway`

- **Sources:**
  - `https://dream-gateway.livepeer.cloud` (or user-overridden via Settings)
  - `https://openai-gateway.livepeer.cloud/v1` (BYOC OpenAI)
- **Auth:** Bearer token from `VITE_GATEWAY_BEARER_TOKEN`, overridable per-user via Settings.
- **Validation:** zod schemas at the boundary.
- **State:** user-selected gateway URL and bearer token persist in `localStorage` under `gateway-settings`. Defaults come from env.

This is the only provider that talks to live Livepeer infrastructure. AI inference (text-to-image, LLM, etc.) and `getNetworkCapabilities` go through here.

## How repos call providers

A domain's `repo.ts` may import from one or more providers. It transforms provider responses into the domain's own `types.ts` shapes. The transformation is the boundary between the provider's vocabulary and the domain's.

Example: the `orchestrators` repo calls `network-explorer` for the list, projects from `OrchestratorProfileRow` into the domain's `Orchestrator` type, and optionally joins performance data from the `performance` provider. The UI sees one shape; it has no idea two providers were involved.

## When to add a new provider

A new provider is justified only when an external system has its own auth model, its own URL family, and its own response shape that doesn't naturally project into an existing provider. "We need to call a new endpoint on the network-explorer API" is not a new provider.

## When NOT to add a provider

- A polyfill or shim — that's `src/utils/`.
- A cross-domain helper — that's also `src/utils/`, or it lives in the domain that owns it.
- Client-side state — that's a domain's `service` or a TanStack Query mutation.
