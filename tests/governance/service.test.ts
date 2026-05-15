import { describe, expect, it } from "vitest";
import {
  deriveStatus,
  formatLpt,
  formatPercent,
  getTitle,
  hydrateTitles,
  identityLabel,
  rankByCreatedDesc,
  shortAddress,
  tallyBreakdown,
  voteSharePct,
} from "@/domains/governance/service";
import type {
  BlockFloor,
  Proposal,
  TallyAmounts,
  Vote,
} from "@/domains/governance/types";

function makeProposal(over: Partial<Proposal> = {}): Proposal {
  return {
    id: "1",
    title: "",
    description: "",
    proposer: null,
    proposerIdentity: null,
    createdAt: "2026-01-01T00:00:00Z",
    createdBlock: 100,
    executed: false,
    executedAt: null,
    voteStartBlock: 110,
    voteEndBlock: 200,
    tally: { forLpt: 0, againstLpt: 0, abstainLpt: 0 },
    ...over,
  };
}

const floor = (n: number | null): BlockFloor => ({ floor: n });

describe("governance.service", () => {
  describe("getTitle", () => {
    it("returns the first non-empty line", () => {
      expect(getTitle("Hello\nworld")).toBe("Hello");
    });
    it("strips leading hash prefixes (markdown headings)", () => {
      expect(getTitle("# My Title\nbody")).toBe("My Title");
      expect(getTitle("### Subhead\nbody")).toBe("Subhead");
    });
    it("falls through blank leading lines", () => {
      expect(getTitle("\n  \n# Real Title\n")).toBe("Real Title");
    });
    it("falls back to 'Untitled Proposal' on empty input", () => {
      expect(getTitle("")).toBe("Untitled Proposal");
      expect(getTitle("   \n")).toBe("Untitled Proposal");
    });
  });

  describe("shortAddress", () => {
    it("renders 0x1234...abcd", () => {
      expect(shortAddress("0x08f76e106a2dd4f6385efc8ea6c69a2816082461")).toBe(
        "0x08f7...2461",
      );
    });
  });

  describe("identityLabel", () => {
    it("prefers display name when set", () => {
      expect(identityLabel("0xabc", "alice.eth")).toBe("alice.eth");
    });
    it("falls back to short address", () => {
      expect(
        identityLabel("0x08f76e106a2dd4f6385efc8ea6c69a2816082461", null),
      ).toBe("0x08f7...2461");
    });
    it("returns 'Unknown' when both are absent", () => {
      expect(identityLabel(null, null)).toBe("Unknown");
    });
  });

  describe("deriveStatus", () => {
    it("returns 'Executed' when executed is true", () => {
      const p = makeProposal({ executed: true });
      expect(deriveStatus(p, floor(1000))).toBe("Executed");
    });
    it("returns 'Unknown' when vote_end is null", () => {
      const p = makeProposal({ voteEndBlock: null });
      expect(deriveStatus(p, floor(1000))).toBe("Unknown");
    });
    it("returns 'Unknown' when no block floor is available", () => {
      const p = makeProposal();
      expect(deriveStatus(p, floor(null))).toBe("Unknown");
    });
    it("returns 'Succeeded' when past and for > against", () => {
      const p = makeProposal({
        voteEndBlock: 200,
        tally: { forLpt: 100, againstLpt: 50, abstainLpt: 0 },
      });
      expect(deriveStatus(p, floor(300))).toBe("Succeeded");
    });
    it("returns 'Defeated' when past and for <= against", () => {
      const p = makeProposal({
        voteEndBlock: 200,
        tally: { forLpt: 30, againstLpt: 70, abstainLpt: 0 },
      });
      expect(deriveStatus(p, floor(300))).toBe("Defeated");
    });
    it("returns 'Defeated' when past with no votes (zero quorum)", () => {
      const p = makeProposal({
        voteEndBlock: 200,
        tally: { forLpt: 0, againstLpt: 0, abstainLpt: 0 },
      });
      expect(deriveStatus(p, floor(300))).toBe("Defeated");
    });
    it("returns 'Pending' when vote_start is after the floor", () => {
      const p = makeProposal({ voteStartBlock: 500, voteEndBlock: 600 });
      expect(deriveStatus(p, floor(400))).toBe("Pending");
    });
    it("returns 'Active' when floor falls between vote_start and vote_end", () => {
      const p = makeProposal({ voteStartBlock: 100, voteEndBlock: 500 });
      expect(deriveStatus(p, floor(250))).toBe("Active");
    });
  });

  describe("tallyBreakdown", () => {
    const t = (forL: number, against: number, abs: number): TallyAmounts => ({
      forLpt: forL,
      againstLpt: against,
      abstainLpt: abs,
    });

    it("computes percentages relative to the total", () => {
      const out = tallyBreakdown(t(60, 30, 10));
      expect(out.totalLpt).toBe(100);
      expect(out.forPct).toBe(60);
      expect(out.againstPct).toBe(30);
      expect(out.abstainPct).toBe(10);
    });
    it("excludes abstain from totalSupportPct", () => {
      const out = tallyBreakdown(t(70, 30, 100));
      expect(out.totalSupportPct).toBe(70);
    });
    it("returns 0 when totals are zero", () => {
      const out = tallyBreakdown(t(0, 0, 0));
      expect(out.totalLpt).toBe(0);
      expect(out.totalSupportPct).toBe(0);
      expect(out.forPct).toBe(0);
    });
  });

  describe("formatLpt + formatPercent", () => {
    it("formats LPT with two decimals", () => {
      expect(formatLpt(1234.5)).toMatch(/1,234\.50/);
    });
    it("formats percentages with fixed digits", () => {
      expect(formatPercent(33.3333, 2)).toBe("33.33%");
      expect(formatPercent(33.3333, 4)).toBe("33.3333%");
    });
  });

  describe("hydrateTitles + rankByCreatedDesc", () => {
    it("populates titles from description and sorts newest first", () => {
      const list = [
        makeProposal({ id: "a", description: "# Old", createdBlock: 100 }),
        makeProposal({ id: "b", description: "# New", createdBlock: 500 }),
        makeProposal({ id: "c", description: "# Mid", createdBlock: 300 }),
      ];
      const out = rankByCreatedDesc(hydrateTitles(list));
      expect(out.map((p) => p.id)).toEqual(["b", "c", "a"]);
      expect(out.map((p) => p.title)).toEqual(["New", "Mid", "Old"]);
    });
  });

  describe("voteSharePct", () => {
    function makeVote(stake: number): Vote {
      return {
        proposalId: "1",
        voterAddress: "0xabc",
        voterIdentity: null,
        support: "For",
        stakeLpt: stake,
        reason: null,
        blockTimestamp: null,
      };
    }
    it("computes percent of the total vote", () => {
      expect(voteSharePct(makeVote(25), 100)).toBe(25);
    });
    it("returns 0 when total is 0", () => {
      expect(voteSharePct(makeVote(25), 0)).toBe(0);
    });
  });
});
