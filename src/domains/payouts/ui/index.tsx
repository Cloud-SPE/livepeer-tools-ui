import { Navigate, Route } from "react-router-dom";
import {
  dailySummaryLoader,
  monthlySummaryLoader,
  reportsLandingLoader,
  topPayoutLoader,
  weeklySummaryLoader,
} from "../runtime";
import { todayIso } from "../service";
import { PayoutSummary } from "./PayoutSummary";
import { Reports } from "./Reports";
import { TopPayout } from "./TopPayout";

export { Reports } from "./Reports";
export { PayoutSummary } from "./PayoutSummary";
export { TopPayout } from "./TopPayout";

/**
 * Route descriptors for the payouts domain.
 *
 * Top-level period routes without a date redirect to the same path with
 * today's date pre-filled — preserves link compatibility with the old UI.
 */
export const payoutsRoutes = (
  <>
    <Route path="reports" element={<Reports />} loader={reportsLandingLoader} />
    <Route path="reports/top/payout" element={<TopPayout />} loader={topPayoutLoader} />
    <Route
      path="reports/daily"
      element={<Navigate to={`/reports/daily/${todayIso()}`} replace />}
    />
    <Route
      path="reports/weekly"
      element={<Navigate to={`/reports/weekly/${todayIso()}`} replace />}
    />
    <Route
      path="reports/monthly"
      element={<Navigate to={`/reports/monthly/${todayIso()}`} replace />}
    />
    <Route
      path="reports/daily/:date"
      element={<PayoutSummary kind="daily" />}
      loader={dailySummaryLoader}
    />
    <Route
      path="reports/weekly/:date"
      element={<PayoutSummary kind="weekly" />}
      loader={weeklySummaryLoader}
    />
    <Route
      path="reports/monthly/:date"
      element={<PayoutSummary kind="monthly" />}
      loader={monthlySummaryLoader}
    />
  </>
);
