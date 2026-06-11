import type { JSX } from "react";
import {
  Alert,
  Avatar,
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useSearchParams } from "react-router-dom";
import { JOB_TYPES, SORT_KEYS } from "../config";
import { useLeaderboard } from "../runtime";
import { formatEth, formatInt, formatUsd, rowLabel, todayIso } from "../service";
import type { JobType, PayoutLeaderboardRow, SortKey } from "../types";

function defaultStart(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

export function TopPayout(): JSX.Element {
  const [search, setSearch] = useSearchParams();
  const from = search.get("from") ?? defaultStart();
  const to = search.get("to") ?? todayIso();
  const jobType: JobType = ((): JobType => {
    const j = search.get("job_type");
    return j === "ai" || j === "transcoding" ? j : "both";
  })();
  const sort: SortKey = ((): SortKey => {
    const s = search.get("sort");
    if (s === "face_value_usd" || s === "ticket_count") return s;
    return "commission_usd";
  })();

  const leaderboardQ = useLeaderboard({ from, to, jobType, sort });

  const updateParam = (key: string, value: string | null): void => {
    const next = new URLSearchParams(search);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    setSearch(next);
  };

  const columns: GridColDef<PayoutLeaderboardRow & { id: string; rank: number }>[] = [
    { field: "rank", headerName: "Rank", width: 80 },
    {
      field: "orchestrator",
      headerName: "Orchestrator",
      flex: 1.4,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Avatar
            src={params.row.avatarUrl ?? undefined}
            alt={rowLabel(params.row)}
            sx={{ width: 24, height: 24 }}
          />
          <span>{rowLabel(params.row)}</span>
        </Stack>
      ),
    },
    { field: "ticketCount", headerName: "Tickets Won", type: "number", flex: 0.7 },
    {
      field: "faceValueEth",
      headerName: "Total (ETH)",
      type: "number",
      flex: 0.9,
      valueFormatter: (v: number) => formatEth(v, 4),
    },
    {
      field: "faceValueUsd",
      headerName: "Total (USD)",
      type: "number",
      flex: 0.9,
      valueFormatter: (v: number) => formatUsd(v),
    },
    {
      field: "commissionEth",
      headerName: "Commission (ETH)",
      type: "number",
      flex: 1,
      valueFormatter: (v: number) => formatEth(v, 4),
    },
    {
      field: "commissionUsd",
      headerName: "Commission (USD)",
      type: "number",
      flex: 1,
      valueFormatter: (v: number) => formatUsd(v),
    },
    {
      field: "distinctGateways",
      headerName: "Distinct Gateways",
      type: "number",
      flex: 0.8,
      valueFormatter: (v: number) => formatInt(v),
    },
  ];

  const rows = (leaderboardQ.data?.data ?? []).map((r, i) => ({
    ...r,
    id: r.orchestratorAddress,
    rank: i + 1,
  }));

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" align="center" gutterBottom>
        Top Payout Report
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid
          size={{
            xs: 12,
            md: 3,
          }}
        >
          <TextField
            label="Start Date"
            type="date"
            value={from}
            onChange={(e) => updateParam("from", e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 3,
          }}
        >
          <TextField
            label="End Date"
            type="date"
            value={to}
            onChange={(e) => updateParam("to", e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 3,
          }}
        >
          <FormControl fullWidth>
            <InputLabel id="sort-label">Sort By</InputLabel>
            <Select
              labelId="sort-label"
              label="Sort By"
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
            >
              {SORT_KEYS.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 3,
          }}
        >
          <FormControl fullWidth>
            <InputLabel id="job-label">Job Type</InputLabel>
            <Select
              labelId="job-label"
              label="Job Type"
              value={jobType}
              onChange={(e) =>
                updateParam("job_type", e.target.value === "both" ? null : e.target.value)
              }
            >
              {JOB_TYPES.map((j) => (
                <MenuItem key={j.value} value={j.value}>
                  {j.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {leaderboardQ.error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load: {leaderboardQ.error.message}
        </Alert>
      ) : (
        <Paper sx={{ mt: 2, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={leaderboardQ.isLoading}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            pageSizeOptions={[25, 50, 100]}
            autoHeight
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" },
            }}
          />
        </Paper>
      )}
    </Box>
  );
}
