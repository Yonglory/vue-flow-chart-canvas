<script setup>
import { ref } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import TimeField from '@/components/drawer/TimeField.vue'
import { normalizeSchedule, copyFirstDay } from '@/utils/schedule'
import { getTimezoneOptions } from '@/utils/timezones'
import { validateSchedule, validateTimezone } from '@/utils/validation'

const props = defineProps({
  timezone: { type: String, default: 'UTC' },
  schedule: { type: Array, default: () => [] },
})

const emit = defineEmits(['change'])

const timezone = ref(props.timezone || 'UTC')
const schedule = ref(normalizeSchedule(props.schedule))
const errors = ref({})
const zoneError = ref('')
const zones = getTimezoneOptions(timezone.value)

function commit() {
  const scheduleResult = validateSchedule(schedule.value)
  zoneError.value = validateTimezone(timezone.value)
  errors.value = scheduleResult.errors
  if (!scheduleResult.valid || zoneError.value) return
  emit('change', {
    timezone: timezone.value,
    schedule: schedule.value.map((row) => ({ ...row })),
  })
}

function updateTime(index, key, value) {
  schedule.value[index] = { ...schedule.value[index], [key]: value }
  commit()
}

function closeDay(index) {
  schedule.value[index] = { ...schedule.value[index], enabled: false }
  commit()
}

function openDay(index) {
  const row = schedule.value[index]
  schedule.value[index] = {
    ...row,
    enabled: true,
    start: row.start || '09:00',
    end: row.end || '17:00',
  }
  commit()
}

function copyMonday() {
  schedule.value = copyFirstDay(schedule.value)
  commit()
}
</script>

<template>
  <section class="drawer-section" data-testid="business-hours-fields">
    <header class="section-head">
      <h3>Business hours</h3>
      <p>
        Open hours follow the success path. Closed hours follow the failure path.
        Those branches stay on the canvas and cannot be opened.
      </p>
    </header>
    <div class="hours-toolbar">
      <span>Day</span>
      <span>Time</span>
      <button type="button" class="text-button" data-testid="copy-monday" @click="copyMonday">
        Copy Monday to all
      </button>
    </div>
    <ul class="hours-list">
      <li v-for="(row, index) in schedule" :key="row.day" class="hours-row">
        <span class="day-label">{{ row.label }}</span>
        <div v-if="row.enabled" class="hours-times">
          <TimeField
            :input-id="`${row.day}-start`"
            :label="`${row.label} opening time`"
            :model-value="row.start"
            @update:model-value="updateTime(index, 'start', $event)"
          />
          <span class="to">to</span>
          <TimeField
            :input-id="`${row.day}-end`"
            :label="`${row.label} closing time`"
            :model-value="row.end"
            @update:model-value="updateTime(index, 'end', $event)"
          />
          <button type="button" class="icon-button" :aria-label="`Clear ${row.label}`" @click="closeDay(index)">
            <Icon name="close" />
          </button>
        </div>
        <div v-else class="hours-closed">
          <span>Closed</span>
          <button type="button" class="text-button" @click="openDay(index)">Add hours</button>
        </div>
        <p v-if="errors[row.day]" class="field-error hours-error" role="alert">{{ errors[row.day] }}</p>
      </li>
    </ul>
    <div class="field" :class="{ 'has-error': zoneError }">
      <div class="field-label-row">
        <label for="timezone">Time zone</label>
      </div>
      <select id="timezone" v-model="timezone" data-testid="timezone-select" @change="commit">
        <option v-for="zone in zones" :key="zone.value" :value="zone.value">{{ zone.label }}</option>
      </select>
      <p v-if="zoneError" class="field-error" role="alert">{{ zoneError }}</p>
    </div>
  </section>
</template>
