<script setup>
import { computed, ref, watch } from 'vue'
import { useFlowStore } from '../../stores/flowStore'
import { LIMITS } from '../../utils/constants'
import { nodeDescription, nodeTitle, typeLabel } from '../../utils/describeNode'
import { canDelete } from '../../utils/graph'
import { truncate } from '../../utils/truncate'
import NodeIcon from '../canvas/nodes/NodeIcon.vue'
import SendMessageFields from './SendMessageFields.vue'
import CommentFields from './CommentFields.vue'
import BusinessHoursFields from './BusinessHoursFields.vue'
import TriggerFields from './TriggerFields.vue'

const props = defineProps({
  node: { type: Object, required: true },
})

const emit = defineEmits(['close', 'deleted'])
const store = useFlowStore()

const title = ref('')
const description = ref('')
const errors = ref({ title: '', description: '' })
const confirming = ref(false)

const live = computed(() => store.nodes.find((item) => String(item.id) === String(props.node.id)) || props.node)
const tone = computed(() => {
  if (live.value.type === 'sendMessage') return 'message'
  if (live.value.type === 'addComment') return 'comment'
  if (live.value.type === 'dateTime') return 'hours'
  return 'trigger'
})
const derived = computed(() => {
  const plain = { ...live.value }
  delete plain.description
  return nodeDescription(plain)
})

function syncDrafts(node) {
  const titleField = document.getElementById('node-title')
  const descriptionField = document.getElementById('node-description')
  if (document.activeElement !== titleField) {
    title.value = node.name || ''
  }
  if (document.activeElement !== descriptionField) {
    description.value = node.description ?? nodeDescription({ ...node, description: undefined })
  }
}

watch(live, (node) => {
  confirming.value = false
  syncDrafts(node)
}, { immediate: true })

function saveTitle() {
  const result = store.updateTitle(live.value.id, title.value)
  errors.value = { ...errors.value, title: result.title || '' }
}

function saveDescription() {
  const value = description.value.trim()
  if (value === derived.value.trim() && !live.value.description) {
    errors.value = { ...errors.value, description: '' }
    return
  }
  const result = store.updateDescription(live.value.id, description.value)
  errors.value = { ...errors.value, description: result.description || '' }
}

function onDelete() {
  if (store.deleteNode(live.value.id)) emit('deleted')
}
</script>

<template>
  <aside class="drawer" role="dialog" aria-labelledby="drawer-title">
    <div class="drawer__scroll">
      <header class="drawer__head">
        <div class="drawer-icon" :class="`tone-${tone}`">
          <NodeIcon :name="tone" />
        </div>
        <div>
          <p class="eyebrow">{{ typeLabel(live) }}</p>
          <h2 id="drawer-title">{{ nodeTitle(live) }}</h2>
        </div>
        <button class="close" type="button" @click="emit('close')">Close</button>
      </header>

      <form @submit.prevent="saveTitle">
        <label class="field">
          <span>Title</span>
          <input
            id="node-title"
            v-model="title"
            :maxlength="LIMITS.title"
            :aria-invalid="Boolean(errors.title)"
            @blur="saveTitle"
          />
          <small v-if="errors.title" class="error">{{ errors.title }}</small>
        </label>

        <label class="field">
          <span>Description</span>
          <textarea
            id="node-description"
            v-model="description"
            :maxlength="LIMITS.description"
            :aria-invalid="Boolean(errors.description)"
            @blur="saveDescription"
          />
          <small class="hint">{{ description.length }}/{{ LIMITS.description }}. On the canvas: {{ truncate(nodeDescription(live)) || 'empty' }}</small>
          <small v-if="errors.description" class="error">{{ errors.description }}</small>
        </label>
      </form>

      <TriggerFields v-if="live.type === 'trigger'" :node="live" />
      <SendMessageFields v-else-if="live.type === 'sendMessage'" :node="live" />
      <CommentFields v-else-if="live.type === 'addComment'" :node="live" />
      <BusinessHoursFields v-else-if="live.type === 'dateTime'" :node="live" />

      <div v-if="canDelete(live)" class="section">
        <div v-if="!confirming">
          <button class="danger" type="button" @click="confirming = true">Delete</button>
        </div>
        <div v-else class="confirm">
          <p>Delete this node and everything below it?</p>
          <button class="ghost" type="button" @click="confirming = false">Cancel</button>
          <button class="danger" type="button" @click="onDelete">Delete</button>
        </div>
      </div>
    </div>
  </aside>
</template>
