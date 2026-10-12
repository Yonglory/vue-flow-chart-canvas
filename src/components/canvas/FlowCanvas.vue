<script setup>
import { markRaw, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ConnectionMode, Panel, VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import OutcomeNode from '@/components/canvas/nodes/OutcomeNode.vue'
import WorkflowNode from '@/components/canvas/nodes/WorkflowNode.vue'
import { useFlowStore } from '@/stores/flowStore'
import { useToastStore } from '@/stores/toastStore'
import { canConnect, isGraphConnectionValid, miniMapColor, reconcileEdges, reconcileNodes } from '@/utils/flow'

const emit = defineEmits(['node-click', 'pane-click', 'ready', 'create', 'persist'])

const route = useRoute()
const store = useFlowStore()
const toast = useToastStore()
const { fitView, connectionStatus, connectionStartHandle, connectionEndHandle } = useVueFlow()

const nodeTypes = {
  trigger: markRaw(WorkflowNode),
  sendMessage: markRaw(WorkflowNode),
  addComment: markRaw(WorkflowNode),
  businessHours: markRaw(WorkflowNode),
  outcome: markRaw(OutcomeNode),
}

const flowNodes = ref([])
const flowEdges = ref([])
const draggingId = ref(null)

function selectedId() {
  const id = route.params.nodeId
  return typeof id === 'string' ? id : null
}

function syncFromStore() {
  flowNodes.value = reconcileNodes(flowNodes.value, store.nodes, {
    selectedId: selectedId(),
    draggingId: draggingId.value,
  })
  flowEdges.value = reconcileEdges(flowEdges.value, store.edges)
}

watch(() => [store.revision, route.params.nodeId], syncFromStore, { immediate: true })

function onDragStart(payload) {
  draggingId.value = payload?.node?.id || null
}

function onDragStop(payload) {
  const moved = payload?.nodes?.length ? payload.nodes : [payload?.node].filter(Boolean)
  const changed = moved.some((node) => store.updateNodePosition(node.id, node.position))
  draggingId.value = null
  if (changed) emit('persist')
}

function onEdgesChange(changes) {
  const removed = changes.filter((change) => change.type === 'remove')
  if (!removed.length) return
  const changed = removed.some((change) => store.removeEdge(change.id))
  if (changed) emit('persist')
}

function onConnect(connection) {
  const result = store.addEdge(connection)
  if (!result.ok) {
    toast.error(result.reason)
    return
  }
  syncFromStore()
  emit('persist')
}

function isValidConnection(connection) {
  return isGraphConnectionValid(connection, store.nodes, store.edges)
}

function onConnectEnd() {
  if (connectionStatus.value !== 'invalid') return
  const start = connectionStartHandle.value
  const end = connectionEndHandle.value
  if (!start?.nodeId || !end?.nodeId) return
  const fromSource = start.type !== 'target'
  const connection = fromSource
    ? {
      source: start.nodeId,
      sourceHandle: start.id,
      target: end.nodeId,
      targetHandle: end.id,
    }
    : {
      source: end.nodeId,
      sourceHandle: end.id,
      target: start.nodeId,
      targetHandle: start.id,
    }
  const result = canConnect(connection, store.nodes, store.edges)
  toast.error(result.ok ? 'That connection is not allowed.' : result.reason)
}

function onNodeClick(payload) {
  emit('node-click', payload.node)
}

function onPaneClick() {
  emit('pane-click')
}

function onReady() {
  const id = selectedId()
  if (id && store.nodeById(id)) {
    fitView({ nodes: [id], padding: 0.45, duration: 450 })
  } else {
    fitView({ padding: 0.22, duration: 450 })
  }
  emit('ready')
}

function focusNode(id) {
  fitView({ nodes: [id], padding: 0.5, duration: 450 })
}

defineExpose({ focusNode, syncFromStore })
</script>

<template>
  <div class="flow-canvas" data-testid="flow-canvas">
    <VueFlow
      :nodes="flowNodes"
      :edges="flowEdges"
      :node-types="nodeTypes"
      :delete-key-code="'Delete'"
      :is-valid-connection="isValidConnection"
      :connection-line-options="{ style: { stroke: '#ff7a59', strokeWidth: 2 } }"
      :default-edge-options="{ type: 'smoothstep', style: { stroke: '#ff7a59', strokeWidth: 2 } }"
      :min-zoom="0.35"
      :max-zoom="1.6"
      :nodes-draggable="true"
      :connection-mode="ConnectionMode.Loose"
      :connection-radius="80"
      elevate-nodes-on-select
      @node-drag-start="onDragStart"
      @node-drag-stop="onDragStop"
      @edges-change="onEdgesChange"
      @connect="onConnect"
      @connect-end="onConnectEnd"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @init="onReady"
    >
      <Background variant="dots" :gap="22" :size="1.35" pattern-color="#d5d9e2" />
      <Controls position="bottom-left" />
      <MiniMap
        position="bottom-right"
        pannable
        zoomable
        :node-color="miniMapColor"
        mask-color="rgba(245, 246, 248, 0.72)"
      />
      <Panel position="bottom-center">
        <p class="canvas-hint">Drag a step to move it. Pull a circle handle to connect steps.</p>
      </Panel>
    </VueFlow>
    <div v-if="!store.nodes.length" class="empty-canvas">
      <div class="empty-card">
        <h2>No steps yet</h2>
        <p>Create a step to start the workflow.</p>
        <button type="button" class="btn btn-primary" data-testid="empty-create" @click="emit('create')">
          Create New Node
        </button>
      </div>
    </div>
  </div>
</template>
