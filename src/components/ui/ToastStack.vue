<script setup>
import { useToastStore } from '@/stores/toastStore'

const toast = useToastStore()
</script>

<template>
  <div class="toasts" aria-live="polite">
    <button
      v-for="item in toast.items"
      :key="item.id"
      type="button"
      class="toast"
      :class="`is-${item.tone}`"
      @click="toast.dismiss(item.id)"
    >
      {{ item.message }}
    </button>
  </div>
</template>
