import { describe, expect, it } from "vitest";
import {
  aggregateTicketCountsByDate,
  avatarInitial,
  displayLabel,
  filterTicketsByDateRange,
  formatDateTime,
  formatLpt,
  formatPercent,
  isValidDateRange,
  lastCalendarYearRange,
  rankByStake,
  shortAddress,
  trailingThirtyDaysRange,
} from "@/domains/orchestrators/service";
import type { Orchestrator } from "@/domains/orchestrators/types";

function makeOrch(over: Partial<Orchestrator> = {}): Orchestrator {
  return {
    address: "0xabcdef0123456789abcdef0123456789abcdef01",
    displayName: null,
    avatarUrl: null,
    serviceUri: null,
    isActive: true,
    totalStakeLpt: 0,
    rewardCutPct: 0,
    feeCutPct: 0,
    feeSharePct: 0,
    asOfBlock: 0,
    asOfRound: null,
    lastLifecycleEventAt: null,
    ...over,
  };
}

describe("orchestrators service", () => {
  describe("shortAddress", () => {
    it("renders 0x1234...abcd for canonical eth addresses", () => {
      expect(shortAddress("0x08f76e106a2dd4f6385efc8ea6c69a2816082461")).toBe("0x08f7...2461");
    });
    it("returns input untouched when too short to truncate", () => {
      expect(shortAddress("0x1234")).toBe("0x1234");
    });
  });

  describe("displayLabel", () => {
    it("prefers display_name when present", () => {
      const o = makeOrch({ displayName: "titannode.eth" });
      expect(displayLabel(o)).toBe("titannode.eth");
    });
    it("falls back to short address when display_name is empty/null", () => {
      const o = makeOrch({
        address: "0x08f76e106a2dd4f6385efc8ea6c69a2816082461",
        displayName: "  ",
      });
      expect(displayLabel(o)).toBe("0x08f7...2461");
    });
  });

  describe("avatarInitial", () => {
    it("uppercases the first character of the display label", () => {
      const o = makeOrch({ displayName: "alice.eth" });
      expect(avatarInitial(o)).toBe("A");
    });
  });

  describe("formatLpt", () => {
    it("renders thousands separators with up to 2 decimals", () => {
      expect(formatLpt(1234567.891)).toMatch(/1,234,567\.89 LPT/);
    });
    it("renders 0 LPT for NaN", () => {
      expect(formatLpt(Number.NaN)).toBe("0 LPT");
    });
  });

  describe("formatPercent", () => {
    it("renders 0..100 values with up to 2 decimals + '%'", () => {
      expect(formatPercent(12.5)).toBe("12.5%");
      expect(formatPercent(0)).toBe("0%");
    });
  });

  describe("date ranges", () => {
    it("defaults downloads to the previous calendar year", () => {
      expect(lastCalendarYearRange(new Date(Date.UTC(2026, 5, 4)))).toEqual({
        start: "2025-01-01",
        end: "2025-12-31",
      });
    });

    it("validates ISO date ranges", () => {
      expect(isValidDateRange("2025-01-01", "2025-12-31")).toBe(true);
      expect(isValidDateRange("2025-12-31", "2025-01-01")).toBe(false);
      expect(isValidDateRange("2025-02-30", "2025-12-31")).toBe(false);
    });

    it("builds a trailing 30 day range for payouts", () => {
      expect(trailingThirtyDaysRange(new Date(Date.UTC(2026, 5, 4)))).toEqual({
        start: "2026-05-06",
        end: "2026-06-04",
      });
    });
  });

  describe("ticket chart helpers", () => {
    it("aggregates winning tickets by UTC date", () => {
      expect(
        aggregateTicketCountsByDate([
          { blockTimestamp: "2025-01-02T01:00:00Z" },
          { blockTimestamp: "2025-01-02T22:00:00Z" },
          { blockTimestamp: "2025-01-03T01:00:00Z" },
        ]),
      ).toEqual([
        { date: "2025-01-02", count: 2 },
        { date: "2025-01-03", count: 1 },
      ]);
    });

    it("formats API timestamps compactly", () => {
      expect(formatDateTime("2025-01-02T03:04:05.000Z")).toBe("2025-01-02 03:04:05");
    });

    it("filters ticket rows to an inclusive date picker range", () => {
      const tickets = [
        { blockTimestamp: "2026-05-05T23:59:59Z", id: "before" },
        { blockTimestamp: "2026-05-06T00:00:00Z", id: "start" },
        { blockTimestamp: "2026-06-04T16:12:03Z", id: "end" },
        { blockTimestamp: "2026-06-05T00:00:00Z", id: "after" },
      ];
      expect(
        filterTicketsByDateRange(tickets, "2026-05-06", "2026-06-04").map((t) => t.id),
      ).toEqual(["start", "end"]);
    });
  });

  describe("rankByStake", () => {
    it("returns a new array sorted by totalStakeLpt descending", () => {
      const input = [
        makeOrch({ address: "0xa", totalStakeLpt: 100 }),
        makeOrch({ address: "0xb", totalStakeLpt: 500 }),
        makeOrch({ address: "0xc", totalStakeLpt: 250 }),
      ];
      const out = rankByStake(input);
      expect(out.map((o) => o.address)).toEqual(["0xb", "0xc", "0xa"]);
      // Input is not mutated
      expect(input.map((o) => o.address)).toEqual(["0xa", "0xb", "0xc"]);
    });
    it("is stable for ties", () => {
      const input = [
        makeOrch({ address: "0xa", totalStakeLpt: 100 }),
        makeOrch({ address: "0xb", totalStakeLpt: 100 }),
        makeOrch({ address: "0xc", totalStakeLpt: 100 }),
      ];
      const out = rankByStake(input);
      expect(out.map((o) => o.address)).toEqual(["0xa", "0xb", "0xc"]);
    });
  });
});
