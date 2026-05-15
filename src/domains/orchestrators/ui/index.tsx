import { Route } from "react-router-dom";
import { orchestratorLoader, orchestratorsLoader } from "../runtime";
import { Orchestrators } from "./Orchestrators";
import { OrchestratorDetail } from "./OrchestratorDetail";

export { Orchestrators } from "./Orchestrators";
export { OrchestratorDetail } from "./OrchestratorDetail";
export { OrchestratorCard } from "./OrchestratorCard";

/**
 * Route descriptors for this domain. Composed into the app's top-level
 * router in `src/app/routes.tsx`. Domain owns its URL contract; the app
 * just mounts the fragment.
 */
export const orchestratorRoutes = (
  <>
    <Route
      path="orchestrators"
      element={<Orchestrators />}
      loader={orchestratorsLoader}
    />
    <Route
      path="orchestrator/:eth_address"
      element={<OrchestratorDetail />}
      loader={orchestratorLoader}
    />
  </>
);
