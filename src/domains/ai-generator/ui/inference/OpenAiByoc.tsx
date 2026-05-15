import type { JSX } from "react";
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import {
  BYOC_CHAT_DEFAULTS,
  BYOC_EMBEDDING_DEFAULTS,
  BYOC_IMAGE_DEFAULTS,
  BYOC_IMAGE_SIZES,
  PIPELINE_NAMES,
} from "../../config";
import {
  useByocChatMutation,
  useByocEmbeddingMutation,
  useByocImageMutation,
  useModels,
} from "../../runtime";
import { validateByocChat, validateByocEmbedding, validateByocImage } from "../../service";
import type { ByocChatForm, ByocEmbeddingForm, ByocImageForm } from "../../types";

export function OpenAiByoc(): JSX.Element {
  const [tab, setTab] = useState(0);

  const { models: chatModels } = useModels(PIPELINE_NAMES.byocChat);
  const { models: imageModels } = useModels(PIPELINE_NAMES.byocImage);
  const { models: embeddingModels } = useModels(PIPELINE_NAMES.byocEmbedding);

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        BYOC OpenAI
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        OpenAI-compatible BYOC gateway: chat completions, image generation, and embeddings.
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Tabs value={tab} onChange={(_, v) => setTab(v as number)} sx={{ mb: 2 }}>
        <Tab label="Chat" disabled={chatModels.length === 0} />
        <Tab label="Image" disabled={imageModels.length === 0} />
        <Tab label="Embeddings" disabled={embeddingModels.length === 0} />
      </Tabs>

      {tab === 0 && <ChatPanel models={chatModels} />}
      {tab === 1 && <ImagePanel models={imageModels} />}
      {tab === 2 && <EmbeddingPanel models={embeddingModels} />}
    </Box>
  );
}

function ChatPanel({ models }: { models: string[] }): JSX.Element {
  const [form, setForm] = useState<ByocChatForm>(BYOC_CHAT_DEFAULTS);
  const [errors, setErrors] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [reasoning, setReasoning] = useState("");
  const mutation = useByocChatMutation();

  useEffect(() => {
    if (!form.model && models.length > 0 && models[0]) {
      setForm((prev) => ({ ...prev, model: models[0] ?? "" }));
    }
  }, [models, form.model]);

  const update = <K extends keyof ByocChatForm>(key: K, value: ByocChatForm[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const v = validateByocChat(form);
    setErrors(v);
    if (v.length > 0) return;
    setContent("");
    setReasoning("");
    mutation.mutate(
      {
        ...form,
        onDelta: (delta) => {
          if (delta.content) setContent((prev) => prev + delta.content);
          if (delta.reasoning) setReasoning((prev) => prev + delta.reasoning);
        },
      },
      {
        onSuccess: (res) => {
          if (!form.stream) {
            setContent(res.content);
            setReasoning(res.reasoning);
          }
        },
      },
    );
  };

  return (
    <Grid container spacing={3}>
      <Grid
        size={{
          xs: 12,
          md: 5,
        }}
      >
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Chat Completions
            </Typography>
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
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Model</InputLabel>
                <Select
                  value={form.model}
                  label="Model"
                  onChange={(e) => update("model", e.target.value)}
                >
                  {models.length > 0 ? (
                    models.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No models available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <TextField
                label="System"
                fullWidth
                multiline
                rows={2}
                value={form.system}
                onChange={(e) => update("system", e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Prompt"
                fullWidth
                required
                multiline
                rows={5}
                value={form.prompt}
                onChange={(e) => update("prompt", e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Temperature"
                type="number"
                fullWidth
                value={Number.isFinite(form.temperature) ? form.temperature : ""}
                onChange={(e) =>
                  update("temperature", e.target.value === "" ? Number.NaN : Number(e.target.value))
                }
                sx={{ mb: 2 }}
                slotProps={{ htmlInput: { min: 0, max: 2, step: 0.1 } }}
              />
              <TextField
                label="Max Tokens"
                type="number"
                fullWidth
                value={Number.isFinite(form.max_tokens) ? form.max_tokens : ""}
                onChange={(e) =>
                  update("max_tokens", e.target.value === "" ? Number.NaN : Number(e.target.value))
                }
                sx={{ mb: 2 }}
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Stream</InputLabel>
                <Select
                  value={form.stream ? "true" : "false"}
                  label="Stream"
                  onChange={(e) => update("stream", e.target.value === "true")}
                >
                  <MenuItem value="true">true</MenuItem>
                  <MenuItem value="false">false</MenuItem>
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" fullWidth disabled={mutation.isPending}>
                {mutation.isPending ? "Submitting…" : "Submit Chat"}
              </Button>
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
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Response
            </Typography>
            {mutation.isPending && !content && !reasoning && <CircularProgress size={22} />}
            {reasoning && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderLeft: 3,
                  borderColor: "divider",
                  backgroundColor: "action.hover",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ display: "block", mb: 0.5 }}
                >
                  Thinking
                </Typography>
                <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontFamily: "inherit", m: 0 }}>
                  {reasoning}
                </Box>
              </Box>
            )}
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              !reasoning &&
              !mutation.isPending && <Typography variant="body2">No output yet.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function ImagePanel({ models }: { models: string[] }): JSX.Element {
  const [form, setForm] = useState<ByocImageForm>(BYOC_IMAGE_DEFAULTS);
  const [errors, setErrors] = useState<string[]>([]);
  const mutation = useByocImageMutation();

  useEffect(() => {
    if (!form.model && models.length > 0 && models[0]) {
      setForm((prev) => ({ ...prev, model: models[0] ?? "" }));
    }
  }, [models, form.model]);

  const update = <K extends keyof ByocImageForm>(key: K, value: ByocImageForm[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const v = validateByocImage(form);
    setErrors(v);
    if (v.length === 0) mutation.mutate(form);
  };

  return (
    <Grid container spacing={3}>
      <Grid
        size={{
          xs: 12,
          md: 5,
        }}
      >
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Image Generation
            </Typography>
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
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Model</InputLabel>
                <Select
                  value={form.model}
                  label="Model"
                  onChange={(e) => update("model", e.target.value)}
                >
                  {models.length > 0 ? (
                    models.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No models available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <TextField
                label="Prompt"
                fullWidth
                required
                multiline
                rows={4}
                value={form.prompt}
                onChange={(e) => update("prompt", e.target.value)}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Size</InputLabel>
                <Select
                  value={form.size}
                  label="Size"
                  onChange={(e) => update("size", e.target.value)}
                  disabled={mutation.isPending}
                >
                  {BYOC_IMAGE_SIZES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Count"
                type="number"
                fullWidth
                value={Number.isFinite(form.n) ? form.n : ""}
                onChange={(e) =>
                  update("n", e.target.value === "" ? Number.NaN : Number(e.target.value))
                }
                sx={{ mb: 2 }}
                slotProps={{ htmlInput: { min: 1, max: 4 } }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={mutation.isPending}>
                {mutation.isPending ? "Generating…" : "Generate Image"}
              </Button>
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
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Images
            </Typography>
            {mutation.isPending && <CircularProgress size={22} />}
            {!mutation.isPending && (mutation.data?.items.length ?? 0) === 0 && (
              <Typography variant="body2">No images yet.</Typography>
            )}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {mutation.data?.items.map((item, idx) => (
                <Box
                  key={idx}
                  component="img"
                  src={item.src}
                  alt={`Generated ${idx + 1}`}
                  sx={{ width: 220, borderRadius: 1 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function EmbeddingPanel({ models }: { models: string[] }): JSX.Element {
  const [form, setForm] = useState<ByocEmbeddingForm>(BYOC_EMBEDDING_DEFAULTS);
  const [errors, setErrors] = useState<string[]>([]);
  const mutation = useByocEmbeddingMutation();

  useEffect(() => {
    if (!form.model && models.length > 0 && models[0]) {
      setForm((prev) => ({ ...prev, model: models[0] ?? "" }));
    }
  }, [models, form.model]);

  const update = <K extends keyof ByocEmbeddingForm>(key: K, value: ByocEmbeddingForm[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const v = validateByocEmbedding(form);
    setErrors(v);
    if (v.length === 0) mutation.mutate(form);
  };

  const onDownload = (): void => {
    if (!mutation.data) return;
    const blob = new Blob([JSON.stringify(mutation.data.raw, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "embedding.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Grid container spacing={3}>
      <Grid
        size={{
          xs: 12,
          md: 5,
        }}
      >
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Embeddings
            </Typography>
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
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Model</InputLabel>
                <Select
                  value={form.model}
                  label="Model"
                  onChange={(e) => update("model", e.target.value)}
                >
                  {models.length > 0 ? (
                    models.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No models available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <TextField
                label="Input Text"
                fullWidth
                required
                multiline
                rows={6}
                value={form.input}
                onChange={(e) => update("input", e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={mutation.isPending}>
                {mutation.isPending ? "Generating…" : "Generate Embedding"}
              </Button>
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
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Embedding Output
            </Typography>
            {mutation.isPending ? (
              <CircularProgress size={22} />
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Dimensions: {mutation.data?.embedding.length ?? 0}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, wordBreak: "break-word" }}>
                  Sample: {mutation.data?.preview || "No output yet."}
                </Typography>
                {mutation.data && (
                  <Button variant="contained" size="small" sx={{ mt: 2 }} onClick={onDownload}>
                    Download JSON
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
