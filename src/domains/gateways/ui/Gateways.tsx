import type { JSX } from "react";
import { Alert, Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useGateways } from "../runtime";
import { GatewayCard } from "./GatewayCard";

export function Gateways(): JSX.Element {
  const { data, isLoading, error } = useGateways({});

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
        <Alert severity="error">Failed to load gateways: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        All Gateways
      </Typography>
      <Grid container spacing={4}>
        {(data?.data ?? []).map((gw) => (
          <GatewayCard key={gw.address} gateway={gw} />
        ))}
      </Grid>
    </Box>
  );
}
