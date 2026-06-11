import { describe, expect, it, vi } from "vitest";
import { listOrchestratorDelegators } from "@/domains/orchestrators/repo";
import { networkExplorer } from "@/providers/network-explorer";

vi.mock("@/providers/network-explorer", () => ({
  networkExplorer: {
    GET: vi.fn(),
  },
  unwrap: async <T>(result: Promise<{ data: T }>): Promise<T> => {
    const resolved = await result;
    return resolved.data;
  },
}));

const getMock = vi.mocked(networkExplorer.GET);

describe("orchestrators repo", () => {
  it("projects delegator current stake from pending_stake with bonded fallback", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        requested_block: "123",
        total_bonded_principal: "300",
        data: [
          {
            delegator_address: "0xPending",
            bonded_principal: "100",
            pending_stake: "125",
            pending_fees: null,
            block_number: "123",
            block_timestamp: "2026-06-11T00:00:00Z",
            staleness_blocks: "0",
          },
          {
            delegator_address: "0xFallback",
            bonded_principal: "200",
            pending_stake: null,
            pending_fees: null,
            block_number: "123",
            block_timestamp: "2026-06-11T00:00:00Z",
            staleness_blocks: "0",
          },
        ],
      },
      response: new Response(),
    });

    const result = await listOrchestratorDelegators("0xOrch", 123);

    expect(result.data.map((d) => d.currentStakeLpt)).toEqual([125, 200]);
    expect(result.data.map((d) => d.bondedPrincipalLpt)).toEqual([100, 200]);
    expect(result.totalBondedLpt).toBe(300);
  });
});
