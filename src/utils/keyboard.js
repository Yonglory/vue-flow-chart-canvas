import { findNode, orderedChildren } from './graph'

export function moveSelection(nodes, selectedId, direction) {
  if (!nodes.length) return null
  const root = nodes.find((node) => node.type === 'trigger') || nodes[0]
  if (selectedId == null) return root.id

  const current = findNode(nodes, selectedId)
  if (!current) return root.id

  if (direction === 'down') {
    const kids = orderedChildren(nodes, current.id)
    if (kids.length) return kids[0].id
    return nextInWalk(nodes, current)
  }

  const previous = previousSibling(nodes, current.id)
  if (previous) return deepestLast(nodes, previous).id
  if (current.parentId === -1 || current.parentId === '-1') return current.id
  return current.parentId
}

function nextSibling(nodes, id) {
  const current = findNode(nodes, id)
  if (!current) return null
  const siblings = orderedChildren(nodes, current.parentId)
  const index = siblings.findIndex((node) => String(node.id) === String(id))
  return siblings[index + 1] || null
}

function previousSibling(nodes, id) {
  const current = findNode(nodes, id)
  if (!current) return null
  const siblings = orderedChildren(nodes, current.parentId)
  const index = siblings.findIndex((node) => String(node.id) === String(id))
  return index > 0 ? siblings[index - 1] : null
}

function deepestLast(nodes, node) {
  const kids = orderedChildren(nodes, node.id)
  if (!kids.length) return node
  return deepestLast(nodes, kids[kids.length - 1])
}

function nextInWalk(nodes, current) {
  const sibling = nextSibling(nodes, current.id)
  if (sibling) return sibling.id
  const parent = findNode(nodes, current.parentId)
  if (!parent) return null
  return nextInWalk(nodes, parent)
}

export function isTypingTarget(target) {
  if (!target) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}
