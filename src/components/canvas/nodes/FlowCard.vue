<script setup>
import { computed } from 'vue'
import { attachmentName, firstAttachment, nodeDescription, nodeTitle } from '../../../utils/describeNode'
import { truncate } from '../../../utils/truncate'
import NodeIcon from './NodeIcon.vue'

const props = defineProps({
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  tone: { type: String, required: true },
  showAttachment: { type: Boolean, default: false },
})

const title = computed(() => nodeTitle(props.data))
const description = computed(() => truncate(nodeDescription(props.data)))
const attachment = computed(() => (props.showAttachment ? firstAttachment(props.data) : ''))
</script>

<template>
  <article class="flow-card" :class="[tone, { 'is-selected': selected }]">
    <div class="flow-card__icon">
      <NodeIcon :name="tone" />
    </div>
    <div>
      <h3>{{ title }}</h3>
      <p>{{ description || 'No description yet' }}</p>
      <figure v-if="attachment" class="flow-card__file">
        <img :src="attachment" alt="" />
        <figcaption>{{ truncate(attachmentName(attachment), 28) }}</figcaption>
      </figure>
    </div>
  </article>
</template>
