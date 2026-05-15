import type { JSX } from "react";
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
import { IMAGE_TO_VIDEO_DEFAULTS, PIPELINE_NAMES } from "../../config";
import { useGatewaySettings, useImageToVideoMutation, useModels } from "../../runtime";
import { resolveMediaUrl, validateImageToVideo } from "../../service";
import type { ImageToVideoForm } from "../../types";
import { FilePicker, ModelSelect, NumberField, SeedField } from "./InferenceFields";

export function ImageToVideo(): JSX.Element {
  const [form, setForm] = useState<ImageToVideoForm>(IMAGE_TO_VIDEO_DEFAULTS);
  const [errors, setErrors] = useState<string[]>([]);
  const { models } = useModels(PIPELINE_NAMES.imageToVideo);
  const mutation = useImageToVideoMutation();
  const { settings } = useGatewaySettings();

  useEffect(() => {
    if (!form.model_id && models.length > 0 && models[0]) {
      setForm((prev) => ({ ...prev, model_id: models[0] ?? "" }));
    }
  }, [models, form.model_id]);

  const update = <K extends keyof ImageToVideoForm>(key: K, value: ImageToVideoForm[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const v = validateImageToVideo(form);
    setErrors(v);
    if (v.length === 0) mutation.mutate(form);
  };

  const videoUrl = mutation.data?.images[0]?.url;

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        Image to Video
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Upload an image and generate a short video.
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
              {mutation.isSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Video generated successfully.
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
                <FilePicker file={form.image} onPick={(f) => update("image", f)} />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={mutation.isPending}
                  sx={{ mb: 2 }}
                >
                  {mutation.isPending ? "Generating…" : "Generate Video"}
                </Button>
                {mutation.isPending && <LinearProgress sx={{ mb: 2 }} />}
                <ModelSelect
                  value={form.model_id}
                  models={models}
                  onChange={(v) => update("model_id", v)}
                />
                <NumberField
                  label="Width"
                  value={form.width}
                  onChange={(v) => update("width", v)}
                  required
                />
                <NumberField
                  label="Height"
                  value={form.height}
                  onChange={(v) => update("height", v)}
                  required
                />
                <NumberField label="FPS" value={form.fps} onChange={(v) => update("fps", v)} />
                <NumberField
                  label="Motion Bucket ID"
                  value={form.motion_bucket_id}
                  onChange={(v) => update("motion_bucket_id", v)}
                />
                <NumberField
                  label="Noise Aug Strength"
                  value={form.noise_aug_strength}
                  onChange={(v) => update("noise_aug_strength", v)}
                  step={0.001}
                />
                <SeedField value={form.seed} onChange={(v) => update("seed", v)} />
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
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generated Video
              </Typography>
              <Box sx={{ mt: 2 }}>
                {videoUrl ? (
                  <Box
                    component="video"
                    src={resolveMediaUrl(videoUrl, settings.baseUrl)}
                    controls
                    autoPlay
                    sx={{ width: "100%", maxWidth: 720, mb: 2 }}
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Generated video will appear here.
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
