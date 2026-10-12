<script setup>
import { computed } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { fromTimeModel, toTimeModel } from '@/utils/time'

const props = defineProps({
  modelValue: { type: String, default: '09:00' },
  inputId: { type: String, required: true },
  label: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

const timeConfig = { is24: true, enableSeconds: false, minutesIncrement: 15 }
const model = computed(() => toTimeModel(props.modelValue))
const inputAttrs = computed(() => ({
  id: props.inputId,
  required: true,
  autocomplete: 'off',
  clearable: false,
  hideInputIcon: true,
  name: props.inputId,
}))

function onUpdate(value) {
  const next = fromTimeModel(value)
  if (!next || next === props.modelValue) return
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="time-field">
    <VueDatePicker
      :model-value="model"
      time-picker
      auto-apply
      teleport="body"
      :time-config="timeConfig"
      :input-attrs="inputAttrs"
      :aria-labels="{ input: label }"
      @update:model-value="onUpdate"
    />
  </div>
</template>
