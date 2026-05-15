import { describe, expect, it } from "vitest";
import {
  buildBoxString,
  buildPointCoords,
  flattenCapabilities,
  matchesPreset,
  modelsForPipeline,
  resolveImageUrl,
  sam2StageDimensions,
  validateAudioToText,
  validateByocChat,
  validateByocEmbedding,
  validateByocImage,
  validateImageToImage,
  validateImageToText,
  validateImageToVideo,
  validateLlm,
  validateSegmentAnything2,
  validateTextToImage,
  validateTextToSpeech,
  validateUpscale,
} from "@/domains/ai-generator/service";
import {
  extractText,
  parseSseLine,
  pickTopMasks,
  type RawCapabilities,
} from "@/domains/ai-generator/repo";
import {
  AUDIO_TO_TEXT_DEFAULTS,
  BYOC_CHAT_DEFAULTS,
  BYOC_EMBEDDING_DEFAULTS,
  BYOC_IMAGE_DEFAULTS,
  IMAGE_TO_IMAGE_DEFAULTS,
  IMAGE_TO_TEXT_DEFAULTS,
  IMAGE_TO_VIDEO_DEFAULTS,
  LLM_DEFAULTS,
  SEGMENT_ANYTHING_2_DEFAULTS,
  TEXT_TO_IMAGE_DEFAULTS,
  TEXT_TO_SPEECH_DEFAULTS,
  UPSCALE_DEFAULTS,
} from "@/domains/ai-generator/config";
import type { CapabilitiesView } from "@/domains/ai-generator/types";

describe("ai-generator.service", () => {
  describe("flattenCapabilities", () => {
    it("returns empty pipelines for an empty input", () => {
      const out = flattenCapabilities({ orchestrators: [] });
      expect(out.pipelines).toEqual([]);
    });

    it("aggregates two orchestrators advertising the same model into one entry", () => {
      const raw: RawCapabilities = {
        orchestrators: [
          {
            address: "0xAAA",
            hardware: [{ pipeline: "llm", model_id: "glm-4" }],
          },
          {
            address: "0xBBB",
            hardware: [{ pipeline: "llm", model_id: "glm-4" }],
          },
        ],
      };
      const out = flattenCapabilities(raw);
      expect(out.pipelines).toHaveLength(1);
      const pipeline = out.pipelines[0];
      if (!pipeline) throw new Error("expected one pipeline");
      expect(pipeline.name).toBe("Llm");
      expect(pipeline.models).toHaveLength(1);
      const model = pipeline.models[0];
      if (!model) throw new Error("expected one model");
      expect(model.name).toBe("glm-4");
      expect(model.warmCount).toBe(2);
      expect(model.orchestrators.map((o) => o.ethAddress)).toEqual(["0xaaa", "0xbbb"]);
    });

    it("sorts pipelines and models alphabetically", () => {
      const raw: RawCapabilities = {
        orchestrators: [
          {
            address: "0x1",
            hardware: [
              { pipeline: "text-to-image", model_id: "z-model" },
              { pipeline: "text-to-image", model_id: "a-model" },
              { pipeline: "llm", model_id: "glm-4" },
            ],
          },
        ],
      };
      const out = flattenCapabilities(raw);
      expect(out.pipelines.map((p) => p.name)).toEqual(["Llm", "Text-to-image"]);
      expect(out.pipelines[1]?.models.map((m) => m.name)).toEqual(["a-model", "z-model"]);
    });

    it("picks up models from capability_options arrays", () => {
      const raw: RawCapabilities = {
        orchestrators: [
          {
            address: "0xC",
            capability_options: {
              "openai-chat-completions": [{ model: "gpt-4o-mini" }, { model: "gpt-5" }],
            },
          },
        ],
      };
      const out = flattenCapabilities(raw);
      expect(out.pipelines).toHaveLength(1);
      expect(out.pipelines[0]?.name).toBe("Openai-chat-completions");
      expect(out.pipelines[0]?.models.map((m) => m.name)).toEqual(["gpt-4o-mini", "gpt-5"]);
    });

    it("treats BYOC capabilities as pipeline-only (no model rows)", () => {
      const raw: RawCapabilities = {
        orchestrators: [
          {
            address: "0xD",
            capabilities_prices: [{ capability: "37", constraint: "openai-chat-completions" }],
          },
        ],
        capabilities_names: { "37": "byoc" },
      };
      const out = flattenCapabilities(raw);
      // The pipeline exists but has no models (BYOC enumerates models via capability_options).
      expect(out.pipelines.map((p) => p.name)).toEqual(["Openai-chat-completions"]);
      expect(out.pipelines[0]?.models).toEqual([]);
    });

    it("picks up models from capabilities_prices (non-BYOC)", () => {
      const raw: RawCapabilities = {
        orchestrators: [
          {
            address: "0xE",
            capabilities_prices: [
              { capability: "12", pipeline: "image-to-image", constraint: "SDXL" },
            ],
          },
          {
            address: "0xF",
            capabilities_prices: [
              { capability: "12", pipeline: "image-to-image", constraint: "SDXL" },
            ],
          },
        ],
      };
      const out = flattenCapabilities(raw);
      const model = out.pipelines[0]?.models[0];
      if (!model) throw new Error("expected one model");
      expect(model.name).toBe("SDXL");
      expect(model.warmCount).toBe(2);
    });
  });

  describe("matchesPreset", () => {
    const presets = [
      { value: "https://a", label: "a" },
      { value: "https://b", label: "b" },
    ];
    it("returns true for an exact value match", () => {
      expect(matchesPreset("https://a", presets)).toBe(true);
    });
    it("returns false for non-matches", () => {
      expect(matchesPreset("https://custom", presets)).toBe(false);
      expect(matchesPreset("", presets)).toBe(false);
    });
  });

  describe("modelsForPipeline", () => {
    const view: CapabilitiesView = {
      pipelines: [
        {
          name: "Text-to-image",
          models: [
            { name: "a-model", coldCount: 0, warmCount: 1, orchestrators: [] },
            { name: "b-model", coldCount: 0, warmCount: 1, orchestrators: [] },
          ],
        },
        {
          name: "Upscale",
          models: [{ name: "real-esrgan", coldCount: 0, warmCount: 1, orchestrators: [] }],
        },
      ],
    };
    it("returns the model names for a known pipeline", () => {
      expect(modelsForPipeline(view, "Text-to-image")).toEqual(["a-model", "b-model"]);
    });
    it("returns [] for unknown pipeline", () => {
      expect(modelsForPipeline(view, "Nonsense")).toEqual([]);
    });
    it("returns [] when the view is undefined", () => {
      expect(modelsForPipeline(undefined, "Text-to-image")).toEqual([]);
    });
  });

  describe("resolveImageUrl", () => {
    it("returns absolute URLs unchanged", () => {
      expect(resolveImageUrl("https://x/y.png", "https://gw")).toBe("https://x/y.png");
    });
    it("prepends the base for leading-slash relative URLs", () => {
      expect(resolveImageUrl("/img.png", "https://gw")).toBe("https://gw/img.png");
    });
    it("inserts a slash for non-leading-slash relative URLs", () => {
      expect(resolveImageUrl("img.png", "https://gw")).toBe("https://gw/img.png");
    });
    it("strips a trailing slash from the base", () => {
      expect(resolveImageUrl("/x.png", "https://gw/")).toBe("https://gw/x.png");
    });
    it("returns empty string unchanged", () => {
      expect(resolveImageUrl("", "https://gw")).toBe("");
    });
  });

  describe("validateTextToImage", () => {
    it("returns no errors on a clean form with a prompt and model", () => {
      expect(
        validateTextToImage({
          ...TEXT_TO_IMAGE_DEFAULTS,
          prompt: "a hat",
          model_id: "m",
        }),
      ).toEqual([]);
    });
    it("flags an empty prompt", () => {
      expect(validateTextToImage({ ...TEXT_TO_IMAGE_DEFAULTS, model_id: "m" })).toContain(
        "Please enter a prompt.",
      );
    });
    it("flags width above 1024", () => {
      expect(
        validateTextToImage({
          ...TEXT_TO_IMAGE_DEFAULTS,
          prompt: "x",
          model_id: "m",
          width: 2000,
        }),
      ).toContain("Width must be between 1 and 1024.");
    });
    it("flags num_inference_steps <= 1", () => {
      expect(
        validateTextToImage({
          ...TEXT_TO_IMAGE_DEFAULTS,
          prompt: "x",
          model_id: "m",
          num_inference_steps: 1,
        }),
      ).toContain("Number of inference steps must be greater than 1.");
    });
    it("flags num_images_per_prompt > 10", () => {
      expect(
        validateTextToImage({
          ...TEXT_TO_IMAGE_DEFAULTS,
          prompt: "x",
          model_id: "m",
          num_images_per_prompt: 11,
        }),
      ).toContain("Number of images per prompt cannot exceed 10.");
    });
  });

  describe("validateImageToImage", () => {
    const file = new File(["x"], "img.png", { type: "image/png" });
    it("returns no errors when image + prompt + model are set", () => {
      expect(
        validateImageToImage({
          ...IMAGE_TO_IMAGE_DEFAULTS,
          prompt: "x",
          model_id: "m",
          image: file,
        }),
      ).toEqual([]);
    });
    it("flags missing image", () => {
      expect(
        validateImageToImage({
          ...IMAGE_TO_IMAGE_DEFAULTS,
          prompt: "x",
          model_id: "m",
        }),
      ).toContain("Image must be uploaded.");
    });
    it("flags strength <= 0", () => {
      expect(
        validateImageToImage({
          ...IMAGE_TO_IMAGE_DEFAULTS,
          prompt: "x",
          model_id: "m",
          image: file,
          strength: 0,
        }),
      ).toContain("Strength must be a positive number.");
    });
  });

  describe("validateUpscale", () => {
    const file = new File(["x"], "img.png", { type: "image/png" });
    it("returns no errors when image + model are set", () => {
      expect(validateUpscale({ ...UPSCALE_DEFAULTS, model_id: "m", image: file })).toEqual([]);
    });
    it("flags missing image", () => {
      expect(validateUpscale({ ...UPSCALE_DEFAULTS, model_id: "m" })).toContain(
        "Image must be uploaded.",
      );
    });
    it("flags missing model", () => {
      expect(validateUpscale({ ...UPSCALE_DEFAULTS, image: file })).toContain(
        "Please select a model.",
      );
    });
  });

  describe("validateImageToVideo", () => {
    const file = new File(["x"], "img.png", { type: "image/png" });
    it("returns no errors on a complete form", () => {
      expect(
        validateImageToVideo({
          ...IMAGE_TO_VIDEO_DEFAULTS,
          model_id: "m",
          image: file,
        }),
      ).toEqual([]);
    });
    it("flags missing image", () => {
      expect(validateImageToVideo({ ...IMAGE_TO_VIDEO_DEFAULTS, model_id: "m" })).toContain(
        "Image must be uploaded.",
      );
    });
    it("flags width > 1024", () => {
      expect(
        validateImageToVideo({
          ...IMAGE_TO_VIDEO_DEFAULTS,
          model_id: "m",
          image: file,
          width: 2000,
        }),
      ).toContain("Width must be between 1 and 1024.");
    });
    it("flags non-numeric fps", () => {
      expect(
        validateImageToVideo({
          ...IMAGE_TO_VIDEO_DEFAULTS,
          model_id: "m",
          image: file,
          fps: Number.NaN,
        }),
      ).toContain("FPS must be a number.");
    });
  });

  describe("validateImageToText", () => {
    const file = new File(["x"], "img.png", { type: "image/png" });
    it("returns no errors with image, model, prompt", () => {
      expect(
        validateImageToText({
          ...IMAGE_TO_TEXT_DEFAULTS,
          model_id: "m",
          image: file,
          prompt: "describe",
        }),
      ).toEqual([]);
    });
    it("flags missing prompt", () => {
      expect(
        validateImageToText({
          ...IMAGE_TO_TEXT_DEFAULTS,
          model_id: "m",
          image: file,
        }),
      ).toContain("Please enter a prompt.");
    });
  });

  describe("validateAudioToText", () => {
    const audio = new File(["x"], "a.mp3", { type: "audio/mpeg" });
    it("returns no errors with audio + model", () => {
      expect(validateAudioToText({ ...AUDIO_TO_TEXT_DEFAULTS, model_id: "m", audio })).toEqual([]);
    });
    it("flags missing audio", () => {
      expect(validateAudioToText({ ...AUDIO_TO_TEXT_DEFAULTS, model_id: "m" })).toContain(
        "Audio file must be uploaded.",
      );
    });
  });

  describe("validateTextToSpeech", () => {
    it("returns no errors with text + model", () => {
      expect(
        validateTextToSpeech({
          ...TEXT_TO_SPEECH_DEFAULTS,
          model_id: "m",
          text: "hello",
        }),
      ).toEqual([]);
    });
    it("flags missing text", () => {
      expect(validateTextToSpeech({ ...TEXT_TO_SPEECH_DEFAULTS, model_id: "m" })).toContain(
        "Please enter text to speak.",
      );
    });
    it("flags missing model", () => {
      expect(validateTextToSpeech({ ...TEXT_TO_SPEECH_DEFAULTS, text: "x" })).toContain(
        "Please select a model.",
      );
    });
  });

  describe("validateLlm", () => {
    it("returns no errors with prompt + model + valid max_tokens", () => {
      expect(validateLlm({ ...LLM_DEFAULTS, model_id: "m", prompt: "hi" })).toEqual([]);
    });
    it("flags empty prompt", () => {
      expect(validateLlm({ ...LLM_DEFAULTS, model_id: "m" })).toContain("Please enter a prompt.");
    });
    it("flags missing model", () => {
      expect(validateLlm({ ...LLM_DEFAULTS, prompt: "hi" })).toContain("Please select a model.");
    });
    it("flags non-positive max_tokens", () => {
      expect(
        validateLlm({ ...LLM_DEFAULTS, model_id: "m", prompt: "hi", max_tokens: 0 }),
      ).toContain("Max tokens must be a positive number.");
    });
  });

  describe("parseSseLine", () => {
    it("returns ignore for non-data lines", () => {
      expect(parseSseLine("")).toEqual({ kind: "ignore" });
      expect(parseSseLine(": ping")).toEqual({ kind: "ignore" });
      expect(parseSseLine("event: foo")).toEqual({ kind: "ignore" });
    });
    it("returns done for the [DONE] sentinel", () => {
      expect(parseSseLine("data: [DONE]")).toEqual({ kind: "done" });
    });
    it("extracts content from a delta payload", () => {
      const line = 'data: {"choices":[{"delta":{"content":"hello "}}]}';
      expect(parseSseLine(line)).toEqual({ kind: "delta", content: "hello " });
    });
    it("returns ignore for deltas with no content (e.g. finish_reason updates)", () => {
      const line = 'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}';
      expect(parseSseLine(line)).toEqual({ kind: "ignore" });
    });
    it("returns ignore for malformed JSON without throwing", () => {
      expect(parseSseLine("data: {not-json")).toEqual({ kind: "ignore" });
    });
    it("returns ignore for an empty data payload", () => {
      expect(parseSseLine("data: ")).toEqual({ kind: "ignore" });
    });
  });

  describe("extractText", () => {
    it("returns empty string for nullish/empty input", () => {
      expect(extractText(null)).toBe("");
      expect(extractText(undefined)).toBe("");
      expect(extractText("")).toBe("");
    });
    it("returns plain strings unchanged", () => {
      expect(extractText("hello")).toBe("hello");
    });
    it("joins array-of-text parts", () => {
      const parts = [
        { type: "text", text: "Hello " },
        { type: "text", text: "world" },
      ];
      expect(extractText(parts)).toBe("Hello world");
    });
    it("accepts array entries with .content fallback", () => {
      const parts = [{ content: "abc" }, { content: "def" }];
      expect(extractText(parts)).toBe("abcdef");
    });
    it("accepts plain strings inside an array", () => {
      expect(extractText(["a", "b"])).toBe("ab");
    });
    it("falls back to .text on a plain object", () => {
      expect(extractText({ text: "boo" })).toBe("boo");
    });
    it("returns empty for unrecognized shapes", () => {
      expect(extractText({ foo: 1 })).toBe("");
      expect(extractText(42)).toBe("");
    });
  });

  describe("validateByocChat", () => {
    it("returns no errors with model + prompt + sane numbers", () => {
      expect(validateByocChat({ ...BYOC_CHAT_DEFAULTS, model: "m", prompt: "hi" })).toEqual([]);
    });
    it("flags empty prompt", () => {
      expect(validateByocChat({ ...BYOC_CHAT_DEFAULTS, model: "m" })).toContain(
        "Prompt is required.",
      );
    });
    it("flags missing model", () => {
      expect(validateByocChat({ ...BYOC_CHAT_DEFAULTS, prompt: "hi" })).toContain(
        "Please select a model.",
      );
    });
    it("flags non-positive max_tokens", () => {
      expect(
        validateByocChat({
          ...BYOC_CHAT_DEFAULTS,
          model: "m",
          prompt: "hi",
          max_tokens: 0,
        }),
      ).toContain("Max tokens must be a positive number.");
    });
  });

  describe("validateByocImage", () => {
    it("returns no errors with model + prompt + size + n", () => {
      expect(validateByocImage({ ...BYOC_IMAGE_DEFAULTS, model: "m", prompt: "hi" })).toEqual([]);
    });
    it("flags empty prompt", () => {
      expect(validateByocImage({ ...BYOC_IMAGE_DEFAULTS, model: "m" })).toContain(
        "Prompt is required.",
      );
    });
    it("flags non-positive n", () => {
      expect(
        validateByocImage({
          ...BYOC_IMAGE_DEFAULTS,
          model: "m",
          prompt: "hi",
          n: 0,
        }),
      ).toContain("Count must be a positive number.");
    });
  });

  describe("validateByocEmbedding", () => {
    it("returns no errors with model + input", () => {
      expect(validateByocEmbedding({ ...BYOC_EMBEDDING_DEFAULTS, model: "m", input: "x" })).toEqual(
        [],
      );
    });
    it("flags empty input", () => {
      expect(validateByocEmbedding({ ...BYOC_EMBEDDING_DEFAULTS, model: "m" })).toContain(
        "Input text is required.",
      );
    });
    it("flags missing model", () => {
      expect(validateByocEmbedding({ ...BYOC_EMBEDDING_DEFAULTS, input: "x" })).toContain(
        "Please select a model.",
      );
    });
  });

  describe("validateSegmentAnything2", () => {
    const file = new File(["x"], "img.png", { type: "image/png" });
    it("returns no errors with image + model", () => {
      expect(
        validateSegmentAnything2({
          ...SEGMENT_ANYTHING_2_DEFAULTS,
          model_id: "m",
          image: file,
        }),
      ).toEqual([]);
    });
    it("flags missing image", () => {
      expect(validateSegmentAnything2({ ...SEGMENT_ANYTHING_2_DEFAULTS, model_id: "m" })).toContain(
        "Image must be uploaded.",
      );
    });
    it("flags missing model", () => {
      expect(validateSegmentAnything2({ ...SEGMENT_ANYTHING_2_DEFAULTS, image: file })).toContain(
        "Please select a model.",
      );
    });
  });

  describe("buildPointCoords / buildBoxString", () => {
    it("formats a point as [[x,y]] with two decimals", () => {
      expect(buildPointCoords(123.4567, 88)).toBe("[[123.46,88.00]]");
    });
    it("formats a box as [x1, y1, x2, y2] with two decimals", () => {
      expect(buildBoxString(0, 0, 10.5, 20)).toBe("[0.00, 0.00, 10.50, 20.00]");
    });
  });

  describe("sam2StageDimensions", () => {
    it("scales widths above 500px down to fit", () => {
      const out = sam2StageDimensions(1000, 500);
      expect(out.stageWidth).toBe(500);
      expect(out.stageHeight).toBe(250);
      expect(out.scaleFactor).toBe(0.5);
    });
    it("leaves smaller images at 1:1", () => {
      const out = sam2StageDimensions(400, 300);
      expect(out).toEqual({ stageWidth: 400, stageHeight: 300, scaleFactor: 1 });
    });
    it("returns zeros for an invalid input", () => {
      expect(sam2StageDimensions(0, 0)).toEqual({
        stageWidth: 0,
        stageHeight: 0,
        scaleFactor: 1,
      });
    });
  });

  describe("pickTopMasks", () => {
    const m = (v: number) => [[v]] as number[][];
    it("drops masks below the 0.17 threshold", () => {
      const out = pickTopMasks([m(1), m(1), m(1)], [0.5, 0.1, 0.2]);
      expect(out.scores).toEqual([0.5, 0.2]);
      expect(out.masks).toHaveLength(2);
    });
    it("caps the result at the configured topN", () => {
      const masks = Array.from({ length: 20 }, () => m(1));
      const scores = Array.from({ length: 20 }, () => 1);
      const out = pickTopMasks(masks, scores);
      expect(out.masks).toHaveLength(10);
      expect(out.scores).toHaveLength(10);
    });
    it("returns empty when no mask passes the threshold", () => {
      expect(pickTopMasks([m(1)], [0.01])).toEqual({ masks: [], scores: [] });
    });
    it("preserves input order for ties", () => {
      const out = pickTopMasks([m(1), m(2), m(3)], [0.9, 0.9, 0.9]);
      expect(out.masks.map((row) => row[0]?.[0])).toEqual([1, 2, 3]);
    });
  });
});
