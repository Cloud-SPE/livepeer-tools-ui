import type { JSX } from "react";
import { useMemo, useState } from "react";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Download from "@mui/icons-material/Download";
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
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip as ChartTooltip,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  LIVEPEER_EXPLORER_ORCHESTRATOR_URL,
  buildOrchestratorRewardsCsvUrl,
  buildOrchestratorWinningTicketsCsvUrl,
} from "../config";
import {
  useOrchestrator,
  useOrchestratorDelegators,
  useOrchestratorPerformance,
  useOrchestratorTickets,
  useOrchestratorVotes,
  usePerformancePipelines,
} from "../runtime";
import {
  aggregateTicketCountsByDate,
  avatarInitial,
  displayLabel,
  formatDateTime,
  formatDecimal,
  formatEth,
  formatInt,
  formatLpt,
  formatPercent,
  formatUnixTimestamp,
  formatUsd,
  filterTicketsByDateRange,
  isValidDateRange,
  lastCalendarYearRange,
  shortAddress,
  trailingThirtyDaysRange,
} from "../service";
import type {
  OrchestratorDelegator,
  OrchestratorPerformanceRow,
  OrchestratorTicket,
  OrchestratorVote,
  PerformanceMode,
} from "../types";

ChartJS.register(BarElement, CategoryScale, LinearScale, ChartTooltip, Legend);

type DetailTab = "overview" | "csv" | "payouts" | "delegators" | "voting" | "performance";

const tabOrder: DetailTab[] = ["overview", "payouts", "delegators", "performance", "voting", "csv"];

const buttonSx = {
  color: "primary.main",
  borderColor: "primary.main",
  "&:hover": {
    borderColor: "primary.dark",
    backgroundColor: "action.hover",
  },
};

function Stat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}): JSX.Element {
  return (
    <Grid
      size={{
        xs: 12,
        sm: 6,
        md: 3,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
    </Grid>
  );
}

function QueryState({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean;
  error: Error | null;
  children: JSX.Element;
}): JSX.Element {
  if (error) {
    return <Alert severity="error">Failed to load: {error.message}</Alert>;
  }
  if (isLoading) {
    return (
      <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  return children;
}

export function OrchestratorDetail(): JSX.Element {
  const params = useParams<{ eth_address: string }>();
  const navigate = useNavigate();
  const address = params.eth_address ?? "";
  const defaultRange = useMemo(() => lastCalendarYearRange(), []);
  const payoutsRange = useMemo(() => trailingThirtyDaysRange(), []);
  const [start, setStart] = useState(defaultRange.start);
  const [end, setEnd] = useState(defaultRange.end);
  const [payoutStart, setPayoutStart] = useState(payoutsRange.start);
  const [payoutEnd, setPayoutEnd] = useState(payoutsRange.end);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>("transcoding");
  const [performancePipeline, setPerformancePipeline] = useState("");
  const [performanceModel, setPerformanceModel] = useState("");
  const [tab, setTab] = useState<DetailTab>("overview");
  const validRange = isValidDateRange(start, end);
  const validPayoutRange = isValidDateRange(payoutStart, payoutEnd);

  const { data, isLoading, error } = useOrchestrator(address);
  const ticketsQ = useOrchestratorTickets(
    address,
    payoutStart,
    payoutEnd,
    tab === "payouts" && validPayoutRange,
  );
  const delegatorsQ = useOrchestratorDelegators(
    address,
    data?.asOfBlock ?? 0,
    tab === "delegators",
  );
  const votesQ = useOrchestratorVotes(address, tab === "voting");
  const performancePipelinesQ = usePerformancePipelines(tab === "performance");
  const performanceQ = useOrchestratorPerformance(
    address,
    performanceMode,
    performanceMode === "ai" ? performancePipeline : undefined,
    performanceMode === "ai" ? performanceModel : undefined,
    tab === "performance",
  );

  const ticketsMatchSelectedRange =
    ticketsQ.data?.start === payoutStart && ticketsQ.data?.end === payoutEnd;
  const selectedTickets = useMemo(() => {
    if (!ticketsMatchSelectedRange || !ticketsQ.data) return [];
    return filterTicketsByDateRange(ticketsQ.data.data, payoutStart, payoutEnd);
  }, [payoutEnd, payoutStart, ticketsMatchSelectedRange, ticketsQ.data]);
  const ticketsLoadingForRange =
    ticketsQ.isLoading || ticketsQ.isFetching || !ticketsMatchSelectedRange;

  const ticketCounts = useMemo(
    () => aggregateTicketCountsByDate(selectedTickets),
    [selectedTickets],
  );

  const ticketChartData: ChartData<"bar"> = {
    labels: ticketCounts.map((p) => p.date),
    datasets: [
      {
        label: "Winning Tickets",
        data: ticketCounts.map((p) => p.count),
        backgroundColor: "#1976d2",
      },
    ],
  };
  const ticketChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  const delegatorColumns: GridColDef<OrchestratorDelegator & { id: string }>[] = [
    {
      field: "delegatorAddress",
      headerName: "Delegator",
      flex: 1.2,
      renderCell: (params) => (
        <Tooltip title={params.row.delegatorAddress}>
          <Link
            component={RouterLink}
            to={`/delegator/${params.row.delegatorAddress}`}
            underline="hover"
          >
            {shortAddress(params.row.delegatorAddress)}
          </Link>
        </Tooltip>
      ),
    },
    {
      field: "bondedPrincipalLpt",
      headerName: "Stake on Orch",
      type: "number",
      flex: 1,
      valueFormatter: (v: number) => formatLpt(v),
    },
    {
      field: "asOfTimestamp",
      headerName: "As Of",
      flex: 1,
      valueFormatter: (v: string) => formatDateTime(v),
    },
  ];

  const ticketColumns: GridColDef<OrchestratorTicket & { id: string }>[] = [
    {
      field: "blockTimestamp",
      headerName: "Date",
      flex: 1,
      valueFormatter: (v: string) => formatDateTime(v),
    },
    {
      field: "gatewayAddress",
      headerName: "Gateway",
      flex: 1,
      renderCell: (params) => (
        <Tooltip title={params.row.gatewayAddress}>
          <span>{shortAddress(params.row.gatewayAddress)}</span>
        </Tooltip>
      ),
    },
    {
      field: "faceValueEth",
      headerName: "ETH",
      type: "number",
      flex: 0.7,
      valueFormatter: (v: number) => formatEth(v),
    },
    {
      field: "faceValueUsd",
      headerName: "USD",
      type: "number",
      flex: 0.7,
      valueFormatter: (v: number) => formatUsd(v),
    },
  ];

  const voteColumns: GridColDef<OrchestratorVote & { id: string }>[] = [
    {
      field: "proposalId",
      headerName: "Proposal",
      flex: 1,
      renderCell: (params) => (
        <Link
          component={RouterLink}
          to={`/vote/history?proposal=${encodeURIComponent(params.row.proposalId)}`}
          underline="hover"
        >
          {params.row.proposalId}
        </Link>
      ),
    },
    { field: "support", headerName: "Support", flex: 0.7 },
    {
      field: "stakeLpt",
      headerName: "Stake",
      type: "number",
      flex: 0.8,
      valueFormatter: (v: number) => formatLpt(v),
    },
    {
      field: "blockTimestamp",
      headerName: "Date",
      flex: 1,
      valueFormatter: (v: string | null) => formatDateTime(v),
    },
    { field: "reason", headerName: "Reason", flex: 1.5 },
  ];

  const performanceColumns: GridColDef<OrchestratorPerformanceRow>[] =
    performanceMode === "ai"
      ? [
          { field: "region", headerName: "Region", flex: 0.7 },
          {
            field: "timestamp",
            headerName: "Time",
            flex: 1.2,
            valueFormatter: (v: number) => formatUnixTimestamp(v),
          },
          {
            field: "successRate",
            headerName: "Passed",
            flex: 0.7,
            valueFormatter: (v: number) => (v === 1 ? "Yes" : "No"),
          },
          {
            field: "roundTripTime",
            headerName: "Round Trip",
            type: "number",
            flex: 0.8,
            valueFormatter: (v: number) => formatDecimal(v),
          },
          {
            field: "pipeline",
            headerName: "Pipeline",
            flex: 1,
            valueFormatter: (v: string | null) => v ?? "",
          },
          {
            field: "model",
            headerName: "Model",
            flex: 1,
            valueFormatter: (v: string | null) => v ?? "",
          },
          {
            field: "modelIsWarm",
            headerName: "Warm",
            flex: 0.6,
            valueFormatter: (v: boolean | null) => (v == null ? "" : v ? "Yes" : "No"),
          },
        ]
      : [
          { field: "region", headerName: "Region", flex: 0.7 },
          {
            field: "timestamp",
            headerName: "Time",
            flex: 1.2,
            valueFormatter: (v: number) => formatUnixTimestamp(v),
          },
          {
            field: "realtime",
            headerName: "Realtime",
            flex: 0.7,
            valueFormatter: (v: boolean) => (v ? "Yes" : "No"),
          },
          {
            field: "successRate",
            headerName: "Success",
            type: "number",
            flex: 0.7,
            valueFormatter: (v: number) => formatPercent(v * 100),
          },
          {
            field: "transcodeTime",
            headerName: "Transcode",
            type: "number",
            flex: 0.8,
            valueFormatter: (v: number | null) => formatDecimal(v),
          },
          {
            field: "uploadTime",
            headerName: "Upload",
            type: "number",
            flex: 0.7,
            valueFormatter: (v: number) => formatDecimal(v),
          },
          {
            field: "downloadTime",
            headerName: "Download",
            type: "number",
            flex: 0.8,
            valueFormatter: (v: number | null) => formatDecimal(v),
          },
          {
            field: "roundTripTime",
            headerName: "Round Trip",
            type: "number",
            flex: 0.8,
            valueFormatter: (v: number) => formatDecimal(v),
          },
          {
            field: "segmentsReceived",
            headerName: "Segments",
            flex: 0.7,
            valueFormatter: (v: number | null) => (v == null ? "" : `${v}/60`),
          },
        ];

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

  const rewardsCsvUrl = buildOrchestratorRewardsCsvUrl({ address: data.address, start, end });
  const winningTicketsCsvUrl = buildOrchestratorWinningTicketsCsvUrl({
    address: data.address,
    start,
    end,
  });
  const delegatorRows = (delegatorsQ.data?.data ?? [])
    .map((r) => ({
      ...r,
      id: r.delegatorAddress,
    }))
    .sort((a, b) => b.bondedPrincipalLpt - a.bondedPrincipalLpt);
  const ticketRows = selectedTickets.map((r) => ({ ...r, id: r.eventId }));
  const voteRows = (votesQ.data?.data ?? []).map((r) => ({
    ...r,
    id: `${r.proposalId}-${r.txHash}`,
  }));
  const pipelineDef = performancePipelinesQ.data?.find((p) => p.id === performancePipeline);
  const performanceModels = pipelineDef?.models ?? [];
  const performanceRows = performanceQ.data ?? [];

  return (
    <Box sx={{ py: 3, px: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
        <IconButton aria-label="Back to orchestrators" onClick={() => navigate("/orchestrators")}>
          <ArrowBack />
        </IconButton>
        {data.avatarUrl ? (
          <Avatar src={data.avatarUrl} alt={displayLabel(data)} sx={{ width: 56, height: 56 }} />
        ) : (
          <Avatar sx={{ width: 56, height: 56 }}>{avatarInitial(data)}</Avatar>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ wordBreak: "break-word" }}>
            {displayLabel(data)}
          </Typography>
          <Tooltip title={data.address}>
            <Typography variant="body2" color="text.secondary">
              {shortAddress(data.address)}
            </Typography>
          </Tooltip>
        </Box>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, value: DetailTab) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        {tabOrder.map((value) => (
          <Tab
            key={value}
            value={value}
            label={
              value === "csv"
                ? "CSV Exports"
                : value === "performance"
                  ? "Performance"
                  : value.charAt(0).toUpperCase() + value.slice(1)
            }
          />
        ))}
      </Tabs>

      {tab === "overview" && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Stat label="Active" value={data.isActive ? "Yes" : "No"} />
              <Stat label="Reward Cut" value={formatPercent(data.rewardCutPct)} />
              <Stat label="Fee Cut" value={formatPercent(data.feeCutPct)} />
              <Stat label="Stake" value={formatLpt(data.totalStakeLpt)} />
              <Grid size={12}>
                <Button
                  variant="contained"
                  href={LIVEPEER_EXPLORER_ORCHESTRATOR_URL(data.address)}
                  target="_blank"
                  rel="noopener"
                >
                  View on Livepeer
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === "csv" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              CSV Exports
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Start"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ maxWidth: 220 }}
              />
              <TextField
                label="End"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ maxWidth: 220 }}
              />
            </Stack>
            {!validRange && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Select a valid date range with the end date on or after the start date.
              </Alert>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                href={rewardsCsvUrl}
                target="_blank"
                rel="noopener"
                disabled={!validRange}
                sx={buttonSx}
              >
                LPT Rewards CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                href={winningTicketsCsvUrl}
                target="_blank"
                rel="noopener"
                disabled={!validRange}
                sx={buttonSx}
              >
                Winning Ticket Payments CSV
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === "payouts" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Winning Tickets
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Defaults to the last 30 days. The chart and table use the selected range.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Start"
                type="date"
                value={payoutStart}
                onChange={(e) => setPayoutStart(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ maxWidth: 220 }}
              />
              <TextField
                label="End"
                type="date"
                value={payoutEnd}
                onChange={(e) => setPayoutEnd(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ maxWidth: 220 }}
              />
            </Stack>
            {!validPayoutRange ? (
              <Alert severity="warning">
                Select a valid date range with the end date on or after the start date.
              </Alert>
            ) : (
              <QueryState isLoading={ticketsLoadingForRange} error={ticketsQ.error}>
                <>
                  <Grid container spacing={3} sx={{ mb: 2 }}>
                    <Stat label="Tickets" value={formatInt(ticketRows.length)} />
                    <Stat
                      label="Total Value"
                      value={formatUsd(ticketRows.reduce((sum, row) => sum + row.faceValueUsd, 0))}
                    />
                  </Grid>
                  {ticketCounts.length === 0 ? (
                    <Alert severity="info">No winning tickets found for this range.</Alert>
                  ) : (
                    <Box sx={{ height: 320, mb: 3 }}>
                      <Bar data={ticketChartData} options={ticketChartOptions} />
                    </Box>
                  )}
                  <DataGrid
                    rows={ticketRows}
                    columns={ticketColumns}
                    autoHeight
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    disableRowSelectionOnClick
                  />
                </>
              </QueryState>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "delegators" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Delegators
            </Typography>
            <QueryState isLoading={delegatorsQ.isLoading} error={delegatorsQ.error}>
              <>
                <Grid container spacing={3} sx={{ mb: 2 }}>
                  <Stat
                    label="Snapshot Stake"
                    value={formatLpt(delegatorsQ.data?.totalBondedLpt ?? 0)}
                  />
                  <Stat
                    label="Profile Stake"
                    value={formatLpt(data.totalStakeLpt)}
                    helper={`Profile block ${data.asOfBlock.toLocaleString()}`}
                  />
                </Grid>
                {delegatorRows.length === 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No delegators found for this orchestrator.
                  </Alert>
                )}
                <DataGrid
                  rows={delegatorRows}
                  columns={delegatorColumns}
                  autoHeight
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  disableRowSelectionOnClick
                />
              </>
            </QueryState>
          </CardContent>
        </Card>
      )}

      {tab === "voting" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Voting History
            </Typography>
            <QueryState isLoading={votesQ.isLoading} error={votesQ.error}>
              <>
                {voteRows.length === 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No votes found for this orchestrator address.
                  </Alert>
                )}
                <DataGrid
                  rows={voteRows}
                  columns={voteColumns}
                  autoHeight
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  disableRowSelectionOnClick
                />
              </>
            </QueryState>
          </CardContent>
        </Card>
      )}

      {tab === "performance" && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel id="performance-mode-label">Mode</InputLabel>
                  <Select
                    labelId="performance-mode-label"
                    label="Mode"
                    value={performanceMode}
                    onChange={(e) => {
                      const next = e.target.value as PerformanceMode;
                      setPerformanceMode(next);
                      if (next === "transcoding") {
                        setPerformancePipeline("");
                        setPerformanceModel("");
                      }
                    }}
                  >
                    <MenuItem value="transcoding">Transcoding</MenuItem>
                    <MenuItem value="ai">AI</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {performanceMode === "ai" && (
                <>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth disabled={performancePipelinesQ.isLoading}>
                      <InputLabel id="performance-pipeline-label">Pipeline</InputLabel>
                      <Select
                        labelId="performance-pipeline-label"
                        label="Pipeline"
                        value={performancePipeline}
                        onChange={(e) => {
                          setPerformancePipeline(e.target.value);
                          setPerformanceModel("");
                        }}
                      >
                        <MenuItem value="">
                          <em>All</em>
                        </MenuItem>
                        {(performancePipelinesQ.data ?? []).map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.id}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth disabled={!performancePipeline}>
                      <InputLabel id="performance-model-label">Model</InputLabel>
                      <Select
                        labelId="performance-model-label"
                        label="Model"
                        value={performanceModel}
                        onChange={(e) => setPerformanceModel(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>All</em>
                        </MenuItem>
                        {performanceModels.map((model) => (
                          <MenuItem key={model} value={model}>
                            {model}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
            </Grid>
            {performanceQ.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load performance data: {performanceQ.error.message}
              </Alert>
            )}
            {performanceRows.length === 0 && !performanceQ.isLoading && !performanceQ.error && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No performance records found for this selection.
              </Alert>
            )}
            <DataGrid
              rows={performanceRows}
              columns={performanceColumns}
              loading={performanceQ.isLoading}
              autoHeight
              pageSizeOptions={[20, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 20 } },
                sorting: { sortModel: [{ field: "timestamp", sort: "desc" }] },
              }}
              getRowClassName={(p) => (p.row.successRate === 0 ? "row-failed-test" : "")}
              disableRowSelectionOnClick
              sx={{
                "& .row-failed-test": {
                  backgroundColor: (t: import("@mui/material/styles").Theme) =>
                    t.palette.error.light + "22",
                },
              }}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
