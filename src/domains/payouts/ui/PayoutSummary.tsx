import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Download from "@mui/icons-material/Download";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { JOB_TYPES, PERIOD_LABELS, buildPayoutsCsvUrl } from "../config";
import { useLeaderboard, useReportSummary } from "../runtime";
import {
  formatEth,
  formatHumanDate,
  formatInt,
  formatPercent,
  formatUsd,
  rangeFor,
  rowLabel,
} from "../service";
import type { JobType, PayoutLeaderboardRow, PeriodKind } from "../types";
import { DateInput } from "./DateInput";
import { DateNav } from "./DateNav";

interface Props {
  kind: PeriodKind;
}

export function PayoutSummary({ kind }: Props): JSX.Element {
  const { date = "" } = useParams<{ date: string }>();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const jobType: JobType = ((): JobType => {
    const j = search.get("job_type");
    return j === "ai" || j === "transcoding" ? j : "both";
  })();

  const summaryQ = useReportSummary(kind, date, jobType);
  const range = rangeFor(kind, date);
  const leaderboardQ = useLeaderboard({
    from: range?.from ?? date,
    to: range?.to ?? date,
    jobType,
    sort: "commission_usd",
  });

  if (!range) {
    return (
      <Box p={4}>
        <Alert severity="error">Invalid date: {date}</Alert>
      </Box>
    );
  }

  const summary = summaryQ.data;
  const totalFaceUsd = summary?.totalUsd ?? 0;
  const totalCommissionUsd = summary?.commissionUsd ?? 0;

  const columns: GridColDef<PayoutLeaderboardRow & { id: string; rank: number }>[] = [
    { field: "rank", headerName: "Rank", width: 80, sortable: true },
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
      field: "facePct",
      headerName: "Total (%)",
      type: "number",
      flex: 0.7,
      valueGetter: (_, row) =>
        totalFaceUsd > 0 ? (row.faceValueUsd / totalFaceUsd) * 100 : 0,
      valueFormatter: (v: number) => formatPercent(v),
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
      field: "commissionPct",
      headerName: "Commission (%)",
      type: "number",
      flex: 0.8,
      valueGetter: (_, row) =>
        totalCommissionUsd > 0 ? (row.commissionUsd / totalCommissionUsd) * 100 : 0,
      valueFormatter: (v: number) => formatPercent(v),
    },
  ];

  const rows = (leaderboardQ.data?.data ?? []).map((r, i) => ({
    ...r,
    id: r.orchestratorAddress,
    rank: i + 1,
  }));

  const jobLabel =
    jobType === "both" ? "All Jobs" : jobType === "ai" ? "AI" : "Transcoding";

  const onJobTypeChange = (value: JobType): void => {
    const next = new URLSearchParams(search);
    if (value === "both") next.delete("job_type");
    else next.set("job_type", value);
    setSearch(next);
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        {PERIOD_LABELS[kind]} Summary Report: {formatHumanDate(range.from)} ({jobLabel})
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
        <DateInput
          initialDate={date}
          buildPath={(iso) =>
            `/reports/${kind}/${iso}${search.toString() ? `?${search.toString()}` : ""}`
          }
          label="Date"
        />
        <FormControl sx={{ mt: 2, minWidth: 220 }}>
          <InputLabel id="job-type-label">Job Type</InputLabel>
          <Select
            labelId="job-type-label"
            label="Job Type"
            value={jobType}
            onChange={(e) => onJobTypeChange(e.target.value as JobType)}
          >
            {JOB_TYPES.map((j) => (
              <MenuItem key={j.value} value={j.value}>
                {j.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<Download />}
          href={buildPayoutsCsvUrl({ from: range.from, to: range.to, jobType })}
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
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1" align="center">
                  Number of Winning Tickets
                </Typography>
                <Typography variant="h6" align="center">
                  {formatInt(summary.ticketCount)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1" align="center">
                  Distinct Gateways
                </Typography>
                <Typography variant="h6" align="center">
                  {formatInt(summary.distinctGateways)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1" align="center">
                  Total Fees
                </Typography>
                <Typography variant="h6" align="center">
                  {formatEth(summary.totalEth, 4)} ETH
                </Typography>
                <Typography variant="subtitle2" align="center">
                  {formatUsd(summary.totalUsd)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1" align="center">
                  Orch Commission
                </Typography>
                <Typography variant="h6" align="center">
                  {formatEth(summary.commissionEth, 4)} ETH
                </Typography>
                <Typography variant="subtitle2" align="center">
                  {formatUsd(summary.commissionUsd)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Orchestrator Payout Details
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

      <DateNav kind={kind} currentDate={date} search={search.toString()} />
    </Box>
  );
}
