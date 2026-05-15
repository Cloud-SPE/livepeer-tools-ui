# 006 — Domain: tickets

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Port the old `/reports/tickets/daily` route — a date-range-windowed line chart of winning-ticket counts split by AI vs Transcoding. Closes the "(Coming soon)" link on the Reports landing card.

This phase introduces `chart.js` + `react-chartjs-2` to the codebase for the first time.

## Acceptance criteria

- [ ] `src/domains/tickets/` is fully layered.
- [ ] `repo.ts` imports only from `src/providers/network-explorer`.
- [ ] `/reports/tickets/daily?start=&end=&job_type=&granularity=` renders the line chart.
- [ ] Date range, job type, and granularity (auto / daily / weekly / monthly) are URL-driven.
- [ ] Auto-granularity matches the old UI: ≤90 days = daily, ≤540 days = weekly, else monthly.
- [ ] Range-warning when span is invalid or exceeds 730 days.
- [ ] Reports landing card no longer says "(Coming soon)".
- [ ] At least 4 unit tests for service helpers (granularity resolution, aggregation, span calc).
- [ ] Structural tests still pass.

## Steps

1. Add `chart.js` + `react-chartjs-2` to dependencies (done before code).
2. types, config, repo, service.
3. runtime + ui.
4. Update payouts/ui/Reports.tsx tickets card description.
5. Tests + spec.
6. Verify + close.

## Decisions log

- Use `react-chartjs-2` declarative wrapper over hand-rolled `useRef + new Chart()`. Cleaner React lifecycle.
- Register only the chart.js parts we actually use (LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler). Skip ChartDataLabels — the old UI registered it for this route but disabled it; not needed.
- Live API uses `start` + `end` (not `from` + `to`) as query parameter names. Repo respects that.
- `count` ships as a string; repo parses to number on the boundary.
- Auto-granularity heuristic is identical to the old UI (90/540 thresholds in days).
- 730-day max span is enforced client-side as a warning, not a hard block — matches the old UI.

## Test plan

- Unit-test `resolveGranularity` for boundary cases (90, 91, 540, 541, null span).
- Unit-test `aggregateByGranularity` for daily passthrough, weekly bucketing (ISO Monday), monthly bucketing.
- Unit-test `spanInDays` for valid, reversed, and invalid inputs.
- After wiring, hit `/reports/tickets/daily?start=2026-05-01&end=2026-05-14` against the live API and confirm the chart renders.
