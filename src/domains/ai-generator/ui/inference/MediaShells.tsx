import type { JSX } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";

interface FormShellProps {
  title: string;
  subtitle: string;
  busy: boolean;
  errors: string[];
  success: string | null;
  mutationError: string | null;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
}

/**
 * Shared "left column" shell — header, status messages, form scaffolding,
 * submit button + progress bar. Each media route assembles its inputs as
 * children and slots them in.
 */
export function FormShell({
  title,
  subtitle,
  busy,
  errors,
  success,
  mutationError,
  children,
  onSubmit,
  submitLabel = "Generate",
}: FormShellProps): JSX.Element {
  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        {subtitle}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        <Grid
          size={{
            xs: 12,
            md: 5,
          }}
        >
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Input Configuration
              </Typography>
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
              {mutationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {mutationError}
                </Alert>
              )}
              {errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>
                  {errors.join("\n")}
                </Alert>
              )}
              <Box component="form" onSubmit={onSubmit}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={busy}
                  sx={{ mb: 2, mt: 2 }}
                >
                  {busy ? "Working…" : submitLabel}
                </Button>
                {busy && <LinearProgress sx={{ mb: 2 }} />}
                {children}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 7,
          }}
        >
          <ResultColumn />
        </Grid>
      </Grid>
    </Box>
  );
}

function ResultColumn(): JSX.Element {
  // The right column is composed per-route; FormShell only owns the left.
  // We return an empty slot here and let each component compose its own.
  return <></>;
}

interface ResultCardProps {
  title: string;
  empty: string;
  children: React.ReactNode;
}

export function ResultCard({ title, empty, children }: ResultCardProps): JSX.Element {
  return (
    <Card elevation={3} sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ mt: 2 }}>
          {children ?? (
            <Typography variant="body2" color="textSecondary">
              {empty}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
