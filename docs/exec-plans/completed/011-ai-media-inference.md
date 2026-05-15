# 011 — AI media inference (image-to-video, image-to-text, audio-to-text, text-to-speech)

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Replace four of the seven remaining placeholder inference routes with real components. Four "media-in, media-out" routes that fit the existing inference pattern. SAM-2 (interactive canvas, ~550 lines) and LLM (streaming) get their own plans.

## Acceptance criteria

- [ ] `/ai/image-to-video` uploads an image (multipart) → renders a `<video>` element.
- [ ] `/ai/image-to-text` uploads an image + prompt (multipart) → renders the returned text.
- [ ] `/ai/audio-to-text` uploads an audio file + model (multipart) → renders the returned text.
- [ ] `/ai/text-to-speech` posts text + voice description (JSON) → renders an `<audio>` element.
- [ ] Each form validates locally before sending.
- [ ] Service tests cover the four new validators.

## Steps

1. types/config/repo/service/runtime additions.
2. Four UI components.
3. Wire (replace 4 placeholders in `ui/index.tsx`).
4. Tests + spec update.
5. Verify + dev probe.

## Decisions log

- Image-to-video reuses the existing `ImagesResponse` projection — the gateway returns `{ images: [{url}] }` where the URL points to an MP4. UI grabs `images[0]?.url` and resolves against the gateway base.
- Text-to-speech response shape: `{ audio: { url } }`. New `AudioResponse` type.
- Audio-to-text response has a `chunks` array of segments alongside `text`. Phase 11 renders the text only; chunks are deferred.
- Pipeline names from the capabilities view: `Image-to-video`, `Image-to-text`, `Audio-to-text`, `Text-to-speech`.
- No new provider surface needed — `gatewayPost` (JSON) handles TTS, `gatewayPostMultipart` handles the other three.

## Test plan

- Unit-test the four validators.
- Probe each new route via dev server.
