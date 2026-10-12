<script setup>
defineProps({
  name: { type: String, required: true },
})
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
    <template v-if="name === 'trigger'">
      <path d="M13 2 4 14h7l-1 8 10-14h-7l0-6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'message'">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 3.5V6.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
      <path d="M8 9h8M8 12h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'comment'">
      <path d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v6A2.5 2.5 0 0 1 17 15.5H11l-3.5 3v-3H7A2.5 2.5 0 0 1 4.5 13V7A2.5 2.5 0 0 1 7 4.5Z" stroke="currentColor" stroke-width="1.7" />
      <path d="M8 8.5h8M8 11.5h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'hours'">
      <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" stroke-width="1.7" />
      <path d="M8 3.5v3M16 3.5v3M4 9.5h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
      <path d="M12 13v2.2l1.6 1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M5 7.5h14M10 7.5V5.8A1.3 1.3 0 0 1 11.3 4.5h1.4A1.3 1.3 0 0 1 14 5.8v1.7M8 7.5l.7 11.2A1.5 1.5 0 0 0 10.2 20h3.6a1.5 1.5 0 0 0 1.5-1.3L16 7.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'upload'">
      <path d="M12 16V6M8 9.5 12 5.5l4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M5 16.5V18a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18v-1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
    </template>
    <template v-else-if="name === 'file'">
      <path d="M8 3.5h5.2L19 9.2V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 7 19V5A1.5 1.5 0 0 1 8.5 3.5H8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
      <path d="M13 3.8V9h5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
    </template>
    <template v-else-if="name === 'reset'">
      <path d="M19 12a7 7 0 1 1-2-4.9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
      <path d="M19 4.5V8h-3.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
    </template>
  </svg>
</template>
