#!/usr/bin/env bash
# Verify that src/generated/api-types.ts matches the live OpenAPI spec.
# Used by CI. Fails non-zero if there's a diff.

set -euo pipefail

OPENAPI_URL="${OPENAPI_URL:-https://livepeer-network-api.cloudspe.com/openapi.json}"
COMMITTED="src/generated/api-types.ts"
TMP="$(mktemp --suffix=.ts)"
trap 'rm -f "$TMP"' EXIT

if [[ ! -f "$COMMITTED" ]]; then
  echo "[check:api-drift] $COMMITTED is missing — run 'npm run gen:api' and commit." >&2
  exit 1
fi

echo "[check:api-drift] Regenerating into $TMP"
npx --yes openapi-typescript "$OPENAPI_URL" -o "$TMP" >/dev/null

# Apply the same `operations` strip as scripts/regen-api-types.sh so the
# comparison is apples-to-apples. See that file for the rationale.
node -e '
const fs = require("fs");
const path = process.argv[1];
let src = fs.readFileSync(path, "utf8");
const start = src.search(/^export interface operations\s*\{/m);
if (start === -1) process.exit(0);
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
fs.writeFileSync(path, src.slice(0, start) + replacement + src.slice(i));
' "$TMP"

npx --yes prettier --write "$TMP" >/dev/null

if ! diff -q "$COMMITTED" "$TMP" >/dev/null; then
  echo "[check:api-drift] DRIFT DETECTED — committed file is out of sync with $OPENAPI_URL." >&2
  echo "Run 'npm run gen:api' and commit the diff." >&2
  diff -u "$COMMITTED" "$TMP" >&2 || true
  exit 1
fi

echo "[check:api-drift] OK — committed file matches upstream."
