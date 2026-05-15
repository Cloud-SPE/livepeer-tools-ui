import { createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { orchestratorRoutes } from "@/domains/orchestrators/ui";
import { governanceRoutes } from "@/domains/governance/ui";
import { payoutsRoutes } from "@/domains/payouts/ui";
import { gatewayRoutes } from "@/domains/gateways/ui";
import { rewardsRoutes } from "@/domains/rewards/ui";
import { ticketsRoutes } from "@/domains/tickets/ui";
import { networkRoutes } from "@/domains/network/ui";
import { networkStatsLoader } from "@/domains/network/runtime";
import { performanceRoutes } from "@/domains/performance/ui";
import { aiRoutes } from "@/domains/ai-generator/ui";
import { App } from "./App";
import { Home } from "./Home";

/**
 * Top-level route table. Domains export their own `Route` fragments from
 * `<domain>/ui/index.tsx`; this file composes them.
 */
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<Home />} loader={networkStatsLoader} />
      {orchestratorRoutes}
      {governanceRoutes}
      {payoutsRoutes}
      {gatewayRoutes}
      {rewardsRoutes}
      {ticketsRoutes}
      {networkRoutes}
      {performanceRoutes}
      {aiRoutes}
      <Route
        path="*"
        element={
          <Box sx={{ p: 4 }}>
            <Typography variant="h4">404 — Not Found</Typography>
            <Typography variant="body1">The page you are looking for does not exist.</Typography>
          </Box>
        }
      />
    </Route>,
  ),
);
