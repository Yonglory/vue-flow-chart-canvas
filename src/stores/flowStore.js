import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { POSITION_STORAGE_KEY } from '../utils/constants'
import { createNodesFromForm } from '../utils/createNode'
import { canDelete, deleteSubtree, findNode, resolveParentId, sameId } from '../utils/graph'
import { layoutTree, placeUnderParent } from '../utils/layout'
import {
  normalizeTimes,
  validateComment,
  validateDescription,
  validateHours,
  validateMessageText,
  validateTitle,
} from '../utils/validation'

const HISTORY_LIMIT = 50

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function readPositions() {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writePositions(positions) {
  localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(positions))
}

export const useFlowStore = defineStore('flow', () => {
  const nodes = ref([])
  const positions = ref({})
  const selectedId = ref(null)
  const hydrated = ref(false)
  const past = ref([])
  const future = ref([])
  let sync = () => {}

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function setSync(fn) {
    sync = typeof fn === 'function' ? fn : () => {}
  }

  function snapshot() {
    return { nodes: clone(nodes.value), positions: clone(positions.value) }
  }

  function pushHistory() {
    past.value.push(snapshot())
    if (past.value.length > HISTORY_LIMIT) past.value.shift()
    future.value = []
  }

  function persistNodes() {
    sync(clone(nodes.value))
  }

  function persistPositions() {
    writePositions(positions.value)
  }

  function restore(entry) {
    nodes.value = entry.nodes
    positions.value = entry.positions
    if (selectedId.value != null && !findNode(nodes.value, selectedId.value)) {
      selectedId.value = null
    }
    persistNodes()
    persistPositions()
  }

  function hydrate(payload) {
    nodes.value = clone(payload)
    const saved = readPositions()
    const laid = layoutTree(nodes.value)
    const next = {}
    for (const node of nodes.value) {
      const key = String(node.id)
      next[key] = saved[key] || laid[key] || { x: 0, y: 0 }
    }
    positions.value = next
    hydrated.value = true
  }

  function select(id) {
    selectedId.value = id ?? null
  }

  function replaceNode(id, recipe) {
    nodes.value = nodes.value.map((node) => (sameId(node.id, id) ? recipe(node) : node))
  }

  function commit(mutator) {
    pushHistory()
    mutator()
    persistNodes()
    persistPositions()
  }

  function createFromForm(form) {
    const parentId = resolveParentId(nodes.value, selectedId.value)
    const created = createNodesFromForm(form, parentId)
    if (!created.length) return null
    commit(() => {
      nodes.value = [...nodes.value, ...created]
      const next = { ...positions.value }
      for (const node of created) {
        next[String(node.id)] = placeUnderParent(nodes.value, next, node)
      }
      positions.value = next
      selectedId.value = created[0].id
    })
    return created[0]
  }

  function updateTitle(id, title) {
    const current = findNode(nodes.value, id)
    if (!current) return { title: 'This node is no longer on the canvas.' }
    const trimmed = String(title ?? '').trim()
    if (!trimmed && current.type === 'trigger') {
      if (!current.name) return {}
      commit(() => {
        replaceNode(id, (node) => {
          const next = { ...node }
          delete next.name
          return next
        })
      })
      return {}
    }
    const error = validateTitle(title)
    if (error) return { title: error }
    if (current.name === trimmed) return {}
    commit(() => {
      replaceNode(id, (node) => ({ ...node, name: trimmed }))
    })
    return {}
  }

  function updateDescription(id, description) {
    const error = validateDescription(description)
    if (error) return { description: error }
    const trimmed = String(description ?? '').trim()
    const current = findNode(nodes.value, id)
    if (!current) return {}
    const existing = current.description || ''
    if (existing === trimmed) return {}
    commit(() => {
      replaceNode(id, (node) => {
        const next = { ...node }
        if (!trimmed) delete next.description
        else next.description = trimmed
        return next
      })
    })
    return {}
  }

  function updateComment(id, comment) {
    const error = validateComment(comment)
    if (error) return { comment: error }
    const current = findNode(nodes.value, id)
    if (!current || current.data?.comment === comment) return {}
    commit(() => {
      replaceNode(id, (node) => ({
        ...node,
        data: { ...node.data, comment },
      }))
    })
    return {}
  }

  function updateTextItem(id, index, text) {
    const error = validateMessageText(text)
    if (error) return { text: error }
    const current = findNode(nodes.value, id)
    const item = current?.data?.payload?.[index]
    if (!item || item.text === text) return {}
    commit(() => {
      replaceNode(id, (node) => ({
        ...node,
        data: {
          ...node.data,
          payload: node.data.payload.map((entry, entryIndex) => (
            entryIndex === index ? { ...entry, text } : entry
          )),
        },
      }))
    })
    return {}
  }

  function removePayloadItem(id, index) {
    const current = findNode(nodes.value, id)
    if (!current?.data?.payload?.[index]) return
    commit(() => {
      replaceNode(id, (node) => ({
        ...node,
        data: {
          ...node.data,
          payload: node.data.payload.filter((_, entryIndex) => entryIndex !== index),
        },
      }))
    })
  }

  function addTextItem(id) {
    commit(() => {
      replaceNode(id, (node) => ({
        ...node,
        data: {
          ...node.data,
          payload: [...(node.data?.payload || []), { type: 'text', text: 'New message' }],
        },
      }))
    })
  }

  function addAttachment(id, url) {
    if (!url) return
    commit(() => {
      replaceNode(id, (node) => ({
        ...node,
        data: {
          ...node.data,
          payload: [...(node.data?.payload || []), { type: 'attachment', attachment: url }],
        },
      }))
    })
  }

  function updateBusinessHours(id, { times, timezone }) {
    const normalized = normalizeTimes(times)
    const errors = validateHours(normalized, timezone)
    if (Object.keys(errors).length) return errors
    const current = findNode(nodes.value, id)
    if (!current) return errors
    const sameTimes = JSON.stringify(normalizeTimes(current.data?.times)) === JSON.stringify(normalized)
    if (sameTimes && current.data?.timezone === timezone) return {}
    commit(() => {
      replaceNode(id, (node) => ({
        ...node,
        data: { ...node.data, times: normalized, timezone },
      }))
    })
    return {}
  }

  function deleteNode(id) {
    const target = findNode(nodes.value, id)
    if (!canDelete(target)) return false
    commit(() => {
      nodes.value = deleteSubtree(nodes.value, id)
      const next = { ...positions.value }
      for (const key of Object.keys(next)) {
        if (!findNode(nodes.value, key)) delete next[key]
      }
      positions.value = next
      if (selectedId.value != null && !findNode(nodes.value, selectedId.value)) {
        selectedId.value = null
      }
    })
    return true
  }

  function moveNode(id, position) {
    const key = String(id)
    const current = positions.value[key]
    if (!position || (current && current.x === position.x && current.y === position.y)) return
    commit(() => {
      positions.value = {
        ...positions.value,
        [key]: { x: position.x, y: position.y },
      }
    })
  }

  function undo() {
    const previous = past.value.pop()
    if (!previous) return
    future.value.push(snapshot())
    restore(previous)
  }

  function redo() {
    const next = future.value.pop()
    if (!next) return
    past.value.push(snapshot())
    restore(next)
  }

  return {
    nodes,
    positions,
    selectedId,
    hydrated,
    canUndo,
    canRedo,
    setSync,
    hydrate,
    select,
    createFromForm,
    updateTitle,
    updateDescription,
    updateComment,
    updateTextItem,
    removePayloadItem,
    addTextItem,
    addAttachment,
    updateBusinessHours,
    deleteNode,
    moveNode,
    undo,
    redo,
  }
})
