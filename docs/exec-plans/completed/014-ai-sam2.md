# 014 — AI SAM-2 (Segment Anything 2)

**Status:** Completed
**Created:** 2026-05-15
**Completed:** 2026-05-15

## Intent

Port the final inference route: `/ai/segment-anything-2`. Interactive image annotation (point OR box prompt), multipart POST, mask overlay rendering. Adds `konva` + `react-konva` + `use-image` for the canvas. After this plan, every route in the old UI has a real component — zero placeholders.

## Acceptance criteria

- [ ] `/ai/segment-anything-2` lets the user upload an image, toggle between Point and Box modes, draw the prompt, configure SAM-2 params, and submit.
- [ ] Submission posts multipart `image, model_id, point_coords?, point_labels?, box?, mask_input?, multimask_output, return_logits, normalize_coords, safety_check, seed?` to `POST /segment-anything-2`.
- [ ] Response (`{masks, scores}` as JSON strings) parses into mask arrays; the top 10 masks with score ≥ 0.17 are rendered as red-tinted overlays on the uploaded image.
- [ ] Coordinates sent to the API are in original-image space (not the display-scaled coordinates).
- [ ] Service tests cover `pickTopMasks`, the validator, and the point/box coordinate string helpers.

## Steps

1. Add `konva` + `react-konva` + `use-image` (done).
2. types / config / repo / service / runtime additions.
3. UI: SegmentAnything2 page with Konva stage + MaskOverlay component.
4. Wire route (replace last placeholder).
5. Tests + spec.
6. Verify + dev probe.

## Decisions log

- Konva canvas displays the image clamped to 500 px wide; `scaleFactor` translates display coords to original-image coords.
- Mode toggle (`Point` vs `Box`) lives in component state. Switching modes clears the active prompt.
- The repo function expects already-stringified coordinate forms (`[[x,y]]` for points, `[x1,y1,x2,y2]` for box). Service exports the formatters so they're testable.
- Mask threshold (0.17) and topN (10) are constants in `config.ts`. Easy to tune.
- The masked-output canvas does pixel-level compositing (red tint at alpha 0.4 where mask > 0.5). The original image is the FileReader DataURL — no re-fetch from the gateway needed.
- The placeholder routes file no longer has any `<PlaceholderInference>` references after this plan. We keep the component for future plans but no route uses it.

## Test plan

- Unit-test `pickTopMasks` with synthetic mask/score arrays.
- Unit-test the validator (image required, etc.).
- Unit-test `buildPointCoords` / `buildBox` formatters.
- Probe `/ai/segment-anything-2` and confirm it renders.
- Final probe of every route to confirm zero placeholders.
