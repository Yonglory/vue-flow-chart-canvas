<script setup>
import { nextTick, ref } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { createId } from '@/utils/id'
import {
  formatBytes,
  isImageAttachment,
  readFileAsDataUrl,
  validateAttachment,
} from '@/utils/files'
import { LIMITS, validateMessageText } from '@/utils/validation'

const props = defineProps({
  texts: { type: Array, default: () => [] },
  attachments: { type: Array, default: () => [] },
})

const emit = defineEmits(['change'])

const texts = ref(props.texts.map((item) => String(item)))
const textErrors = ref(props.texts.map(() => ''))
const attachmentError = ref('')
const inputRefs = ref([])
const uploading = ref(false)

function commitTexts() {
  textErrors.value = texts.value.map((value) => validateMessageText(value))
  if (textErrors.value.some(Boolean)) return false
  emit('change', { texts: texts.value.map((value) => value.trim()) })
  return true
}

function addText() {
  if (texts.value.length && !commitTexts()) return
  texts.value.push('')
  textErrors.value.push('')
  nextTick(() => inputRefs.value[texts.value.length - 1]?.focus())
}

function removeText(index) {
  texts.value.splice(index, 1)
  textErrors.value.splice(index, 1)
  commitTexts()
}

function removeAttachment(id) {
  attachmentError.value = ''
  emit('change', {
    attachments: props.attachments.filter((file) => file.id !== id),
  })
}

async function onFiles(event) {
  const selected = [...(event.target.files || [])]
  event.target.value = ''
  if (!selected.length) return
  attachmentError.value = ''
  const next = [...props.attachments]
  uploading.value = true
  try {
    for (const file of selected) {
      const result = validateAttachment(file, { existingCount: next.length })
      if (!result.valid) {
        attachmentError.value = result.errors[0]
        continue
      }
      const dataUrl = await readFileAsDataUrl(file)
      next.push({
        id: createId('file'),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        url: '',
        dataUrl,
      })
    }
    if (next.length !== props.attachments.length) emit('change', { attachments: next })
  } catch (error) {
    attachmentError.value = error.message || 'The file could not be read.'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <section class="drawer-section" data-testid="send-message-fields">
    <header class="section-head">
      <h3>Message</h3>
      <p>Show existing text, edit it, or remove it. Attachments appear as tiles.</p>
    </header>
    <div v-if="!texts.length" class="empty-inline">No message text yet.</div>
    <div v-for="(text, index) in texts" :key="index" class="stack-row">
      <div class="field" :class="{ 'has-error': textErrors[index] }">
        <div class="field-label-row">
          <label :for="`message-text-${index}`">Text {{ index + 1 }}</label>
          <span class="counter">{{ text.trim().length }}/{{ LIMITS.message }}</span>
        </div>
        <div class="inline-field">
          <textarea
            :id="`message-text-${index}`"
            :ref="(element) => { inputRefs[index] = element }"
            v-model="texts[index]"
            rows="3"
            :maxlength="LIMITS.message"
            @input="commitTexts"
          />
          <button
            type="button"
            class="icon-button"
            :aria-label="`Remove message text ${index + 1}`"
            @click="removeText(index)"
          >
            <Icon name="trash" />
          </button>
        </div>
        <p v-if="textErrors[index]" class="field-error" role="alert">{{ textErrors[index] }}</p>
      </div>
    </div>
    <button type="button" class="btn btn-subtle" data-testid="add-message-text" @click="addText">
      <Icon name="plus" />
      Add text
    </button>

    <div class="attachment-block">
      <div class="field-label-row">
        <h4>Attachments</h4>
        <span class="counter">{{ attachments.length }}/{{ LIMITS.attachments }}</span>
      </div>
      <ul v-if="attachments.length" class="tiles">
        <li v-for="file in attachments" :key="file.id" class="tile">
          <img v-if="isImageAttachment(file)" :src="file.dataUrl || file.url" :alt="file.name" />
          <div v-else class="tile-fallback">
            <Icon name="file" />
          </div>
          <div class="tile-meta">
            <span class="tile-name" :title="file.name">{{ file.name }}</span>
            <span class="tile-size">{{ formatBytes(file.size) }}</span>
          </div>
          <button type="button" class="icon-button tile-remove" :aria-label="`Remove ${file.name}`" @click="removeAttachment(file.id)">
            <Icon name="close" />
          </button>
        </li>
      </ul>
      <p v-else class="empty-inline">No attachments yet.</p>
      <label class="upload-drop">
        <Icon name="upload" />
        <span>{{ uploading ? 'Reading file…' : 'Upload image or PDF' }}</span>
        <input
          type="file"
          accept="image/*,.pdf,application/pdf"
          multiple
          data-testid="attachment-input"
          :disabled="uploading"
          @change="onFiles"
        />
      </label>
      <p v-if="attachmentError" class="field-error" role="alert">{{ attachmentError }}</p>
    </div>
  </section>
</template>
