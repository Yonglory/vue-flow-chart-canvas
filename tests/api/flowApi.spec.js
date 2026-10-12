import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPayload, resetPayload, savePayload } from '@/api/flowApi'
import { STORAGE_KEY } from '@/constants/flow'

const seed = {
  nodes: [
    { id: 'node-1', type: 'trigger', position: { x: 0, y: 0 }, data: { title: 'Trigger', description: 'Opened' } },
  ],
  edges: [],
}

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('flow API', () => {
  it('fetches the seed, then prefers the saved payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => seed,
    })))

    const first = await fetchPayload()
    expect(first.nodes[0].id).toBe('node-1')
    expect(fetch).toHaveBeenCalledTimes(1)

    await savePayload({
      nodes: [{ ...seed.nodes[0], data: { title: 'Saved', description: 'Local' } }],
      edges: [],
    })
    const second = await fetchPayload()
    expect(second.nodes[0].data.title).toBe('Saved')
    expect(fetch).toHaveBeenCalledTimes(1)

    const restored = await resetPayload()
    expect(restored.nodes[0].data.title).toBe('Trigger')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('throws a storage message when the browser quota is full', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const error = new Error('full')
      error.name = 'QuotaExceededError'
      throw error
    })
    await expect(savePayload(seed)).rejects.toThrow(/Storage is full/)
  })
})
