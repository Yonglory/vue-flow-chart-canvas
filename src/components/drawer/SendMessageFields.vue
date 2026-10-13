<script setup>
import { computed, reactive, watch } from 'vue'
import { useFlowStore } from '../../stores/flowStore'
import { attachmentName } from '../../utils/describeNode'
import { validateAttachment, validateMessageText } from '../../utils/validation'

const props = defineProps({
  node: { type: Object, required: true },
})

const store = useFlowStore()
const drafts = reactive({})
const errors = reactive({})
const fileMessage = reactive({ text: '' })

const items = computed(() => props.node.data?.payload || [])
const empty = computed(() => items.value.length === 0)

watch(items, (payload) => {
  payload.forEach((item, index) => {
    if (item.type !== 'text') return
    const field = document.querySelector(`[data-text-index="${props.node.id}-${index}"]`)
    if (field === document.activeElement) return
    drafts[index] = item.text || ''
  })
}, { immediate: true, deep: true })

function saveText(index) {
  const value = drafts[index] ?? ''
  const problem = validateMessageText(value)
  errors[index] = problem
  if (problem) return
  const result = store.updateTextItem(props.node.id, index, value)
  errors[index] = result.text || ''
}

function removeItem(index) {
  store.removePayloadItem(props.node.id, index)
  delete drafts[index]
  delete errors[index]
}

function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  const problem = validateAttachment(file)
  fileMessage.text = problem
  if (problem || !file) return
  const reader = new FileReader()
  reader.onload = () => {
    store.addAttachment(props.node.id, String(reader.result || ''))
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <section class="section" aria-labelledby="message-fields">
    <h3 id="message-fields">Message</h3>
    <p class="hint">Each text stays in the payload. Remove a row to delete it. Images appear as tiles.</p>
    <p v-if="empty" class="error">Add a message or an attachment.</p>

    <div v-for="(item, index) in items" :key="`${item.type}-${index}`">
      <div v-if="item.type === 'text'" class="text-row">
        <label class="field">
          <span>Text</span>
          <textarea
            v-model="drafts[index]"
            rows="3"
            :data-text-index="`${node.id}-${index}`"
            @blur="saveText(index)"
          />
          <small v-if="errors[index]" class="error">{{ errors[index] }}</small>
        </label>
        <button class="ghost" type="button" @click="removeItem(index)">Remove</button>
      </div>
      <figure v-else-if="item.type === 'attachment'" class="tile">
        <img :src="item.attachment" alt="" />
        <figcaption>{{ attachmentName(item.attachment) }}</figcaption>
        <button class="ghost" type="button" @click="removeItem(index)">Remove</button>
      </figure>
    </div>

    <div class="actions-row" style="margin-top: 12px">
      <button class="ghost" type="button" @click="store.addTextItem(node.id)">Add text</button>
      <label class="upload">
        Upload image
        <input class="file-input" type="file" accept="image/*" @change="onFile" />
      </label>
    </div>
    <p v-if="fileMessage.text" class="error">{{ fileMessage.text }}</p>
  </section>
</template>

<style scoped>
.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.upload { position: relative; }
</style>
