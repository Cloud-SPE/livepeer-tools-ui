import { describe, expect, it } from "vitest";
import { GLOBAL_REGION_ID } from "@/domains/performance/config";
import {
  detectMode,
  formatDecimal,
  formatPercent,
  formatScore,
  formatTimestamp,
  isGlobalRegion,
  prettyJson,
  rankByScore,
  regionOptions,
  rowLabel,
  shortAddress,
} from "@/domains/performance/service";
import type { LeaderboardRow, Region } from "@/domains/performance/types";

const mkRegion = (id: string, name: string, type: string): Region => ({
  id,
  name,
  type,
});

const mkRow = (over: Partial<LeaderboardRow> = {}): LeaderboardRow => ({
  id: "0xabc",
  address: "0xabc",
  identity: null,
  totalScore: 0,
  successRate: 0,
  latencyScore: 0,
  regionCount: 0,
  ...over,
});

describe("performance.service", () => {
  describe("detectMode", () => {
    it("returns transcoding when pipeline is absent", () => {
      expect(detectMode({})).toBe("transcoding");
      expect(detectMode({ pipeline: "", model: "" })).toBe("transcoding");
      expect(detectMode({ model: "something" })).toBe("transcoding");
    });
    it("returns transcoding when pipeline set but model missing", () => {
      expect(detectMode({ pipeline: "llm" })).toBe("transcoding");
    });
    it("returns ai when both pipeline and model are set", () => {
      expect(detectMode({ pipeline: "llm", model: "glm-4" })).toBe("ai");
    });
  });

  describe("regionOptions", () => {
    const regions: Region[] = [
      mkRegion("NYC", "New York", "transcoding"),
      mkRegion("MAD", "Madrid", "transcoding"),
      mkRegion("FRA", "Frankfurt", "ai"),
      mkRegion("MDW", "Chicago", "ai"),
    ];
    it("filters AI regions in AI mode and prepends Global", () => {
      const out = regionOptions(regions, "ai");
      expect(out[0]?.id).toBe(GLOBAL_REGION_ID);
      expect(out.slice(1).map((r) => r.id)).toEqual(["MDW", "FRA"]);
    });
    it("filters non-AI regions in transcoding mode", () => {
      const out = regionOptions(regions, "transcoding");
      expect(out[0]?.id).toBe(GLOBAL_REGION_ID);
      expect(out.slice(1).map((r) => r.id)).toEqual(["MAD", "NYC"]);
    });
    it("sorts alphabetically by name (after Global)", () => {
      const out = regionOptions(regions, "transcoding")
        .slice(1)
        .map((r) => r.name);
      expect(out).toEqual(["Madrid", "New York"]);
    });
  });

  describe("isGlobalRegion", () => {
    it("treats null/empty/GLOBAL as global", () => {
      expect(isGlobalRegion(null)).toBe(true);
      expect(isGlobalRegion("")).toBe(true);
      expect(isGlobalRegion(GLOBAL_REGION_ID)).toBe(true);
    });
    it("treats other ids as non-global", () => {
      expect(isGlobalRegion("FRA")).toBe(false);
    });
  });

  describe("formatters", () => {
    it("formatScore returns 2-decimal string", () => {
      expect(formatScore(7.123)).toBe("7.12");
      expect(formatScore(Number.NaN)).toBe("—");
    });
    it("formatPercent appends %", () => {
      expect(formatPercent(66.5)).toBe("66.50%");
      expect(formatPercent(Number.NaN)).toBe("—");
    });
    it("formatTimestamp renders ISO UTC slice", () => {
      expect(formatTimestamp(1778816046)).toMatch(/^2026-.* UTC$/);
      expect(formatTimestamp(0)).toBe("—");
    });
    it("formatDecimal handles null", () => {
      expect(formatDecimal(null)).toBe("—");
      expect(formatDecimal(0.123456, 3)).toBe("0.123");
    });
  });

  describe("shortAddress / rowLabel", () => {
    it("shortens an address", () => {
      expect(shortAddress("0x08f76e106a2dd4f6385efc8ea6c69a2816082461")).toBe("0x08f7...2461");
    });
    it("rowLabel prefers identity display name", () => {
      const row = mkRow({
        address: "0x08f76e106a2dd4f6385efc8ea6c69a2816082461",
        identity: {
          address: "0x08f76e106a2dd4f6385efc8ea6c69a2816082461",
          displayName: "alice.eth",
          avatarUrl: null,
        },
      });
      expect(rowLabel(row)).toBe("alice.eth");
    });
    it("rowLabel falls back to short address when display name blank", () => {
      const row = mkRow({
        address: "0x08f76e106a2dd4f6385efc8ea6c69a2816082461",
        identity: {
          address: "0x08f76e106a2dd4f6385efc8ea6c69a2816082461",
          displayName: "   ",
          avatarUrl: null,
        },
      });
      expect(rowLabel(row)).toBe("0x08f7...2461");
    });
  });

  describe("rankByScore", () => {
    it("sorts descending by totalScore, stable for ties", () => {
      const input = [
        mkRow({ address: "0xa", totalScore: 1 }),
        mkRow({ address: "0xb", totalScore: 5 }),
        mkRow({ address: "0xc", totalScore: 5 }),
        mkRow({ address: "0xd", totalScore: 3 }),
      ];
      expect(rankByScore(input).map((r) => r.address)).toEqual(["0xb", "0xc", "0xd", "0xa"]);
    });
  });

  describe("prettyJson", () => {
    it("pretty-prints valid JSON", () => {
      expect(prettyJson('{"a":1,"b":[2,3]}')).toContain('"a": 1');
    });
    it("returns the raw string when input is not JSON", () => {
      expect(prettyJson("not json")).toBe("not json");
    });
    it("returns empty string for null/empty", () => {
      expect(prettyJson(null)).toBe("");
      expect(prettyJson("")).toBe("");
    });
  });
});
