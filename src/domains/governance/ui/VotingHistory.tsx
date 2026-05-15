import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
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
import BallotIcon from "@mui/icons-material/Ballot";
import { STATUS_PALETTE } from "../config";
import { useBlockFloor, useProposals } from "../runtime";
import { deriveStatus, hydrateTitles, rankByCreatedDesc } from "../service";
import type { Proposal, ProposalStatus } from "../types";
import { ProposalDetailPane } from "./ProposalDetailPane";

export function VotingHistory(): JSX.Element {
  const theme = useTheme();
  const proposalsQ = useProposals();
  const floorQ = useBlockFloor();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const proposals = useMemo<Proposal[]>(
    () => rankByCreatedDesc(hydrateTitles(proposalsQ.data?.data ?? [])),
    [proposalsQ.data],
  );

  const selected = selectedId
    ? proposals.find((p) => p.id === selectedId)
    : null;

  if (proposalsQ.isLoading) {
    return (
      <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (proposalsQ.error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">Failed to load proposals: {proposalsQ.error.message}</Alert>
      </Box>
    );
  }

  const statusColor = (status: ProposalStatus): string => {
    const tone = STATUS_PALETTE[status].tone;
    return tone === "grey" ? theme.palette.grey[500] : theme.palette[tone].main;
  };

  const statusBg = (status: ProposalStatus, value: number): string => {
    const tone = STATUS_PALETTE[status].tone;
    if (tone === "grey") return alpha(theme.palette.grey[400], value);
    return alpha(theme.palette[tone].light, value);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        mt: 2,
        mb: 2,
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", md: "30%" },
          borderRight: { xs: "none", md: `1px solid ${theme.palette.divider}` },
          backgroundColor: theme.palette.background.paper,
          boxShadow: { xs: theme.shadows[1], md: "none" },
          overflow: "hidden",
        }}
      >
        <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                <TableCell
                  sx={{
                    color: theme.palette.common.white,
                    fontWeight: "bold",
                    fontSize: "1rem",
                  }}
                >
                  <BallotIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  Proposals
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proposals.map((proposal) => {
                const status = deriveStatus(proposal, floorQ.data ?? { floor: null });
                const isSelected = proposal.id === selectedId;
                return (
                  <TableRow
                    key={proposal.id}
                    hover
                    onClick={() => setSelectedId(proposal.id)}
                    sx={{
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      "&:hover": { backgroundColor: theme.palette.action.hover },
                      backgroundColor: isSelected ? statusBg(status, 0.25) : "inherit",
                      borderLeft: `4px solid ${statusColor(status)}`,
                    }}
                  >
                    <TableCell
                      sx={{ fontWeight: isSelected ? "bold" : "normal" }}
                    >
                      <Typography variant="subtitle2">{proposal.title}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: statusColor(status),
                          fontWeight: "bold",
                          display: "block",
                          mt: 0.5,
                        }}
                      >
                        {status}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ width: { xs: "100%", md: "70%" }, p: 2, overflow: "hidden" }}>
        {!selected ? (
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}
          >
            <Typography variant="h6" color="textSecondary">
              Select a proposal from the list to view details.
            </Typography>
          </Card>
        ) : (
          <ProposalDetailPane proposal={selected} />
        )}
      </Box>
    </Box>
  );
}
