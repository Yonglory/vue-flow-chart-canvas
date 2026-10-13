import { createRouter, createWebHistory } from 'vue-router'
import FlowCanvas from '../components/canvas/FlowCanvas.vue'
import { useFlowStore } from '../stores/flowStore'
import { findNode, isConnector } from '../utils/graph'

export const routes = [
  { path: '/', name: 'canvas', component: FlowCanvas },
  { path: '/nodes/:nodeId', name: 'node', component: FlowCanvas },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.name !== 'node') return true
  const store = useFlowStore()
  if (!store.hydrated) return true
  const node = findNode(store.nodes, to.params.nodeId)
  if (!node || isConnector(node)) return { name: 'canvas' }
  return true
})
