import { describe, expect, it } from "vitest";
import {
  formatHumanDate,
  formatInt,
  formatIsoDate,
  formatLpt,
  formatPercent,
  formatUsd,
  parseIsoDate,
  rangeFor,
  rowLabel,
  shiftPeriod,
  shortAddress,
  todayIso,
} from "@/domains/rewards/service";
import type { RewardLeaderboardRow } from "@/domains/rewards/types";

describe("rewards.service", () => {
  describe("parseIsoDate / formatIsoDate", () => {
    it("round-trips a valid ISO date", () => {
      const d = parseIsoDate("2026-05-14");
      expect(d).not.toBeNull();
      expect(formatIsoDate(d!)).toBe("2026-05-14");
    });
    it("rejects malformed input", () => {
      expect(parseIsoDate("bad")).toBeNull();
      expect(parseIsoDate("2026-13-01")).toBeNull();
    });
  });

  describe("todayIso", () => {
    it("returns YYYY-MM-DD for the injected now", () => {
      const now = new Date(Date.UTC(2026, 4, 14, 12, 0, 0));
      expect(todayIso(now)).toBe("2026-05-14");
    });
  });

  describe("rangeFor", () => {
    it("daily: from inclusive, to exclusive next day", () => {
      expect(rangeFor("daily", "2026-05-14")).toEqual({
        from: "2026-05-14",
        to: "2026-05-15",
      });
    });
    it("weekly: snaps to ISO Monday", () => {
      expect(rangeFor("weekly", "2026-05-14")).toEqual({
        from: "2026-05-11",
        to: "2026-05-18",
      });
    });
    it("monthly: full calendar month half-open", () => {
      expect(rangeFor("monthly", "2026-05-14")).toEqual({
        from: "2026-05-01",
        to: "2026-06-01",
      });
    });
    it("returns null for invalid input", () => {
      expect(rangeFor("daily", "bad")).toBeNull();
    });
  });

  describe("shiftPeriod", () => {
    it("daily: ±1 day", () => {
      expect(shiftPeriod("daily", "2026-05-14", -1)).toBe("2026-05-13");
      expect(shiftPeriod("daily", "2026-05-14", 1)).toBe("2026-05-15");
    });
    it("weekly: ±7 days", () => {
      expect(shiftPeriod("weekly", "2026-05-14", -1)).toBe("2026-05-07");
    });
    it("monthly: ±1 month at same day", () => {
      expect(shiftPeriod("monthly", "2026-05-14", 1)).toBe("2026-06-14");
    });
  });

  describe("formatters", () => {
    it("formatLpt uses 2 decimals by default", () => {
      expect(formatLpt(1234.5)).toMatch(/1,234\.50/);
      expect(formatLpt(Number.NaN)).toBe("0");
    });
    it("formatUsd renders $ + 2 decimals", () => {
      expect(formatUsd(1234.5)).toMatch(/\$1,234\.50/);
      expect(formatUsd(Number.NaN)).toBe("$0.00");
    });
    it("formatInt truncates and groups", () => {
      expect(formatInt(1234.9)).toBe("1,234");
    });
    it("formatPercent honors fractionDigits", () => {
      expect(formatPercent(33.3333)).toBe("33.33%");
    });
    it("formatHumanDate emits readable form", () => {
      expect(formatHumanDate("2026-05-14")).toMatch(/May 14, 2026/);
    });
    it("formatHumanDate passes through invalid input", () => {
      expect(formatHumanDate("bad")).toBe("bad");
    });
  });

  describe("shortAddress / rowLabel", () => {
    it("shortens an address", () => {
      expect(shortAddress("0x08f76e106a2dd4f6385efc8ea6c69a2816082461")).toBe(
        "0x08f7...2461",
      );
    });
    it("rowLabel prefers display name", () => {
      const r: RewardLeaderboardRow = {
        orchestratorAddress: "0xabc",
        displayName: "alice.eth",
        avatarUrl: null,
        rewardEventCount: 0,
        totalLpt: 0,
        totalUsd: 0,
        orchLpt: 0,
        orchUsd: 0,
        delegatorsLpt: 0,
        delegatorsUsd: 0,
      };
      expect(rowLabel(r)).toBe("alice.eth");
    });
    it("rowLabel falls back to short address when display name blank", () => {
      const r: RewardLeaderboardRow = {
        orchestratorAddress: "0x08f76e106a2dd4f6385efc8ea6c69a2816082461",
        displayName: "   ",
        avatarUrl: null,
        rewardEventCount: 0,
        totalLpt: 0,
        totalUsd: 0,
        orchLpt: 0,
        orchUsd: 0,
        delegatorsLpt: 0,
        delegatorsUsd: 0,
      };
      expect(rowLabel(r)).toBe("0x08f7...2461");
    });
  });
});
