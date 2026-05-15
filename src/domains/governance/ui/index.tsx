import { Route } from "react-router-dom";
import { votingHistoryLoader } from "../runtime";
import { VotingHistory } from "./VotingHistory";

export { VotingHistory } from "./VotingHistory";

export const governanceRoutes = (
  <Route path="vote/history" element={<VotingHistory />} loader={votingHistoryLoader} />
);
