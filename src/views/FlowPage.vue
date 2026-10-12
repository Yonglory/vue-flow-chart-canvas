<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FlowCanvas from '@/components/canvas/FlowCanvas.vue'
import NodeDrawer from '@/components/drawer/NodeDrawer.vue'
import Icon from '@/components/icons/Icon.vue'
import CreateNodeDialog from '@/components/nodes/CreateNodeDialog.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import ToastStack from '@/components/ui/ToastStack.vue'
import { useFlowSync } from '@/composables/useFlowSync'
import { useFlowStore } from '@/stores/flowStore'
import { useToastStore } from '@/stores/toastStore'
import { debounce } from '@/utils/debounce'
import { drawerRouteState, isNodeAccessible } from '@/utils/flow'

const route = useRoute()
const router = useRouter()
const store = useFlowStore()
const toast = useToastStore()
const { isLoading, isError, isSaving, error, retry, persist, reset } = useFlowSync()

const canvas = ref(null)
const createOpen = ref(false)
const resetOpen = ref(false)
const status = ref('Saved')

const activeNode = computed(() => {
  const state = drawerRouteState(route.params.nodeId, store.nodes)
  return state.status === 'open' ? state.node : null
})

const stepLabel = computed(() => {
  const count = store.accessibleCount
  return `${count} ${count === 1 ? 'step' : 'steps'}`
})

const schedulePersist = debounce(() => {
  persistNow()
}, 220)

async function persistNow() {
  status.value = 'Saving…'
  try {
    await persist()
    status.value = 'Saved'
  } catch (err) {
    status.value = 'Not saved'
    toast.error(err?.message || 'The workflow could not be saved.')
  }
}

function queuePersist() {
  schedulePersist()
}

function onUpdate(patch) {
  if (!activeNode.value) return
  store.updateNode(activeNode.value.id, patch)
  queuePersist()
}

async function onDelete() {
  const id = activeNode.value?.id
  if (!id) return
  schedulePersist.cancel()
  store.deleteNode(id)
  await router.push({ name: 'canvas' })
  await persistNow()
}

async function onCreate(draft) {
  const node = store.createNode(draft)
  createOpen.value = false
  await router.push({ name: 'node', params: { nodeId: node.id } })
  await persistNow()
  requestAnimationFrame(() => canvas.value?.focusNode(node.id))
}

function onNodeClick(node) {
  if (!isNodeAccessible(node)) {
    toast.info('Success and failure steps are display-only.')
    return
  }
  if (route.params.nodeId === node.id) {
    closeDrawer()
    return
  }
  router.push({ name: 'node', params: { nodeId: node.id } })
}

function closeDrawer() {
  schedulePersist.cancel()
  persistNow()
  if (route.name !== 'canvas') router.push({ name: 'canvas' })
}

function onPaneClick() {
  if (route.name === 'node') closeDrawer()
}

async function confirmReset() {
  resetOpen.value = false
  schedulePersist.cancel()
  try {
    await reset()
    status.value = 'Saved'
    toast.info('Workflow restored from payload.json.')
    if (route.name !== 'canvas') router.push({ name: 'canvas' })
  } catch (err) {
    toast.error(err?.message || 'The workflow could not be restored.')
  }
}

function onCanvasPersist() {
  schedulePersist.cancel()
  persistNow()
}

watch(() => [route.params.nodeId, store.hydrated], () => {
  if (!store.hydrated) return
  const state = drawerRouteState(route.params.nodeId, store.nodes)
  if (state.status === 'missing') {
    toast.error('That step could not be found.')
    router.replace({ name: 'canvas' })
  } else if (state.status === 'display-only') {
    toast.info('Success and failure steps are display-only.')
    router.replace({ name: 'canvas' })
  }
})

function onKeydown(event) {
  if (event.key !== 'Escape' || createOpen.value || resetOpen.value) return
  if (route.name === 'node') closeDrawer()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  schedulePersist.cancel()
})
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="brand">
        <span class="mark" aria-hidden="true">
          <Icon name="trigger" />
        </span>
        <div>
          <p class="brand-name">Flowline</p>
          <p class="brand-sub">Workflow canvas</p>
        </div>
      </div>
      <div class="header-actions">
        <span v-if="store.hydrated" class="step-count">{{ stepLabel }}</span>
        <button type="button" class="btn btn-ghost" data-testid="reset-workflow" @click="resetOpen = true">
          <Icon name="reset" />
          Reset
        </button>
        <button type="button" class="btn btn-primary" data-testid="create-node-button" @click="createOpen = true">
          <Icon name="plus" />
          Create New Node
        </button>
      </div>
    </header>

    <div class="stage" :class="{ 'is-open': Boolean(activeNode) }">
      <div class="canvas-wrap">
        <div v-if="isLoading" class="status-card" data-testid="loading-state">
          <p>Loading workflow…</p>
        </div>
        <div v-else-if="isError" class="status-card" data-testid="error-state">
          <h2>The workflow could not be loaded</h2>
          <p>{{ error?.message || 'Check the payload and try again.' }}</p>
          <button type="button" class="btn btn-primary" @click="retry">Try again</button>
        </div>
        <FlowCanvas
          v-else
          ref="canvas"
          @node-click="onNodeClick"
          @pane-click="onPaneClick"
          @create="createOpen = true"
          @persist="onCanvasPersist"
        />
      </div>
      <aside class="drawer" :aria-hidden="!activeNode">
        <NodeDrawer
          v-if="activeNode"
          :node="activeNode"
          :saving="isSaving"
          :status="status"
          @close="closeDrawer"
          @update="onUpdate"
          @delete="onDelete"
        />
      </aside>
      <button
        v-if="activeNode"
        type="button"
        class="drawer-backdrop"
        aria-label="Close details"
        @click="closeDrawer"
      />
    </div>

    <CreateNodeDialog :open="createOpen" @close="createOpen = false" @submit="onCreate" />
    <AppDialog :open="resetOpen" title="Restore the original workflow?" labelled-by="reset-title" @close="resetOpen = false">
      <template #close-icon>
        <Icon name="close" />
      </template>
      <div class="dialog-form">
        <p class="dialog-copy">
          This reloads payload.json and clears the changes saved in this browser.
        </p>
        <footer class="dialog-actions">
          <button type="button" class="btn btn-ghost" @click="resetOpen = false">Cancel</button>
          <button type="button" class="btn btn-danger" data-testid="confirm-reset" @click="confirmReset">
            Restore
          </button>
        </footer>
      </div>
    </AppDialog>
    <ToastStack />
  </div>
</template>
