<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true },
})

const tone = computed(() => (props.data.outcome === 'failure' ? 'failure' : 'success'))
const hint = computed(() => (
  tone.value === 'failure'
    ? 'Failure is display-only and cannot be opened.'
    : 'Success is display-only and cannot be opened.'
))
</script>

<template>
  <article
    class="outcome-node"
    :class="`is-${tone}`"
    :title="hint"
    :data-testid="`outcome-node-${id}`"
  >
    <Handle id="in" type="target" :position="Position.Top" />
    <span>{{ data.title }}</span>
    <Handle id="out" type="source" :position="Position.Bottom" />
  </article>
</template>

<style scoped>
.outcome-node {
  width: 112px;
  padding: 7px 10px 9px;
  border-radius: 999px;
  border: 1px solid #d8deea;
  background: #fff;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: default;
}

.outcome-node.is-success {
  color: #178a4a;
  border-color: #b7ebc9;
  background: #f3fbf6;
}

.outcome-node.is-failure {
  color: #d92d20;
  border-color: #fecdca;
  background: #fff6f5;
}
</style>
