# Product spec — AI Generator

Ninth domain. Stands up the AI section of the UI: tab shell, landing page, gateway settings, network capabilities matrix, and the first three inference routes (text-to-image, image-to-image, upscale). The remaining inference routes (image-to-video, audio-to-text, text-to-speech, SAM-2, LLM, BYOC OpenAI, image-to-text) are placeholders until plan 011+.

## Routes

| URL                                                                                                                                          | Component                        | Purpose                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------- |
| `/ai` (index), `/ai/generator`                                                                                                               | `AIGenerator` (under `AILayout`) | Landing — feature card grid                                   |
| `/ai/settings`                                                                                                                               | `Settings`                       | Gateway URL + bearer token configuration                      |
| `/ai/network-capabilities`                                                                                                                   | `NetworkCapabilities`            | Pipelines / models / orchestrators matrix                     |
| `/ai/text-to-image`                                                                                                                          | `TextToImage`                    | Prompt → image grid (POST /text-to-image, JSON)               |
| `/ai/image-to-image`                                                                                                                         | `ImageToImage`                   | Image + prompt → image grid (POST /image-to-image, multipart) |
| `/ai/upscale`                                                                                                                                | `Upscale`                        | Image → upscaled image grid (POST /upscale, multipart)        |
| `/ai/image-to-video`, `/ai/image-to-text`, `/ai/audio-to-text`, `/ai/text-to-speech`, `/ai/segment-anything-2`, `/ai/llm`, `/ai/byoc/openai` | `PlaceholderInference`           | Stubs — real components land in plan 011+                     |

All `/ai/*` routes live under `AILayout`, which renders the top tab bar in its `<Outlet />`.

## Data sources

Exactly one provider: `gateway` (the live Livepeer inference gateway).

- `GET {gateway}/getNetworkCapabilities` — drives the capabilities matrix
- `localStorage` (via the gateway provider's `getGatewaySettings` / `setGatewaySettings`) — gateway URL + bearer token persistence

## Settings

- Preset dropdown: env default first, then `us-west`, `us-east`, `eu-central`. Labels show the hostname.
- "Use Custom Gateway URL" checkbox swaps the preset dropdown for a free-text URL field.
- Bearer Token (optional, password-masked).
- "Save Settings" persists via `setGatewaySettings` and invalidates the `["ai", "capabilities"]` cache so the next mount of Network Capabilities refetches.
- A `window`-level event keeps multiple open tabs / instances of Settings in sync.

## Network Capabilities

- Per-pipeline card with a colored left border.
- Each model expands into an accordion showing Cold / Warm counts and the list of orchestrators advertising it.
- Refresh button invalidates the query.
- Empty state: "No capabilities available."
- Error state: `Alert severity="error"` with the gateway error message.

## Capability flattening

`flattenCapabilities` (in `service.ts`) mirrors the old UI's transformation:

1. Walk each orchestrator's `hardware` array — `{pipeline, model_id}` pairs.
2. Walk each `capability_options` map — pipeline → array of `{model}` entries.
3. Walk each `capabilities_prices` entry; BYOC ones (`capability === "37"` or named "byoc") register the pipeline only, non-BYOC ones register `{pipeline, model_id}` like hardware.

Pipeline names are normalized to leading-uppercase (e.g. `"llm" → "Llm"`, `"text-to-image" → "Text-to-image"`). Output is sorted alphabetically by pipeline name and then by model name within each pipeline.

## States

| Condition             | Render                                        |
| --------------------- | --------------------------------------------- |
| Capabilities loading  | `CircularProgress`                            |
| Capabilities error    | `Alert severity="error"` with `error.message` |
| Capabilities empty    | Centered "No capabilities available."         |
| Settings save success | Inline `Alert severity="success"`             |
| Settings save failure | Inline `Alert severity="error"`               |

## Inference (text-to-image, image-to-image, upscale)

Each route renders a two-column layout: an input-config card on the left and a generated-images card on the right. Forms own their state locally (`useState`) — not URL-synced because they carry in-memory `File` objects for two of three.

Common form elements (via `ui/inference/InferenceFields.tsx`):

- `ModelSelect` — model dropdown sourced from `useModels(pipelineName)`, which reads from the cached capabilities view and filters to that pipeline.
- `SafetyCheckSelect` — boolean toggle rendered as a Select.
- `NumberField` — numeric input that emits NaN on empty (validators catch that).
- `SeedField` — optional string seed; repo parses to number when non-empty.
- `FilePicker` — multipart upload control (image-to-image, upscale).

Each form validates locally via `validateTextToImage` / `validateImageToImage` / `validateUpscale` before submit. Errors render in an `Alert severity="error"` with `whiteSpace: "pre-line"` so the multi-line message shows.

The repo functions:

- `postTextToImage` — JSON POST `/text-to-image`.
- `postImageToImage` — multipart POST `/image-to-image`. `safety_check` and numeric fields are stringified for FormData.
- `postUpscale` — multipart POST `/upscale`. Always sends `prompt=not needed` for parity with the old UI's gateway contract.

All three return `ImagesResponse = { images: GeneratedImage[] }`. The gateway sometimes returns relative URLs; `resolveImageUrl(url, baseUrl)` resolves them against the currently-configured gateway base.

The `GeneratedImageCard` component renders a thumbnail; clicking opens a full-size dialog. Image-to-video chaining was in the old UI's GenerateImageCard but is deferred to plan 011.

## Cross-domain rules

This domain only uses the `gateway` provider. It does not import from any other domain. The tab bar uses URL links — no domain imports.

## Out of scope (deferred to plan 011+)

- Remaining inference routes — image-to-video, image-to-text, audio-to-text, text-to-speech, SAM-2, LLM, BYOC OpenAI. Each has its own form, request shape, and result-rendering needs.
- Image-to-video chaining from `GeneratedImageCard`.
- A "test the gateway" button on Settings that pings `/getNetworkCapabilities` immediately on save.
- Multi-gateway compare views.
