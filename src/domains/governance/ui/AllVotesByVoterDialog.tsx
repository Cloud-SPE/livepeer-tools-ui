import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { SUPPORT_PALETTE, STATUS_PALETTE } from "../config";
import { useBlockFloor, useProposals, useVotesByVoter } from "../runtime";
import {
  deriveStatus,
  formatLpt,
  getTitle,
  identityLabel,
} from "../service";
import type { Proposal, VoterIdentity } from "../types";

interface Props {
  open: boolean;
  voterAddress: string | null;
  voterIdentity: VoterIdentity | null;
  onClose: () => void;
}

export function AllVotesByVoterDialog({
  open,
  voterAddress,
  voterIdentity,
  onClose,
}: Props): JSX.Element {
  const theme = useTheme();
  const proposalsQ = useProposals();
  const floorQ = useBlockFloor();
  const votesQ = useVotesByVoter(voterAddress);

  const proposalsById = new Map<string, Proposal>();
  for (const p of proposalsQ.data?.data ?? []) proposalsById.set(p.id, p);

  const label = voterAddress
    ? identityLabel(voterAddress, voterIdentity?.displayName ?? null)
    : "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" component="span">
            All Votes by
          </Typography>
          <Avatar
            src={voterIdentity?.avatarUrl ?? undefined}
            alt={label}
            sx={{ width: 24, height: 24 }}
          />
          <Typography variant="h5" component="span">
            {label}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {votesQ.isLoading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : votesQ.error ? (
          <Typography color="error">Failed to load: {votesQ.error.message}</Typography>
        ) : !votesQ.data || votesQ.data.data.length === 0 ? (
          <Typography>No votes found for {voterAddress ?? "this voter"}.</Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Proposal Title</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Support</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Stake (LPT)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {votesQ.data.data.map((vote) => {
                  const proposal = proposalsById.get(vote.proposalId);
                  const title = proposal ? getTitle(proposal.description) : vote.proposalId;
                  const status = proposal
                    ? deriveStatus(proposal, floorQ.data ?? { floor: null })
                    : "Unknown";
                  const statusTone = STATUS_PALETTE[status].tone;
                  const statusBg =
                    statusTone === "grey"
                      ? alpha(theme.palette.grey[400], 0.25)
                      : alpha(theme.palette[statusTone].main, 0.25);
                  const supportTone = SUPPORT_PALETTE[vote.support];
                  const supportBg = alpha(theme.palette[supportTone].main, 0.25);
                  return (
                    <TableRow key={vote.proposalId}>
                      <TableCell>{title}</TableCell>
                      <TableCell sx={{ backgroundColor: statusBg }}>{status}</TableCell>
                      <TableCell sx={{ backgroundColor: supportBg }}>{vote.support}</TableCell>
                      <TableCell>{formatLpt(vote.stakeLpt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
