<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { CREATE_TYPES, LIMITS } from '../../utils/constants'
import { validateCreate } from '../../utils/validation'

const emit = defineEmits(['close', 'create'])

const form = reactive({
  title: '',
  description: '',
  type: 'sendMessage',
})
const errors = ref({})
const titleInput = ref(null)

function submit() {
  errors.value = validateCreate(form)
  if (Object.keys(errors.value).length) return
  emit('create', { ...form })
}

onMounted(() => nextTick(() => titleInput.value?.focus()))
</script>

<template>
  <div class="modal-back" @click.self="emit('close')">
    <form class="modal" role="dialog" aria-modal="true" aria-labelledby="create-title" @submit.prevent="submit">
      <p class="eyebrow">New step</p>
      <h2 id="create-title">Create New Node</h2>
      <p class="hint">It hangs under the selected card. With nothing selected, it hangs under the trigger.</p>

      <label class="field">
        <span>Title</span>
        <input
          ref="titleInput"
          v-model="form.title"
          name="title"
          maxlength="80"
          aria-describedby="title-error"
          :aria-invalid="Boolean(errors.title)"
        />
        <small v-if="errors.title" id="title-error" class="error">{{ errors.title }}</small>
      </label>

      <label class="field">
        <span>Description</span>
        <textarea
          v-model="form.description"
          name="description"
          :maxlength="LIMITS.description"
          aria-describedby="description-error"
          :aria-invalid="Boolean(errors.description)"
        />
        <small class="hint">{{ form.description.length }}/{{ LIMITS.description }}</small>
        <small v-if="errors.description" id="description-error" class="error">{{ errors.description }}</small>
      </label>

      <label class="field">
        <span>Type of Node</span>
        <select v-model="form.type" name="type" aria-describedby="type-error" :aria-invalid="Boolean(errors.type)">
          <option v-for="option in CREATE_TYPES" :key="option.value" :value="option.value">
            {{ option.label }} ({{ option.value }})
          </option>
        </select>
        <small v-if="errors.type" id="type-error" class="error">{{ errors.type }}</small>
      </label>

      <div class="actions-row">
        <button class="ghost" type="button" @click="emit('close')">Cancel</button>
        <button class="primary" type="submit">Add to canvas</button>
      </div>
    </form>
  </div>
</template>
