import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { invalidateCapabilities, useCapabilities } from "../runtime";

export function NetworkCapabilities(): JSX.Element {
  const { data, isLoading, error, isFetching } = useCapabilities();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              pb={1}
              sx={{ borderBottom: "1px solid #e0e0e0" }}
            >
              <Typography variant="h5" fontWeight="bold">
                Network Capabilities
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="medium"
                onClick={() => invalidateCapabilities()}
                disabled={isFetching}
                sx={{ textTransform: "capitalize" }}
              >
                {isFetching ? "Refreshing…" : "Refresh"}
              </Button>
            </Box>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              Livepeer AI Pipelines Loaded
            </Typography>

            {error && (
              <Alert severity="error" sx={{ my: 2 }}>
                Failed to load capabilities: {error.message}
              </Alert>
            )}

            {isLoading && (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            )}

            {data && data.pipelines.length === 0 && (
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mt: 2, textAlign: "center" }}
              >
                No capabilities available.
              </Typography>
            )}

            {data?.pipelines.map((pipeline) => (
              <Card
                key={pipeline.name}
                elevation={2}
                sx={{ my: 2, borderLeft: "5px solid #3f51b5", borderRadius: 2 }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {pipeline.name}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  {pipeline.models.map((model) => (
                    <Accordion key={model.name} elevation={0} sx={{ mb: 1 }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          backgroundColor: "#f9f9f9",
                          borderBottom: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          {model.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ ml: 2 }}
                        >
                          Cold: {model.coldCount}, Warm: {model.warmCount}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {model.orchestrators.map((o) => (
                          <Typography
                            key={o.ethAddress}
                            variant="body2"
                            sx={{
                              color: o.warm ? "warning.main" : "info.main",
                              mb: 1,
                            }}
                          >
                            {o.ethAddress} — {o.warm ? "Warm" : "Cold"}
                          </Typography>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
