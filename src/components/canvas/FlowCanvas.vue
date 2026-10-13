<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVueFlow, VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useFlowPayload } from '../../query/useFlowPayload'
import { toFlowEdges, toFlowNodes } from '../../utils/flowElements'
import { canDelete, findNode, isConnector, routeForNodeClick } from '../../utils/graph'
import { isTypingTarget, moveSelection } from '../../utils/keyboard'
import TriggerNode from './nodes/TriggerNode.vue'
import MessageNode from './nodes/MessageNode.vue'
import CommentNode from './nodes/CommentNode.vue'
import BusinessHoursNode from './nodes/BusinessHoursNode.vue'
import ConnectorNode from './nodes/ConnectorNode.vue'
import CreateNodeDialog from '../create/CreateNodeDialog.vue'
import NodeDrawer from '../drawer/NodeDrawer.vue'
import NodeIcon from './nodes/NodeIcon.vue'

const route = useRoute()
const router = useRouter()
const { query, store } = useFlowPayload()
const { fitView, onNodesInitialized } = useVueFlow('conversation')

const isPending = query.isPending
const isError = query.isError
const error = query.error
const refetch = query.refetch

const flowNodes = ref([])
const flowEdges = ref([])
const createOpen = ref(false)
const shell = ref(null)
const fitted = ref(false)

watch(
  () => [store.nodes, store.positions, store.selectedId],
  () => {
    flowNodes.value = toFlowNodes(store.nodes, store.positions, store.selectedId)
    flowEdges.value = toFlowEdges(store.nodes)
  },
  { immediate: true },
)

onNodesInitialized(async () => {
  if (!store.hydrated || fitted.value || !store.nodes.length) return
  await nextTick()
  fitView({ padding: 0.24, duration: 450 })
  fitted.value = true
})

const activeNode = computed(() => {
  const id = route.params.nodeId
  if (!id) return null
  const node = findNode(store.nodes, id)
  if (!node || isConnector(node)) return null
  return node
})

watch(
  () => [route.params.nodeId, store.hydrated, store.nodes.length],
  () => {
    const id = route.params.nodeId
    if (!id || !store.hydrated) return
    const node = findNode(store.nodes, id)
    if (!node || isConnector(node)) {
      router.replace({ name: 'canvas' })
      return
    }
    store.select(node.id)
  },
  { immediate: true },
)

function onNodeClick({ node }) {
  const payload = node?.data
  if (!payload) return
  store.select(payload.id)
  const destination = routeForNodeClick(payload)
  if (!destination) return
  router.push(destination)
}

function onDragStop({ node }) {
  store.moveNode(node.id, node.position)
}

function closeDrawer() {
  if (route.name === 'node') router.push({ name: 'canvas' })
}

function onCreate(form) {
  const created = store.createFromForm(form)
  createOpen.value = false
  if (!created) return
  router.push({ name: 'node', params: { nodeId: String(created.id) } })
}

function onDeleted() {
  router.push({ name: 'canvas' })
}

function onKeydown(event) {
  const key = event.key
  const meta = event.metaKey || event.ctrlKey

  if (key === 'Escape') {
    if (createOpen.value) {
      createOpen.value = false
      return
    }
    if (route.name === 'node') {
      event.preventDefault()
      closeDrawer()
    }
    return
  }

  if (isTypingTarget(event.target)) return

  if (meta && key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) store.redo()
    else store.undo()
    return
  }

  if (meta && key.toLowerCase() === 'y') {
    event.preventDefault()
    store.redo()
    return
  }

  if (key === 'ArrowDown' || key === 'ArrowUp') {
    event.preventDefault()
    const next = moveSelection(store.nodes, store.selectedId, key === 'ArrowDown' ? 'down' : 'up')
    if (next != null) store.select(next)
    return
  }

  if (key === 'Enter') {
    const node = findNode(store.nodes, store.selectedId)
    const destination = routeForNodeClick(node)
    if (!destination) return
    event.preventDefault()
    router.push(destination)
    return
  }

  if (key === 'Backspace' || key === 'Delete') {
    const node = findNode(store.nodes, store.selectedId)
    if (!canDelete(node)) return
    event.preventDefault()
    const removedId = node.id
    store.deleteNode(removedId)
    if (route.params.nodeId && String(route.params.nodeId) === String(removedId)) {
      router.push({ name: 'canvas' })
    }
  }
}

function miniColor(node) {
  const payload = node.data || {}
  if (payload.type === 'trigger') return '#6456c8'
  if (payload.type === 'sendMessage') return '#1f8a7b'
  if (payload.type === 'addComment') return '#b7791f'
  if (payload.type === 'dateTime') return '#e15a3a'
  return payload.data?.connectorType === 'failure' ? '#1f8a7b' : '#e15a3a'
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  shell.value?.focus()
})

onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div ref="shell" class="shell" tabindex="0" aria-label="Conversation flow canvas">
    <header class="topbar">
      <div class="brand">
        <span class="mark" aria-hidden="true"><NodeIcon name="trigger" /></span>
        <div>
          <h1>Flow</h1>
          <p>Click a card to edit it</p>
        </div>
      </div>
      <div class="actions">
        <button class="icon-button" type="button" aria-keyshortcuts="Meta+Z" :disabled="!store.canUndo" @click="store.undo()">Undo</button>
        <button class="icon-button" type="button" aria-keyshortcuts="Meta+Shift+Z" :disabled="!store.canRedo" @click="store.redo()">Redo</button>
        <button class="primary" type="button" @click="createOpen = true">Create New Node</button>
      </div>
    </header>

    <p v-if="isPending" class="status">Loading the flow…</p>
    <p v-else-if="isError" class="status" role="alert">
      {{ error?.message || 'The flow could not be loaded.' }}
      <button type="button" @click="refetch()">Try again</button>
    </p>

    <VueFlow
      id="conversation"
      class="canvas"
      :nodes="flowNodes"
      :edges="flowEdges"
      :nodes-connectable="false"
      :min-zoom="0.35"
      :max-zoom="1.6"
      @node-click="onNodeClick"
      @node-drag-stop="onDragStop"
    >
      <template #node-trigger="props"><TriggerNode v-bind="props" /></template>
      <template #node-sendMessage="props"><MessageNode v-bind="props" /></template>
      <template #node-addComment="props"><CommentNode v-bind="props" /></template>
      <template #node-businessHours="props"><BusinessHoursNode v-bind="props" /></template>
      <template #node-connector="props"><ConnectorNode v-bind="props" /></template>
      <Background variant="dots" pattern-color="#d9cfc2" :gap="22" :size="1.3" />
      <Controls :show-interactive="false" />
      <MiniMap position="bottom-left" pannable zoomable :node-color="miniColor" />
    </VueFlow>

    <Transition name="drawer">
      <NodeDrawer v-if="activeNode" :node="activeNode" @close="closeDrawer" @deleted="onDeleted" />
    </Transition>

    <CreateNodeDialog v-if="createOpen" @close="createOpen = false" @create="onCreate" />
  </div>
</template>
