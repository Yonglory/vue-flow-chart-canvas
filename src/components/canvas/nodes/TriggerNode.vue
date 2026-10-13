<script setup>
import { Handle, Position } from '@vue-flow/core'
import FlowCard from './FlowCard.vue'

defineProps({
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})
</script>

<template>
  <div class="node-shell">
    <FlowCard :data="data" :selected="selected" tone="trigger" />
    <Handle id="out" type="source" :position="Position.Bottom" :connectable="false" />
  </div>
</template>
