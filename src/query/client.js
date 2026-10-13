import { QueryClient } from '@tanstack/vue-query'

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

export const queryClient = new QueryClient(queryClientConfig)
