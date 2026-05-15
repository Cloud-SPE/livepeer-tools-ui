import type { JSX } from "react";
import { Alert, Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useOrchestrators } from "../runtime";
import { rankByStake } from "../service";
import { OrchestratorCard } from "./OrchestratorCard";

export function Orchestrators(): JSX.Element {
  const { data, isLoading, error } = useOrchestrators({});

  if (isLoading) {
    return (
      <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">Failed to load orchestrators: {error.message}</Alert>
      </Box>
    );
  }

  const ranked = rankByStake(data?.data ?? []);

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        All Orchestrators
      </Typography>
      <Grid container spacing={4}>
        {ranked.map((orch, idx) => (
          <OrchestratorCard key={orch.address} orch={orch} rank={idx + 1} />
        ))}
      </Grid>
    </Box>
  );
}
