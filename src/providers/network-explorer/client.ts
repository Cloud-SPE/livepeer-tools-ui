import createClient from "openapi-fetch";
import type { paths } from "@/generated/api-types";
import { env } from "@/utils/env";

/**
 * The one and only HTTP client for the protocol-explorer API.
 * All endpoint paths and shapes are checked against the generated `paths`
 * type. Drift between the generated file and the live spec is detected
 * by `scripts/check-api-drift.sh` in CI.
 */
export const networkExplorer = createClient<paths>({
  baseUrl: env.networkExplorer.baseUrl,
  headers: { Accept: "application/json" },
});

export class NetworkExplorerError extends Error {
  public readonly status: number;
  public readonly bodyText: string;

  constructor(status: number, bodyText: string) {
    super(`network-explorer ${status}: ${bodyText.slice(0, 200)}`);
    this.name = "NetworkExplorerError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

/**
 * Helper that unwraps an openapi-fetch result, throwing on error.
 * Domain repos use this to keep call sites short.
 */
export async function unwrap<T>(
  resultPromise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await resultPromise;
  if (data === undefined) {
    const bodyText = await response.text().catch(() => "");
    throw new NetworkExplorerError(
      response.status,
      bodyText || JSON.stringify(error ?? {}),
    );
  }
  return data;
}
