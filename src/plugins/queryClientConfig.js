/**
 * Query defaults from the assignment. gcTime keeps the payload cached for an
 * hour, staleTime stops background refetching, and networkMode lets the
 * local payload load even when the browser reports itself offline.
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      networkMode: 'always',
      staleTime: Infinity,
      gcTime: 60 * 60 * 1000,
    },
  },
}
