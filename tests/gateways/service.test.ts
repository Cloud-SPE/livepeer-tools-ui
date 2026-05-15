import { describe, expect, it } from "vitest";
import {
  avatarInitial,
  formatEth,
  formatUsd,
  gatewayLabel,
  kindLabel,
  recipientLabel,
  shortAddress,
} from "@/domains/gateways/service";
import type { Gateway, GatewayPayoutRow } from "@/domains/gateways/types";

function makeGateway(over: Partial<Gateway> = {}): Gateway {
  return {
    address: "0x08f76e106a2dd4f6385efc8ea6c69a2816082461",
    displayName: null,
    avatarUrl: null,
    kind: "ai",
    depositEth: 0,
    reserveEth: 0,
    reserveClaimedThisRoundEth: 0,
    withdrawRound: null,
    unlockInProgress: false,
    asOfBlock: 0,
    ...over,
  };
}

function makePayoutRow(over: Partial<GatewayPayoutRow> = {}): GatewayPayoutRow {
  return {
    eventId: "1",
    eventName: "WinningTicketRedeemed",
    flowKind: "ticket_redeemed",
    blockNumber: 0,
    blockTimestamp: null,
    txHash: "0x",
    asset: "ETH",
    amountEth: 0,
    amountUsd: 0,
    fromAddress: "0xabc",
    toAddress: "0xdef",
    toIdentity: null,
    ...over,
  };
}

describe("gateways.service", () => {
  describe("shortAddress", () => {
    it("truncates a canonical eth address", () => {
      expect(shortAddress("0x08f76e106a2dd4f6385efc8ea6c69a2816082461")).toBe(
        "0x08f7...2461",
      );
    });
    it("returns short input untouched", () => {
      expect(shortAddress("0x1234")).toBe("0x1234");
    });
  });

  describe("gatewayLabel", () => {
    it("uses display name when set", () => {
      expect(gatewayLabel(makeGateway({ displayName: "bob.eth" }))).toBe("bob.eth");
    });
    it("falls back to short address when blank/null", () => {
      expect(gatewayLabel(makeGateway({ displayName: "   " }))).toBe("0x08f7...2461");
      expect(gatewayLabel(makeGateway({ displayName: null }))).toBe("0x08f7...2461");
    });
  });

  describe("avatarInitial", () => {
    it("uppercases the first character of the label", () => {
      expect(avatarInitial(makeGateway({ displayName: "bob.eth" }))).toBe("B");
    });
  });

  describe("kindLabel", () => {
    it("renders AI", () => {
      expect(kindLabel("ai")).toBe("AI");
    });
    it("renders Transcoding", () => {
      expect(kindLabel("transcoding")).toBe("Transcoding");
    });
    it("renders Unknown for anything else", () => {
      expect(kindLabel("unknown")).toBe("Unknown");
    });
  });

  describe("formatEth / formatUsd", () => {
    it("formats ETH with 4 decimals by default", () => {
      expect(formatEth(1.23456)).toMatch(/1\.2346/);
    });
    it("formats USD with $ + 2 decimals", () => {
      expect(formatUsd(1234.5)).toMatch(/\$1,234\.50/);
    });
    it("falls back on NaN", () => {
      expect(formatEth(Number.NaN)).toBe("0");
      expect(formatUsd(Number.NaN)).toBe("$0.00");
    });
  });

  describe("recipientLabel", () => {
    it("uses the hydrated identity when present", () => {
      const row = makePayoutRow({
        toAddress: "0x08f76e106a2dd4f6385efc8ea6c69a2816082461",
        toIdentity: {
          address: "0x08f76e106a2dd4f6385efc8ea6c69a2816082461",
          displayName: "alice.eth",
          avatarUrl: null,
        },
      });
      expect(recipientLabel(row)).toBe("alice.eth");
    });
    it("falls back to short address otherwise", () => {
      const row = makePayoutRow({
        toAddress: "0x08f76e106a2dd4f6385efc8ea6c69a2816082461",
        toIdentity: null,
      });
      expect(recipientLabel(row)).toBe("0x08f7...2461");
    });
  });
});
