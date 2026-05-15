import {
  BYOC_CAPABILITY_ID,
  BYOC_CAPABILITY_NAME,
  SAM2_DISPLAY_WIDTH,
} from "./config";
import type { RawCapabilities } from "./repo";
import type {
  AudioToTextForm,
  ByocChatForm,
  ByocEmbeddingForm,
  ByocImageForm,
  CapabilitiesView,
  ImageToImageForm,
  ImageToTextForm,
  ImageToVideoForm,
  InferenceErrors,
  LlmForm,
  ModelCapability,
  PipelineCapability,
  SegmentAnything2Form,
  TextToImageForm,
  TextToSpeechForm,
  UpscaleForm,
} from "./types";

/**
 * Flatten the gateway's per-orchestrator capability advertisements into a
 * pipeline → model → orchestrator matrix. Mirrors the old UI's
 * `transformNetworkCapabilitiesToAICapabilities` logic. The output is a
 * stable, alphabetically-sorted view ready for the accordion.
 */
export function flattenCapabilities(raw: RawCapabilities): CapabilitiesView {
  // pipelineType -> modelName -> { warmCount, orchestrators }
  const pipelines = new Map<
    string,
    Map<string, { coldCount: number; warmCount: number; orchestrators: Map<string, boolean> }>
  >();

  const addModel = (pipelineNameRaw: string, modelName: string, orch: string): void => {
    if (!pipelineNameRaw || !modelName) return;
    const pipelineType =
      pipelineNameRaw.charAt(0).toUpperCase() + pipelineNameRaw.slice(1);
    if (!pipelines.has(pipelineType)) pipelines.set(pipelineType, new Map());
    const modelsMap = pipelines.get(pipelineType)!;
    if (!modelsMap.has(modelName)) {
      modelsMap.set(modelName, {
        coldCount: 0,
        warmCount: 0,
        orchestrators: new Map(),
      });
    }
    const entry = modelsMap.get(modelName)!;
    // Each advertised entry is treated as a "warm" slot, matching the old UI.
    entry.warmCount += 1;
    entry.orchestrators.set(orch, true);
  };

  const ensurePipeline = (pipelineNameRaw: string): void => {
    if (!pipelineNameRaw) return;
    const pipelineType =
      pipelineNameRaw.charAt(0).toUpperCase() + pipelineNameRaw.slice(1);
    if (!pipelines.has(pipelineType)) pipelines.set(pipelineType, new Map());
  };

  const capabilitiesNames = raw.capabilities_names ?? {};

  for (const orch of raw.orchestrators) {
    const address = orch.address.toLowerCase();

    // 1) hardware advertisements: most direct signal.
    for (const hw of orch.hardware ?? []) {
      if (hw.pipeline && hw.model_id) addModel(hw.pipeline, hw.model_id, address);
    }

    // 2) capability_options: model lists from BYOC-style pipelines.
    for (const [pipelineName, options] of Object.entries(orch.capability_options ?? {})) {
      if (!Array.isArray(options)) continue;
      for (const opt of options) {
        if (opt.model) addModel(pipelineName, opt.model, address);
      }
    }

    // 3) capabilities_prices: catch-all, with BYOC pipelines handled separately.
    for (const price of orch.capabilities_prices ?? []) {
      const capabilityId = String(price.capability);
      const capabilityName = capabilitiesNames[capabilityId]?.toLowerCase();
      const isByoc =
        capabilityId === BYOC_CAPABILITY_ID || capabilityName === BYOC_CAPABILITY_NAME;
      if (isByoc) {
        const pipelineName = price.constraint ?? null;
        if (pipelineName) ensurePipeline(pipelineName);
      } else {
        const pipelineName = (price.pipeline ?? capabilitiesNames[capabilityId] ?? "")
          .toLowerCase();
        const modelName = price.constraint ?? null;
        if (pipelineName && modelName) addModel(pipelineName, modelName, address);
      }
    }
  }

  // Materialize into sorted arrays.
  const out: PipelineCapability[] = [];
  for (const [pipelineName, modelsMap] of pipelines.entries()) {
    const models: ModelCapability[] = [];
    for (const [modelName, entry] of modelsMap.entries()) {
      const orchestrators = Array.from(entry.orchestrators.keys())
        .sort()
        .map((eth) => ({ ethAddress: eth, warm: true }));
      models.push({
        name: modelName,
        coldCount: entry.coldCount,
        warmCount: entry.warmCount,
        orchestrators,
      });
    }
    models.sort((a, b) => a.name.localeCompare(b.name));
    out.push({ name: pipelineName, models });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return { pipelines: out };
}

/** Detect whether `value` is one of the preset gateway base URLs. */
export function matchesPreset(
  value: string,
  presets: ReadonlyArray<{ value: string }>,
): boolean {
  return presets.some((p) => p.value === value);
}

/* ---------- inference helpers ---------- */

/**
 * Pull the model list for a pipeline out of a flattened CapabilitiesView.
 * Returns an empty array when the pipeline isn't loaded or doesn't exist.
 */
export function modelsForPipeline(
  view: CapabilitiesView | undefined,
  pipelineName: string,
): string[] {
  if (!view) return [];
  const pipeline = view.pipelines.find((p) => p.name === pipelineName);
  if (!pipeline) return [];
  return pipeline.models.map((m) => m.name);
}

/**
 * Resolve a gateway-returned image URL. The gateway sometimes ships URLs
 * starting with `/` (relative); we resolve those against the current
 * gateway base.
 */
export function resolveImageUrl(url: string, baseUrl: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

/* ---------- form validators ---------- */

export function validateTextToImage(form: TextToImageForm): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.prompt.trim()) errors.push("Please enter a prompt.");
  if (!form.model_id) errors.push("Please select a model.");
  if (form.width < 1 || form.width > 1024) errors.push("Width must be between 1 and 1024.");
  if (form.height < 1 || form.height > 1024)
    errors.push("Height must be between 1 and 1024.");
  if (form.guidance_scale < 0) errors.push("Guidance scale must be a positive number.");
  if (form.num_inference_steps <= 1)
    errors.push("Number of inference steps must be greater than 1.");
  if (form.num_images_per_prompt > 10)
    errors.push("Number of images per prompt cannot exceed 10.");
  return errors;
}

export function validateImageToImage(form: ImageToImageForm): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.image) errors.push("Image must be uploaded.");
  if (!form.prompt.trim()) errors.push("Please enter a prompt.");
  if (!form.model_id) errors.push("Please select a model.");
  if (form.num_inference_steps <= 1)
    errors.push("Number of inference steps must be greater than 1.");
  if (!Number.isFinite(form.guidance_scale))
    errors.push("Guidance scale must be a number.");
  if (form.strength <= 0) errors.push("Strength must be a positive number.");
  if (form.num_images_per_prompt > 10)
    errors.push("Number of images per prompt cannot exceed 10.");
  return errors;
}

export function validateUpscale(form: UpscaleForm): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.image || form.image.size === 0) errors.push("Image must be uploaded.");
  if (!form.model_id) errors.push("Please select a model.");
  return errors;
}

export function validateImageToVideo(form: ImageToVideoForm): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.image || form.image.size === 0) errors.push("Image must be uploaded.");
  if (!form.model_id) errors.push("Please select a model.");
  if (form.width < 1 || form.width > 1024)
    errors.push("Width must be between 1 and 1024.");
  if (form.height < 1 || form.height > 1024)
    errors.push("Height must be between 1 and 1024.");
  if (!Number.isFinite(form.fps)) errors.push("FPS must be a number.");
  if (!Number.isFinite(form.motion_bucket_id))
    errors.push("Motion bucket ID must be a number.");
  if (!Number.isFinite(form.noise_aug_strength))
    errors.push("Noise augmentation strength must be a number.");
  return errors;
}

export function validateImageToText(form: ImageToTextForm): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.image) errors.push("Image must be uploaded.");
  if (!form.model_id) errors.push("Please select a model.");
  if (!form.prompt.trim()) errors.push("Please enter a prompt.");
  return errors;
}

export function validateAudioToText(form: AudioToTextForm): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.audio || form.audio.size === 0) errors.push("Audio file must be uploaded.");
  if (!form.model_id) errors.push("Please select a model.");
  return errors;
}

export function validateTextToSpeech(form: TextToSpeechForm): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.text.trim()) errors.push("Please enter text to speak.");
  if (!form.model_id.trim()) errors.push("Please select a model.");
  return errors;
}

/**
 * Resolve a gateway-returned audio/video URL. Same logic as image URLs.
 */
export function resolveMediaUrl(url: string, baseUrl: string): string {
  return resolveImageUrl(url, baseUrl);
}

/* ---------- LLM (plan 012) ---------- */

export function validateLlm(form: LlmForm): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.prompt.trim()) errors.push("Please enter a prompt.");
  if (!form.model_id.trim()) errors.push("Please select a model.");
  if (!Number.isFinite(form.max_tokens) || form.max_tokens <= 0)
    errors.push("Max tokens must be a positive number.");
  return errors;
}

/* ---------- BYOC OpenAI (plan 013) ---------- */

export function validateByocChat(form: ByocChatForm): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.prompt.trim()) errors.push("Prompt is required.");
  if (!form.model) errors.push("Please select a model.");
  if (!Number.isFinite(form.temperature)) errors.push("Temperature must be a number.");
  if (!Number.isFinite(form.max_tokens) || form.max_tokens <= 0)
    errors.push("Max tokens must be a positive number.");
  return errors;
}

export function validateByocImage(form: ByocImageForm): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.prompt.trim()) errors.push("Prompt is required.");
  if (!form.model) errors.push("Please select a model.");
  if (!form.size) errors.push("Size is required.");
  if (!Number.isFinite(form.n) || form.n <= 0)
    errors.push("Count must be a positive number.");
  return errors;
}

export function validateByocEmbedding(form: ByocEmbeddingForm): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.input.trim()) errors.push("Input text is required.");
  if (!form.model) errors.push("Please select a model.");
  return errors;
}

/* ---------- SAM-2 (plan 014) ---------- */

export function validateSegmentAnything2(
  form: SegmentAnything2Form,
): InferenceErrors {
  const errors: InferenceErrors = [];
  if (!form.image) errors.push("Image must be uploaded.");
  if (!form.model_id) errors.push("Please select a model.");
  return errors;
}

/**
 * Format a single point's coordinates the way the SAM-2 gateway expects:
 * `[[x,y]]` (a list of one [x, y] pair). Numbers are emitted with two
 * decimal places.
 */
export function buildPointCoords(x: number, y: number): string {
  return `[[${x.toFixed(2)},${y.toFixed(2)}]]`;
}

/** Format a single bounding box: `[x1,y1,x2,y2]`. */
export function buildBoxString(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  return `[${x1.toFixed(2)}, ${y1.toFixed(2)}, ${x2.toFixed(2)}, ${y2.toFixed(2)}]`;
}

/**
 * Display dimensions for a Konva stage given an image's natural size.
 * Clamps width to SAM2_DISPLAY_WIDTH and returns the scale factor so the
 * UI can translate display coordinates back to original-image space.
 */
export function sam2StageDimensions(
  imageWidth: number,
  imageHeight: number,
): { stageWidth: number; stageHeight: number; scaleFactor: number } {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { stageWidth: 0, stageHeight: 0, scaleFactor: 1 };
  }
  if (imageWidth > SAM2_DISPLAY_WIDTH) {
    const scaleFactor = SAM2_DISPLAY_WIDTH / imageWidth;
    return {
      stageWidth: SAM2_DISPLAY_WIDTH,
      stageHeight: imageHeight * scaleFactor,
      scaleFactor,
    };
  }
  return { stageWidth: imageWidth, stageHeight: imageHeight, scaleFactor: 1 };
}
