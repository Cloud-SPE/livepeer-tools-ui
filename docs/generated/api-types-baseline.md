# Generated: API types baseline

This directory documents how `src/generated/api-types.ts` is produced and how drift is detected.

## How to regenerate

```sh
npm run gen:api
```

Runs `scripts/regen-api-types.sh`, which:

1. Downloads `https://livepeer-network-api.cloudspe.com/openapi.json`.
2. Pipes it through `openapi-typescript`.
3. Writes `src/generated/api-types.ts`.
4. Formats with `prettier`.

Commit the resulting diff to source control. **Never edit `src/generated/api-types.ts` by hand.**

## How drift is detected

CI runs `scripts/check-api-drift.sh`:

1. Regenerates `src/generated/api-types.ts` into a tempfile.
2. Diffs against the committed file.
3. Fails the build if non-empty.

When this fails, the fix is: run `npm run gen:api` locally, commit the diff. Do not bypass the check.

## What's in the file

A single TypeScript module exporting:

- `paths` — a type whose keys are URL templates and whose values describe each method's request/response shapes.
- `components` — schema definitions referenced by `paths`.
- `operations` — operation-id-keyed map. **The body of this interface is replaced post-generation with an index signature** because the upstream OpenAPI spec re-uses operationIds across path families (e.g. `at_block`, `latest`, `leaderboard`, `get_one`), which makes openapi-typescript emit duplicate keys that TypeScript rejects.

This file is consumed only by `src/providers/network-explorer/`. No other file may import from it.

## Known limitation: loose per-operation typing

Because of the `operations` rewrite above, request parameters typed via `operations["someId"]` resolve to `any`. The URL-level typing in `paths` is preserved — `openapi-fetch` will refuse calls to undefined URLs and will narrow path/query params based on the URL — but the per-operation `operations["X"]["parameters"]` lookup chain loses precision.

This is acceptable for now. To remove the loss, either:

1. File an upstream issue against `livepeer-protocol-explorer` to assign unique operationIds across the whole spec, then drop the post-process.
2. Switch to a different codegen tool that gracefully handles duplicate operationIds (e.g. `kubb`).
