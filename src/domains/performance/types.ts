/** UI-facing mode. Drives which provider base + filter shapes we use.
 *  Intentionally NOT imported from the provider — the domain owns its own
 *  vocabulary. Same string union; if the provider's type diverges the repo's
 *  projection will catch it. */
export type Mode = "ai" | "transcoding";

export interface Region {
  id: string;
  name: string;
  type: "ai" | "transcoding" | string;
}

export interface Pipeline {
  id: string;
  models: string[];
  regions: string[];
}

export interface OrchestratorIdentity {
  address: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export type IdentityIndex = ReadonlyMap<string, OrchestratorIdentity>;

/** One aggregated leaderboard row, ready for the DataGrid. */
export interface LeaderboardRow {
  /** Stable key for the DataGrid. */
  id: string;
  address: string;
  identity: OrchestratorIdentity | null;
  /** Average score across regions × 10. */
  totalScore: number;
  /** Average success_rate × 100. */
  successRate: number;
  /** Average round_trip_score × 10. */
  latencyScore: number;
  regionCount: number;
}

/** One raw-stats row flattened from the API's region-keyed map. */
export interface StatsRow {
  id: string;
  region: string;
  orchestrator: string;
  timestamp: number;
  successRate: number;
  roundTripTime: number;
  segDuration: number;
  segmentsSent: number;
  segmentsReceived: number | null;
  uploadTime: number;
  downloadTime: number | null;
  transcodeTime: number | null;
  pipeline: string | null;
  model: string | null;
  modelIsWarm: boolean | null;
  inputParameters: string | null;
  responsePayload: string | null;
  errors: Array<{ errorCode: string; count: number }>;
  /** Realtime indicator for transcoding: seg_duration > round_trip_time AND success_rate > 0. */
  realtime: boolean;
}

export interface LeaderboardParams {
  mode: Mode;
  region?: string;
  pipeline?: string;
  model?: string;
}

export interface StatsParams {
  mode: Mode;
  orchestrator: string;
  pipeline?: string;
  model?: string;
}
