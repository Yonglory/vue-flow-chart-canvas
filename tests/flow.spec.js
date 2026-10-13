import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useFlowStore } from '../src/stores/flowStore'
import { createNodesFromForm } from '../src/utils/createNode'
import { nodeDescription, nodeTitle, attachmentName } from '../src/utils/describeNode'
import { toFlowEdges } from '../src/utils/flowElements'
import { deleteSubtree, findNode, routeForNodeClick } from '../src/utils/graph'
import { moveSelection } from '../src/utils/keyboard'
import { layoutTree } from '../src/utils/layout'
import { truncate } from '../src/utils/truncate'
import { validateCreate, validateHours } from '../src/utils/validation'
import { queryClientConfig } from '../src/query/client'

function loadPayload() {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'public/payload.json'), 'utf8'))
}

describe('payload helpers', () => {
  const payload = loadPayload()

  it('truncates flattened text', () => {
    expect(truncate('Hello there\n\nwelcome', 12)).toBe('Hello there…')
    expect(truncate('Short')).toBe('Short')
  })

  it('describes seed nodes from their payload fields', () => {
    const trigger = findNode(payload, 1)
    const hours = findNode(payload, 'd09c08')
    const welcome = findNode(payload, 'b0653a')
    expect(nodeTitle(trigger)).toBe('Trigger')
    expect(nodeDescription(trigger)).toBe('Conversation Opened')
    expect(nodeDescription(hours)).toBe('Business Hours - UTC')
    expect(nodeDescription(welcome)).toContain('Hello there')
    expect(attachmentName(welcome.data.payload[1].attachment)).toBe('354.jpg')
  })

  it('lays the success branch to the left of failure', () => {
    const positions = layoutTree(payload)
    expect(positions['1'].y).toBeLessThan(positions.d09c08.y)
    expect(positions['161f52'].x).toBeLessThan(positions['28c4b9'].x)
    expect(positions.b0653a.y).toBeGreaterThan(positions['161f52'].y)
    expect(positions.e879e4.y).toBeGreaterThan(positions.b6a0c1.y)
  })

  it('colors success and failure edges and keeps connectors closed', () => {
    const edges = toFlowEdges(payload)
    expect(edges.find((edge) => edge.target === '161f52')).toMatchObject({
      sourceHandle: 'success',
      style: { stroke: '#e15a3a' },
    })
    expect(edges.find((edge) => edge.target === 'b6a0c1').style.stroke).toBe('#1f8a7b')
    expect(routeForNodeClick(findNode(payload, '161f52'))).toBeNull()
    expect(routeForNodeClick(findNode(payload, 'b0653a'))).toEqual({
      name: 'node',
      params: { nodeId: 'b0653a' },
    })
  })

  it('walks the tree from the trigger down to the comment', () => {
    expect(moveSelection(payload, null, 'down')).toBe(1)
    expect(moveSelection(payload, 1, 'down')).toBe('d09c08')
    expect(moveSelection(payload, 'd09c08', 'down')).toBe('161f52')
    expect(moveSelection(payload, '161f52', 'down')).toBe('b0653a')
    expect(moveSelection(payload, 'b0653a', 'down')).toBe('28c4b9')
    expect(moveSelection(payload, '28c4b9', 'down')).toBe('b6a0c1')
    expect(moveSelection(payload, 'b6a0c1', 'down')).toBe('e879e4')
    expect(moveSelection(payload, 'e879e4', 'up')).toBe('b6a0c1')
  })

  it('maps create-form types onto the payload contract', () => {
    const [message] = createNodesFromForm({ title: 'Ping', description: 'Yo', type: 'sendMessage' }, 1)
    expect(message).toMatchObject({ type: 'sendMessage', parentId: 1, name: 'Ping' })
    expect(message.data.payload).toEqual([{ type: 'text', text: 'Yo' }])

    const [comment] = createNodesFromForm({ title: 'Note', description: 'Hi', type: 'addComments' }, 'b6a0c1')
    expect(comment).toMatchObject({ type: 'addComment', parentId: 'b6a0c1' })
    expect(comment.data.comment).toBe('Hi')

    const hours = createNodesFromForm({ title: 'Hours', description: 'Week', type: 'businessHours' }, 1)
    expect(hours[0]).toMatchObject({ type: 'dateTime', parentId: 1 })
    expect(hours[0].data.action).toBe('businessHours')
    expect(hours[0].data.connectors).toEqual([hours[1].id, hours[2].id])
    expect(hours[1].data.connectorType).toBe('success')
    expect(hours[2].data.connectorType).toBe('failure')
    expect(hours[2].parentId).toBe(hours[0].id)
  })

  it('removes a subtree and leaves the trigger when business hours is deleted', () => {
    expect(deleteSubtree(payload, 'b6a0c1').map((node) => node.id)).not.toContain('e879e4')
    expect(deleteSubtree(payload, 'd09c08').map((node) => node.id)).toEqual([1])
    expect(deleteSubtree(payload, 1)).toBe(payload)
  })

  it('validates required fields and hour ranges', () => {
    expect(validateCreate({ title: ' ', description: '', type: 'sendMessage' }).title).toMatch(/required/i)
    expect(validateCreate({ title: 'Ok', description: '', type: 'nope' }).type).toBeTruthy()
    const errors = validateHours([{ day: 'mon', startTime: '17:00', endTime: '09:00' }], 'UTC')
    expect(errors.mon).toMatch(/after/i)
    expect(validateHours([{ day: 'mon', startTime: '09:00', endTime: '17:00' }], 'Mars').timezone).toBeTruthy()
  })

  it('keeps the TanStack Query v5 client config exact', () => {
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
  })
})

describe('flow store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('creates, edits, undoes, and deletes', () => {
    const store = useFlowStore()
    store.hydrate(loadPayload())

    store.select('d09c08')
    const created = store.createFromForm({ title: 'Ping', description: 'Yo', type: 'addComments' })
    expect(created.type).toBe('addComment')
    expect(created.parentId).toBe('161f52')

    expect(store.updateTitle('b0653a', '  ').title).toMatch(/required/i)
    expect(store.updateTitle('b0653a', 'Welcome back')).toEqual({})
    expect(findNode(store.nodes, 'b0653a').name).toBe('Welcome back')
    store.undo()
    expect(findNode(store.nodes, 'b0653a').name).toBe('Welcome Message')
    store.redo()
    expect(findNode(store.nodes, 'b0653a').name).toBe('Welcome back')

    store.moveNode('b0653a', { x: 12, y: 34 })
    expect(store.positions.b0653a).toEqual({ x: 12, y: 34 })
    store.undo()
    expect(store.positions.b0653a).not.toEqual({ x: 12, y: 34 })

    expect(store.deleteNode(1)).toBe(false)
    expect(store.deleteNode('161f52')).toBe(false)
    expect(store.deleteNode('b6a0c1')).toBe(true)
    expect(findNode(store.nodes, 'e879e4')).toBeUndefined()
    expect(findNode(store.nodes, '28c4b9')).toBeTruthy()
  })

  it('rejects an impossible business-hours range', () => {
    const store = useFlowStore()
    store.hydrate(loadPayload())
    const result = store.updateBusinessHours('d09c08', {
      times: [{ day: 'mon', startTime: '10:00', endTime: '09:00' }],
      timezone: 'UTC',
    })
    expect(result.mon).toMatch(/after/i)
    expect(findNode(store.nodes, 'd09c08').data.times[0].endTime).toBe('17:00')
  })
})
