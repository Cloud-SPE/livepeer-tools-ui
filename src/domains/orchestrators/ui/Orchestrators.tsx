import type { JSX } from "react";
import { Alert, Box, Button, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import { useOrchestratorsInfinite } from "../runtime";
import { rankByStake } from "../service";
import { OrchestratorCard } from "./OrchestratorCard";

export function Orchestrators(): JSX.Element {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOrchestratorsInfinite(100);

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

  const ranked = rankByStake(data?.pages.flatMap((page) => page.data) ?? []);

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
      {hasNextPage && (
        <Stack sx={{ alignItems: "center", mt: 4 }}>
          <Button
            variant="contained"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
