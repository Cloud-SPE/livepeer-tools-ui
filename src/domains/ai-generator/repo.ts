import {
  gatewayPost,
  gatewayPostMultipart,
  gatewayPostStream,
  getByocOpenAIClient,
  getGatewaySettings,
  getNetworkCapabilities,
  setGatewaySettings,
  type GatewaySettings,
  type NetworkCapabilitiesResponse,
} from "@/providers/gateway";
import {
  BYOC_EMBEDDING_PREVIEW_COUNT,
  LLM_HEADER_TOKEN_PATTERN,
  SAM2_MASK_THRESHOLD,
  SAM2_TOP_N,
} from "./config";
import type {
  AudioToTextForm,
  AudioToTextResponse,
  ByocChatInvocation,
  ByocChatResult,
  ByocEmbeddingForm,
  ByocEmbeddingResult,
  ByocImageForm,
  ByocImageResult,
  ImageToImageForm,
  ImageToTextForm,
  ImageToVideoForm,
  ImagesResponse,
  LlmInvocation,
  LlmResponse,
  LlmStreamEvent,
  SegmentAnything2Form,
  SegmentAnything2Result,
  SegmentationMask,
  TextResponse,
  TextToImageForm,
  TextToSpeechForm,
  TextToSpeechResponse,
  UpscaleForm,
  VideoResponse,
} from "./types";

/**
 * Extract a plain string from an OpenAI-style "content" field, which can
 * be: a plain string, an array of `{type, text|content}` parts, or an
 * object with a `.text` property.
 *
 * Lives in repo (not service) because it's protocol-shape transformation —
 * same rule as `parseSseLine`. Exported so service tests can hit it.
 */
export function extractText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const obj = item as Record<string, unknown>;
        if (obj["type"] === "text" && typeof obj["text"] === "string") {
          return obj["text"];
        }
        if (typeof obj["content"] === "string") return obj["content"];
        return "";
      })
      .join("");
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj["text"] === "string") return obj["text"];
  }
  return "";
}

/**
 * Parse one line from an SSE stream of OpenAI-compatible chat-completions
 * deltas. Lives in repo (not service) because it's protocol-level data
 * shape transformation; service layer is forbidden upstream of repo.
 */
export function parseSseLine(rawLine: string): LlmStreamEvent {
  const line = rawLine.trim();
  if (!line.startsWith("data:")) return { kind: "ignore" };
  const payload = line.slice(5).trim();
  if (!payload) return { kind: "ignore" };
  if (payload === "[DONE]") return { kind: "done" };
  try {
    const parsed = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: unknown } }>;
    };
    const content = parsed.choices?.[0]?.delta?.content;
    if (typeof content === "string" && content.length > 0) {
      return { kind: "delta", content };
    }
    return { kind: "ignore" };
  } catch {
    return { kind: "ignore" };
  }
}

export type RawCapabilities = NetworkCapabilitiesResponse;

export async function fetchCapabilities(): Promise<RawCapabilities> {
  return getNetworkCapabilities();
}

export function loadGatewaySettings(): GatewaySettings {
  return getGatewaySettings();
}

export function saveGatewaySettings(next: GatewaySettings): void {
  setGatewaySettings(next);
}

/* ---------- inference ---------- */

function projectImagesResponse(raw: unknown): ImagesResponse {
  const r = raw as { images?: unknown; error?: unknown };
  if (r.error) {
    throw new Error(typeof r.error === "string" ? r.error : "Inference failed");
  }
  const images = Array.isArray(r.images) ? r.images : [];
  return {
    images: images.map((img) => {
      const o = img as Record<string, unknown>;
      return {
        url: String(o["url"] ?? ""),
        seed: typeof o["seed"] === "number" ? o["seed"] : undefined,
        nsfw: typeof o["nsfw"] === "boolean" ? o["nsfw"] : undefined,
      };
    }),
  };
}

export async function postTextToImage(form: TextToImageForm): Promise<ImagesResponse> {
  const body: Record<string, unknown> = {
    prompt: form.prompt,
    model_id: form.model_id,
    negative_prompt: form.negative_prompt,
    width: form.width,
    height: form.height,
    num_images_per_prompt: form.num_images_per_prompt,
    num_inference_steps: form.num_inference_steps,
    guidance_scale: form.guidance_scale,
    safety_check: form.safety_check,
  };
  const seed = form.seed.trim();
  if (seed) body["seed"] = Number(seed);
  const raw = await gatewayPost("/text-to-image", body);
  return projectImagesResponse(raw);
}

export async function postImageToImage(form: ImageToImageForm): Promise<ImagesResponse> {
  if (!form.image) throw new Error("Image is required.");
  const fd = new FormData();
  fd.append("prompt", form.prompt);
  fd.append("negative_prompt", form.negative_prompt);
  fd.append("image", form.image);
  fd.append("model_id", form.model_id);
  fd.append("guidance_scale", String(form.guidance_scale));
  fd.append("strength", String(form.strength));
  fd.append("num_images_per_prompt", String(form.num_images_per_prompt));
  fd.append("num_inference_steps", String(form.num_inference_steps));
  fd.append("safety_check", String(form.safety_check));
  const seed = form.seed.trim();
  if (seed) fd.append("seed", seed);
  const raw = await gatewayPostMultipart("/image-to-image", fd);
  return projectImagesResponse(raw);
}

export async function postUpscale(form: UpscaleForm): Promise<ImagesResponse> {
  if (!form.image) throw new Error("Image is required.");
  const fd = new FormData();
  // Old UI sends "not needed" — the gateway accepts but ignores it. Keeping
  // for parity until the gateway contract drops the field.
  fd.append("prompt", "not needed");
  fd.append("image", form.image);
  fd.append("model_id", form.model_id);
  fd.append("safety_check", String(form.safety_check));
  const seed = form.seed.trim();
  if (seed) fd.append("seed", seed);
  const raw = await gatewayPostMultipart("/upscale", fd);
  return projectImagesResponse(raw);
}

/* ---------- media inference (plan 011) ---------- */

function checkError(raw: unknown): void {
  const r = raw as { error?: unknown };
  if (r.error) {
    throw new Error(typeof r.error === "string" ? r.error : "Inference failed");
  }
}

export async function postImageToVideo(form: ImageToVideoForm): Promise<VideoResponse> {
  if (!form.image) throw new Error("Image is required.");
  const fd = new FormData();
  fd.append("image", form.image);
  fd.append("model_id", form.model_id);
  fd.append("width", String(form.width));
  fd.append("height", String(form.height));
  fd.append("fps", String(form.fps));
  fd.append("motion_bucket_id", String(form.motion_bucket_id));
  fd.append("noise_aug_strength", String(form.noise_aug_strength));
  const seed = form.seed.trim();
  if (seed) fd.append("seed", seed);
  const raw = await gatewayPostMultipart("/image-to-video", fd);
  return projectImagesResponse(raw);
}

export async function postImageToText(form: ImageToTextForm): Promise<TextResponse> {
  if (!form.image) throw new Error("Image is required.");
  const fd = new FormData();
  fd.append("prompt", form.prompt);
  fd.append("image", form.image);
  fd.append("model_id", form.model_id);
  const raw = await gatewayPostMultipart("/image-to-text", fd);
  checkError(raw);
  const r = raw as { text?: unknown };
  return { text: typeof r.text === "string" ? r.text : "" };
}

export async function postAudioToText(form: AudioToTextForm): Promise<AudioToTextResponse> {
  if (!form.audio) throw new Error("Audio is required.");
  const fd = new FormData();
  fd.append("audio", form.audio);
  fd.append("model_id", form.model_id);
  const raw = await gatewayPostMultipart("/audio-to-text", fd);
  checkError(raw);
  const r = raw as { text?: unknown };
  return { text: typeof r.text === "string" ? r.text : "" };
}

export async function postTextToSpeech(form: TextToSpeechForm): Promise<TextToSpeechResponse> {
  const body: Record<string, unknown> = {
    model_id: form.model_id,
    text: form.text,
    description: form.description,
  };
  const raw = await gatewayPost("/text-to-speech", body);
  checkError(raw);
  const r = raw as { audio?: { url?: unknown } };
  const url = r.audio && typeof r.audio.url === "string" ? r.audio.url : "";
  return { audio: { url } };
}

/* ---------- LLM (plan 012) ---------- */

function buildLlmBody(invocation: LlmInvocation): Record<string, unknown> {
  return {
    model: invocation.model_id,
    messages: [
      { role: "system", content: invocation.system },
      { role: "user", content: invocation.prompt },
    ],
    max_tokens: invocation.max_tokens,
    stream: invocation.stream,
  };
}

function stripHeaderTokens(text: string): string {
  return text.replace(LLM_HEADER_TOKEN_PATTERN, "");
}

/**
 * Call the gateway's `/llm` endpoint. Handles both the streaming
 * (Accept: text/event-stream) and non-streaming (Accept: application/json)
 * cases. In streaming mode, each `delta.content` chunk is emitted via
 * `onDelta`; in non-streaming mode the full content is read once.
 *
 * Always resolves with the accumulated content for parity. UI typically
 * uses `onDelta` for progressive rendering and ignores the resolved value.
 */
export async function postLlm(invocation: LlmInvocation): Promise<LlmResponse> {
  const body = buildLlmBody(invocation);

  if (!invocation.stream) {
    const raw = await gatewayPost("/llm", body);
    checkError(raw);
    const r = raw as {
      choices?: Array<{
        message?: { content?: unknown };
        delta?: { content?: unknown };
      }>;
    };
    const first = r.choices?.[0];
    const content =
      (first?.message?.content as string | undefined) ??
      (first?.delta?.content as string | undefined) ??
      "";
    if (!content) throw new Error("Invalid response format.");
    return { content: stripHeaderTokens(content) };
  }

  const response = await gatewayPostStream("/llm", body);
  if (!response.body) {
    throw new Error("ReadableStream not supported in this environment.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const event = parseSseLine(line);
      if (event.kind === "delta") {
        const cleaned = stripHeaderTokens(event.content);
        accumulated += cleaned;
        invocation.onDelta?.(cleaned);
      }
    }
  }

  return { content: accumulated };
}

/* ---------- BYOC OpenAI (plan 013) ---------- */

function normalizeSdkError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "object" && err !== null) {
    const e = err as { message?: unknown; status?: unknown };
    const out = new Error(typeof e.message === "string" ? e.message : "Request failed.");
    if (typeof e.status === "number") {
      Object.assign(out, { status: e.status });
    }
    return out;
  }
  return new Error("Request failed.");
}

/**
 * BYOC OpenAI chat completion. Handles both the streaming and
 * non-streaming cases. Streaming emits `{content, reasoning}` chunks via
 * `onDelta`; non-streaming resolves with the full accumulated content.
 *
 * Models occasionally emit a `reasoning` field alongside `content` —
 * surfaced separately so the UI can render it in a sidebar.
 */
export async function postByocChat(invocation: ByocChatInvocation): Promise<ByocChatResult> {
  const client = getByocOpenAIClient();
  const payload = {
    model: invocation.model,
    messages: [
      { role: "system" as const, content: invocation.system },
      { role: "user" as const, content: invocation.prompt },
    ],
    temperature: invocation.temperature,
    max_tokens: invocation.max_tokens,
  };

  try {
    if (invocation.stream) {
      const stream = await client.chat.completions.create({
        ...payload,
        stream: true,
      });
      let content = "";
      let reasoning = "";
      // The OpenAI SDK's streaming iterator yields chat-completion chunks.
      // The delta type is loose because vendors extend with `reasoning`.
      for await (const chunk of stream) {
        const c = chunk as unknown as {
          choices?: Array<{ delta?: Record<string, unknown> }>;
        };
        const delta = c.choices?.[0]?.delta ?? {};
        const contentChunk = stripHeaderTokens(extractText(delta["content"]));
        const reasoningChunk = stripHeaderTokens(
          extractText(delta["reasoning"]) || extractText(delta["reasoning_content"]),
        );
        if (contentChunk) {
          content += contentChunk;
        }
        if (reasoningChunk) {
          reasoning += reasoningChunk;
        }
        if (contentChunk || reasoningChunk) {
          invocation.onDelta?.({
            ...(contentChunk ? { content: contentChunk } : {}),
            ...(reasoningChunk ? { reasoning: reasoningChunk } : {}),
          });
        }
      }
      return { content, reasoning };
    }

    const data = await client.chat.completions.create({ ...payload, stream: false });
    const d = data as unknown as {
      choices?: Array<{
        message?: Record<string, unknown>;
        delta?: Record<string, unknown>;
      }>;
    };
    const message = d.choices?.[0]?.message ?? {};
    const delta = d.choices?.[0]?.delta ?? {};
    const content = stripHeaderTokens(
      extractText(message["content"]) || extractText(delta["content"]),
    );
    const reasoning = stripHeaderTokens(
      extractText(message["reasoning"]) ||
        extractText(message["reasoning_content"]) ||
        extractText(delta["reasoning"]) ||
        extractText(delta["reasoning_content"]),
    );
    return { content, reasoning };
  } catch (err) {
    throw normalizeSdkError(err);
  }
}

export async function postByocImage(form: ByocImageForm): Promise<ByocImageResult> {
  const client = getByocOpenAIClient();
  try {
    // Cast `size` to OpenAI's union type — the API accepts our string list.
    const data = await client.images.generate({
      model: form.model,
      prompt: form.prompt,
      size: form.size as unknown as "1024x1024" | "1024x1792" | "1792x1024",
      n: form.n,
      response_format: "b64_json",
    });
    const generated = Array.isArray(data?.data) ? data.data : [];
    const items = generated
      .map((item): { src: string } | null => {
        const o = item as { url?: unknown; b64_json?: unknown };
        if (typeof o.url === "string" && o.url) return { src: o.url };
        if (typeof o.b64_json === "string" && o.b64_json) {
          return { src: `data:image/png;base64,${o.b64_json}` };
        }
        return null;
      })
      .filter((x): x is { src: string } => x !== null);
    return { items };
  } catch (err) {
    throw normalizeSdkError(err);
  }
}

export async function postByocEmbedding(form: ByocEmbeddingForm): Promise<ByocEmbeddingResult> {
  const client = getByocOpenAIClient();
  try {
    const data = await client.embeddings.create({
      model: form.model,
      input: form.input,
    });
    const d = data as {
      data?: Array<{ embedding?: unknown }>;
      embedding?: unknown;
    };
    const candidate = d.data?.[0]?.embedding ?? d.embedding;
    const embedding = Array.isArray(candidate)
      ? candidate.map((v) => (typeof v === "number" ? v : Number(v)))
      : [];
    const preview = embedding
      .slice(0, BYOC_EMBEDDING_PREVIEW_COUNT)
      .map((v) => v.toFixed(5))
      .join(", ");
    return { embedding, preview, raw: data };
  } catch (err) {
    throw normalizeSdkError(err);
  }
}

/* ---------- SAM-2 (plan 014) ---------- */

/**
 * Pick the top-N masks above the configured score threshold. Order is
 * preserved from the input — these are typically score-ranked already by
 * the gateway, but we don't depend on that. Lives in repo because it
 * operates on the wire-protocol shape.
 */
export function pickTopMasks(
  masks: SegmentationMask[],
  scores: number[],
): { masks: SegmentationMask[]; scores: number[] } {
  const pairs: Array<{ mask: SegmentationMask; score: number }> = [];
  for (let i = 0; i < masks.length; i++) {
    const score = scores[i] ?? 0;
    const mask = masks[i];
    if (mask && score >= SAM2_MASK_THRESHOLD) {
      pairs.push({ mask, score });
    }
  }
  const top = pairs.slice(0, SAM2_TOP_N);
  return {
    masks: top.map((p) => p.mask),
    scores: top.map((p) => p.score),
  };
}

function parseMaskString(raw: unknown): SegmentationMask[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SegmentationMask[]) : [];
  } catch {
    return [];
  }
}

function parseScoreString(raw: unknown): number[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => Number(v)) : [];
  } catch {
    return [];
  }
}

export async function postSegmentAnything2(
  form: SegmentAnything2Form,
): Promise<SegmentAnything2Result> {
  if (!form.image) throw new Error("Image is required.");

  const fd = new FormData();
  fd.append("image", form.image);
  fd.append("model_id", form.model_id);
  if (form.point_coords) fd.append("point_coords", form.point_coords);
  if (form.point_labels) fd.append("point_labels", form.point_labels);
  if (form.box) fd.append("box", form.box);
  if (form.mask_input) fd.append("mask_input", form.mask_input);
  fd.append("multimask_output", String(form.multimask_output));
  fd.append("return_logits", String(form.return_logits));
  fd.append("normalize_coords", String(form.normalize_coords));
  fd.append("safety_check", String(form.safety_check));
  const seed = form.seed.trim();
  if (seed) fd.append("seed", seed);

  const raw = await gatewayPostMultipart("/segment-anything-2", fd);
  checkError(raw);
  const r = raw as { masks?: unknown; scores?: unknown };
  const masks = parseMaskString(r.masks);
  const scores = parseScoreString(r.scores);
  return pickTopMasks(masks, scores);
}
