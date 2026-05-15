import { useMemo } from "react";
import {
  Alert,
  Avatar,
  Box,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Visibility from "@mui/icons-material/Visibility";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GLOBAL_REGION_ID } from "../config";
import { useLeaderboard, usePipelines, useRegions } from "../runtime";
import {
  detectMode,
  formatPercent,
  formatScore,
  rankByScore,
  regionOptions,
  rowLabel,
} from "../service";
import type { LeaderboardRow, Mode } from "../types";

export function Leaderboard(): JSX.Element {
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const region = search.get("region") ?? GLOBAL_REGION_ID;
  const pipeline = search.get("pipeline") ?? "";
  const model = search.get("model") ?? "";
  const mode: Mode = detectMode({ pipeline, model });

  const regionsQ = useRegions(mode);
  const pipelinesQ = usePipelines();
  const leaderboardQ = useLeaderboard({
    mode,
    region: region !== GLOBAL_REGION_ID ? region : undefined,
    pipeline: mode === "ai" ? pipeline : undefined,
    model: mode === "ai" ? model : undefined,
  });

  const update = (param: string, value: string | null): void => {
    const next = new URLSearchParams(search);
    // Changing the pipeline clears the model — model selection only makes
    // sense in the context of a specific pipeline.
    if (param === "pipeline") next.delete("model");
    if (value === null || value === "") next.delete(param);
    else next.set(param, value);
    setSearch(next);
  };

  const regions = useMemo(
    () => regionOptions(regionsQ.data ?? [], mode),
    [regionsQ.data, mode],
  );
  const pipelineDef = pipelinesQ.data?.find((p) => p.id === pipeline);
  const models = pipelineDef?.models ?? [];

  const ranked = rankByScore(leaderboardQ.data ?? []);

  const columns: GridColDef<LeaderboardRow>[] = [
    {
      field: "orchestrator",
      headerName: "Orchestrator",
      flex: 1.4,
      sortable: false,
      renderCell: (params) => (
        <Link
          to={`/orchestrator/${params.row.address}`}
          target="_blank"
          rel="noopener"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              src={params.row.identity?.avatarUrl ?? undefined}
              alt={rowLabel(params.row)}
              sx={{ width: 24, height: 24 }}
            />
            <Typography variant="inherit">{rowLabel(params.row)}</Typography>
          </Stack>
        </Link>
      ),
    },
    {
      field: "totalScore",
      headerName: "Total Score",
      type: "number",
      flex: 0.9,
      valueFormatter: (v: number) => formatScore(v),
    },
    {
      field: "successRate",
      headerName: "Success Rate (%)",
      type: "number",
      flex: 0.9,
      valueFormatter: (v: number) => formatPercent(v),
    },
    {
      field: "latencyScore",
      headerName: "Latency Score",
      type: "number",
      flex: 0.9,
      valueFormatter: (v: number) => formatScore(v),
    },
    {
      field: "regionCount",
      headerName: "Regions",
      type: "number",
      flex: 0.5,
    },
    {
      field: "viewStats",
      headerName: "View Stats",
      flex: 0.5,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            const qs = new URLSearchParams({ orchestrator: params.row.address });
            if (pipeline) qs.set("pipeline", pipeline);
            if (model) qs.set("model", model);
            navigate(`/performance/stats?${qs.toString()}`);
          }}
          size="small"
        >
          <Visibility />
        </IconButton>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        {mode === "ai" ? "AI" : "Transcoding"} Performance Leaderboard
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel id="region-label">Select Region</InputLabel>
            <Select
              labelId="region-label"
              value={region}
              label="Select Region"
              onChange={(e) =>
                update("region", e.target.value === GLOBAL_REGION_ID ? null : e.target.value)
              }
            >
              {regions.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth disabled={!pipelinesQ.data}>
            <InputLabel id="pipeline-label">Select Pipeline</InputLabel>
            <Select
              labelId="pipeline-label"
              value={pipeline}
              label="Select Pipeline"
              onChange={(e) => update("pipeline", e.target.value || null)}
            >
              <MenuItem value="">
                <em>None (Transcoding)</em>
              </MenuItem>
              {(pipelinesQ.data ?? []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth disabled={!pipeline}>
            <InputLabel id="model-label">Select Model</InputLabel>
            <Select
              labelId="model-label"
              value={model}
              label="Select Model"
              onChange={(e) => update("model", e.target.value || null)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {models.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {leaderboardQ.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load leaderboard: {leaderboardQ.error.message}
        </Alert>
      )}

      <Paper sx={{ width: "100%" }}>
        <DataGrid
          rows={ranked}
          columns={columns}
          loading={leaderboardQ.isLoading}
          autoHeight
          rowHeight={45}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
            sorting: { sortModel: [{ field: "totalScore", sort: "desc" }] },
          }}
          pageSizeOptions={[20, 50, 100]}
          disableRowSelectionOnClick
          sx={{ "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" } }}
        />
      </Paper>
    </Box>
  );
}
