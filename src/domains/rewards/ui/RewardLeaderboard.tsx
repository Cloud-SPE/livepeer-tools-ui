import {
  Alert,
  Avatar,
  Box,
  Button,
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
import Download from "@mui/icons-material/Download";
import { useSearchParams } from "react-router-dom";
import { SORT_KEYS, buildRewardsCsvUrl } from "../config";
import { useRewardLeaderboard } from "../runtime";
import {
  formatInt,
  formatLpt,
  formatUsd,
  rowLabel,
  todayIso,
} from "../service";
import type { RewardLeaderboardRow, SortKey } from "../types";

function defaultStart(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

export function RewardLeaderboard(): JSX.Element {
  const [search, setSearch] = useSearchParams();
  const from = search.get("from") ?? defaultStart();
  const to = search.get("to") ?? todayIso();
  const sort: SortKey = ((): SortKey => {
    const s = search.get("sort");
    if (s === "total_tokens_usd" || s === "reward_event_count") return s;
    return "orch_tokens_usd";
  })();

  const leaderboardQ = useRewardLeaderboard({ from, to, sort });

  const updateParam = (key: string, value: string | null): void => {
    const next = new URLSearchParams(search);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    setSearch(next);
  };

  const columns: GridColDef<RewardLeaderboardRow & { id: string; rank: number }>[] = [
    { field: "rank", headerName: "Rank", width: 80 },
    {
      field: "orchestrator",
      headerName: "Orchestrator",
      flex: 1.4,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar
            src={params.row.avatarUrl ?? undefined}
            alt={rowLabel(params.row)}
            sx={{ width: 24, height: 24 }}
          />
          <span>{rowLabel(params.row)}</span>
        </Stack>
      ),
    },
    { field: "rewardEventCount", headerName: "Reward Calls", type: "number", flex: 0.7 },
    {
      field: "totalLpt",
      headerName: "Total (LPT)",
      type: "number",
      flex: 0.9,
      valueFormatter: (v: number) => formatLpt(v),
    },
    {
      field: "totalUsd",
      headerName: "Total (USD)",
      type: "number",
      flex: 0.9,
      valueFormatter: (v: number) => formatUsd(v),
    },
    {
      field: "orchLpt",
      headerName: "Orch (LPT)",
      type: "number",
      flex: 0.9,
      valueFormatter: (v: number) => formatLpt(v),
    },
    {
      field: "orchUsd",
      headerName: "Orch (USD)",
      type: "number",
      flex: 0.9,
      valueFormatter: (v: number) => formatUsd(v),
    },
    {
      field: "delegatorsLpt",
      headerName: "Delegators (LPT)",
      type: "number",
      flex: 1,
      valueFormatter: (v: number) => formatLpt(v),
    },
    {
      field: "delegatorsUsd",
      headerName: "Delegators (USD)",
      type: "number",
      flex: 1,
      valueFormatter: (v: number) => formatUsd(v),
    },
    {
      field: "events",
      headerName: "Events",
      type: "number",
      flex: 0.6,
      valueGetter: (_, row) => row.rewardEventCount,
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
        Top Rewards Report
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Start Date"
            type="date"
            value={from}
            onChange={(e) => updateParam("from", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="End Date"
            type="date"
            value={to}
            onChange={(e) => updateParam("to", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
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
      </Grid>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          startIcon={<Download />}
          href={buildRewardsCsvUrl({ from, to })}
          target="_blank"
          rel="noopener"
        >
          Download CSV
        </Button>
      </Box>

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
            sx={{ "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" } }}
          />
        </Paper>
      )}
    </Box>
  );
}
