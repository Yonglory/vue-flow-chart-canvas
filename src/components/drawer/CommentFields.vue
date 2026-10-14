<script setup>
import { ref, watch } from 'vue'
import { useFlowStore } from '../../stores/flowStore'
import { LIMITS } from '../../utils/constants'

const props = defineProps({
  node: { type: Object, required: true },
})

const store = useFlowStore()
const comment = ref('')
const error = ref('')

watch(() => props.node.data?.comment, (value) => {
  const field = document.getElementById(`comment-${props.node.id}`)
  if (field === document.activeElement) return
  comment.value = value || ''
}, { immediate: true })

function save() {
  const result = store.updateComment(props.node.id, comment.value)
  error.value = result.comment || ''
}

function remove() {
  comment.value = ''
  error.value = ''
  store.updateComment(props.node.id, '')
}
</script>

<template>
  <section class="section" aria-labelledby="comment-fields">
    <h3 id="comment-fields">Comment</h3>
    <label class="field">
      <span class="field-head">
        <span class="field-label">Existing comment</span>
        <small>{{ comment.length }}/{{ LIMITS.comment }}</small>
      </span>
      <textarea
        :id="`comment-${node.id}`"
        v-model="comment"
        rows="4"
        :maxlength="LIMITS.comment"
        @blur="save"
      />
      <small v-if="error" class="error">{{ error }}</small>
    </label>
    <button class="ghost" type="button" @click="remove">Remove comment</button>
  </section>
</template>
