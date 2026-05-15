# 010 — AI image inference (text-to-image, image-to-image, upscale)

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Replace three placeholder routes under `/ai/` with real inference forms. Wires the gateway provider's inference endpoints, introduces multipart uploads, and ships a shared `GeneratedImageCard` for displaying results. **Adds to the existing `ai-generator` domain — no new domain.**

Image-to-video is deferred to plan 011 along with the remaining inference routes.

## Acceptance criteria

- [ ] `gatewayPostMultipart` exists in `src/providers/gateway/` and is re-exported from `index.ts`.
- [ ] `/ai/text-to-image` posts JSON to `POST {gateway}/text-to-image` and renders the result image grid.
- [ ] `/ai/image-to-image` uploads a file via multipart to `POST {gateway}/image-to-image` and renders the result grid.
- [ ] `/ai/upscale` uploads a file via multipart to `POST {gateway}/upscale` and renders the result grid.
- [ ] Each form lists models filtered to its pipeline name in the capabilities view (text-to-image, image-to-image, upscale).
- [ ] `GeneratedImageCard` shows a thumbnail; clicking opens a full-size dialog.
- [ ] Form validation rejects bad inputs locally before sending (per old UI rules: width/height ranges, num_inference_steps > 1, etc.).
- [ ] Structural tests still pass — no cross-domain or non-repo provider imports.
- [ ] Service unit tests for: form validators, modelsForPipeline.

## Steps

1. Extend gateway provider with multipart POST.
2. types: inference request/response shapes.
3. config: default form states + pipeline name constants.
4. repo: three POST functions.
5. service: validators (validateTextToImage, validateImageToImage, validateUpscale), modelsForPipeline helper.
6. runtime: useTextToImageMutation / useImageToImageMutation / useUpscaleMutation, useModels(pipeline).
7. UI: three page components + GeneratedImageCard. Replace the three placeholders in `ui/index.tsx`.
8. Tests + spec update.
9. Verify + dev probe.

## Decisions log

- All three forms own their state locally (`useState`) rather than via URL params. Reason: form state is large, contains an in-memory `File` for two of the three, and shouldn't be link-shareable.
- We do NOT pull models from a hardcoded list — they're read from `useCapabilities` via a `modelsForPipeline` helper. Pipeline names use the same camel-cased form the capabilities transformer produces (e.g. "Text-to-image").
- Image URLs returned by the gateway sometimes start with `/` (relative) and sometimes with `http` (absolute). We resolve the relative ones against the current gateway base URL in the UI.
- The video-generation chain on `GeneratedImageCard` is removed in this plan — only the full-size dialog remains. Reintroduced in plan 011 when `/ai/image-to-video` lands.
- The bearer token is sent via the gateway provider's existing auth flow (`getGatewaySettings` → `Authorization: Bearer ...`). The domain doesn't touch tokens.
- `safety_check` and `seed` are sent as strings in multipart bodies (form-data only supports strings/Blobs). Repo handles that.

## Test plan

- Unit-test validators against the boundary cases the old UI enforced (empty prompt, width >1024, steps ≤1, etc.).
- Unit-test `modelsForPipeline` with various capability views.
- After wiring, probe `/ai/text-to-image`, `/ai/image-to-image`, `/ai/upscale` and verify the forms render (don't expect a real inference — gateway may require real models/auth).
