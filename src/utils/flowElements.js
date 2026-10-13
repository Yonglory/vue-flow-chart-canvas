import { findNode } from './graph'

export function flowNodeType(node) {
  if (node.type === 'dateTime') return 'businessHours'
  if (node.type === 'dateTimeConnector') return 'connector'
  return node.type
}

function branchOf(nodes, node, seen = new Set()) {
  if (!node || seen.has(String(node.id))) return null
  seen.add(String(node.id))
  if (node.type === 'dateTimeConnector') return node.data?.connectorType || null
  const parent = findNode(nodes, node.parentId)
  if (!parent) return null
  return branchOf(nodes, parent, seen)
}

const BRANCH_STROKE = {
  success: '#e15a3a',
  failure: '#1f8a7b',
}

export function toFlowNodes(nodes, positions, selectedId) {
  return nodes.map((node) => ({
    id: String(node.id),
    type: flowNodeType(node),
    position: positions[String(node.id)] || { x: 0, y: 0 },
    data: node,
    draggable: true,
    selectable: node.type !== 'dateTimeConnector',
    connectable: false,
    selected: selectedId != null && String(selectedId) === String(node.id),
  }))
}

export function toFlowEdges(nodes) {
  return nodes.flatMap((node) => {
    if (node.parentId === -1 || node.parentId === '-1') return []
    const parent = findNode(nodes, node.parentId)
    if (!parent) return []
    const branch = branchOf(nodes, node)
    const sourceHandle = node.type === 'dateTimeConnector' ? node.data?.connectorType || 'out' : 'out'
    return [{
      id: `e-${parent.id}-${node.id}`,
      source: String(parent.id),
      target: String(node.id),
      sourceHandle,
      targetHandle: 'in',
      type: 'smoothstep',
      pathOptions: { borderRadius: 18 },
      style: {
        stroke: BRANCH_STROKE[branch] || '#c3b6a6',
        strokeWidth: 2,
      },
    }]
  })
}
