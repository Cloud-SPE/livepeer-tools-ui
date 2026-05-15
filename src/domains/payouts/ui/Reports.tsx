import type { JSX } from "react";
import { Box, Button, Card, CardActions, CardContent, Grid, Typography } from "@mui/material";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";

interface ReportLink {
  title: string;
  description: string;
  to: string;
}

const REPORTS: ReadonlyArray<ReportLink> = [
  {
    title: "Payout Charts",
    description:
      "A leaderboard of payouts from the Livepeer Protocol. Configurable date range, sort, and job type. Values shown in ETH and USD.",
    to: "/reports/top/payout",
  },
  {
    title: "Daily Winning Tickets Trend",
    description:
      "Daily winning-ticket counts split by AI and Transcoding jobs, over a configurable date range. (Coming soon — tickets domain.)",
    to: "/reports/tickets/daily",
  },
  {
    title: "Daily Payout Report",
    description:
      "Aggregate payouts plus per-orchestrator leaderboard for a single day. Values shown in ETH and USD.",
    to: "/reports/daily",
  },
  {
    title: "Weekly Payout Report",
    description:
      "Aggregate payouts plus per-orchestrator leaderboard for an ISO week (Monday–Sunday).",
    to: "/reports/weekly",
  },
  {
    title: "Monthly Payout Report",
    description: "Aggregate payouts plus per-orchestrator leaderboard for a calendar month.",
    to: "/reports/monthly",
  },
  {
    title: "Top Rewards Report",
    description:
      "Leaderboard of LPT reward calls over a configurable date range. Configurable sort (orchestrator share / total / event count).",
    to: "/reports/rewards/leaderboard",
  },
  {
    title: "Daily Reward Report",
    description:
      "Aggregate reward calls plus per-orchestrator leaderboard for a single day. LPT and USD.",
    to: "/reports/rewards/daily",
  },
  {
    title: "Weekly Reward Report",
    description:
      "Aggregate reward calls plus per-orchestrator leaderboard for an ISO week (Monday–Sunday).",
    to: "/reports/rewards/weekly",
  },
  {
    title: "Monthly Reward Report",
    description: "Aggregate reward calls plus per-orchestrator leaderboard for a calendar month.",
    to: "/reports/rewards/monthly",
  },
];

export function Reports(): JSX.Element {
  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      <Grid container spacing={4}>
        {REPORTS.map((report) => (
          <Grid
            key={report.to}
            size={{
              xs: 12,
              sm: 6,
              md: 4,
              lg: 3,
            }}
          >
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {report.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {report.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  endIcon={<ArrowForward />}
                  component={Link}
                  to={report.to}
                >
                  View Report
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
