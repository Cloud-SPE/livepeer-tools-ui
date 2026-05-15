import type { JSX } from "react";
import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { gatewayPresets } from "../config";
import { useGatewaySettings } from "../runtime";
import { matchesPreset } from "../service";

export function Settings(): JSX.Element {
  const presets = useMemo(() => gatewayPresets(), []);
  const { settings, save } = useGatewaySettings();
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [bearerToken, setBearerToken] = useState(settings.bearerToken);
  const [useCustom, setUseCustom] = useState(!matchesPreset(settings.baseUrl, presets));
  const [status, setStatus] = useState<{ severity: "success" | "error"; message: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!baseUrl.trim()) {
      setStatus({ severity: "error", message: "Gateway URL is required." });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      save({ baseUrl: baseUrl.trim(), bearerToken: bearerToken.trim() });
      setStatus({ severity: "success", message: "Settings saved." });
    } catch (err) {
      setStatus({
        severity: "error",
        message: err instanceof Error ? err.message : "Failed to save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const onPresetChange = (value: string): void => {
    setBaseUrl(value);
    setUseCustom(!matchesPreset(value, presets));
  };

  const onCustomToggle = (next: boolean): void => {
    setUseCustom(next);
    if (!next && !matchesPreset(baseUrl, presets) && presets[0]) {
      setBaseUrl(presets[0].value);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
              Settings
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              Configure the AI gateway used by the inference and capabilities pages. The choice is
              persisted to localStorage on this device.
            </Typography>
            <Divider sx={{ my: 2 }} />

            {status && (
              <Alert severity={status.severity} sx={{ mb: 2 }}>
                {status.message}
              </Alert>
            )}

            <Box component="form" onSubmit={onSubmit}>
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth disabled={useCustom}>
                  <InputLabel id="gateway-preset-label">Gateway</InputLabel>
                  <Select
                    labelId="gateway-preset-label"
                    label="Gateway"
                    value={matchesPreset(baseUrl, presets) ? baseUrl : ""}
                    onChange={(e) => onPresetChange(e.target.value)}
                  >
                    {presets.map((p) => (
                      <MenuItem key={p.value} value={p.value}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Pick the gateway closest to your region.
                  </Typography>
                </FormControl>
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={useCustom}
                    onChange={(e) => onCustomToggle(e.target.checked)}
                  />
                }
                label="Use Custom Gateway URL"
              />

              {useCustom && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="Custom Gateway URL"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    fullWidth
                    required
                    helperText="Enter a custom gateway base URL."
                  />
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Bearer Token (optional)"
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  fullWidth
                  type="password"
                  helperText="If your gateway requires authentication, enter the bearer token here."
                />
              </Box>

              <Box sx={{ mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={saving}
                >
                  {saving ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
