import { Alert, Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { useOrchestrator } from "../runtime";
import { OrchestratorCard } from "./OrchestratorCard";

export function OrchestratorDetail(): JSX.Element {
  const params = useParams<{ eth_address: string }>();
  const address = params.eth_address ?? "";
  const { data, isLoading, error } = useOrchestrator(address);

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
        <Alert severity="error">Failed to load orchestrator: {error.message}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="warning">Orchestrator not found.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Orchestrator
      </Typography>
      <Grid container spacing={4}>
        <OrchestratorCard orch={data} clickable={false} />
      </Grid>
    </Box>
  );
}
