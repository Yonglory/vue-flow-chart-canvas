import { describe, expect, it } from 'vitest'
import payload from '../../public/payload.json'
import {
  buildNodeBundle,
  canConnect,
  drawerRouteState,
  isGraphConnectionValid,
  isNodeAccessible,
  nextNodePosition,
  normalizePayload,
  previewLine,
  reconcileNodes,
  removeNodeFromGraph,
  wouldCycle,
} from '@/utils/flow'

describe('payload normalization', () => {
  it('loads the seeded workflow and keeps success and failure display-only', () => {
    const graph = normalizePayload(payload)
    const types = graph.nodes.map((node) => node.type)
    expect(types).toEqual([
      'trigger',
      'businessHours',
      'outcome',
      'outcome',
      'sendMessage',
      'sendMessage',
      'addComment',
    ])
    const outcomes = graph.nodes.filter((node) => node.type === 'outcome')
    expect(outcomes.every((node) => !isNodeAccessible(node))).toBe(true)
    expect(graph.edges.some((edge) => edge.data.locked)).toBe(true)
    expect(graph.nodes.find((node) => node.id === 'node-welcome').data.attachments[0].name)
      .toBe('0f642f52e639febd6ba5a27453cc8345.png')
  })

  it('drops edges that point at missing nodes', () => {
    const graph = normalizePayload({
      nodes: [{ id: 'a', type: 'trigger', position: { x: 1, y: 2 }, data: { title: 'T', description: 'D' } }],
      edges: [{ id: 'e', source: 'a', target: 'missing' }],
    })
    expect(graph.edges).toEqual([])
    expect(graph.nodes[0].position).toEqual({ x: 1, y: 2 })
  })

  it('rejects a payload without nodes and edges', () => {
    expect(() => normalizePayload({ nodes: [] })).toThrow(/nodes and edges/)
  })
})

describe('graph editing', () => {
  const base = normalizePayload(payload)

  it('places a new step below the lowest real node', () => {
    const position = nextNodePosition(base.nodes)
    expect(position.y).toBeGreaterThan(700)
  })

  it('creates success and failure branches with a business hours step', () => {
    const bundle = buildNodeBundle({
      id: 'hours-2',
      type: 'businessHours',
      title: 'Hours',
      description: 'Weekday cover',
      position: { x: 10, y: 20 },
    })
    expect(bundle.nodes.map((node) => node.type)).toEqual(['businessHours', 'outcome', 'outcome'])
    expect(bundle.edges).toHaveLength(2)
    expect(bundle.edges.every((edge) => edge.data.locked)).toBe(true)
  })

  it('removes a business hours step together with its branches and edges', () => {
    const result = removeNodeFromGraph(base.nodes, base.edges, 'node-hours')
    expect(result.removedIds).toEqual(expect.arrayContaining([
      'node-hours',
      'node-hours-success',
      'node-hours-failure',
    ]))
    expect(result.nodes.some((node) => node.id === 'node-welcome')).toBe(true)
    expect(result.edges.some((edge) => edge.source === 'node-hours')).toBe(false)
  })

  it('refuses to delete a display-only outcome', () => {
    const result = removeNodeFromGraph(base.nodes, base.edges, 'node-hours-success')
    expect(result.removed).toBe(false)
    expect(result.nodes).toHaveLength(base.nodes.length)
  })

  it('blocks loops, triggers as targets, and duplicate links', () => {
    expect(wouldCycle(base.edges, 'node-away', 'node-trigger')).toBe(true)
    expect(wouldCycle(base.edges, 'node-welcome', 'node-comment')).toBe(false)
    expect(canConnect({ source: 'node-comment', target: 'node-trigger' }, base.nodes, base.edges).ok).toBe(false)
    expect(canConnect({ source: 'node-hours', target: 'node-welcome', sourceHandle: 'success' }, base.nodes, base.edges).reason)
      .toMatch(/success or failure/)
    expect(canConnect({
      source: 'node-away',
      target: 'node-comment',
      sourceHandle: 'out',
    }, base.nodes, base.edges).ok).toBe(false)
    expect(canConnect({ source: 'node-welcome', target: 'node-comment', sourceHandle: 'out' }, base.nodes, base.edges).ok).toBe(true)
    const existing = base.edges.find((edge) => edge.id === 'edge-trigger-hours')
    expect(isGraphConnectionValid(existing, base.nodes, base.edges)).toBe(true)
    expect(isGraphConnectionValid({
      source: 'node-away',
      target: 'node-comment',
      sourceHandle: 'out',
    }, base.nodes, base.edges)).toBe(false)
  })
})

describe('canvas helpers', () => {
  it('previews message text and keeps node identity while reconciling', () => {
    const welcome = normalizePayload(payload).nodes.find((node) => node.id === 'node-welcome')
    expect(previewLine(welcome)).toMatch(/teammate/)
    const current = [{ id: 'node-welcome', position: { x: 1, y: 1 }, data: { title: 'Old' }, measured: { width: 10 } }]
    const next = reconcileNodes(current, [{ ...welcome, position: { x: 9, y: 9 } }], { selectedId: 'node-welcome' })
    expect(next[0]).toBe(current[0])
    expect(next[0].data.title).toBe('Welcome Message')
    expect(next[0].selected).toBe(true)
    expect(next[0].position).toEqual({ x: 9, y: 9 })
    expect(next[0].measured).toEqual({ width: 10 })
  })

  it('keeps the dragged position until the drag finishes', () => {
    const current = [{ id: 'a', position: { x: 4, y: 5 }, data: {} }]
    const next = reconcileNodes(current, [{ id: 'a', type: 'trigger', position: { x: 1, y: 1 }, data: { title: 'T', description: 'D' } }], {
      draggingId: 'a',
    })
    expect(next[0].position).toEqual({ x: 4, y: 5 })
  })

  it('describes drawer routes', () => {
    const nodes = normalizePayload(payload).nodes
    expect(drawerRouteState('', nodes).status).toBe('closed')
    expect(drawerRouteState('missing', nodes).status).toBe('missing')
    expect(drawerRouteState('node-hours-success', nodes).status).toBe('display-only')
    expect(drawerRouteState('node-welcome', nodes).status).toBe('open')
  })
})
