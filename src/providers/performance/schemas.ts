import { z } from "zod";

/** GET /api/regions — { regions: [...] } */
export const regionsResponseSchema = z.object({
  regions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["transcoding", "ai"]).or(z.string()),
    }),
  ),
});
export type RegionsResponse = z.infer<typeof regionsResponseSchema>;

/** GET /api/pipelines — { pipelines: [{ id, models[], regions[] }] } */
export const pipelinesResponseSchema = z.object({
  pipelines: z.array(
    z.object({
      id: z.string(),
      models: z.array(z.string()),
      regions: z.array(z.string()),
    }),
  ),
});
export type PipelinesResponse = z.infer<typeof pipelinesResponseSchema>;

/** GET /api/aggregated_stats — Record<address, Record<region, {success_rate, round_trip_score, score}>> */
export const aggregatedStatsResponseSchema = z.record(
  z.string(),
  z.record(
    z.string(),
    z.object({
      success_rate: z.number(),
      round_trip_score: z.number(),
      score: z.number(),
    }),
  ),
);
export type AggregatedStatsResponse = z.infer<typeof aggregatedStatsResponseSchema>;

/**
 * GET /api/raw_stats — Record<region, Array<{...}>>.
 *
 * The transcoding base ships the core fields; the AI base ships the core
 * fields PLUS several extras (model_is_warm, input/response JSON blobs,
 * pipeline/model metadata). We mark every extra as optional so the same
 * schema parses both shapes.
 */
export const rawStatsRowSchema = z.object({
  region: z.string(),
  orchestrator: z.string(),
  success_rate: z.number(),
  round_trip_time: z.number(),
  errors: z
    .array(
      z.object({
        error_code: z.string(),
        count: z.number(),
      }),
    )
    .default([]),
  timestamp: z.number(),
  seg_duration: z.number(),
  segments_sent: z.number(),
  upload_time: z.number(),
  // Transcoding-only timing fields (optional).
  segments_received: z.number().optional(),
  download_time: z.number().optional(),
  transcode_time: z.number().optional(),
  // AI-only fields (optional).
  pipeline: z.string().optional(),
  model: z.string().optional(),
  model_is_warm: z.boolean().optional(),
  input_parameters: z.string().nullish(),
  response_payload: z.string().nullish(),
});
export const rawStatsResponseSchema = z.record(z.string(), z.array(rawStatsRowSchema));
export type RawStatsResponse = z.infer<typeof rawStatsResponseSchema>;
export type RawStatsRow = z.infer<typeof rawStatsRowSchema>;
