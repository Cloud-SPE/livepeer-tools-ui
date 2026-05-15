import {
  Avatar,
  Box,
  Grid,
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
import { SUPPORT_PALETTE } from "../config";
import { formatLpt, identityLabel, voteSharePct } from "../service";
import type { Vote, VoterIdentity } from "../types";

interface Props {
  votes: ReadonlyArray<Vote>;
  totalLpt: number;
  onVoterClick: (identity: VoterIdentity | null, address: string) => void;
}

export function VotesTable({ votes, totalLpt, onVoterClick }: Props): JSX.Element {
  const theme = useTheme();
  const supportBg = (s: Vote["support"]): string => {
    const tone = SUPPORT_PALETTE[s];
    const palette = theme.palette[tone];
    return alpha(palette.main, 0.1);
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
            <TableCell sx={{ fontWeight: "bold" }}>Voter</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Support</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Stake (LPT)</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>% of Vote</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {votes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                No votes found for this proposal.
              </TableCell>
            </TableRow>
          ) : (
            votes.map((vote, idx) => {
              const label = identityLabel(
                vote.voterAddress,
                vote.voterIdentity?.displayName ?? null,
              );
              return (
                <TableRow
                  key={`${vote.voterAddress}-${idx}`}
                  hover
                  sx={{ backgroundColor: supportBg(vote.support), cursor: "pointer" }}
                  onClick={() => onVoterClick(vote.voterIdentity, vote.voterAddress)}
                >
                  <TableCell>
                    <Grid container alignItems="center" spacing={1}>
                      <Grid item>
                        <Avatar
                          src={vote.voterIdentity?.avatarUrl ?? undefined}
                          alt={label}
                          sx={{ width: 24, height: 24 }}
                        />
                      </Grid>
                      <Grid item>
                        <Typography variant="inherit">{label}</Typography>
                      </Grid>
                    </Grid>
                  </TableCell>
                  <TableCell>{vote.support}</TableCell>
                  <TableCell>{formatLpt(vote.stakeLpt)}</TableCell>
                  <TableCell>
                    {voteSharePct(vote, totalLpt).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                    %
                  </TableCell>
                  <TableCell>
                    <Box sx={{ maxWidth: 400, whiteSpace: "pre-wrap" }}>
                      {vote.reason ?? "-"}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
