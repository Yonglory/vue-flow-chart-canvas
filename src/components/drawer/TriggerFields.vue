<script setup>
defineProps({
  node: { type: Object, required: true },
})
</script>

<template>
  <section class="section" aria-labelledby="trigger-fields">
    <h3 id="trigger-fields">When it runs</h3>
    <p class="preview">
      {{ node.data?.type === 'conversationOpened' ? 'Conversation Opened' : node.data?.type }}
    </p>
    <p class="hint">
      {{ node.data?.oncePerContact ? 'Once per contact.' : 'Every time a conversation opens.' }}
    </p>
  </section>
</template>
