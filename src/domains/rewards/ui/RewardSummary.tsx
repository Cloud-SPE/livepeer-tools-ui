import type { JSX } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Download from "@mui/icons-material/Download";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PERIOD_LABELS, buildRewardsCsvUrl } from "../config";
import { useRewardLeaderboard, useRewardSummary } from "../runtime";
import {
  formatHumanDate,
  formatInt,
  formatLpt,
  formatPercent,
  formatUsd,
  rangeFor,
  rowLabel,
  shiftPeriod,
} from "../service";
import type { PeriodKind, RewardLeaderboardRow } from "../types";

interface Props {
  kind: PeriodKind;
}

export function RewardSummary({ kind }: Props): JSX.Element {
  const { date = "" } = useParams<{ date: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const summaryQ = useRewardSummary(kind, date);
  const range = rangeFor(kind, date);

  const leaderboardQ = useRewardLeaderboard({
    from: range?.from ?? date,
    to: range?.to ?? date,
    sort: "orch_tokens_usd",
  });

  if (!range) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Invalid date: {date}</Alert>
      </Box>
    );
  }

  const summary = summaryQ.data;
  const totalUsd = summary?.totalUsd ?? 0;
  const orchUsd = summary?.orchUsd ?? 0;

  const columns: GridColDef<RewardLeaderboardRow & { id: string; rank: number }>[] = [
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
      field: "totalPct",
      headerName: "Total (%)",
      type: "number",
      flex: 0.7,
      valueGetter: (_, row) => (totalUsd > 0 ? (row.totalUsd / totalUsd) * 100 : 0),
      valueFormatter: (v: number) => formatPercent(v),
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
      field: "orchPct",
      headerName: "Orch (%)",
      type: "number",
      flex: 0.7,
      valueGetter: (_, row) => (orchUsd > 0 ? (row.orchUsd / orchUsd) * 100 : 0),
      valueFormatter: (v: number) => formatPercent(v),
    },
  ];

  const rows = (leaderboardQ.data?.data ?? []).map((r, i) => ({
    ...r,
    id: r.orchestratorAddress,
    rank: i + 1,
  }));

  const prev = shiftPeriod(kind, date, -1);
  const next = shiftPeriod(kind, date, 1);
  const q = search.toString() ? `?${search.toString()}` : "";

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        {PERIOD_LABELS[kind]} Reward Report: {formatHumanDate(range.from)}
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: "flex-start" }}>
        <Button
          variant="outlined"
          startIcon={<Download />}
          href={buildRewardsCsvUrl({ from: range.from, to: range.to })}
          target="_blank"
          rel="noopener"
          sx={{ mt: 2 }}
        >
          Download CSV
        </Button>
      </Stack>
      {summaryQ.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load summary: {summaryQ.error.message}
        </Alert>
      )}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          {summaryQ.isLoading || !summary ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <Typography variant="subtitle1" align="center">
                  Reward Calls
                </Typography>
                <Typography variant="h6" align="center">
                  {formatInt(summary.rewardEventCount)}
                </Typography>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <Typography variant="subtitle1" align="center">
                  Total Tokens
                </Typography>
                <Typography variant="h6" align="center">
                  {formatLpt(summary.totalLpt)} LPT
                </Typography>
                <Typography variant="subtitle2" align="center">
                  {formatUsd(summary.totalUsd)}
                </Typography>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <Typography variant="subtitle1" align="center">
                  Orchestrator Share
                </Typography>
                <Typography variant="h6" align="center">
                  {formatLpt(summary.orchLpt)} LPT
                </Typography>
                <Typography variant="subtitle2" align="center">
                  {formatUsd(summary.orchUsd)}
                </Typography>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <Typography variant="subtitle1" align="center">
                  Delegators Share
                </Typography>
                <Typography variant="h6" align="center">
                  {formatLpt(summary.delegatorsLpt)} LPT
                </Typography>
                <Typography variant="subtitle2" align="center">
                  {formatUsd(summary.delegatorsUsd)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Orchestrator Reward Details
      </Typography>
      {leaderboardQ.error ? (
        <Alert severity="error">Failed to load leaderboard: {leaderboardQ.error.message}</Alert>
      ) : (
        <Paper sx={{ width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={leaderboardQ.isLoading}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            pageSizeOptions={[25, 50, 100]}
            autoHeight
            disableRowSelectionOnClick
            onRowClick={(p) => navigate(`/orchestrator/${p.row.orchestratorAddress}`)}
            sx={{
              cursor: "pointer",
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" },
            }}
          />
        </Paper>
      )}
      <Box sx={{ mt: 3, display: "flex", gap: 1, justifyContent: "space-between" }}>
        <Button
          component={Link}
          to={`/reports/rewards/${kind}/${prev}${q}`}
          startIcon={<ChevronLeft />}
          variant="outlined"
        >
          Previous
        </Button>
        <Button
          component={Link}
          to={`/reports/rewards/${kind}/${next}${q}`}
          endIcon={<ChevronRight />}
          variant="outlined"
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
