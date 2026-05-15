import { useEffect, useState } from "react";
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
import { PIPELINE_NAMES, UPSCALE_DEFAULTS } from "../../config";
import { useGatewaySettings, useModels, useUpscaleMutation } from "../../runtime";
import { resolveImageUrl, validateUpscale } from "../../service";
import type { UpscaleForm } from "../../types";
import { GeneratedImageCard } from "./GeneratedImageCard";
import {
  FilePicker,
  ModelSelect,
  SafetyCheckSelect,
  SeedField,
} from "./InferenceFields";

export function Upscale(): JSX.Element {
  const [form, setForm] = useState<UpscaleForm>(UPSCALE_DEFAULTS);
  const [errors, setErrors] = useState<string[]>([]);
  const { models } = useModels(PIPELINE_NAMES.upscale);
  const mutation = useUpscaleMutation();
  const { settings } = useGatewaySettings();

  useEffect(() => {
    if (!form.model_id && models.length > 0 && models[0]) {
      setForm((prev) => ({ ...prev, model_id: models[0] ?? "" }));
    }
  }, [models, form.model_id]);

  const update = <K extends keyof UpscaleForm>(key: K, value: UpscaleForm[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const v = validateUpscale(form);
    setErrors(v);
    if (v.length === 0) mutation.mutate(form);
  };

  const images = mutation.data?.images ?? [];

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Upscale
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Upload an image and produce an upscaled version.
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Input Configuration
              </Typography>

              {mutation.isSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Image upscaled successfully.
                </Alert>
              )}
              {mutation.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {mutation.error.message}
                </Alert>
              )}
              {errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>
                  {errors.join("\n")}
                </Alert>
              )}

              <Box component="form" onSubmit={onSubmit}>
                <FilePicker
                  file={form.image}
                  onPick={(f) => update("image", f)}
                  label="Choose a file"
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={mutation.isPending}
                  sx={{ my: 2 }}
                >
                  {mutation.isPending ? "Processing…" : "Upscale Image"}
                </Button>
                {mutation.isPending && <LinearProgress />}

                <ModelSelect
                  value={form.model_id}
                  models={models}
                  onChange={(v) => update("model_id", v)}
                />
                <SafetyCheckSelect
                  value={form.safety_check}
                  onChange={(v) => update("safety_check", v)}
                />
                <SeedField value={form.seed} onChange={(v) => update("seed", v)} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upscaled Images
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                {images.length > 0 ? (
                  images.map((img, idx) => (
                    <GeneratedImageCard
                      key={`${img.url}-${idx}`}
                      imageSrc={resolveImageUrl(img.url, settings.baseUrl)}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Generated images will appear here.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
