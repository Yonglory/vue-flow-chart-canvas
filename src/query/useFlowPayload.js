import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { watch } from 'vue'
import { useFlowStore } from '../stores/flowStore'
import { FLOW_QUERY_KEY, PAYLOAD_STORAGE_KEY } from '../utils/constants'

export async function fetchPayload() {
  const cached = localStorage.getItem(PAYLOAD_STORAGE_KEY)
  if (cached) {
    try {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed)) return parsed
    } catch {
      localStorage.removeItem(PAYLOAD_STORAGE_KEY)
    }
  }
  const response = await fetch('/payload.json')
  if (!response.ok) throw new Error('Failed to load the flow payload.')
  return response.json()
}

export function useFlowPayload() {
  const store = useFlowStore()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: FLOW_QUERY_KEY,
    queryFn: fetchPayload,
  })

  const mutation = useMutation({
    networkMode: 'always',
    mutationFn: async (nextNodes) => {
      localStorage.setItem(PAYLOAD_STORAGE_KEY, JSON.stringify(nextNodes))
      return nextNodes
    },
    onSuccess: (data) => {
      queryClient.setQueryData(FLOW_QUERY_KEY, data)
    },
  })

  store.setSync((nextNodes) => {
    mutation.mutate(nextNodes)
  })

  watch(query.data, (data) => {
    if (!data || store.hydrated) return
    store.hydrate(data)
  }, { immediate: true })

  return { query, store }
}
