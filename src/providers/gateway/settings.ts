import { env } from "@/utils/env";

const STORAGE_KEY = "gateway-settings";

export interface GatewaySettings {
  baseUrl: string;
  bearerToken: string;
}

function defaults(): GatewaySettings {
  return {
    baseUrl: env.gateway.baseUrl,
    bearerToken: env.gateway.bearerToken,
  };
}

/**
 * Read user gateway settings from localStorage, falling back to env defaults.
 * Safe to call during SSR-style contexts (returns defaults if `window` is missing).
 */
export function getGatewaySettings(): GatewaySettings {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    return {
      baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl : defaults().baseUrl,
      bearerToken:
        typeof parsed.bearerToken === "string" ? parsed.bearerToken : defaults().bearerToken,
    };
  } catch {
    return defaults();
  }
}

export function setGatewaySettings(next: GatewaySettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function resetGatewaySettings(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
