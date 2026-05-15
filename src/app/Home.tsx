import type { JSX } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";
import { NetworkStatsStrip } from "@/domains/network/ui";

interface FeatureCard {
  title: string;
  description: string;
  to: string;
}

const FEATURES: ReadonlyArray<FeatureCard> = [
  {
    title: "Reports",
    description:
      "Generate detailed payout and reward reports in ETH, LPT, and USD: daily, weekly, monthly, or custom charts.",
    to: "/reports",
  },
  {
    title: "Orchestrators",
    description:
      "Explore a list of orchestrators with reward and fee cuts, stake amounts, and quick links to their profiles.",
    to: "/orchestrators",
  },
  {
    title: "Gateways",
    description:
      "View details of gateways, including deposit and reserve amounts, with links to their profiles.",
    to: "/gateways",
  },
  {
    title: "Treasury Voting History",
    description: "Review all funding requests voted on by Livepeer stakeholders.",
    to: "/vote/history",
  },
  {
    title: "Rounds",
    description: "Browse historical Livepeer protocol rounds with stake and payout snapshots.",
    to: "/rounds",
  },
];

export function Home(): JSX.Element {
  return (
    <Container sx={{ maxWidth: "lg", py: 8 }}>
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography variant="h2" gutterBottom>
          Welcome to Livepeer Tools
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Your all-in-one platform for orchestrator performance, treasury insights, and
          comprehensive reporting. Empower your Livepeer operations with data-driven tools.
        </Typography>
      </Box>
      <Box sx={{ mb: 6 }}>
        <NetworkStatsStrip />
      </Box>
      <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
        <Typography variant="h4" gutterBottom>
          Key Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {FEATURES.map((f) => (
            <Grid
              key={f.to}
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
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {f.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    endIcon={<ArrowForward />}
                    component={Link}
                    to={f.to}
                  >
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
