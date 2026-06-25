import { describe, expect, it } from "vitest";

import { safeAvatarUrl } from "@/utils/avatar";

describe("safeAvatarUrl", () => {
  it("resolves a root-relative cached-avatar path against the API origin", () => {
    // Base URL is https://livepeer-network-api.cloudspe.com/api/v1 — the
    // leading slash resolves against the origin, so /api/v1 isn't doubled.
    expect(safeAvatarUrl("/api/v1/orchestrators/0xabc/avatar")).toBe(
      "https://livepeer-network-api.cloudspe.com/api/v1/orchestrators/0xabc/avatar",
    );
  });

  it("passes through absolute http(s) URLs unchanged", () => {
    expect(safeAvatarUrl("https://override.example/a.png")).toBe("https://override.example/a.png");
    expect(safeAvatarUrl("http://example.com/b.gif")).toBe("http://example.com/b.gif");
  });

  it("rejects non-http(s) records the explorer couldn't resolve", () => {
    expect(safeAvatarUrl("eip155:1/erc721:0xabc/123")).toBeNull();
    expect(safeAvatarUrl("ipfs://QmHash")).toBeNull();
  });

  it("rejects empty / non-string values", () => {
    expect(safeAvatarUrl("")).toBeNull();
    expect(safeAvatarUrl(null)).toBeNull();
    expect(safeAvatarUrl(undefined)).toBeNull();
    expect(safeAvatarUrl(42)).toBeNull();
  });
});
