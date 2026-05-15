# Product spec — Performance

Eighth domain. Replaces the dead `/performance/leaderboard` and `/performance/stats` menu items from the old UI. **First multi-provider domain** — composes `network-explorer` (for orchestrator identity) and the external `performance` API (for stats).

## Routes

| URL | Component | Purpose |
| --- | --- | --- |
| `/performance/leaderboard?region=&pipeline=&model=` | `Leaderboard` | Aggregated leaderboard with cascading filters |
| `/performance/stats?orchestrator=&pipeline=&model=` | `Stats` | Raw per-region stats for a specific orchestrator |

## Data sources

Two providers, composed in `repo.ts`:

- `performance` provider — `getRegions`, `getPipelines`, `getAggregatedStats`, `getRawStats`
- `network-explorer` provider — `/orchestrators` for identity hydration (display name + avatar)

The leaderboard repo function `listLeaderboard(params, identities)` takes the identity index as input so it can be reused across hooks. The runtime's `fetchLeaderboard` resolves the identity index from cache before calling.

## Mode (AI vs Transcoding)

Mode is derived from query string state: AI = both `pipeline` AND `model` are set. Otherwise transcoding. Selecting a pipeline alone does NOT switch to AI mode — model is required too. Matches the old UI behavior.

The mode determines:
- Which performance base URL is used (`transcoding` vs `ai`)
- Which regions appear in the filter (`type === "ai"` vs not)
- Which DataGrid columns appear on the Stats page

## Leaderboard

Three cascading filters:

1. **Region** — `GLOBAL` sentinel meaning "no region filter". Filtered to mode-appropriate regions. Sorted alphabetically with Global first.
2. **Pipeline** — `None (Transcoding)` option meaning transcoding mode.
3. **Model** — disabled until a pipeline is selected. Changing the pipeline clears the model.

Columns: Orchestrator (avatar + display name or short address; links to `/orchestrator/:address` in a new tab), Total Score, Success Rate (%), Latency Score, Regions, View Stats (icon button navigating to `/performance/stats`).

Default sort: total score descending. The aggregation math:

```
totalScore   = mean(per-region score)         * 10
successRate  = mean(per-region success_rate)  * 100
latencyScore = mean(per-region round_trip)    * 10
```

These match the old UI exactly. Aggregation happens client-side in `repo.ts` because the perf API doesn't pre-aggregate.

## Stats

Three filters: Orchestrator address (text input), Pipeline, Model. Same cascade rule.

**Transcoding columns**: Region, Time, RealTime (Yes/No), Transcode, Upload, Download, Round Trip, Seg Duration, Seg Received (`/60`), Success.

**AI columns**: Region, Time, Passed (Yes/No), Round Trip Time, Model Warm, Inputs (modal trigger), Response (modal trigger).

The `realtime` flag is computed: `seg_duration > round_trip_time && success_rate > 0`. Matches the old UI.

Rows with `successRate === 0` get a tinted background (`row-failed-test` class with `error.light` at low alpha).

## Payload modal

Inputs and Response cells on AI rows render a "View" link that opens a `<Dialog>` with the JSON pretty-printed. Falls back to the raw string when JSON.parse fails.

## States

| Condition | Render |
| --- | --- |
| Loading | DataGrid built-in shimmer |
| Error | `Alert severity="error"` above the table |
| Stats: no orchestrator entered | `Alert severity="info"` prompting input |
| Stats: AI mode with no results | DataGrid empty state (the AI base often returns `{}`) |

## Cross-domain rules

- The leaderboard navigates to `/orchestrator/:address` via URL — no import of the orchestrators domain.
- Identity hydration calls `/orchestrators` through the network-explorer provider — same pattern as governance and gateways.
- This domain does NOT import from `payouts`, `rewards`, etc.

## Out of scope

- Saved filter presets.
- Server-side region filtering on stats (we currently fetch all regions for the address and filter client-side).
- Time-series charts of stats over time.
- Bulk download of stats data.
