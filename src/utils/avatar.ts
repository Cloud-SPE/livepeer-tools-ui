import { env } from "./env";

/**
 * Normalize an `avatar_url` from the network explorer into a fetchable
 * absolute http(s) URL, or null if it isn't renderable.
 *
 * Two shapes come back from the API:
 *  - Absolute http(s) URLs (manual overrides, or ENS records that were
 *    already plain URLs) — accepted as-is.
 *  - Root-relative paths for locally-cached avatars the explorer resolved
 *    from ENS (e.g. "/api/v1/orchestrators/0x.../avatar"). This SPA is
 *    served from a different origin than the API, so a bare relative path
 *    would resolve against the UI origin and 404. We resolve it against the
 *    API base URL's origin. (A leading-slash path resolves against the
 *    origin, so the base's "/api/v1" prefix isn't doubled.)
 *
 * ENS records may also contain CAIP-19 asset identifiers (e.g.
 * "eip155:1/erc721:0x.../1234") or ipfs:// URIs the explorer couldn't
 * resolve. Passing those to an <img src> triggers ERR_UNKNOWN_URL_SCHEME,
 * so they're rejected.
 */
export function safeAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string" || value === "") return null;
  if (value.startsWith("/")) {
    try {
      return new URL(value, env.networkExplorer.baseUrl).href;
    } catch {
      return null;
    }
  }
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}
