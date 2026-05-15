import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BallotIcon from "@mui/icons-material/Ballot";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Description from "@mui/icons-material/Description";
import Poll from "@mui/icons-material/Poll";
import ThumbUp from "@mui/icons-material/ThumbUp";
import ThumbDown from "@mui/icons-material/ThumbDown";
import ThumbsUpDown from "@mui/icons-material/ThumbsUpDown";
import { LIVEPEER_TREASURY_PROPOSAL_URL, STATUS_PALETTE } from "../config";
import { useBlockFloor, useVotesForProposal } from "../runtime";
import {
  deriveStatus,
  formatLpt,
  formatPercent,
  identityLabel,
  tallyBreakdown,
} from "../service";
import type { Proposal, VoterIdentity } from "../types";
import { VotesTable } from "./VotesTable";
import { AllVotesByVoterDialog } from "./AllVotesByVoterDialog";

interface Props {
  proposal: Proposal;
}

export function ProposalDetailPane({ proposal }: Props): JSX.Element {
  const theme = useTheme();
  const floorQ = useBlockFloor();
  const votesQ = useVotesForProposal(proposal.id);
  const [selectedVoter, setSelectedVoter] = useState<
    { address: string; identity: VoterIdentity | null } | null
  >(null);

  const status = deriveStatus(proposal, floorQ.data ?? { floor: null });
  const statusTone = STATUS_PALETTE[status].tone;
  const chipColor =
    statusTone === "grey" ? theme.palette.grey[500] : theme.palette[statusTone].main;
  const breakdown = tallyBreakdown(proposal.tally);

  const proposerLabel = identityLabel(
    proposal.proposer,
    proposal.proposerIdentity?.displayName ?? null,
  );

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          boxShadow: theme.shadows[2],
          backgroundColor: theme.palette.background.default,
          height: "100%",
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", display: "flex", alignItems: "center" }}
          >
            <BallotIcon sx={{ mr: 1 }} />
            {proposal.title}
          </Typography>

          <Box sx={{ mt: 1 }}>
            <Chip
              label={status}
              sx={{
                fontWeight: "bold",
                color: theme.palette.common.white,
                backgroundColor: chipColor,
              }}
            />
          </Box>

          <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <PersonOutlineIcon fontSize="small" color="action" />
            <Typography variant="body2">
              <strong>Proposer:</strong> {proposerLabel}
            </Typography>
          </Box>

          <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Description fontSize="small" color="action" />
            <Typography variant="body2" component="span">
              <strong>Original Proposal:</strong>
            </Typography>
            <Button
              size="small"
              color="primary"
              endIcon={<ArrowForward />}
              target="_blank"
              href={LIVEPEER_TREASURY_PROPOSAL_URL(proposal.id)}
              rel="noopener"
            >
              View on Livepeer
            </Button>
          </Box>

          <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Poll fontSize="small" color="action" />
            <Typography variant="body2">
              <strong>Total Stake Voted:</strong> {formatLpt(breakdown.totalLpt)} LPT
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              Total Support: {formatPercent(breakdown.totalSupportPct, 4)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              (For / (For + Against), excluding Abstain votes)
            </Typography>
            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <ThumbUp fontSize="small" color="action" />
              <Typography variant="body2">
                For ({formatPercent(breakdown.forPct, 4)}):{" "}
                {formatLpt(proposal.tally.forLpt)} LPT
              </Typography>
            </Box>
            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <ThumbDown fontSize="small" color="action" />
              <Typography variant="body2">
                Against ({formatPercent(breakdown.againstPct, 4)}):{" "}
                {formatLpt(proposal.tally.againstLpt)} LPT
              </Typography>
            </Box>
            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <ThumbsUpDown fontSize="small" color="action" />
              <Typography variant="body2">
                Abstain ({formatPercent(breakdown.abstainPct, 4)}):{" "}
                {formatLpt(proposal.tally.abstainLpt)} LPT
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
            <HowToVoteIcon color="action" />
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              Votes
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Click on any voter's row to see all of their votes.
          </Typography>

          {votesQ.isLoading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : votesQ.error ? (
            <Alert severity="error">Failed to load votes: {votesQ.error.message}</Alert>
          ) : (
            <VotesTable
              votes={votesQ.data?.data ?? []}
              totalLpt={breakdown.totalLpt}
              onVoterClick={(identity, address) =>
                setSelectedVoter({ address, identity })
              }
            />
          )}
        </CardContent>
      </Card>

      <AllVotesByVoterDialog
        open={selectedVoter !== null}
        voterAddress={selectedVoter?.address ?? null}
        voterIdentity={selectedVoter?.identity ?? null}
        onClose={() => setSelectedVoter(null)}
      />
    </>
  );
}
