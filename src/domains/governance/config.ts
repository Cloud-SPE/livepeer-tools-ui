import type { ProposalStatus, SupportLabel } from "./types";

/** Where the "View on Livepeer" link points for a proposal. */
export const LIVEPEER_TREASURY_PROPOSAL_URL = (proposalId: string): string =>
  `https://explorer.livepeer.org/treasury/${proposalId}`;

/**
 * MUI theme palette keys used to render each status / support type. The
 * UI resolves these against the live theme — config doesn't hard-code RGB.
 */
export const STATUS_PALETTE: Record<
  ProposalStatus,
  { main: string; tone: "success" | "error" | "info" | "warning" | "grey" }
> = {
  Executed: { main: "success.main", tone: "success" },
  Succeeded: { main: "success.main", tone: "success" },
  Defeated: { main: "error.main", tone: "error" },
  Active: { main: "info.main", tone: "info" },
  Pending: { main: "info.main", tone: "info" },
  Unknown: { main: "grey.500", tone: "grey" },
};

export const SUPPORT_PALETTE: Record<SupportLabel, "success" | "error" | "warning"> = {
  For: "success",
  Against: "error",
  Abstain: "warning",
};

/** Default page size when listing proposals or votes. */
export const DEFAULT_PROPOSALS_LIMIT = 200;
export const DEFAULT_VOTES_LIMIT = 500;
