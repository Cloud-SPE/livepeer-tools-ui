# Product spec — Tickets

Sixth domain. Closes the "(Coming soon)" link on the Reports landing card. Single route, single endpoint, single chart.

## Routes

| URL | Component | Purpose |
| --- | --- | --- |
| `/reports/tickets/daily?start=&end=&job_type=&granularity=` | `DailyTicketsReport` | Line chart of winning-ticket counts |

## Data sources

Exactly one provider: `network-explorer`. One endpoint:

- `GET /tickets/timeseries/daily?start=&end=&job_type=` — required `start`/`end`, optional `job_type`. Response shape: `{ start, end, job_type, ai: [{date,count}], transcoding: [{date,count}] }`. Counts ship as strings; repo parses on the boundary.

## Layout

1. **Header** — "Daily Winning Tickets Trend"
2. **Description row** — explains the report. Range defaults to last 30 days. Max span 730 days.
3. **Date inputs** — start + end (URL-driven via `?start=&end=`).
4. **Filter row** — Job Type + Granularity selectors.
   - Granularity options: `Auto`, `Daily`, `Weekly`, `Monthly`. The Auto label shows the resolved kind in parens.
5. **Range warning** — when span is invalid (end < start) or exceeds 730 days, render a yellow `Alert` and skip the fetch.
6. **Chart** — `react-chartjs-2` `<Line>` filling a fixed-height bordered box. Two datasets (AI in teal, Transcoding in violet) — filtered by the selected job type. Chart title and Y-axis label vary by granularity.

## Granularity

- `auto`: span ≤90 days = daily; ≤540 = weekly; else monthly.
- `daily`: pass series through unchanged.
- `weekly`: bucket by ISO Monday (UTC), sum counts.
- `monthly`: bucket by `YYYY-MM`, sum counts.

## States

| Condition | Render |
| --- | --- |
| Invalid range | Warning Alert. No chart. |
| Span > 730 days | Warning Alert. No chart. |
| Loading | `CircularProgress` above the chart box |
| Error | `Alert severity="error"` above the chart box |
| Empty data | Chart renders with no datapoints (chart.js handles gracefully) |

## URL contract

All filter state lives in the query string. Changing any input updates the URL via `useSearchParams`; the loader prefetches on URL change. Defaults are applied when a key is absent.

## Dependencies introduced

- `chart.js ^4.4.7`
- `react-chartjs-2 ^5.3.0`

Registered components (in `ui/chartSetup.ts`, side-effect import from the route component): `LineElement`, `PointElement`, `LinearScale`, `CategoryScale`, `Title`, `Tooltip`, `Legend`, `Filler`. Other domains may register additional chart.js pieces independently.

## Out of scope

- CSV export of the timeseries.
- Hover crosshair / annotation plugins.
- Multi-chart compare views.
- Per-orchestrator drilldown.
