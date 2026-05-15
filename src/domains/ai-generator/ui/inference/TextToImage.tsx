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
  TextField,
  Typography,
} from "@mui/material";
import { PIPELINE_NAMES, TEXT_TO_IMAGE_DEFAULTS } from "../../config";
import { useGatewaySettings, useModels, useTextToImageMutation } from "../../runtime";
import { resolveImageUrl, validateTextToImage } from "../../service";
import type { TextToImageForm } from "../../types";
import { GeneratedImageCard } from "./GeneratedImageCard";
import { ModelSelect, NumberField, SafetyCheckSelect, SeedField } from "./InferenceFields";

export function TextToImage(): JSX.Element {
  const [form, setForm] = useState<TextToImageForm>(TEXT_TO_IMAGE_DEFAULTS);
  const [errors, setErrors] = useState<string[]>([]);
  const { models } = useModels(PIPELINE_NAMES.textToImage);
  const mutation = useTextToImageMutation();
  const { settings } = useGatewaySettings();

  useEffect(() => {
    if (!form.model_id && models.length > 0 && models[0]) {
      setForm((prev) => ({ ...prev, model_id: models[0] ?? "" }));
    }
  }, [models, form.model_id]);

  const update = <K extends keyof TextToImageForm>(key: K, value: TextToImageForm[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const v = validateTextToImage(form);
    setErrors(v);
    if (v.length === 0) mutation.mutate(form);
  };

  const images = mutation.data?.images ?? [];

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        Text to Image
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Enter a prompt, configure the parameters, and generate images.
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
                  Images generated successfully.
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
                <TextField
                  label="Prompt"
                  value={form.prompt}
                  onChange={(e) => update("prompt", e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={3}
                  placeholder="Describe the image"
                  sx={{ my: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={mutation.isPending}
                  sx={{ mb: 2 }}
                >
                  {mutation.isPending ? "Generating…" : "Generate"}
                </Button>
                {mutation.isPending && <LinearProgress sx={{ mb: 2 }} />}

                <ModelSelect
                  value={form.model_id}
                  models={models}
                  onChange={(v) => update("model_id", v)}
                />
                <TextField
                  label="Negative Prompt"
                  value={form.negative_prompt}
                  onChange={(e) => update("negative_prompt", e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
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
                <NumberField
                  label="# of Images"
                  value={form.num_images_per_prompt}
                  onChange={(v) => update("num_images_per_prompt", v)}
                  required
                />
                <NumberField
                  label="# of Inference Steps"
                  value={form.num_inference_steps}
                  onChange={(v) => update("num_inference_steps", v)}
                />
                <NumberField
                  label="Guidance Scale"
                  value={form.guidance_scale}
                  onChange={(v) => update("guidance_scale", v)}
                  step={0.1}
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

        <Grid
          size={{
            xs: 12,
            md: 7,
          }}
        >
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generated Images
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
