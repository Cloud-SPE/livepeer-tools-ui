import { describe, expect, it } from "vitest";
import {
  formatEth,
  formatInt,
  formatLpt,
  formatTimestampUtc,
  formatUsd,
} from "@/domains/network/service";

describe("network.service", () => {
  describe("formatLpt", () => {
    it("rounds to 0 decimals by default", () => {
      expect(formatLpt(27966956.964)).toBe("27,966,957");
    });
    it("respects fractionDigits", () => {
      expect(formatLpt(1.5, 2)).toBe("1.50");
    });
    it("falls back on NaN", () => {
      expect(formatLpt(Number.NaN)).toBe("0");
    });
  });

  describe("formatUsd", () => {
    it("renders $ + 2 decimals", () => {
      expect(formatUsd(1234.5)).toMatch(/\$1,234\.50/);
    });
    it("falls back on NaN", () => {
      expect(formatUsd(Number.NaN)).toBe("$0.00");
    });
  });

  describe("formatEth", () => {
    it("uses 4 decimals by default", () => {
      expect(formatEth(0.003883)).toMatch(/0\.0039/);
    });
    it("respects fractionDigits", () => {
      expect(formatEth(0.003883786625152, 6)).toMatch(/0\.003884/);
    });
  });

  describe("formatInt", () => {
    it("truncates and groups thousands", () => {
      expect(formatInt(8951.9)).toBe("8,951");
      expect(formatInt(100)).toBe("100");
    });
    it("falls back on NaN", () => {
      expect(formatInt(Number.NaN)).toBe("0");
    });
  });

  describe("formatTimestampUtc", () => {
    it("renders ISO timestamps in YYYY-MM-DD HH:mm:ss UTC", () => {
      expect(formatTimestampUtc("2026-05-14T20:14:43Z")).toBe("2026-05-14 20:14:43 UTC");
    });
    it("renders em-dash for null/undefined", () => {
      expect(formatTimestampUtc(null)).toBe("—");
    });
    it("passes through unparseable input", () => {
      expect(formatTimestampUtc("bad")).toBe("bad");
    });
  });
});
