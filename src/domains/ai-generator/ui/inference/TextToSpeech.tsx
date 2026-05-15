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
import { PIPELINE_NAMES, TEXT_TO_SPEECH_DEFAULTS } from "../../config";
import { useGatewaySettings, useModels, useTextToSpeechMutation } from "../../runtime";
import { resolveMediaUrl, validateTextToSpeech } from "../../service";
import type { TextToSpeechForm } from "../../types";
import { ModelSelect } from "./InferenceFields";

export function TextToSpeech(): JSX.Element {
  const [form, setForm] = useState<TextToSpeechForm>(TEXT_TO_SPEECH_DEFAULTS);
  const [errors, setErrors] = useState<string[]>([]);
  const { models } = useModels(PIPELINE_NAMES.textToSpeech);
  const mutation = useTextToSpeechMutation();
  const { settings } = useGatewaySettings();

  useEffect(() => {
    if (!form.model_id && models.length > 0 && models[0]) {
      setForm((prev) => ({ ...prev, model_id: models[0] ?? "" }));
    }
  }, [models, form.model_id]);

  const update = <K extends keyof TextToSpeechForm>(key: K, value: TextToSpeechForm[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const v = validateTextToSpeech(form);
    setErrors(v);
    if (v.length === 0) mutation.mutate(form);
  };

  const audioUrl = mutation.data?.audio.url;

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        Text to Speech
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Synthesize speech from a text prompt and an optional voice description.
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
                  Speech generated successfully.
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
                  label="Text"
                  value={form.text}
                  onChange={(e) => update("text", e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  placeholder="Text to speak"
                  sx={{ my: 2 }}
                />
                <TextField
                  label="Voice Description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  fullWidth
                  placeholder="Optional voice characterization"
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={mutation.isPending}
                  sx={{ mb: 2 }}
                >
                  {mutation.isPending ? "Generating…" : "Generate Speech"}
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
                Generated Audio
              </Typography>
              <Box sx={{ mt: 2 }}>
                {audioUrl ? (
                  <Box
                    component="audio"
                    src={resolveMediaUrl(audioUrl, settings.baseUrl)}
                    controls
                    autoPlay
                    sx={{ width: "100%" }}
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Generated audio will appear here.
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
