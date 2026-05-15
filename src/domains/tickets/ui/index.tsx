import { Route } from "react-router-dom";
import { dailyTicketsLoader } from "../runtime";
import { DailyTicketsReport } from "./DailyTicketsReport";

export { DailyTicketsReport } from "./DailyTicketsReport";

export const ticketsRoutes = (
  <Route
    path="reports/tickets/daily"
    element={<DailyTicketsReport />}
    loader={dailyTicketsLoader}
  />
);
