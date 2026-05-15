import type { JSX } from "react";
import { Alert, Box, Paper, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useRounds } from "../runtime";
import { formatInt, formatLpt, formatTimestampUtc, formatUsd } from "../service";
import type { Round } from "../types";

export function RoundsIndex(): JSX.Element {
  const { data, isLoading, error } = useRounds({});

  const columns: GridColDef<Round & { id: number }>[] = [
    { field: "round", headerName: "Round", width: 100, type: "number" },
    {
      field: "startedAt",
      headerName: "Started At (UTC)",
      flex: 1,
      minWidth: 180,
      valueFormatter: (v: string) => formatTimestampUtc(v),
    },
    {
      field: "startedBlock",
      headerName: "Started Block",
      type: "number",
      flex: 1,
      minWidth: 130,
      valueFormatter: (v: number) => formatInt(v),
    },
    {
      field: "activeOrchestrators",
      headerName: "Active Orchs",
      type: "number",
      flex: 0.8,
      minWidth: 110,
    },
    {
      field: "totalLptStaked",
      headerName: "Total LPT Staked",
      type: "number",
      flex: 1.1,
      minWidth: 150,
      valueFormatter: (v: number) => `${formatLpt(v)} LPT`,
    },
    {
      field: "payoutsUsdOnDay",
      headerName: "Payouts (USD)",
      type: "number",
      flex: 0.9,
      minWidth: 120,
      valueFormatter: (v: number) => formatUsd(v),
    },
    {
      field: "rewardsUsdOnDay",
      headerName: "Rewards (USD)",
      type: "number",
      flex: 0.9,
      minWidth: 120,
      valueFormatter: (v: number) => formatUsd(v),
    },
  ];

  const rows = (data?.data ?? []).map((r) => ({ ...r, id: r.round }));

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">Failed to load rounds: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Rounds
      </Typography>
      <Paper sx={{ width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          autoHeight
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: "round", sort: "desc" }] },
          }}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          sx={{ "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" } }}
        />
      </Paper>
    </Box>
  );
}
