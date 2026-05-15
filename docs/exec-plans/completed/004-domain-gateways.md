# 004 — Domain: gateways

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Port the old `/gateways` and `/gateway/:eth_address` routes. Preserve URL compatibility with the old `/broadcasters` and `/broadcaster/:eth_address` aliases. Match the old visual: card grid for the list, a profile header + latest-payouts DataGrid for the detail.

## Acceptance criteria

- [ ] `src/domains/gateways/` is fully layered.
- [ ] `repo.ts` imports only from `src/providers/network-explorer`.
- [ ] `/gateways` renders a card grid with deposit, reserve, and kind for each gateway.
- [ ] `/broadcasters` resolves to the same component.
- [ ] `/gateway/:eth_address` renders profile (address, deposit, reserve, kind, withdraw status) + DataGrid of recent payouts.
- [ ] `/broadcaster/:eth_address` resolves to the same component.
- [ ] Payout rows show the recipient orchestrator's display name when available (hydrated via `/orchestrators`).
- [ ] At least 4 unit tests for service helpers.
- [ ] Structural tests still pass.

## Steps

1. types/config/repo/service.
2. runtime.
3. UI components.
4. Wire routes + aliases.
5. Tests + spec.
6. Verify + close.

## Decisions log

- The list endpoint paginates via `cursor`. Phase 4 renders only the first page (defaults).
- Identity hydration uses the same pattern as governance: gateways repo calls `/orchestrators` directly. No cross-domain imports.
- Payout rows include both `from_address` (the gateway) and `to_address` (the orchestrator). The UI shows the orchestrator-side identity.
- The old UI's "kind" wasn't shown directly. We surface it on the card (badge) and the detail page (text row) — new info, low risk.
- Defer: flows, claimants, balance history, recipients, summary tabs. Each could become its own sub-route on a future plan.

## Test plan

- Unit-test service helpers (formatters, kind label, identity label).
- After wiring, hit `/gateways`, `/gateway/0x...` against the live API and confirm the cards + payouts table render.
