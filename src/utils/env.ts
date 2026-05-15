import { z } from "zod";

/**
 * Typed access to import.meta.env. Parsed once at module load. Anywhere else
 * in the codebase that needs an env value imports from here.
 */
const schema = z.object({
  VITE_NETWORK_EXPLORER_BASE_URL: z.string().url(),
  VITE_PERFORMANCE_TRANSCODING_BASE_URL: z.string().url(),
  VITE_PERFORMANCE_AI_BASE_URL: z.string().url(),
  VITE_GATEWAY_BASE_URL: z.string().url(),
  VITE_BYOC_GATEWAY_BASE_URL: z.string().url(),
  VITE_GATEWAY_BEARER_TOKEN: z.string().default(""),
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  // Boundary failure — fail loudly, do not paper over.
  console.error("[env] Missing or invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment configuration. See .env.example.");
}

export const env = {
  networkExplorer: { baseUrl: parsed.data.VITE_NETWORK_EXPLORER_BASE_URL },
  performance: {
    transcodingBaseUrl: parsed.data.VITE_PERFORMANCE_TRANSCODING_BASE_URL,
    aiBaseUrl: parsed.data.VITE_PERFORMANCE_AI_BASE_URL,
  },
  gateway: {
    baseUrl: parsed.data.VITE_GATEWAY_BASE_URL,
    byocBaseUrl: parsed.data.VITE_BYOC_GATEWAY_BASE_URL,
    bearerToken: parsed.data.VITE_GATEWAY_BEARER_TOKEN,
  },
} as const;
