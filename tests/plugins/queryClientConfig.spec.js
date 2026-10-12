import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'
import { queryClientConfig } from '@/plugins/queryClientConfig'

describe('query client config', () => {
  it('matches the required query defaults', () => {
    expect(queryClientConfig).toEqual({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          networkMode: 'always',
          staleTime: Infinity,
          gcTime: 60 * 60 * 1000,
        },
      },
    })
    const client = new QueryClient(queryClientConfig)
    expect(client.getDefaultOptions().queries.staleTime).toBe(Infinity)
    expect(client.getDefaultOptions().queries.gcTime).toBe(60 * 60 * 1000)
  })
})
