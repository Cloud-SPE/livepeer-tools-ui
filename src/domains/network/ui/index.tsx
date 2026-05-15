import { Route } from "react-router-dom";
import { roundsLoader } from "../runtime";
import { RoundsIndex } from "./RoundsIndex";

export { NetworkStatsStrip } from "./NetworkStatsStrip";
export { RoundsIndex } from "./RoundsIndex";

export const networkRoutes = (
  <Route path="rounds" element={<RoundsIndex />} loader={roundsLoader} />
);
