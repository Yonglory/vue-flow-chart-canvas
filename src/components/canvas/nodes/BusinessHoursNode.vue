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
    <FlowCard :data="data" :selected="selected" tone="hours" />
    <Handle id="success" class="handle-success" type="source" :position="Position.Bottom" :connectable="false" />
    <Handle id="failure" class="handle-failure" type="source" :position="Position.Bottom" :connectable="false" />
  </div>
</template>
