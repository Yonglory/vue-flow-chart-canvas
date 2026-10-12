<script setup>
import { reactive, watch } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import Icon from '@/components/icons/Icon.vue'
import { CREATABLE_TYPES } from '@/constants/flow'
import { LIMITS, validateNodeDraft } from '@/utils/validation'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  title: '',
  description: '',
  type: '',
})
const errors = reactive({
  title: '',
  description: '',
  type: '',
})

function reset() {
  form.title = ''
  form.description = ''
  form.type = ''
  errors.title = ''
  errors.description = ''
  errors.type = ''
}

watch(() => props.open, (isOpen) => {
  if (isOpen) reset()
})

function onSubmit() {
  const result = validateNodeDraft(form)
  errors.title = result.errors.title
  errors.description = result.errors.description
  errors.type = result.errors.type
  if (!result.valid) return
  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim(),
    type: form.type,
  })
}
</script>

<template>
  <AppDialog :open="open" title="Create New Node" labelled-by="create-node-title" @close="emit('close')">
    <template #close-icon>
      <Icon name="close" />
    </template>
    <form class="dialog-form" novalidate @submit.prevent="onSubmit">
      <p class="dialog-copy">Add a step to the canvas. You can edit its details after it is created.</p>
      <div class="field" :class="{ 'has-error': errors.title }">
        <div class="field-label-row">
          <label for="node-title">Title</label>
          <span class="counter">{{ form.title.trim().length }}/{{ LIMITS.title }}</span>
        </div>
        <input
          id="node-title"
          v-model="form.title"
          type="text"
          :maxlength="LIMITS.title"
          autocomplete="off"
          @blur="errors.title = validateNodeDraft(form).errors.title"
        />
        <p v-if="errors.title" class="field-error" role="alert">{{ errors.title }}</p>
      </div>
      <div class="field" :class="{ 'has-error': errors.description }">
        <div class="field-label-row">
          <label for="node-description">Description</label>
          <span class="counter">{{ form.description.trim().length }}/{{ LIMITS.description }}</span>
        </div>
        <textarea
          id="node-description"
          v-model="form.description"
          rows="3"
          :maxlength="LIMITS.description"
          @blur="errors.description = validateNodeDraft(form).errors.description"
        />
        <p v-if="errors.description" class="field-error" role="alert">{{ errors.description }}</p>
      </div>
      <div class="field" :class="{ 'has-error': errors.type }">
        <div class="field-label-row">
          <label for="node-type">Type of Node</label>
        </div>
        <select
          id="node-type"
          v-model="form.type"
          @change="errors.type = ''"
        >
          <option value="" disabled>Select a type</option>
          <option v-for="option in CREATABLE_TYPES" :key="option.value" :value="option.value">
            {{ option.label }} ({{ option.value }})
          </option>
        </select>
        <p v-if="form.type" class="field-hint">
          {{ CREATABLE_TYPES.find((option) => option.value === form.type)?.hint }}
        </p>
        <p v-if="errors.type" class="field-error" role="alert">{{ errors.type }}</p>
      </div>
      <footer class="dialog-actions">
        <button type="button" class="btn btn-ghost" @click="emit('close')">Cancel</button>
        <button type="submit" class="btn btn-primary" data-testid="create-node-submit">Create New Node</button>
      </footer>
    </form>
  </AppDialog>
</template>
