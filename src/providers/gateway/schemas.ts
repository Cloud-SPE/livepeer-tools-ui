import { z } from "zod";

/**
 * Gateway response shapes. We only schematize the routes the UI actually
 * uses; everything else stays untyped until a domain wires it up.
 */

/** GET /getNetworkCapabilities */
export const networkCapabilitiesResponseSchema = z.object({
  orchestrators: z.array(
    z.object({
      address: z.string(),
      hardware: z
        .array(
          z.object({
            pipeline: z.string().optional(),
            model_id: z.string().optional(),
          }),
        )
        .nullish(),
      capabilities_prices: z
        .array(
          z.object({
            capability: z.union([z.string(), z.number()]),
            pipeline: z.string().optional().nullable(),
            constraint: z.string().optional().nullable(),
          }),
        )
        .nullish(),
      capability_options: z
        .record(z.string(), z.array(z.object({ model: z.string().optional() }).passthrough()))
        .nullish(),
    }),
  ),
  capabilities_names: z.record(z.string(), z.string()).optional(),
});
export type NetworkCapabilitiesResponse = z.infer<typeof networkCapabilitiesResponseSchema>;
