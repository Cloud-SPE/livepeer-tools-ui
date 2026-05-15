import { QueryClient } from "@tanstack/react-query";

/**
 * Shared TanStack Query client. Consumed by the app shell (for the provider)
 * and by every domain's `runtime.ts` (for loader prefetches that warm the
 * cache before the matching `useQuery` hook reads it).
 *
 * Singleton lifetime: created once at module load. Tests that need isolation
 * should call `queryClient.clear()` between cases.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
