import { describe, expect, it } from "vitest";
import {
  formatEth,
  formatHumanDate,
  formatInt,
  formatIsoDate,
  formatPercent,
  formatUsd,
  parseIsoDate,
  rangeFor,
  rowLabel,
  shiftPeriod,
  shortAddress,
  todayIso,
} from "@/domains/payouts/service";
import type { PayoutLeaderboardRow } from "@/domains/payouts/types";

describe("payouts.service", () => {
  describe("parseIsoDate / formatIsoDate", () => {
    it("round-trips a valid ISO date", () => {
      const d = parseIsoDate("2026-05-14");
      expect(d).not.toBeNull();
      expect(formatIsoDate(d!)).toBe("2026-05-14");
    });
    it("rejects malformed input", () => {
      expect(parseIsoDate("2026-5-14")).toBeNull();
      expect(parseIsoDate("bad")).toBeNull();
      expect(parseIsoDate("")).toBeNull();
    });
    it("rejects out-of-range months/days", () => {
      expect(parseIsoDate("2026-13-01")).toBeNull();
      expect(parseIsoDate("2026-02-30")).toBeNull();
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
    it("daily: rolls over month boundaries correctly", () => {
      expect(rangeFor("daily", "2026-05-31")).toEqual({
        from: "2026-05-31",
        to: "2026-06-01",
      });
    });
    it("weekly: snaps to the ISO Monday and ends on the next Monday", () => {
      // 2026-05-14 is a Thursday — ISO week starts Mon 2026-05-11
      expect(rangeFor("weekly", "2026-05-14")).toEqual({
        from: "2026-05-11",
        to: "2026-05-18",
      });
    });
    it("weekly: Sunday belongs to the prior Monday-based week", () => {
      // 2026-05-17 is a Sunday
      expect(rangeFor("weekly", "2026-05-17")).toEqual({
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
      expect(shiftPeriod("weekly", "2026-05-14", 1)).toBe("2026-05-21");
    });
    it("monthly: ±1 month at the same day-of-month", () => {
      expect(shiftPeriod("monthly", "2026-05-14", -1)).toBe("2026-04-14");
      expect(shiftPeriod("monthly", "2026-05-14", 1)).toBe("2026-06-14");
    });
  });

  describe("formatters", () => {
    it("formatEth uses fixed decimals", () => {
      expect(formatEth(1.23456, 4)).toMatch(/1\.2346/);
      expect(formatEth(Number.NaN)).toBe("0");
    });
    it("formatUsd renders $ + 2 decimals", () => {
      expect(formatUsd(1234.5)).toMatch(/\$1,234\.50/);
      expect(formatUsd(Number.NaN)).toBe("$0.00");
    });
    it("formatInt truncates and groups thousands", () => {
      expect(formatInt(1234)).toBe("1,234");
      expect(formatInt(1234.9)).toBe("1,234");
    });
    it("formatPercent honors fractionDigits", () => {
      expect(formatPercent(33.3333)).toBe("33.33%");
      expect(formatPercent(33.3333, 0)).toBe("33%");
    });
    it("formatHumanDate emits a readable form", () => {
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
    it("rowLabel prefers display name when set", () => {
      const r: PayoutLeaderboardRow = {
        orchestratorAddress: "0xabc",
        displayName: "alice.eth",
        avatarUrl: null,
        ticketCount: 0,
        faceValueEth: 0,
        faceValueUsd: 0,
        commissionEth: 0,
        commissionUsd: 0,
        delegatorsShareEth: 0,
        delegatorsShareUsd: 0,
        distinctGateways: 0,
      };
      expect(rowLabel(r)).toBe("alice.eth");
    });
    it("rowLabel falls back to short address when display name is blank", () => {
      const r: PayoutLeaderboardRow = {
        orchestratorAddress: "0x08f76e106a2dd4f6385efc8ea6c69a2816082461",
        displayName: "  ",
        avatarUrl: null,
        ticketCount: 0,
        faceValueEth: 0,
        faceValueUsd: 0,
        commissionEth: 0,
        commissionUsd: 0,
        delegatorsShareEth: 0,
        delegatorsShareUsd: 0,
        distinctGateways: 0,
      };
      expect(rowLabel(r)).toBe("0x08f7...2461");
    });
  });
});
