#!/usr/bin/env bash
# Regenerate src/generated/api-types.ts from the live OpenAPI spec.
# See docs/generated/api-types-baseline.md.

set -euo pipefail

OPENAPI_URL="${OPENAPI_URL:-https://livepeer-network-api.cloudspe.com/openapi.json}"
OUT="${OUT:-src/generated/api-types.ts}"

mkdir -p "$(dirname "$OUT")"

echo "[gen:api] Fetching $OPENAPI_URL"
npx --yes openapi-typescript "$OPENAPI_URL" -o "$OUT"

# The protocol-explorer spec re-uses operationIds across path families
# (e.g. "at_block", "latest", "leaderboard"), which makes the generated
# `operations` interface collide on duplicate keys. The `paths` type
# references operations via `operations["X"]` lookups, so we can't just
# drop the interface. Instead we replace its body with an index signature.
# URL-level typing in `paths` is preserved; per-operation parameter typing
# is loosened. See docs/generated/api-types-baseline.md and
# docs/design-docs/providers-and-boundaries.md.
echo "[gen:api] Replacing colliding operations interface body"
node -e '
const fs = require("fs");
const path = process.argv[1];
let src = fs.readFileSync(path, "utf8");
const start = src.search(/^export interface operations\s*\{/m);
if (start === -1) {
  console.log("[gen:api] (no operations block found)");
  process.exit(0);
}
const openIdx = src.indexOf("{", start);
let depth = 0;
let i = openIdx;
for (; i < src.length; i++) {
  const c = src[i];
  if (c === "{") depth++;
  else if (c === "}") { depth--; if (depth === 0) { i++; break; } }
}
const replacement =
  "export interface operations {\n" +
  "  // operationIds in the upstream spec are not unique across path families,\n" +
  "  // so the generator would emit duplicate keys. The body is replaced with\n" +
  "  // an index signature; per-operation typing is intentionally loose.\n" +
  "  // See docs/generated/api-types-baseline.md.\n" +
  "  // eslint-disable-next-line @typescript-eslint/no-explicit-any\n" +
  "  [key: string]: any;\n" +
  "}";
const out = src.slice(0, start) + replacement + src.slice(i);
fs.writeFileSync(path, out);
console.log("[gen:api] operations interface body replaced with index signature");
' "$OUT"

echo "[gen:api] Formatting $OUT"
npx --yes prettier --write "$OUT"

echo "[gen:api] Done — wrote $OUT"
