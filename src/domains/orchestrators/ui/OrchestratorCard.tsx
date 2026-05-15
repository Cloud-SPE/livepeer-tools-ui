import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { LIVEPEER_EXPLORER_ORCHESTRATOR_URL } from "../config";
import {
  avatarInitial,
  displayLabel,
  formatLpt,
  formatPercent,
  shortAddress,
} from "../service";
import type { Orchestrator } from "../types";

const AddressTooltip = styled(Tooltip)(({ theme }) => ({
  cursor: "pointer",
  textDecoration: "underline",
  "&:hover": { backgroundColor: theme.palette.grey[200] },
}));

interface Props {
  orch: Orchestrator;
  rank?: number;
  clickable?: boolean;
}

export function OrchestratorCard({ orch, rank, clickable = true }: Props): JSX.Element {
  const navigate = useNavigate();
  const onClick = clickable ? () => navigate(`/orchestrator/${orch.address}`) : undefined;

  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          cursor: clickable ? "pointer" : "default",
          "&:hover": clickable ? { boxShadow: 6 } : undefined,
        }}
        onClick={onClick}
      >
        <CardHeader
          avatar={
            orch.avatarUrl ? (
              <Avatar src={orch.avatarUrl} alt={displayLabel(orch)} />
            ) : (
              <Avatar>{avatarInitial(orch)}</Avatar>
            )
          }
          title={
            <Typography variant="h6" component="div">
              {displayLabel(orch)}
            </Typography>
          }
          subheader={
            <AddressTooltip title={orch.address} placement="top" arrow>
              <Typography variant="body2" color="textSecondary">
                {shortAddress(orch.address)}
              </Typography>
            </AddressTooltip>
          }
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}>
            {rank !== undefined && (
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="textPrimary">
                    Rank
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {rank}
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" color="textPrimary">
                  Active
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {orch.isActive ? "Yes" : "No"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" color="textPrimary">
                  Reward Cut
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatPercent(orch.rewardCutPct)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" color="textPrimary">
                  Fee Cut
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatPercent(orch.feeCutPct)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box>
                <Typography variant="subtitle2" color="textPrimary">
                  Total Stake
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatLpt(orch.totalStakeLpt)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              target="_blank"
              href={LIVEPEER_EXPLORER_ORCHESTRATOR_URL(orch.address)}
              rel="noopener"
              onClick={(e) => e.stopPropagation()}
            >
              View on Livepeer
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}
