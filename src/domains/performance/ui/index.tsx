import { Route } from "react-router-dom";
import { leaderboardLoader, statsLoader } from "../runtime";
import { Leaderboard } from "./Leaderboard";
import { Stats } from "./Stats";

export { Leaderboard } from "./Leaderboard";
export { Stats } from "./Stats";

export const performanceRoutes = (
  <>
    <Route path="performance/leaderboard" element={<Leaderboard />} loader={leaderboardLoader} />
    <Route path="performance/stats" element={<Stats />} loader={statsLoader} />
  </>
);
