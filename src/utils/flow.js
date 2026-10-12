import { NODE_TYPES } from '@/constants/flow'
import { defaultSchedule, normalizeSchedule, scheduleSummary } from '@/utils/schedule'

const APPEARANCE = {
  [NODE_TYPES.trigger]: { icon: 'trigger', tone: 'trigger', label: 'Trigger' },
  [NODE_TYPES.sendMessage]: { icon: 'message', tone: 'message', label: 'Send Message' },
  [NODE_TYPES.addComment]: { icon: 'comment', tone: 'comment', label: 'Add Comments' },
  [NODE_TYPES.businessHours]: { icon: 'hours', tone: 'hours', label: 'Business Hours' },
  [NODE_TYPES.outcome]: { icon: 'outcome', tone: 'outcome', label: 'Branch' },
}

export function nodeAppearance(type) {
  return APPEARANCE[type] || { icon: 'trigger', tone: 'trigger', label: 'Step' }
}

export function isNodeAccessible(node) {
  if (!node) return false
  if (node.type === NODE_TYPES.outcome) return false
  if (node.data?.accessible === false) return false
  return true
}

export function previewLine(node) {
  if (!node?.data) return ''
  if (node.type === NODE_TYPES.sendMessage) {
    const text = (node.data.texts || []).find((item) => String(item || '').trim())
    if (text) return String(text).trim()
    return node.data.attachments?.[0]?.name || ''
  }
  if (node.type === NODE_TYPES.addComment) return String(node.data.comment || '').trim()
  if (node.type === NODE_TYPES.businessHours) {
    return scheduleSummary(node.data.schedule, node.data.timezone || 'UTC')
  }
  return ''
}

export function miniMapColor(node) {
  if (node?.type === NODE_TYPES.outcome) {
    return node.data?.outcome === 'failure' ? '#d92d20' : '#178a4a'
  }
  const colors = {
    [NODE_TYPES.trigger]: '#7c3aed',
    [NODE_TYPES.sendMessage]: '#0f9d8a',
    [NODE_TYPES.addComment]: '#4f46e5',
    [NODE_TYPES.businessHours]: '#e85d04',
  }
  return colors[node?.type] || '#98a2b3'
}

export function nextNodePosition(nodes) {
  const placed = (nodes || []).filter((node) => node.type !== NODE_TYPES.outcome)
  if (!placed.length) return { x: 280, y: 40 }
  const anchor = placed.reduce((lowest, node) => (
    node.position.y > lowest.position.y ? node : lowest
  ))
  return {
    x: anchor.position.x + 32,
    y: anchor.position.y + 210,
  }
}

export function buildDefaultData(type, { title, description }) {
  const base = { title, description }
  if (type === NODE_TYPES.sendMessage) return { ...base, texts: [], attachments: [] }
  if (type === NODE_TYPES.addComment) return { ...base, comment: '' }
  if (type === NODE_TYPES.businessHours) {
    return { ...base, timezone: 'UTC', schedule: defaultSchedule() }
  }
  return base
}

export function createOutcomeBundle(parent) {
  const successId = `${parent.id}-success`
  const failureId = `${parent.id}-failure`
  const nodes = [
    {
      id: successId,
      type: NODE_TYPES.outcome,
      position: { x: parent.position.x - 180, y: parent.position.y + 190 },
      data: {
        title: 'Success',
        description: 'During business hours',
        outcome: 'success',
        parentId: parent.id,
        accessible: false,
      },
    },
    {
      id: failureId,
      type: NODE_TYPES.outcome,
      position: { x: parent.position.x + 200, y: parent.position.y + 190 },
      data: {
        title: 'Failure',
        description: 'Outside business hours',
        outcome: 'failure',
        parentId: parent.id,
        accessible: false,
      },
    },
  ]
  const edges = [
    {
      id: `edge-${parent.id}-success`,
      source: parent.id,
      target: successId,
      sourceHandle: 'success',
      targetHandle: 'in',
      data: { locked: true },
    },
    {
      id: `edge-${parent.id}-failure`,
      source: parent.id,
      target: failureId,
      sourceHandle: 'failure',
      targetHandle: 'in',
      data: { locked: true },
    },
  ]
  return { nodes, edges }
}

export function buildNodeBundle({ id, type, title, description, position }) {
  const primary = {
    id,
    type,
    position: { ...position },
    data: buildDefaultData(type, { title, description }),
  }
  if (type !== NODE_TYPES.businessHours) {
    return { primary, nodes: [primary], edges: [] }
  }
  const outcomes = createOutcomeBundle(primary)
  return {
    primary,
    nodes: [primary, ...outcomes.nodes],
    edges: outcomes.edges,
  }
}

export function wouldCycle(edges, source, target) {
  const adjacency = new Map()
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, [])
    adjacency.get(edge.source).push(edge.target)
  })
  const stack = [target]
  const seen = new Set()
  while (stack.length) {
    const current = stack.pop()
    if (current === source) return true
    if (seen.has(current)) continue
    seen.add(current)
    ;(adjacency.get(current) || []).forEach((next) => stack.push(next))
  }
  return false
}

export function canConnect(connection, nodes, edges) {
  if (!connection?.source) return { ok: false, reason: 'Choose a step to connect from.' }
  if (!connection.target) return { ok: true }
  if (connection.source === connection.target) {
    return { ok: false, reason: 'A step cannot connect to itself.' }
  }

  const sourceNode = nodes.find((node) => node.id === connection.source)
  const targetNode = nodes.find((node) => node.id === connection.target)
  if (!sourceNode || !targetNode) return { ok: false, reason: 'That connection is missing a step.' }
  if (targetNode.type === NODE_TYPES.trigger) {
    return { ok: false, reason: 'The trigger is the start of the workflow.' }
  }
  if (targetNode.type === NODE_TYPES.outcome) {
    return { ok: false, reason: 'Success and failure steps are already wired to business hours.' }
  }
  if (sourceNode.type === NODE_TYPES.businessHours) {
    return { ok: false, reason: 'Connect the next step from the success or failure branch.' }
  }
  if (wouldCycle(edges, connection.source, connection.target)) {
    return { ok: false, reason: 'That connection would create a loop.' }
  }

  const duplicate = edges.some((edge) => (
    edge.source === connection.source
    && edge.target === connection.target
    && (edge.sourceHandle || null) === (connection.sourceHandle || null)
  ))
  if (duplicate) return { ok: false, reason: 'Those steps are already connected.' }
  return { ok: true }
}

export function removeNodeFromGraph(nodes, edges, id) {
  const target = nodes.find((node) => node.id === id)
  if (!target || target.type === NODE_TYPES.outcome) {
    return { removed: false, removedIds: [], nodes, edges }
  }
  const removedIds = new Set([
    id,
    ...nodes.filter((node) => node.data?.parentId === id).map((node) => node.id),
  ])
  return {
    removed: true,
    removedIds: [...removedIds],
    nodes: nodes.filter((node) => !removedIds.has(node.id)),
    edges: edges.filter((edge) => !removedIds.has(edge.source) && !removedIds.has(edge.target)),
  }
}

function normalizePosition(position) {
  const x = Number(position?.x)
  const y = Number(position?.y)
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  }
}

function normalizeAttachment(file, index) {
  return {
    id: String(file?.id || `file-${index}`),
    name: String(file?.name || 'attachment'),
    mimeType: String(file?.mimeType || 'application/octet-stream'),
    size: Number(file?.size) || 0,
    url: file?.url ? String(file.url) : '',
    dataUrl: file?.dataUrl ? String(file.dataUrl) : '',
  }
}

function normalizeNodeData(type, data = {}) {
  const title = String(data.title ?? '').trim() || 'Untitled'
  const description = String(data.description ?? '').trim()
  if (type === NODE_TYPES.sendMessage) {
    return {
      title,
      description,
      texts: Array.isArray(data.texts) ? data.texts.map((item) => String(item)) : [],
      attachments: Array.isArray(data.attachments)
        ? data.attachments.map(normalizeAttachment)
        : [],
    }
  }
  if (type === NODE_TYPES.addComment) {
    return {
      title,
      description,
      comment: String(data.comment ?? ''),
    }
  }
  if (type === NODE_TYPES.businessHours) {
    return {
      title,
      description,
      timezone: String(data.timezone || 'UTC'),
      schedule: normalizeSchedule(data.schedule),
    }
  }
  if (type === NODE_TYPES.outcome) {
    const outcome = data.outcome === 'failure' ? 'failure' : 'success'
    return {
      title: title === 'Untitled' ? (outcome === 'failure' ? 'Failure' : 'Success') : title,
      description,
      outcome,
      parentId: String(data.parentId || ''),
      accessible: false,
    }
  }
  return { title, description }
}

function uniqueById(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function normalizePayload(raw) {
  if (!raw || !Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
    throw new Error('Payload must include nodes and edges arrays.')
  }
  const nodes = uniqueById(raw.nodes).map((node) => {
    const type = Object.values(NODE_TYPES).includes(node.type) ? node.type : NODE_TYPES.trigger
    return {
      id: String(node.id),
      type,
      position: normalizePosition(node.position),
      data: normalizeNodeData(type, node.data),
    }
  })
  const ids = new Set(nodes.map((node) => node.id))
  const edges = uniqueById(raw.edges)
    .filter((edge) => ids.has(String(edge.source)) && ids.has(String(edge.target)))
    .map((edge) => ({
      id: String(edge.id),
      source: String(edge.source),
      target: String(edge.target),
      sourceHandle: edge.sourceHandle ? String(edge.sourceHandle) : null,
      targetHandle: edge.targetHandle ? String(edge.targetHandle) : null,
      data: { locked: Boolean(edge.data?.locked) },
    }))
  return { nodes, edges }
}

export function toFlowNode(node, selectedId = null) {
  const accessible = isNodeAccessible(node)
  return {
    id: node.id,
    type: node.type,
    position: { x: node.position.x, y: node.position.y },
    data: node.data,
    selected: node.id === selectedId,
    draggable: true,
    selectable: accessible,
    connectable: true,
    deletable: false,
    focusable: accessible,
  }
}

export function toFlowEdge(edge) {
  const locked = Boolean(edge.data?.locked)
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: 'smoothstep',
    deletable: !locked,
    selectable: !locked,
    focusable: !locked,
    updatable: false,
    data: { locked },
    style: { stroke: '#ff7a59', strokeWidth: 2 },
    pathOptions: { borderRadius: 18, offset: 24 },
  }
}

export function reconcileNodes(current, sourceNodes, { selectedId = null, draggingId = null } = {}) {
  const byId = new Map((current || []).map((node) => [node.id, node]))
  const same = current?.length === sourceNodes.length && sourceNodes.every((node) => byId.has(node.id))
  if (!same) return sourceNodes.map((node) => toFlowNode(node, selectedId))

  sourceNodes.forEach((source) => {
    const node = byId.get(source.id)
    node.data = source.data
    node.selected = source.id === selectedId
    node.type = source.type
    if (source.id !== draggingId) {
      if (node.position.x !== source.position.x || node.position.y !== source.position.y) {
        node.position = { x: source.position.x, y: source.position.y }
      }
    }
  })
  return current.slice()
}

export function reconcileEdges(current, sourceEdges) {
  const byId = new Map((current || []).map((edge) => [edge.id, edge]))
  const same = current?.length === sourceEdges.length && sourceEdges.every((edge) => byId.has(edge.id))
  if (!same) return sourceEdges.map(toFlowEdge)

  sourceEdges.forEach((source) => {
    const edge = byId.get(source.id)
    edge.source = source.source
    edge.target = source.target
    edge.sourceHandle = source.sourceHandle
    edge.targetHandle = source.targetHandle
    edge.deletable = !source.data?.locked
    edge.selectable = !source.data?.locked
    edge.data = { locked: Boolean(source.data?.locked) }
  })
  return current.slice()
}

export function drawerRouteState(nodeId, nodes) {
  const id = Array.isArray(nodeId) ? nodeId[0] : nodeId
  if (!id) return { status: 'closed' }
  const node = (nodes || []).find((item) => item.id === id)
  if (!node) return { status: 'missing' }
  if (!isNodeAccessible(node)) return { status: 'display-only', node }
  return { status: 'open', node }
}
