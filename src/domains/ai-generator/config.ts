import { env } from "@/utils/env";
import type {
  AudioToTextForm,
  ByocChatForm,
  ByocEmbeddingForm,
  ByocImageForm,
  ImageToImageForm,
  ImageToTextForm,
  ImageToVideoForm,
  LlmForm,
  SegmentAnything2Form,
  TextToImageForm,
  TextToSpeechForm,
  UpscaleForm,
} from "./types";

/**
 * Preset gateways the Settings page offers in its dropdown. The first
 * entry is the env-configured default. Order matters — it's the order
 * users will see.
 */
export function gatewayPresets(): ReadonlyArray<{ value: string; label: string }> {
  const def = env.gateway.baseUrl;
  const presets = [
    "https://dream-gateway.livepeer.cloud",
    "https://dream-gateway-us-west.livepeer.cloud",
    "https://dream-gateway-us-east.livepeer.cloud",
    "https://dream-gateway-eu-central.livepeer.cloud",
  ];
  // Bubble the env default to the top if present; otherwise prepend it.
  const ordered = presets.includes(def)
    ? [def, ...presets.filter((p) => p !== def)]
    : [def, ...presets];
  return ordered.map((value) => {
    let label: string;
    try {
      label = new URL(value).host;
    } catch {
      label = value;
    }
    return { value, label };
  });
}

/** Capability id sentinels — used to detect BYOC entries in capabilities_prices. */
export const BYOC_CAPABILITY_ID = "37";
export const BYOC_CAPABILITY_NAME = "byoc";

/* ---------- inference ---------- */

/**
 * Pipeline names as they appear in the flattened capabilities view
 * (leading uppercase, hyphenated — matches `flattenCapabilities` output).
 */
export const PIPELINE_NAMES = {
  textToImage: "Text-to-image",
  imageToImage: "Image-to-image",
  imageToVideo: "Image-to-video",
  imageToText: "Image-to-text",
  audioToText: "Audio-to-text",
  textToSpeech: "Text-to-speech",
  upscale: "Upscale",
  llm: "Llm",
  byocChat: "Openai-chat-completions",
  byocImage: "Openai-image-generation",
  byocEmbedding: "Openai-text-embeddings",
  segmentAnything2: "Segment-anything-2",
} as const;

export const BYOC_IMAGE_SIZES = [
  "1024x1024",
  "1024x1792",
  "1792x1024",
] as const;

export const TEXT_TO_IMAGE_DEFAULTS: TextToImageForm = {
  prompt: "",
  model_id: "",
  negative_prompt: "",
  width: 1024,
  height: 576,
  num_images_per_prompt: 2,
  num_inference_steps: 6,
  guidance_scale: 2,
  safety_check: false,
  seed: "",
};

export const IMAGE_TO_IMAGE_DEFAULTS: ImageToImageForm = {
  prompt: "",
  model_id: "",
  negative_prompt: "",
  strength: 1,
  num_inference_steps: 10,
  num_images_per_prompt: 2,
  guidance_scale: 1,
  safety_check: false,
  seed: "",
  image: null,
};

export const UPSCALE_DEFAULTS: UpscaleForm = {
  model_id: "",
  safety_check: false,
  seed: "",
  image: null,
};

export const IMAGE_TO_VIDEO_DEFAULTS: ImageToVideoForm = {
  model_id: "",
  width: 1024,
  height: 576,
  fps: 4,
  motion_bucket_id: 127,
  noise_aug_strength: 0.002,
  seed: "",
  image: null,
};

export const IMAGE_TO_TEXT_DEFAULTS: ImageToTextForm = {
  model_id: "",
  prompt: "",
  image: null,
};

export const AUDIO_TO_TEXT_DEFAULTS: AudioToTextForm = {
  model_id: "",
  audio: null,
};

export const TEXT_TO_SPEECH_DEFAULTS: TextToSpeechForm = {
  model_id: "",
  text: "",
  description: "",
};

export const LLM_DEFAULTS: LlmForm = {
  model_id: "",
  system: "",
  prompt: "",
  max_tokens: 256,
  stream: true,
};

/** Llama-style header token leakage that older models emit. We strip it from output. */
export const LLM_HEADER_TOKEN_PATTERN =
  /<\|start_header_id\|>assistant<\|end_header_id\|>/g;

/* ---------- BYOC OpenAI defaults ---------- */

export const BYOC_CHAT_DEFAULTS: ByocChatForm = {
  model: "",
  system: "You are a helpful assistant.",
  prompt: "",
  temperature: 0.7,
  max_tokens: 512,
  stream: true,
};

export const BYOC_IMAGE_DEFAULTS: ByocImageForm = {
  model: "",
  prompt: "",
  size: "1024x1024",
  n: 1,
};

export const BYOC_EMBEDDING_DEFAULTS: ByocEmbeddingForm = {
  model: "",
  input: "",
};

/** Number of leading embedding values shown in the preview string. */
export const BYOC_EMBEDDING_PREVIEW_COUNT = 12;

/* ---------- SAM-2 ---------- */

/** Max display width for the Konva canvas. Drives coordinate scaling. */
export const SAM2_DISPLAY_WIDTH = 500;

/** Mask threshold + topN — masks below the threshold are dropped. */
export const SAM2_MASK_THRESHOLD = 0.17;
export const SAM2_TOP_N = 10;

export const SEGMENT_ANYTHING_2_DEFAULTS: SegmentAnything2Form = {
  model_id: "",
  image: null,
  point_coords: "",
  point_labels: "",
  box: "",
  mask_input: "",
  multimask_output: true,
  return_logits: false,
  normalize_coords: true,
  safety_check: false,
  seed: "",
};
