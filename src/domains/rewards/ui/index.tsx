import { Navigate, Route } from "react-router-dom";
import {
  dailyRewardSummaryLoader,
  monthlyRewardSummaryLoader,
  topRewardsLoader,
  weeklyRewardSummaryLoader,
} from "../runtime";
import { todayIso } from "../service";
import { RewardLeaderboard } from "./RewardLeaderboard";
import { RewardSummary } from "./RewardSummary";

export { RewardSummary } from "./RewardSummary";
export { RewardLeaderboard } from "./RewardLeaderboard";

export const rewardsRoutes = (
  <>
    <Route
      path="reports/rewards/leaderboard"
      element={<RewardLeaderboard />}
      loader={topRewardsLoader}
    />
    <Route
      path="reports/rewards/daily"
      element={<Navigate to={`/reports/rewards/daily/${todayIso()}`} replace />}
    />
    <Route
      path="reports/rewards/weekly"
      element={<Navigate to={`/reports/rewards/weekly/${todayIso()}`} replace />}
    />
    <Route
      path="reports/rewards/monthly"
      element={<Navigate to={`/reports/rewards/monthly/${todayIso()}`} replace />}
    />
    <Route
      path="reports/rewards/daily/:date"
      element={<RewardSummary kind="daily" />}
      loader={dailyRewardSummaryLoader}
    />
    <Route
      path="reports/rewards/weekly/:date"
      element={<RewardSummary kind="weekly" />}
      loader={weeklyRewardSummaryLoader}
    />
    <Route
      path="reports/rewards/monthly/:date"
      element={<RewardSummary kind="monthly" />}
      loader={monthlyRewardSummaryLoader}
    />
  </>
);
