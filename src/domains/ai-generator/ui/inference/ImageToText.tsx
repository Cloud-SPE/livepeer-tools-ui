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
import { IMAGE_TO_TEXT_DEFAULTS, PIPELINE_NAMES } from "../../config";
import { useImageToTextMutation, useModels } from "../../runtime";
import { validateImageToText } from "../../service";
import type { ImageToTextForm } from "../../types";
import { FilePicker, ModelSelect } from "./InferenceFields";

export function ImageToText(): JSX.Element {
  const [form, setForm] = useState<ImageToTextForm>(IMAGE_TO_TEXT_DEFAULTS);
  const [errors, setErrors] = useState<string[]>([]);
  const { models } = useModels(PIPELINE_NAMES.imageToText);
  const mutation = useImageToTextMutation();

  useEffect(() => {
    if (!form.model_id && models.length > 0 && models[0]) {
      setForm((prev) => ({ ...prev, model_id: models[0] ?? "" }));
    }
  }, [models, form.model_id]);

  const update = <K extends keyof ImageToTextForm>(key: K, value: ImageToTextForm[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const v = validateImageToText(form);
    setErrors(v);
    if (v.length === 0) mutation.mutate(form);
  };

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        Image to Text
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Upload an image and a prompt, get a textual description back.
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
                  Text generated successfully.
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
                  placeholder="Describe what you want extracted"
                  sx={{ my: 2 }}
                />
                <FilePicker file={form.image} onPick={(f) => update("image", f)} />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={mutation.isPending}
                  sx={{ mb: 2 }}
                >
                  {mutation.isPending ? "Generating…" : "Generate Text"}
                </Button>
                {mutation.isPending && <LinearProgress sx={{ mb: 2 }} />}
                <ModelSelect
                  value={form.model_id}
                  models={models}
                  onChange={(v) => update("model_id", v)}
                />
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
                Generated Text
              </Typography>
              <Box
                sx={{
                  mt: 2,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  minHeight: 120,
                  color: mutation.data ? "text.primary" : "text.secondary",
                }}
              >
                {mutation.data?.text || "Generated text will appear here."}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
