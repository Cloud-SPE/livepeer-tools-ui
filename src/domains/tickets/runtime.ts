import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/utils/queryClient";
import { DEFAULT_RANGE_DAYS } from "./config";
import { getDailyTimeseries } from "./repo";
import { daysAgoIso, todayIso } from "./service";
import type { DailyTimeseriesParams, JobType, TicketsTimeseries } from "./types";

const timeseriesKey = (params: DailyTimeseriesParams) =>
  ["tickets", "daily", params.start, params.end, params.jobType ?? "both"] as const;

const timeseriesConfig = (params: DailyTimeseriesParams) => ({
  queryKey: timeseriesKey(params),
  queryFn: () => getDailyTimeseries(params),
});

export function useDailyTickets(
  params: DailyTimeseriesParams,
): UseQueryResult<TicketsTimeseries, Error> {
  return useQuery({
    ...timeseriesConfig(params),
    enabled: Boolean(params.start && params.end),
  });
}

function jobTypeFromSearch(search: URLSearchParams): JobType {
  const j = search.get("job_type");
  return j === "ai" || j === "transcoding" ? j : "both";
}

export async function dailyTicketsLoader({ request }: LoaderFunctionArgs): Promise<null> {
  const search = new URL(request.url).searchParams;
  const start = search.get("start") ?? daysAgoIso(DEFAULT_RANGE_DAYS);
  const end = search.get("end") ?? todayIso();
  const jobType = jobTypeFromSearch(search);
  await queryClient.prefetchQuery(timeseriesConfig({ start, end, jobType }));
  return null;
}
