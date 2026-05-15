# Product spec — Gateways

Fourth domain. Replaces `/gateways` + `/gateway/:eth_address` from the old UI, with `/broadcasters` and `/broadcaster/:eth_address` preserved as aliases.

## Routes

| URL                         | Component       | Purpose                   |
| --------------------------- | --------------- | ------------------------- |
| `/gateways`                 | `Gateways`      | Card grid of all gateways |
| `/broadcasters`             | `Gateways`      | Alias (legacy URL)        |
| `/gateway/:eth_address`     | `GatewayDetail` | Profile + recent payouts  |
| `/broadcaster/:eth_address` | `GatewayDetail` | Alias (legacy URL)        |

## Data sources

Exactly one provider: `network-explorer`.

- `GET /gateways` — list endpoint
- `GET /gateways/{address}/profile` — single gateway profile
- `GET /gateways/{gateway}/payouts` — flow rows for the gateway
- `GET /orchestrators?limit=500` — identity hydration for payout-row recipients

## List view

Responsive grid of `GatewayCard`s — three columns at md+, two at sm, one at xs. Each card shows:

- Avatar (from `avatar_url`) or single-letter fallback
- Display name or short-form address
- Truncated address with tooltip to full
- Kind chip (`AI` / `Transcoding`) — AI colored `info`
- Deposit (ETH)
- Reserve (ETH)
- "View on Livepeer" button → `https://explorer.livepeer.org/accounts/{address}/history`

Cards are click-targets navigating to `/gateway/:address`.

## Detail view

Header:

- Avatar + display name + kind chip
- "View on Livepeer" button
- ETH Address (full)
- Deposit (ETH)
- Reserve (ETH)
- If `unlock_in_progress`: an `Alert severity="info"` showing the withdraw round

Latest Payouts DataGrid:

- Columns: Orchestrator (avatar + label, hydrated), Amount (ETH), Amount (USD), Flow, Date/Time (UTC), Tx (short).
- Rows navigate to `/orchestrator/:to_address` on click (cross-domain via URL, not import).
- Page sizes: 25/50/100, defaulting to 50.
- Payout semantics ("net" / "gross"), when present, render as a chip beside the section header.

## States

| Condition            | Render                                   |
| -------------------- | ---------------------------------------- |
| Gateway list loading | `CircularProgress`                       |
| Gateway list error   | `Alert severity="error"`                 |
| Detail loading       | `CircularProgress`                       |
| Detail error         | `Alert severity="error"`                 |
| Detail not found     | `Alert severity="warning"`               |
| Payouts error        | `Alert severity="error"` above the table |
| Payouts loading      | DataGrid built-in shimmer                |

## Cross-domain interactions

- Gateway → orchestrator navigation by URL (`/orchestrator/:address`); no import.
- Recipient identity hydration calls `/orchestrators` directly through the network-explorer provider, mirroring the pattern in the governance domain. No import of the `orchestrators` domain.

## Out of scope (for this plan)

- Sub-routes for flows, claimants, balance history, recipients, summary, analytics. Each could become its own tab on a future plan.
- Cursor-based pagination for the list and payouts table (renders first page only).
- Withdraw-status timeline visualization.
- CSV export for gateway payouts.
