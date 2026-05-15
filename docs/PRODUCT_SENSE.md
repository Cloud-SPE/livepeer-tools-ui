# PRODUCT_SENSE.md

What this product is, who it's for, and what it explicitly is not.

## Audience

Livepeer ecosystem participants: orchestrators, gateway operators, delegators, treasury voters, and observers. Both technical and non-technical. The site is browsed; it is not embedded into other apps.

## What it does

Renders the on-chain economics and governance of the Livepeer protocol in a navigable, exportable form. Specifically:

- **Orchestrators** — leaderboard and per-orchestrator profile (stake, cuts, history, delegators).
- **Gateways** — directory and per-gateway flows (deposits, withdrawals, payouts, recipient leaderboards).
- **Governance** — proposal index, per-proposal vote tally, voter history.
- **Payouts** — daily/weekly/monthly summaries, top-payout reports, gateway-side payout history.
- **Rewards** — daily/weekly/monthly summaries.
- **Tickets** — daily ticket-redemption timeseries, per-orchestrator latest tickets.
- **Network** — round index, round summaries, network-stats snapshot.
- **Performance** — orchestrator transcoding and AI-pipeline performance (from the external leaderboard service).
- **AI generator** — direct interaction with live Livepeer gateways for inference (text-to-image, LLM, etc.).

Reports are exportable as CSV (the protocol-explorer API ships CSV endpoints).

## Domains (in scope, in order of priority)

1. orchestrators
2. governance
3. payouts
4. gateways
5. rewards
6. tickets
7. network
8. performance (external API)
9. ai-generator (gateway API, BYOC, user-configured)

## What this is not

- Not a wallet. No transaction signing. No `eth_sign` requests.
- Not an indexer. We consume the protocol-explorer API; we do not re-index.
- Not a node. We do not run on Livepeer orchestrator or gateway hardware.
- Not a chain client. No direct RPC. All chain reads go through the protocol-explorer API.
- Not an analytics platform. We render canonical data; we do not invent metrics or re-bucket beyond what the API ships.

## Non-goals worth naming

- Real-time updates. Polling at human-visible cadence is fine.
- Mobile-first. Responsive enough to be readable; not a phone app.
- Theming. One theme (the existing tools-ui look). No dark mode in Phase 0.
- Internationalization. English only.

## Success looks like

- Every domain in the list above renders end-to-end against the live API.
- A new coding agent can add a tenth domain by copy-pasting the orchestrators domain skeleton.
- CSV exports work.
- CI is green on every PR.
