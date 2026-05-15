# 013 — AI BYOC OpenAI

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Port the BYOC OpenAI route from the old UI. OpenAI-compatible gateway at a separate base URL (`VITE_BYOC_GATEWAY_BASE_URL`). Three tabs in one page: chat (streaming), image generation, embeddings. Uses the `openai` SDK directly.

## Acceptance criteria

- [ ] `openai` is a dependency.
- [ ] Gateway provider exposes `getByocOpenAIClient()` returning a configured `OpenAI` instance.
- [ ] `/ai/byoc/openai` renders three tabs (Chat / Image / Embeddings). Each tab is disabled when the corresponding pipeline has no models.
- [ ] Chat streaming mode incrementally updates the markdown output as deltas arrive; non-streaming renders the full response on completion. Both modes surface `reasoning` content if the model emits it.
- [ ] Image generation supports `b64_json` and `url` response shapes.
- [ ] Embeddings render a dimension count + first-12-value preview + JSON download.
- [ ] Service tests cover the `extractText` helper and the three validators.

## Steps

1. Add `openai` dep + `getByocOpenAIClient` provider helper (done).
2. types / config / repo / service / runtime additions.
3. UI component with three tabs.
4. Wire route (replace placeholder).
5. Tests + spec update.
6. Verify + dev probe.

## Decisions log

- The OpenAI SDK is consumed via a provider helper rather than directly from the domain repo. Keeps "how to authenticate / where to point" in the provider layer.
- The OpenAI SDK's request types are loose; we treat repo wrappers as the typed boundary and accept `any` from the SDK at that edge.
- Streaming chat uses `for await (const chunk of stream)` (SDK auto-handles the SSE wire format). Same `onDelta` pattern as plan 012 LLM.
- `reasoning` and `reasoning_content` fields surfacing in deltas are model-specific (e.g. DeepSeek-style). UI renders them in a sidebar block above the main output, matching the old UI.
- `extractText` handles all the shapes the SDK can return for `content` / `reasoning` (string, array of parts, object with `text` field). Tested in service.
- Embeddings download builds the Blob client-side and uses `URL.createObjectURL`. No new provider surface.

## Test plan

- Unit-test `extractText` for each input shape.
- Unit-test the three validators (chat / image / embedding) for empty prompt/input.
- Probe `/ai/byoc/openai` and confirm the three tabs render.
