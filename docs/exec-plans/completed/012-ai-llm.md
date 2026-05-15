# 012 — AI LLM (streaming chat)

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Port `/ai/llm` from the old UI. OpenAI-style chat completions body, optional SSE streaming, markdown-rendered output. Introduces `react-markdown` and the gateway provider's streaming helper.

## Acceptance criteria

- [ ] `gatewayPostStream(path, body, accept?)` exists on the gateway provider.
- [ ] `/ai/llm` renders a two-column layout: system/prompt/model/max_tokens/stream form on the left, markdown output on the right.
- [ ] Streaming mode incrementally updates the output as SSE deltas arrive. Non-streaming mode renders the full response on completion.
- [ ] Markdown rendering uses `react-markdown` (no `dangerouslySetInnerHTML`).
- [ ] The body sent to `/llm` matches the OpenAI shape: `{model, messages: [{role:"system"|"user", content}], max_tokens, stream}`.
- [ ] Service tests cover the SSE delta parser.

## Steps

1. Add `react-markdown` + `gatewayPostStream` (done before code).
2. types/config/repo/service/runtime additions.
3. Llm.tsx UI.
4. Wire route (replace placeholder).
5. Tests + spec.
6. Verify + dev probe.

## Decisions log

- Streaming is implemented in the repo. The mutation hook accepts an `onDelta` callback. UI accumulates chunks via `useState`.
- The SSE delta format the old UI parses is OpenAI-compatible: `data: {"choices":[{"delta":{"content": "..."}}]}\n\n` with a terminal `data: [DONE]`. The parser is extracted into `service.ts` as `parseSseLine` for testability.
- Output is rendered via `react-markdown` instead of `marked` + `dangerouslySetInnerHTML`. Same visual result, safer.
- The Llama-style assistant header tokens (`<|start_header_id|>assistant<|end_header_id|>`) are stripped server-side by some models and leaked by others; we strip in service to match old behavior.
- A small `LlmForm.stream` boolean keeps form state; no URL-sync (chat sessions aren't link-shareable).
- We do not persist chat history — the page is a single-turn tester. Matches the old UI.

## Test plan

- Unit-test `parseSseLine` for: `[DONE]` terminator, valid JSON deltas, malformed lines, non-data lines.
- Unit-test `validateLlm` for empty prompt / model.
- After wiring, probe `/ai/llm` and confirm the form renders.
