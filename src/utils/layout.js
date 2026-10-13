import { orderedChildren } from './graph'

const CARD_W = 260
const PILL_W = 120
const GAP_X = 64
const CARD_STEP = 168
const PILL_STEP = 96

function ownWidth(node) {
  return node.type === 'dateTimeConnector' ? PILL_W : CARD_W
}

function widthOf(nodes, node, memo) {
  const key = String(node.id)
  if (memo.has(key)) return memo.get(key)
  const kids = orderedChildren(nodes, node.id)
  const own = ownWidth(node)
  if (!kids.length) {
    memo.set(key, own)
    return own
  }
  const kidsWidth = kids.reduce((sum, kid, index) => {
    return sum + widthOf(nodes, kid, memo) + (index ? GAP_X : 0)
  }, 0)
  const total = Math.max(own, kidsWidth)
  memo.set(key, total)
  return total
}

export function layoutTree(nodes) {
  const positions = {}
  const root = nodes.find((node) => node.parentId === -1 || node.parentId === '-1')
    || nodes.find((node) => node.type === 'trigger')
  if (!root) return positions

  const memo = new Map()

  const place = (node, left, y) => {
    const kids = orderedChildren(nodes, node.id)
    const total = widthOf(nodes, node, memo)
    const own = ownWidth(node)
    positions[String(node.id)] = {
      x: Math.round(left + (total - own) / 2),
      y,
    }
    let cursor = left
    kids.forEach((kid, index) => {
      if (index) cursor += GAP_X
      const step = node.type === 'dateTimeConnector' ? PILL_STEP : CARD_STEP
      place(kid, cursor, y + step)
      cursor += widthOf(nodes, kid, memo)
    })
  }

  place(root, 40, 48)
  return positions
}

export function placeUnderParent(nodes, positions, node) {
  const parentPos = positions[String(node.parentId)] || { x: 80, y: 48 }
  const siblings = orderedChildren(nodes, node.parentId)
  const index = Math.max(0, siblings.findIndex((sibling) => String(sibling.id) === String(node.id)))
  const own = ownWidth(node)
  const span = siblings.length
  return {
    x: Math.round(parentPos.x + (index - (span - 1) / 2) * (own + GAP_X)),
    y: parentPos.y + (node.type === 'dateTimeConnector' ? PILL_STEP : CARD_STEP),
  }
}
