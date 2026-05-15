import { Route } from "react-router-dom";
import { gatewayLoader, gatewaysLoader } from "../runtime";
import { GatewayDetail } from "./GatewayDetail";
import { Gateways } from "./Gateways";

export { Gateways } from "./Gateways";
export { GatewayDetail } from "./GatewayDetail";
export { GatewayCard } from "./GatewayCard";

/**
 * The /broadcasters and /broadcaster/:eth_address aliases preserve URL
 * compatibility with the old livepeer-tools-ui.
 */
export const gatewayRoutes = (
  <>
    <Route path="gateways" element={<Gateways />} loader={gatewaysLoader} />
    <Route path="broadcasters" element={<Gateways />} loader={gatewaysLoader} />
    <Route
      path="gateway/:eth_address"
      element={<GatewayDetail />}
      loader={gatewayLoader}
    />
    <Route
      path="broadcaster/:eth_address"
      element={<GatewayDetail />}
      loader={gatewayLoader}
    />
  </>
);
