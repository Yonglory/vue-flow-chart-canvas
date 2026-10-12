import { defineStore } from 'pinia'
import { createId } from '@/utils/id'
import {
  buildNodeBundle,
  canConnect,
  isNodeAccessible,
  nextNodePosition,
  normalizePayload,
  removeNodeFromGraph,
} from '@/utils/flow'

export const useFlowStore = defineStore('flow', {
  state: () => ({
    nodes: [],
    edges: [],
    hydrated: false,
    revision: 0,
  }),
  getters: {
    nodeById: (state) => (id) => state.nodes.find((node) => node.id === id) || null,
    accessibleCount: (state) => state.nodes.filter((node) => isNodeAccessible(node)).length,
  },
  actions: {
    hydrate(payload) {
      const normalized = normalizePayload(payload)
      this.nodes = normalized.nodes
      this.edges = normalized.edges
      this.hydrated = true
      this.revision += 1
    },
    snapshot() {
      return normalizePayload({ nodes: this.nodes, edges: this.edges })
    },
    createNode({ title, description, type }) {
      const bundle = buildNodeBundle({
        id: createId('node'),
        type,
        title: title.trim(),
        description: description.trim(),
        position: nextNodePosition(this.nodes),
      })
      this.nodes = [...this.nodes, ...bundle.nodes]
      this.edges = [...this.edges, ...bundle.edges]
      this.revision += 1
      return bundle.primary
    },
    updateNode(id, patch) {
      const node = this.nodes.find((item) => item.id === id)
      if (!node || !isNodeAccessible(node)) return false
      this.nodes = this.nodes.map((item) => (
        item.id === id ? { ...item, data: { ...item.data, ...patch } } : item
      ))
      this.revision += 1
      return true
    },
    updateNodePosition(id, position) {
      if (!position) return false
      const node = this.nodes.find((item) => item.id === id)
      if (!node) return false
      const x = Number(position.x)
      const y = Number(position.y)
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false
      if (Math.abs(node.position.x - x) < 0.5 && Math.abs(node.position.y - y) < 0.5) return false
      this.nodes = this.nodes.map((item) => (
        item.id === id ? { ...item, position: { x, y } } : item
      ))
      this.revision += 1
      return true
    },
    deleteNode(id) {
      const result = removeNodeFromGraph(this.nodes, this.edges, id)
      if (!result.removed) return result
      this.nodes = result.nodes
      this.edges = result.edges
      this.revision += 1
      return result
    },
    addEdge(connection) {
      const result = canConnect(connection, this.nodes, this.edges)
      if (!result.ok) return result
      const edge = {
        id: createId('edge'),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || 'out',
        targetHandle: connection.targetHandle || 'in',
        data: { locked: false },
      }
      this.edges = [...this.edges, edge]
      this.revision += 1
      return { ok: true, edge }
    },
    removeEdge(id) {
      const edge = this.edges.find((item) => item.id === id)
      if (!edge || edge.data?.locked) return false
      this.edges = this.edges.filter((item) => item.id !== id)
      this.revision += 1
      return true
    },
  },
})
