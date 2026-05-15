import { useMemo } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartDataset, ChartOptions } from "chart.js";
import { useSearchParams } from "react-router-dom";
import "./chartSetup";
import {
  AI_COLOR,
  DEFAULT_RANGE_DAYS,
  JOB_TYPES,
  MAX_SPAN_DAYS,
  TRANSCODING_COLOR,
} from "../config";
import { useDailyTickets } from "../runtime";
import {
  aggregateByGranularity,
  daysAgoIso,
  granularityChartTitle,
  granularityYAxisLabel,
  resolveGranularity,
  spanInDays,
  todayIso,
} from "../service";
import type { Granularity, JobType } from "../types";

function jobTypeFromSearch(search: URLSearchParams): JobType {
  const j = search.get("job_type");
  return j === "ai" || j === "transcoding" ? j : "both";
}

function granularityFromSearch(search: URLSearchParams): Granularity {
  const g = search.get("granularity");
  if (g === "daily" || g === "weekly" || g === "monthly") return g;
  return "auto";
}

export function DailyTicketsReport(): JSX.Element {
  const [search, setSearch] = useSearchParams();
  const start = search.get("start") ?? daysAgoIso(DEFAULT_RANGE_DAYS);
  const end = search.get("end") ?? todayIso();
  const jobType = jobTypeFromSearch(search);
  const granularity = granularityFromSearch(search);

  const span = useMemo(() => spanInDays(start, end), [start, end]);
  const effective = useMemo(
    () => resolveGranularity(granularity, span),
    [granularity, span],
  );

  const rangeWarning = useMemo(() => {
    if (span === null) {
      return "Please select a valid date range (end on or after start).";
    }
    if (span > MAX_SPAN_DAYS) {
      return `Selected range is ${span} days. Please narrow it to ${MAX_SPAN_DAYS} days or fewer before loading.`;
    }
    return null;
  }, [span]);

  const timeseriesQ = useDailyTickets({
    start,
    end,
    jobType,
  });

  const update = (key: string, value: string | null): void => {
    const next = new URLSearchParams(search);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearch(next);
  };

  const chartData = useMemo<ChartData<"line", number[], string> | null>(() => {
    if (!timeseriesQ.data) return null;
    const ai = aggregateByGranularity(timeseriesQ.data.ai, effective);
    const transcoding = aggregateByGranularity(timeseriesQ.data.transcoding, effective);
    const labels = (ai.length > 0 ? ai : transcoding).map((p) => p.date);
    const datasets: ChartDataset<"line", number[]>[] = [];
    const includeAi = jobType !== "transcoding" && ai.length > 0;
    const includeTranscoding = jobType !== "ai" && transcoding.length > 0;
    if (includeAi) {
      datasets.push({
        label: "AI",
        data: ai.map((p) => p.count),
        borderColor: AI_COLOR,
        backgroundColor: AI_COLOR,
        cubicInterpolationMode: "monotone",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
      });
    }
    if (includeTranscoding) {
      datasets.push({
        label: "Transcoding",
        data: transcoding.map((p) => p.count),
        borderColor: TRANSCODING_COLOR,
        backgroundColor: TRANSCODING_COLOR,
        cubicInterpolationMode: "monotone",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
      });
    }
    return { labels, datasets };
  }, [timeseriesQ.data, effective, jobType]);

  const chartOptions: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: granularityChartTitle(effective) },
        tooltip: {
          callbacks: {
            footer: (items) => {
              const total = items.reduce(
                (acc, it) => acc + (typeof it.parsed.y === "number" ? it.parsed.y : 0),
                0,
              );
              return `Total: ${total}`;
            },
          },
          footerFont: { weight: "bold" },
        },
      },
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
        y: {
          beginAtZero: true,
          title: { display: true, text: granularityYAxisLabel(effective) },
        },
      },
    }),
    [effective],
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
      <Typography variant="h4" align="center" gutterBottom>
        Daily Winning Tickets Trend
      </Typography>

      <Grid container spacing={4} alignItems="center" justifyContent="center">
        <Grid item xs={12} md={6}>
          <Typography variant="body1" align="center">
            Daily count of winning tickets, split by job type. Default range is the last{" "}
            {DEFAULT_RANGE_DAYS} days. Maximum span is {MAX_SPAN_DAYS} days.
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={start}
                onChange={(e) => update("start", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={end}
                onChange={(e) => update("end", e.target.value)}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Box my={3} />

      <Grid container spacing={4} alignItems="center" justifyContent="center">
        <Grid item xs={12} md={6}>
          <Typography variant="body1" align="center">
            Choose a job type and granularity. &quot;Auto&quot; picks daily for short
            ranges, weekly for medium ranges, and monthly for long ranges.
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="jobType-label">Job Type</InputLabel>
                <Select
                  labelId="jobType-label"
                  label="Job Type"
                  value={jobType}
                  onChange={(e) =>
                    update(
                      "job_type",
                      e.target.value === "both" ? null : e.target.value,
                    )
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="granularity-label">Granularity</InputLabel>
                <Select
                  labelId="granularity-label"
                  label="Granularity"
                  value={granularity}
                  onChange={(e) =>
                    update(
                      "granularity",
                      e.target.value === "auto" ? null : e.target.value,
                    )
                  }
                >
                  <MenuItem value="auto">Auto ({effective})</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Box my={3} />

      {rangeWarning && (
        <Box display="flex" justifyContent="center" mb={2}>
          <Alert severity="warning" sx={{ width: "100%", maxWidth: 720 }}>
            {rangeWarning}
          </Alert>
        </Box>
      )}

      {timeseriesQ.error && (
        <Box display="flex" justifyContent="center" mb={2}>
          <Alert severity="error" sx={{ width: "100%", maxWidth: 720 }}>
            Failed to load: {timeseriesQ.error.message}
          </Alert>
        </Box>
      )}

      {timeseriesQ.isLoading && (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={10}>
          <Box
            sx={{
              width: "100%",
              height: { xs: "400px", md: "560px" },
              border: "1px solid #ccc",
              borderRadius: "8px",
              position: "relative",
              p: 1,
            }}
          >
            {chartData && <Line data={chartData} options={chartOptions} />}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
