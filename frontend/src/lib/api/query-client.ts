import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "./problem";

/**
 * TanStack Query defaults.
 * - Queries (reads) retry twice on network/5xx/429, never on 4xx (the request itself was wrong).
 * - Mutations (anything that moves money) NEVER retry automatically. A retry must be a user action
 *   with the same Idempotency-Key.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (isApiError(error) && error.isClientError) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}
