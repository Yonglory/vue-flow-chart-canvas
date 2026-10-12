<script setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import BusinessHoursFields from '@/components/drawer/BusinessHoursFields.vue'
import CommentFields from '@/components/drawer/CommentFields.vue'
import SendMessageFields from '@/components/drawer/SendMessageFields.vue'
import { NODE_TYPES } from '@/constants/flow'
import { nodeAppearance } from '@/utils/flow'
import { LIMITS, validateDescription, validateTitle } from '@/utils/validation'

const props = defineProps({
  node: { type: Object, required: true },
  saving: { type: Boolean, default: false },
  status: { type: String, default: 'Saved' },
})

const emit = defineEmits(['close', 'update', 'delete'])

const title = ref(props.node.data.title)
const description = ref(props.node.data.description)
const titleError = ref('')
const descriptionError = ref('')
const confirming = ref(false)
const titleInput = ref(null)

const appearance = computed(() => nodeAppearance(props.node.type))
const deleteCopy = computed(() => (
  props.node.type === NODE_TYPES.businessHours
    ? 'Delete this step, its connections, and the success and failure branches?'
    : 'Delete this step and its connections?'
))

watch(() => props.node.id, () => {
  title.value = props.node.data.title
  description.value = props.node.data.description
  titleError.value = ''
  descriptionError.value = ''
  confirming.value = false
  requestAnimationFrame(() => titleInput.value?.focus())
}, { immediate: true })

function commitTitle() {
  titleError.value = validateTitle(title.value)
  if (titleError.value) return
  const next = title.value.trim()
  if (next === props.node.data.title) return
  emit('update', { title: next })
}

function commitDescription() {
  descriptionError.value = validateDescription(description.value)
  if (descriptionError.value) return
  const next = description.value.trim()
  if (next === props.node.data.description) return
  emit('update', { description: next })
}
</script>

<template>
  <div class="drawer-inner" data-testid="node-drawer">
    <header class="drawer-header">
      <div class="drawer-type" :class="`tone-${appearance.tone}`">
        <span class="node-icon">
          <Icon :name="appearance.icon" />
        </span>
        <div>
          <p class="eyebrow">{{ appearance.label }}</p>
          <p class="save-state">{{ saving ? 'Saving…' : status }}</p>
        </div>
      </div>
      <button type="button" class="icon-button" aria-label="Close details" data-testid="close-drawer" @click="emit('close')">
        <Icon name="close" />
      </button>
    </header>
    <div class="drawer-body">
      <div class="field" :class="{ 'has-error': titleError }">
        <div class="field-label-row">
          <label for="drawer-title">Title</label>
          <span class="counter">{{ title.trim().length }}/{{ LIMITS.title }}</span>
        </div>
        <input
          id="drawer-title"
          ref="titleInput"
          v-model="title"
          type="text"
          :maxlength="LIMITS.title"
          autocomplete="off"
          @input="commitTitle"
          @blur="commitTitle"
        />
        <p v-if="titleError" class="field-error" role="alert">{{ titleError }}</p>
      </div>
      <div class="field" :class="{ 'has-error': descriptionError }">
        <div class="field-label-row">
          <label for="drawer-description">Description</label>
          <span class="counter">{{ description.trim().length }}/{{ LIMITS.description }}</span>
        </div>
        <textarea
          id="drawer-description"
          v-model="description"
          rows="3"
          :maxlength="LIMITS.description"
          @input="commitDescription"
          @blur="commitDescription"
        />
        <p v-if="descriptionError" class="field-error" role="alert">{{ descriptionError }}</p>
      </div>
      <SendMessageFields
        v-if="node.type === NODE_TYPES.sendMessage"
        :key="`${node.id}-message`"
        :texts="node.data.texts"
        :attachments="node.data.attachments"
        @change="emit('update', $event)"
      />
      <CommentFields
        v-else-if="node.type === NODE_TYPES.addComment"
        :key="`${node.id}-comment`"
        :comment="node.data.comment"
        @change="emit('update', $event)"
      />
      <BusinessHoursFields
        v-else-if="node.type === NODE_TYPES.businessHours"
        :key="`${node.id}-hours`"
        :timezone="node.data.timezone"
        :schedule="node.data.schedule"
        @change="emit('update', $event)"
      />
      <p v-else class="section-note">This trigger starts the workflow. Edit the title and description, or remove the step.</p>
    </div>
    <footer class="drawer-footer">
      <template v-if="!confirming">
        <button type="button" class="btn btn-danger" data-testid="delete-node-button" @click="confirming = true">
          <Icon name="trash" />
          Delete step
        </button>
      </template>
      <template v-else>
        <p>{{ deleteCopy }}</p>
        <div class="footer-actions">
          <button type="button" class="btn btn-ghost" @click="confirming = false">Cancel</button>
          <button type="button" class="btn btn-danger" data-testid="confirm-delete-button" @click="emit('delete')">
            Delete
          </button>
        </div>
      </template>
    </footer>
  </div>
</template>
