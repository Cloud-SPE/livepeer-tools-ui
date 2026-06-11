/**
 * ENS avatar records may contain CAIP-19 asset identifiers (e.g.
 * "eip155:1/erc721:0x.../1234") instead of a fetchable URL. Passing those to
 * an <img src> triggers ERR_UNKNOWN_URL_SCHEME, so only accept http(s) URLs.
 */
export function safeAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string" || value === "") return null;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}
