import type { JSX } from "react";
import { useState } from "react";
import {
  Alert,
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useSearchParams } from "react-router-dom";
import { usePipelines, useStats } from "../runtime";
import { detectMode, formatDecimal, formatPercent, formatTimestamp } from "../service";
import type { Mode, StatsRow } from "../types";
import { PayloadModal } from "./PayloadModal";

export function Stats(): JSX.Element {
  const [search, setSearch] = useSearchParams();
  const orchestrator = (search.get("orchestrator") ?? "").trim();
  const pipeline = search.get("pipeline") ?? "";
  const model = search.get("model") ?? "";
  const mode: Mode = detectMode({ pipeline, model });

  const pipelinesQ = usePipelines();
  const statsQ = useStats({
    mode,
    orchestrator,
    pipeline: mode === "ai" ? pipeline : undefined,
    model: mode === "ai" ? model : undefined,
  });

  const [modal, setModal] = useState<{ title: string; payload: string | null } | null>(null);

  const update = (param: string, value: string | null): void => {
    const next = new URLSearchParams(search);
    if (param === "pipeline") next.delete("model");
    if (value === null || value === "") next.delete(param);
    else next.set(param, value);
    setSearch(next);
  };

  const pipelineDef = pipelinesQ.data?.find((p) => p.id === pipeline);
  const models = pipelineDef?.models ?? [];
  const rows = statsQ.data ?? [];

  const aiColumns: GridColDef<StatsRow>[] = [
    { field: "region", headerName: "Region", flex: 0.5 },
    {
      field: "timestamp",
      headerName: "Time",
      flex: 1.2,
      valueFormatter: (v: number) => formatTimestamp(v),
    },
    {
      field: "successRate",
      headerName: "Passed",
      flex: 0.6,
      valueFormatter: (v: number) => (v === 1 ? "Yes" : "No"),
    },
    {
      field: "roundTripTime",
      headerName: "Round Trip Time",
      type: "number",
      flex: 0.9,
      valueFormatter: (v: number) => formatDecimal(v, 3),
    },
    {
      field: "modelIsWarm",
      headerName: "Model Warm",
      flex: 0.7,
      valueFormatter: (v: boolean | null) => (v == null ? "—" : v ? "Yes" : "No"),
    },
    {
      field: "inputParameters",
      headerName: "Inputs",
      flex: 0.6,
      sortable: false,
      renderCell: (params) =>
        params.row.inputParameters ? (
          <Typography
            variant="inherit"
            sx={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() =>
              setModal({ title: "Input Parameters", payload: params.row.inputParameters })
            }
          >
            View
          </Typography>
        ) : null,
    },
    {
      field: "responsePayload",
      headerName: "Response",
      flex: 0.6,
      sortable: false,
      renderCell: (params) =>
        params.row.responsePayload ? (
          <Typography
            variant="inherit"
            sx={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() =>
              setModal({ title: "Response Payload", payload: params.row.responsePayload })
            }
          >
            View
          </Typography>
        ) : null,
    },
  ];

  const transcodingColumns: GridColDef<StatsRow>[] = [
    { field: "region", headerName: "Region", flex: 0.5 },
    {
      field: "timestamp",
      headerName: "Time",
      flex: 1.2,
      valueFormatter: (v: number) => formatTimestamp(v),
    },
    {
      field: "realtime",
      headerName: "RealTime",
      flex: 0.6,
      valueFormatter: (v: boolean) => (v ? "Yes" : "No"),
    },
    {
      field: "transcodeTime",
      headerName: "Transcode",
      type: "number",
      flex: 0.8,
      valueFormatter: (v: number | null) => formatDecimal(v, 3),
    },
    {
      field: "uploadTime",
      headerName: "Upload",
      type: "number",
      flex: 0.7,
      valueFormatter: (v: number) => formatDecimal(v, 3),
    },
    {
      field: "downloadTime",
      headerName: "Download",
      type: "number",
      flex: 0.7,
      valueFormatter: (v: number | null) => formatDecimal(v, 3),
    },
    {
      field: "roundTripTime",
      headerName: "Round Trip",
      type: "number",
      flex: 0.8,
      valueFormatter: (v: number) => formatDecimal(v, 3),
    },
    {
      field: "segDuration",
      headerName: "Seg Duration",
      type: "number",
      flex: 0.8,
      valueFormatter: (v: number) => formatDecimal(v, 3),
    },
    {
      field: "segmentsReceived",
      headerName: "Seg Received",
      flex: 0.7,
      valueFormatter: (v: number | null) => (v == null ? "—" : `${v}/60`),
    },
    {
      field: "successRate",
      headerName: "Success",
      type: "number",
      flex: 0.6,
      valueFormatter: (v: number) => formatPercent(v * 100),
    },
  ];

  const columns = mode === "ai" ? aiColumns : transcodingColumns;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {mode === "ai" ? "AI" : "Transcoding"} Performance Stats
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2, mt: 2 }}>
        <Grid
          size={{
            xs: 12,
            sm: 4,
          }}
        >
          <TextField
            fullWidth
            label="Orchestrator Address"
            placeholder="0x..."
            value={orchestrator}
            onChange={(e) => update("orchestrator", e.target.value || null)}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 4,
          }}
        >
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
        <Grid
          size={{
            xs: 12,
            sm: 4,
          }}
        >
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
      {!orchestrator && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Enter an orchestrator address to load performance stats.
        </Alert>
      )}
      {statsQ.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load stats: {statsQ.error.message}
        </Alert>
      )}
      <Paper sx={{ width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={statsQ.isLoading}
          autoHeight
          getRowClassName={(p) => (p.row.successRate === 0 ? "row-failed-test" : "")}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
            sorting: { sortModel: [{ field: "timestamp", sort: "desc" }] },
          }}
          pageSizeOptions={[20, 50, 100]}
          disableRowSelectionOnClick
          sx={{
            "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" },
            "& .row-failed-test": {
              backgroundColor: (t: import("@mui/material/styles").Theme) =>
                t.palette.error.light + "22",
            },
          }}
        />
      </Paper>
      <PayloadModal
        open={modal !== null}
        title={modal?.title ?? ""}
        payload={modal?.payload ?? null}
        onClose={() => setModal(null)}
      />
    </Box>
  );
}
