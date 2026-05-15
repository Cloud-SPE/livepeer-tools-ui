import OpenAI from "openai";
import { env } from "@/utils/env";
import { getGatewaySettings } from "./settings";
import {
  networkCapabilitiesResponseSchema,
  type NetworkCapabilitiesResponse,
} from "./schemas";

export class GatewayError extends Error {
  public readonly status: number;
  constructor(status: number, message: string) {
    super(`gateway ${status}: ${message}`);
    this.name = "GatewayError";
    this.status = status;
  }
}

function authHeader(token: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function gatewayFetch(path: string, init?: RequestInit): Promise<Response> {
  const { baseUrl, bearerToken } = getGatewaySettings();
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
      ...authHeader(bearerToken),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GatewayError(res.status, body.slice(0, 200) || res.statusText);
  }
  return res;
}

/**
 * GET /getNetworkCapabilities on the currently-selected gateway.
 * Used by the network-capabilities domain to render the AI capability matrix.
 */
export async function getNetworkCapabilities(): Promise<NetworkCapabilitiesResponse> {
  const res = await gatewayFetch("/getNetworkCapabilities");
  return networkCapabilitiesResponseSchema.parse(await res.json());
}

/**
 * Low-level POST helper for AI inference endpoints. Each AI domain (text-to-image,
 * image-to-image, etc.) wraps this with its own request/response schema.
 */
export async function gatewayPost<TBody>(path: string, body: TBody): Promise<unknown> {
  const res = await gatewayFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * Multipart POST helper for inference endpoints that take an image upload
 * (image-to-image, upscale, image-to-video, etc.). Browser sets the
 * Content-Type with the correct boundary; do NOT set it manually.
 */
export async function gatewayPostMultipart(
  path: string,
  formData: FormData,
): Promise<unknown> {
  const res = await gatewayFetch(path, { method: "POST", body: formData });
  return res.json();
}

/**
 * Streaming POST helper. Returns the raw Response; the caller pulls from
 * `response.body.getReader()` and decodes SSE / NDJSON / whatever the
 * endpoint emits. Used by /llm with `Accept: text/event-stream`.
 */
export async function gatewayPostStream<TBody>(
  path: string,
  body: TBody,
  accept = "text/event-stream",
): Promise<Response> {
  return gatewayFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: accept },
    body: JSON.stringify(body),
  });
}

export const byocBaseUrl = env.gateway.byocBaseUrl;

/**
 * Returns an OpenAI SDK instance pointed at the BYOC gateway. Uses the
 * bearer token from the current gateway settings (same secret as the
 * non-BYOC gateway). Caller must NOT run this in a server context — it's
 * browser-only by design.
 */
export function getByocOpenAIClient(): OpenAI {
  const { bearerToken } = getGatewaySettings();
  return new OpenAI({
    apiKey: bearerToken || "missing-bearer-token",
    baseURL: env.gateway.byocBaseUrl,
    dangerouslyAllowBrowser: true,
  });
}
