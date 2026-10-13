export function sameId(a, b) {
  return String(a) === String(b)
}

export function findNode(nodes, id) {
  if (id == null) return undefined
  return nodes.find((node) => sameId(node.id, id))
}

export function childrenOf(nodes, id) {
  return nodes.filter((node) => sameId(node.parentId, id))
}

export function isConnector(node) {
  return node?.type === 'dateTimeConnector'
}

export function canOpen(node) {
  return Boolean(node) && !isConnector(node)
}

export function canDelete(node) {
  return Boolean(node) && node.type !== 'trigger' && !isConnector(node)
}

export function orderedChildren(nodes, id) {
  const parent = findNode(nodes, id)
  const kids = childrenOf(nodes, id)
  if (parent?.type === 'dateTime' && Array.isArray(parent.data?.connectors)) {
    const order = parent.data.connectors.map(String)
    return [...kids].sort((a, b) => {
      const ai = order.indexOf(String(a.id))
      const bi = order.indexOf(String(b.id))
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
  }
  return kids
}

export function descendantsOf(nodes, id) {
  const collected = []
  const walk = (parentId) => {
    for (const child of childrenOf(nodes, parentId)) {
      collected.push(child)
      walk(child.id)
    }
  }
  walk(id)
  return collected
}

export function deleteSubtree(nodes, id) {
  const target = findNode(nodes, id)
  if (!target || !canDelete(target)) return nodes
  const remove = new Set([String(id), ...descendantsOf(nodes, id).map((node) => String(node.id))])
  return nodes
    .filter((node) => !remove.has(String(node.id)))
    .map((node) => {
      if (node.type !== 'dateTime' || !Array.isArray(node.data?.connectors)) return node
      const connectors = node.data.connectors.filter((connectorId) => !remove.has(String(connectorId)))
      if (connectors.length === node.data.connectors.length) return node
      return { ...node, data: { ...node.data, connectors } }
    })
}

export function routeForNodeClick(node) {
  if (!canOpen(node)) return null
  return { name: 'node', params: { nodeId: String(node.id) } }
}

export function resolveParentId(nodes, selectedId) {
  const selected = findNode(nodes, selectedId)
  if (selected?.type === 'dateTime') {
    const successId = selected.data?.connectors?.[0]
    if (successId != null) return successId
  }
  if (selected) return selected.id
  const trigger = nodes.find((node) => node.type === 'trigger')
  return trigger ? trigger.id : -1
}
