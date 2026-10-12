<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  labelledBy: { type: String, default: 'dialog-title' },
})

const emit = defineEmits(['close'])
const root = ref(null)

function onKeydown(event) {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !root.value) return
  const items = [...root.value.querySelectorAll('button, input, select, textarea')]
    .filter((element) => !element.disabled && element.tabIndex !== -1)
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

async function focusFirst() {
  await nextTick()
  const field = root.value?.querySelector('input, select, textarea, button')
  field?.focus()
}

watch(() => props.open, (isOpen) => {
  document.body.classList.toggle('scroll-lock', isOpen)
  if (isOpen) focusFirst()
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('scroll-lock')
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-layer" @keydown.stop>
      <button type="button" class="dialog-backdrop" aria-label="Close dialog" @click="emit('close')" />
      <div
        ref="root"
        class="dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="labelledBy"
      >
        <header class="dialog-header">
          <h2 :id="labelledBy">{{ title }}</h2>
          <button type="button" class="icon-button" aria-label="Close dialog" @click="emit('close')">
            <slot name="close-icon" />
          </button>
        </header>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
