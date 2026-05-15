import { describe, expect, it } from "vitest";
import {
  aggregateByGranularity,
  daysAgoIso,
  granularityChartTitle,
  granularityYAxisLabel,
  parseIsoDate,
  resolveGranularity,
  spanInDays,
  todayIso,
} from "@/domains/tickets/service";
import type { TicketSeriesPoint } from "@/domains/tickets/types";

describe("tickets.service", () => {
  describe("spanInDays", () => {
    it("returns inclusive day count", () => {
      expect(spanInDays("2026-05-01", "2026-05-01")).toBe(1);
      expect(spanInDays("2026-05-01", "2026-05-14")).toBe(14);
    });
    it("returns null for invalid input", () => {
      expect(spanInDays("bad", "2026-05-14")).toBeNull();
      expect(spanInDays("2026-05-01", "bad")).toBeNull();
    });
    it("returns null when end < start", () => {
      expect(spanInDays("2026-05-14", "2026-05-01")).toBeNull();
    });
  });

  describe("resolveGranularity", () => {
    it("respects an explicit setting", () => {
      expect(resolveGranularity("daily", 9999)).toBe("daily");
      expect(resolveGranularity("weekly", 1)).toBe("weekly");
      expect(resolveGranularity("monthly", 1)).toBe("monthly");
    });
    it("auto picks daily for spans ≤ 90", () => {
      expect(resolveGranularity("auto", 90)).toBe("daily");
      expect(resolveGranularity("auto", 1)).toBe("daily");
    });
    it("auto picks weekly for spans in 91..540", () => {
      expect(resolveGranularity("auto", 91)).toBe("weekly");
      expect(resolveGranularity("auto", 540)).toBe("weekly");
    });
    it("auto picks monthly for spans > 540", () => {
      expect(resolveGranularity("auto", 541)).toBe("monthly");
    });
    it("auto picks daily when span is unknown", () => {
      expect(resolveGranularity("auto", null)).toBe("daily");
    });
  });

  describe("aggregateByGranularity", () => {
    const series: TicketSeriesPoint[] = [
      { date: "2026-05-11", count: 10 }, // Monday
      { date: "2026-05-12", count: 5 },
      { date: "2026-05-13", count: 7 },
      { date: "2026-05-18", count: 8 }, // next Monday
    ];

    it("daily: passes through unchanged", () => {
      expect(aggregateByGranularity(series, "daily")).toEqual(series);
    });
    it("weekly: groups by ISO Monday", () => {
      const out = aggregateByGranularity(series, "weekly");
      expect(out).toEqual([
        { date: "2026-05-11", count: 22 },
        { date: "2026-05-18", count: 8 },
      ]);
    });
    it("monthly: groups by YYYY-MM", () => {
      const longer: TicketSeriesPoint[] = [
        ...series,
        { date: "2026-06-01", count: 3 },
        { date: "2026-06-15", count: 4 },
      ];
      const out = aggregateByGranularity(longer, "monthly");
      expect(out).toEqual([
        { date: "2026-05", count: 30 },
        { date: "2026-06", count: 7 },
      ]);
    });
    it("returns empty for empty input", () => {
      expect(aggregateByGranularity([], "weekly")).toEqual([]);
    });
  });

  describe("date helpers", () => {
    it("todayIso returns ISO from injected now", () => {
      expect(todayIso(new Date(Date.UTC(2026, 4, 14, 12, 0, 0)))).toBe("2026-05-14");
    });
    it("daysAgoIso shifts by exactly n days", () => {
      const now = new Date(Date.UTC(2026, 4, 14, 0, 0, 0));
      expect(daysAgoIso(7, now)).toBe("2026-05-07");
      expect(daysAgoIso(30, now)).toBe("2026-04-14");
    });
    it("parseIsoDate rejects 02-30", () => {
      expect(parseIsoDate("2026-02-30")).toBeNull();
    });
  });

  describe("labels", () => {
    it("y-axis labels match granularity", () => {
      expect(granularityYAxisLabel("daily")).toBe("Tickets / day");
      expect(granularityYAxisLabel("weekly")).toBe("Tickets / week");
      expect(granularityYAxisLabel("monthly")).toBe("Tickets / month");
    });
    it("titles mention the bucket size", () => {
      expect(granularityChartTitle("weekly")).toMatch(/Weekly/);
      expect(granularityChartTitle("monthly")).toMatch(/Monthly/);
      expect(granularityChartTitle("daily")).toMatch(/Daily/);
    });
  });
});
