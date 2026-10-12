<script setup>
import { markRaw, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Panel,
  VueFlow,
  applyEdgeChanges,
  applyNodeChanges,
  useVueFlow,
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import OutcomeNode from '@/components/canvas/nodes/OutcomeNode.vue'
import WorkflowNode from '@/components/canvas/nodes/WorkflowNode.vue'
import { useFlowStore } from '@/stores/flowStore'
import { useToastStore } from '@/stores/toastStore'
import { canConnect, miniMapColor, reconcileEdges, reconcileNodes } from '@/utils/flow'

const emit = defineEmits(['node-click', 'pane-click', 'ready', 'create', 'persist'])

const route = useRoute()
const store = useFlowStore()
const toast = useToastStore()
const { fitView } = useVueFlow()

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
let syncing = false

function selectedId() {
  const id = route.params.nodeId
  return typeof id === 'string' ? id : null
}

function syncFromStore() {
  syncing = true
  flowNodes.value = reconcileNodes(flowNodes.value, store.nodes, {
    selectedId: selectedId(),
    draggingId: draggingId.value,
  })
  flowEdges.value = reconcileEdges(flowEdges.value, store.edges)
  nextTick(() => {
    syncing = false
  })
}

watch(() => [store.revision, route.params.nodeId], syncFromStore, { immediate: true })

function onNodesChange(changes) {
  const activeDrag = changes.find((change) => change.type === 'position' && change.dragging)
  if (activeDrag) draggingId.value = activeDrag.id
  flowNodes.value = applyNodeChanges(changes, flowNodes.value)
  if (syncing) return
  const ended = changes.filter((change) => (
    change.type === 'position' && change.dragging === false && change.position
  ))
  if (!ended.length) return
  draggingId.value = null
  const moved = ended.some((change) => store.updateNodePosition(change.id, change.position))
  if (moved) emit('persist')
}

function onEdgesChange(changes) {
  const lockedIds = new Set(store.edges.filter((edge) => edge.data?.locked).map((edge) => edge.id))
  const allowed = changes.filter((change) => !(change.type === 'remove' && lockedIds.has(change.id)))
  flowEdges.value = applyEdgeChanges(allowed, flowEdges.value)
  if (syncing) return
  const removed = allowed.filter((change) => change.type === 'remove')
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
  return canConnect(connection, store.nodes, store.edges).ok
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
      :apply-default="false"
      :delete-key-code="'Delete'"
      :is-valid-connection="isValidConnection"
      :connection-line-options="{ style: { stroke: '#ff7a59', strokeWidth: 2 } }"
      :default-edge-options="{ type: 'smoothstep', style: { stroke: '#ff7a59', strokeWidth: 2 } }"
      :min-zoom="0.35"
      :max-zoom="1.6"
      :nodes-draggable="true"
      elevate-nodes-on-select
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
      @connect="onConnect"
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
