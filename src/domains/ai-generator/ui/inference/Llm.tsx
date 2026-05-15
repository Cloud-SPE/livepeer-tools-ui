import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import { LLM_DEFAULTS, PIPELINE_NAMES } from "../../config";
import { useLlmMutation, useModels } from "../../runtime";
import { validateLlm } from "../../service";
import type { LlmForm } from "../../types";
import { ModelSelect } from "./InferenceFields";

export function Llm(): JSX.Element {
  const [form, setForm] = useState<LlmForm>(LLM_DEFAULTS);
  const [errors, setErrors] = useState<string[]>([]);
  const [output, setOutput] = useState<string>("");
  const { models } = useModels(PIPELINE_NAMES.llm);
  const mutation = useLlmMutation();

  useEffect(() => {
    if (!form.model_id && models.length > 0 && models[0]) {
      setForm((prev) => ({ ...prev, model_id: models[0] ?? "" }));
    }
  }, [models, form.model_id]);

  const update = <K extends keyof LlmForm>(key: K, value: LlmForm[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const v = validateLlm(form);
    setErrors(v);
    if (v.length > 0) return;
    setOutput("");
    mutation.mutate(
      {
        ...form,
        onDelta: (chunk) => setOutput((prev) => prev + chunk),
      },
      {
        onSuccess: (res) => {
          // For non-streaming mode the onDelta callback never fires; populate
          // the output from the final resolved content.
          if (!form.stream) setOutput(res.content);
        },
      },
    );
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Ask an LLM
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Enter your message and parameters to interact with the LLM.
            </Typography>
            <Divider sx={{ my: 2 }} />

            {mutation.isSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Request successful.
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
                label="System Message"
                value={form.system}
                onChange={(e) => update("system", e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Enter system message"
                sx={{ mb: 3 }}
              />
              <TextField
                label="Prompt"
                value={form.prompt}
                onChange={(e) => update("prompt", e.target.value)}
                fullWidth
                required
                multiline
                rows={4}
                placeholder="Type in your prompt"
                sx={{ mb: 3 }}
              />
              <Box sx={{ position: "relative", mb: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Loading..." : "Ask"}
                </Button>
                {mutation.isPending && (
                  <CircularProgress
                    size={24}
                    sx={{
                      color: "white",
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      marginTop: "-12px",
                      marginLeft: "-12px",
                    }}
                  />
                )}
              </Box>

              <ModelSelect
                value={form.model_id}
                models={models}
                onChange={(v) => update("model_id", v)}
              />
              <TextField
                label="Max Tokens"
                type="number"
                value={Number.isFinite(form.max_tokens) ? form.max_tokens : ""}
                onChange={(e) =>
                  update("max_tokens", e.target.value === "" ? Number.NaN : Number(e.target.value))
                }
                fullWidth
                required
                sx={{ mb: 3 }}
              />
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="stream-label">Stream</InputLabel>
                <Select
                  labelId="stream-label"
                  label="Stream"
                  value={form.stream ? "true" : "false"}
                  onChange={(e) => update("stream", e.target.value === "true")}
                >
                  <MenuItem value="true">true</MenuItem>
                  <MenuItem value="false">false</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Output
            </Typography>
            <Box
              sx={{
                mt: 2,
                "& p": { mt: 0, mb: 1 },
                "& pre": {
                  backgroundColor: (t) => t.palette.grey[100],
                  padding: 2,
                  borderRadius: 1,
                  overflowX: "auto",
                },
                "& code": { fontFamily: "monospace", fontSize: "0.9em" },
              }}
            >
              {output ? (
                <ReactMarkdown>{output}</ReactMarkdown>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No output yet
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
