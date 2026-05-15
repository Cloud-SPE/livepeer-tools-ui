# 009 — Domain: ai-generator (shell + settings + capabilities)

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Stand up the AI section of the UI: the tabbed `AILayout` shell, the `/ai/generator` landing page, the `/ai/settings` gateway configuration page, and the `/ai/network-capabilities` matrix. **First domain to use the gateway provider.** Defers all inference routes (text-to-image, LLM, etc.) to plan 010+.

## Acceptance criteria

- [ ] `src/domains/ai-generator/` is fully layered.
- [ ] `repo.ts` imports from `@/providers/gateway` only.
- [ ] `/ai/generator` is the index route under the layout — renders the feature card grid.
- [ ] `/ai/settings` lets the user pick a gateway from a preset list OR enter a custom URL. Save persists to `localStorage` (via gateway provider's `setGatewaySettings`) and invalidates the capabilities query.
- [ ] `/ai/network-capabilities` shows a refreshable accordion of pipelines → models → orchestrators with Cold/Warm counts.
- [ ] AILayout renders a top tab bar matching the old UI's structure. The Image/Audio submenus collapse into single tabs that link to a placeholder route in this plan (real inference routes land in 9b).
- [ ] Structural tests still pass.
- [ ] Unit tests for the capability flattening function.

## Steps

1. types/config/repo/service.
2. runtime + ui.
3. Wire routes (nested under `/ai`).
4. Tests + spec.
5. Verify + probe.

## Decisions log

- AILayout is the **parent route element**; child routes appear in its `<Outlet />`. Same pattern as the root `App` shell.
- The Settings page uses the existing `setGatewaySettings` from the gateway provider. When the gateway changes, we invalidate `["ai", "capabilities"]` and the consumer re-fetches automatically.
- Tabs that point at inference routes (text-to-image, etc.) are still wired in the AILayout — clicking them navigates to URLs that 404 until plan 010 lands the actual components. Acceptable for this plan; user feedback can drive ordering of 010.
- The preset gateway list is in `config.ts` so it can be updated independently of code.
- We do NOT use a `<form>`/submit pattern; "Save" is a button that calls `setGatewaySettings` + invalidate. Simpler than the old UI's submission dance.

## Test plan

- Unit-test `flattenCapabilities` for: empty input, multiple orchestrators with overlapping pipelines, BYOC pipeline detection.
- Unit-test the gateway preset selection logic.
- After wiring, probe `/ai/generator`, `/ai/settings`, `/ai/network-capabilities` against the live gateway.
