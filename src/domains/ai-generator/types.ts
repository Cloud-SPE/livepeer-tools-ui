/** One orchestrator slot inside a model's capability matrix entry. */
export interface OrchestratorCapability {
  /** Lowercased eth address (or short label when address is missing). */
  ethAddress: string;
  /** True when the orchestrator advertises a warm load for this model. */
  warm: boolean;
}

export interface ModelCapability {
  name: string;
  coldCount: number;
  warmCount: number;
  orchestrators: OrchestratorCapability[];
}

export interface PipelineCapability {
  name: string;
  models: ModelCapability[];
}

export interface CapabilitiesView {
  pipelines: PipelineCapability[];
}

export interface GatewaySettingsView {
  baseUrl: string;
  bearerToken: string;
}

/* ---------- inference ---------- */

/** One image returned by the gateway. URL may be absolute or relative. */
export interface GeneratedImage {
  url: string;
  seed?: number;
  nsfw?: boolean;
}

export interface ImagesResponse {
  images: GeneratedImage[];
}

/** Shared form fields across all three image inference routes. */
interface CommonInferenceFields {
  model_id: string;
  safety_check: boolean;
  /** Kept as string in form state; parsed when submitting. */
  seed: string;
}

export interface TextToImageForm extends CommonInferenceFields {
  prompt: string;
  negative_prompt: string;
  width: number;
  height: number;
  num_images_per_prompt: number;
  num_inference_steps: number;
  guidance_scale: number;
}

export interface ImageToImageForm extends CommonInferenceFields {
  prompt: string;
  negative_prompt: string;
  strength: number;
  num_inference_steps: number;
  num_images_per_prompt: number;
  guidance_scale: number;
  image: File | null;
}

export interface UpscaleForm extends CommonInferenceFields {
  image: File | null;
}

export type InferenceErrors = string[];

/* ---------- media inference (plan 011) ---------- */

export interface ImageToVideoForm {
  model_id: string;
  width: number;
  height: number;
  fps: number;
  motion_bucket_id: number;
  noise_aug_strength: number;
  seed: string;
  image: File | null;
}

/** Same wire shape as ImagesResponse but the URL points at video media. */
export type VideoResponse = ImagesResponse;

export interface ImageToTextForm {
  model_id: string;
  prompt: string;
  image: File | null;
}

export interface TextResponse {
  text: string;
}

export interface AudioToTextForm {
  model_id: string;
  audio: File | null;
}

export interface AudioToTextResponse {
  text: string;
}

export interface TextToSpeechForm {
  model_id: string;
  text: string;
  description: string;
}

export interface TextToSpeechResponse {
  audio: { url: string };
}

/* ---------- LLM (plan 012) ---------- */

export interface LlmForm {
  model_id: string;
  system: string;
  prompt: string;
  max_tokens: number;
  stream: boolean;
}

/** Outcome of `postLlm` — the accumulated content. UI uses onDelta during streaming. */
export interface LlmResponse {
  content: string;
}

export interface LlmInvocation extends LlmForm {
  /** Called for each streaming chunk (incremental content fragment). */
  onDelta?: (chunk: string) => void;
}

/** One parsed SSE line from the LLM stream. */
export type LlmStreamEvent =
  | { kind: "delta"; content: string }
  | { kind: "done" }
  | { kind: "ignore" };

/* ---------- BYOC OpenAI (plan 013) ---------- */

export interface ByocChatForm {
  model: string;
  system: string;
  prompt: string;
  temperature: number;
  max_tokens: number;
  stream: boolean;
}

export interface ByocImageForm {
  model: string;
  prompt: string;
  size: string;
  n: number;
}

export interface ByocEmbeddingForm {
  model: string;
  input: string;
}

export interface ByocChatResult {
  content: string;
  reasoning: string;
}

export interface ByocChatInvocation extends ByocChatForm {
  onDelta?: (delta: { content?: string; reasoning?: string }) => void;
}

export interface ByocImageItem {
  /** Either a URL (for `response_format: "url"`) or a data: URL (for b64_json). */
  src: string;
}

export interface ByocImageResult {
  items: ByocImageItem[];
}

export interface ByocEmbeddingResult {
  /** Raw embedding vector. */
  embedding: number[];
  /** First N values as a comma-separated preview string. */
  preview: string;
  /** The full SDK response, used for the JSON download. */
  raw: unknown;
}

/* ---------- SAM-2 (plan 014) ---------- */

export type Sam2Mode = "point" | "box";

export interface SegmentAnything2Form {
  model_id: string;
  image: File | null;
  /** Already-formatted string: e.g. `[[x,y]]` for a single point. */
  point_coords: string;
  /** Already-formatted string: e.g. `[0]` for a single label. */
  point_labels: string;
  /** Already-formatted string: e.g. `[x1,y1,x2,y2]`. */
  box: string;
  /** Optional pre-existing mask JSON string. */
  mask_input: string;
  multimask_output: boolean;
  return_logits: boolean;
  normalize_coords: boolean;
  safety_check: boolean;
  seed: string;
}

/** 2D array of mask confidence values (0..1). */
export type SegmentationMask = number[][];

export interface SegmentAnything2Result {
  /** Top-N masks above the score threshold, in original score order. */
  masks: SegmentationMask[];
  /** Confidence scores aligned with `masks`. */
  scores: number[];
}
