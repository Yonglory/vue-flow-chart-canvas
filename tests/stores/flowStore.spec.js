import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useFlowStore } from '@/stores/flowStore'
import payload from '../../public/payload.json'

describe('flow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hydrates, edits, moves, connects, and deletes through one graph', () => {
    const store = useFlowStore()
    store.hydrate(payload)
    expect(store.accessibleCount).toBe(5)

    const created = store.createNode({
      title: 'Follow up',
      description: 'Ask if the question was answered.',
      type: 'sendMessage',
    })
    expect(store.nodeById(created.id).data.texts).toEqual([])

    const hours = store.createNode({
      title: 'Weekend hours',
      description: 'Saturday cover',
      type: 'businessHours',
    })
    expect(store.nodes.filter((node) => node.data.parentId === hours.id)).toHaveLength(2)

    expect(store.updateNode(created.id, { title: 'Follow-up message' })).toBe(true)
    expect(store.nodeById(created.id).data.title).toBe('Follow-up message')
    expect(store.updateNode('node-hours-success', { title: 'Nope' })).toBe(false)

    expect(store.updateNodePosition(created.id, { x: 12, y: 18 })).toBe(true)
    expect(store.updateNodePosition(created.id, { x: 12.2, y: 18.2 })).toBe(false)

    const connection = store.addEdge({
      source: created.id,
      target: hours.id,
      sourceHandle: 'out',
      targetHandle: 'in',
    })
    expect(connection.ok).toBe(true)
    expect(store.addEdge({ source: hours.id, target: created.id }).ok).toBe(false)

    const snapshot = store.snapshot()
    snapshot.nodes[0].data.title = 'Mutated copy'
    expect(store.nodes[0].data.title).not.toBe('Mutated copy')

    const removed = store.deleteNode(hours.id)
    expect(removed.removedIds).toContain(`${hours.id}-success`)
    expect(store.edges.some((edge) => edge.target === hours.id)).toBe(false)
    expect(store.deleteNode(`${hours.id}-failure`).removed).toBe(false)
  })
})
