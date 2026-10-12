<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import Icon from '@/components/icons/Icon.vue'
import { nodeAppearance, previewLine } from '@/utils/flow'

const props = defineProps({
  id: { type: String, required: true },
  type: { type: String, required: true },
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

const appearance = computed(() => nodeAppearance(props.type))
const preview = computed(() => previewLine({ type: props.type, data: props.data }))
const showPreview = computed(() => preview.value && preview.value !== props.data.description)
const attachments = computed(() => props.data.attachments || [])
const isHours = computed(() => props.type === 'businessHours')
</script>

<template>
  <article
    class="workflow-node"
    :class="[`tone-${appearance.tone}`, { 'is-selected': selected, 'is-hours': isHours }]"
    :data-testid="`workflow-node-${id}`"
  >
    <Handle v-if="type !== 'trigger'" id="in" type="target" :position="Position.Top" />
    <header class="node-head">
      <span class="node-icon">
        <Icon :name="appearance.icon" />
      </span>
      <h3 class="node-title">{{ data.title }}</h3>
    </header>
    <p class="node-description" :title="data.description">{{ data.description }}</p>
    <p v-if="showPreview" class="node-preview">{{ preview }}</p>
    <ul v-if="attachments.length" class="node-files">
      <li v-for="file in attachments.slice(0, 2)" :key="file.id">
        <Icon name="file" />
        <span>{{ file.name }}</span>
      </li>
      <li v-if="attachments.length > 2" class="more">+{{ attachments.length - 2 }} more</li>
    </ul>
    <Handle v-if="!isHours" id="out" type="source" :position="Position.Bottom" />
    <template v-else>
      <Handle id="success" class="handle-success" type="source" :position="Position.Bottom" :style="{ left: '28%' }" />
      <Handle id="failure" class="handle-failure" type="source" :position="Position.Bottom" :style="{ left: '72%' }" />
    </template>
  </article>
</template>

<style scoped>
.workflow-node {
  width: 240px;
  padding: 12px 14px 16px;
  border: 1px solid #e6e8ee;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 10px 24px rgba(16, 24, 40, 0.05);
  cursor: grab;
  text-align: left;
}

.workflow-node:active {
  cursor: grabbing;
}

.workflow-node.is-hours {
  border-color: #ffb089;
}

.workflow-node.is-selected {
  border-color: #ff7a59;
  box-shadow: 0 0 0 3px rgba(255, 122, 89, 0.22), 0 12px 28px rgba(16, 24, 40, 0.08);
}

.node-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.node-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;
  border-radius: 9px;
}

.node-icon :deep(.icon) {
  width: 18px;
  height: 18px;
}

.tone-trigger .node-icon { background: #f4ebff; color: #7c3aed; }
.tone-message .node-icon { background: #e7f7f4; color: #0f9d8a; }
.tone-comment .node-icon { background: #eeedff; color: #4f46e5; }
.tone-hours .node-icon { background: #fff1ea; color: #e85d04; }

.node-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  color: #1f2328;
}

.node-description,
.node-preview {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #667085;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.node-preview {
  color: #3d4450;
}

.node-files {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: grid;
  gap: 4px;
}

.node-files li {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: #3d4450;
  font-size: 11px;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
}

.node-files :deep(.icon) {
  width: 14px;
  height: 14px;
  flex: none;
  color: #98a2b3;
}

.node-files span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-files .more {
  color: #98a2b3;
  font-family: Figtree, "Segoe UI", sans-serif;
}
</style>
