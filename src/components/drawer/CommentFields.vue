<script setup>
import { ref } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { LIMITS, validateComment } from '@/utils/validation'

const props = defineProps({
  comment: { type: String, default: '' },
})

const emit = defineEmits(['change'])
const comment = ref(props.comment)
const error = ref('')

function commit() {
  error.value = validateComment(comment.value)
  if (error.value) return
  const next = comment.value.trim()
  if (next === props.comment) return
  emit('change', { comment: next })
}

function removeComment() {
  comment.value = ''
  error.value = ''
  if (props.comment === '') return
  emit('change', { comment: '' })
}
</script>

<template>
  <section class="drawer-section" data-testid="comment-fields">
    <header class="section-head">
      <h3>Comment</h3>
      <p>Internal notes stay with the team. They are not sent to the contact.</p>
    </header>
    <div class="field" :class="{ 'has-error': error }">
      <div class="field-label-row">
        <label for="comment-text">Comment</label>
        <span class="counter">{{ comment.trim().length }}/{{ LIMITS.comment }}</span>
      </div>
      <textarea
        id="comment-text"
        v-model="comment"
        rows="4"
        :maxlength="LIMITS.comment"
        placeholder="Add an internal comment"
        @input="commit"
      />
      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    </div>
    <button
      type="button"
      class="btn btn-subtle"
      data-testid="remove-comment"
      :disabled="!comment && !props.comment"
      @click="removeComment"
    >
      <Icon name="trash" />
      Remove comment
    </button>
  </section>
</template>
