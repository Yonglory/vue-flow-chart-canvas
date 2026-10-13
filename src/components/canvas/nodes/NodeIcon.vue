<script setup>
defineProps({
  name: { type: String, required: true },
})
</script>

<template>
  <svg v-if="name === 'trigger'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.5l1.7 5.6 5.8 1.4-4.5 3.8 1.4 5.7L12 16.2 7.6 19l1.4-5.7L4.5 9.5l5.8-1.4L12 2.5z" />
  </svg>
  <svg v-else-if="name === 'message'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4.2 3.2c-.7.5-1.8 0-1.8-.9V5.5z" />
  </svg>
  <svg v-else-if="name === 'comment'" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 3.5h12A2.5 2.5 0 0 1 20.5 6v7.2a2.5 2.5 0 0 1-2.5 2.5H11l-3.6 2.9c-.6.5-1.6 0-1.6-.8V6A2.5 2.5 0 0 1 6 3.5zm2.2 4.2h7.6v1.6H8.2V7.7zm0 3.2h5.4v1.6H8.2v-1.6z" />
  </svg>
  <svg v-else viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 3.5h2V5h6V3.5h2V5h1.2A2.3 2.3 0 0 1 20.5 7.3v11.2a2.3 2.3 0 0 1-2.3 2.3H5.8a2.3 2.3 0 0 1-2.3-2.3V7.3A2.3 2.3 0 0 1 5.8 5H7V3.5zM5.5 10v8.3c0 .2.2.4.4.4h12.2c.2 0 .4-.2.4-.4V10H5.5z" />
  </svg>
</template>
