<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { nodeTitle } from '../../../utils/describeNode'

const props = defineProps({
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

const connectorType = computed(() => props.data.data?.connectorType || 'success')
const label = computed(() => nodeTitle(props.data))
</script>

<template>
  <div class="pill" :class="[connectorType, { 'is-selected': selected }]" role="img" :aria-label="label">
    <Handle id="in" type="target" :position="Position.Top" :connectable="false" />
    {{ label }}
    <Handle id="out" type="source" :position="Position.Bottom" :connectable="false" />
  </div>
</template>
