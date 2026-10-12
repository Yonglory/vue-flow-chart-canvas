import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, watch } from 'vue'
import { fetchPayload, resetPayload, savePayload } from '@/api/flowApi'
import { FLOW_QUERY_KEY } from '@/constants/flow'
import { useFlowStore } from '@/stores/flowStore'

export function useFlowSync() {
  const store = useFlowStore()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: FLOW_QUERY_KEY,
    queryFn: fetchPayload,
    networkMode: 'always',
  })

  const saveMutation = useMutation({
    mutationFn: savePayload,
    networkMode: 'always',
    onSuccess: (payload) => {
      queryClient.setQueryData(FLOW_QUERY_KEY, payload)
    },
  })

  const resetMutation = useMutation({
    mutationFn: resetPayload,
    networkMode: 'always',
    onSuccess: (payload) => {
      store.hydrate(payload)
      queryClient.setQueryData(FLOW_QUERY_KEY, payload)
    },
  })

  watch(query.data, (payload) => {
    if (payload && !store.hydrated) store.hydrate(payload)
  }, { immediate: true })

  async function persist() {
    const previous = queryClient.getQueryData(FLOW_QUERY_KEY)
    try {
      return await saveMutation.mutateAsync(store.snapshot())
    } catch (error) {
      if (previous) store.hydrate(previous)
      throw error
    }
  }

  async function reset() {
    return resetMutation.mutateAsync()
  }

  const isLoading = computed(() => query.isPending.value && !store.hydrated)
  const isError = computed(() => query.isError.value && !store.hydrated)
  const isSaving = computed(() => saveMutation.isPending.value || resetMutation.isPending.value)

  return {
    isLoading,
    isError,
    isSaving,
    error: computed(() => query.error.value),
    retry: () => query.refetch(),
    persist,
    reset,
  }
}
