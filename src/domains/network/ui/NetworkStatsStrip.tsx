import type { JSX } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNetworkStats } from "../runtime";
import { formatEth, formatInt, formatLpt, formatTimestampUtc, formatUsd } from "../service";

interface KPI {
  label: string;
  value: string;
  helper?: string;
}

export function NetworkStatsStrip(): JSX.Element {
  const { data, isLoading, error } = useNetworkStats();

  if (isLoading || !data) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            {error ? (
              <Alert severity="error">Failed to load network stats: {error.message}</Alert>
            ) : (
              <CircularProgress />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const kpis: KPI[] = [
    {
      label: "Latest Round",
      value: data.latestRound != null ? formatInt(data.latestRound) : "—",
      helper: `started ${formatTimestampUtc(data.latestRoundStartedAt)}`,
    },
    {
      label: "Active Orchestrators",
      value: formatInt(data.activeOrchestrators),
    },
    {
      label: "Active Delegators",
      value: formatInt(data.activeDelegators),
      helper: `${formatInt(data.totalDelegations)} delegations total`,
    },
    {
      label: "Gateways Known",
      value: formatInt(data.gatewaysKnown),
    },
    {
      label: "Total LPT Staked",
      value: `${formatLpt(data.totalLptStaked)} LPT`,
    },
    {
      label: "Payouts (24h)",
      value: formatUsd(data.payoutsUsd24h),
    },
    {
      label: "Rewards (24h)",
      value: formatUsd(data.rewardsUsd24h),
    },
    {
      label: "Gas Burned (24h)",
      value: `${formatEth(data.gasBurnedEth24h, 6)} ETH`,
    },
  ];

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
          Network at a glance
        </Typography>
        <Grid container spacing={3}>
          {kpis.map((kpi) => (
            <Grid
              key={kpi.label}
              size={{
                xs: 6,
                sm: 4,
                md: 3,
              }}
            >
              <Tooltip
                title={kpi.helper ?? ""}
                placement="top"
                arrow
                disableHoverListener={!kpi.helper}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {kpi.label}
                  </Typography>
                  <Typography variant="h6">{kpi.value}</Typography>
                </Box>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          Chain {data.chainId} · profiles refreshed{" "}
          {formatTimestampUtc(data.orchestratorProfileRefreshedAt)}
        </Typography>
      </CardContent>
    </Card>
  );
}
