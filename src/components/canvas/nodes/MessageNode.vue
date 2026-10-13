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
    <Handle id="in" type="target" :position="Position.Top" :connectable="false" />
    <FlowCard :data="data" :selected="selected" tone="message" show-attachment />
    <Handle id="out" type="source" :position="Position.Bottom" :connectable="false" />
  </div>
</template>
