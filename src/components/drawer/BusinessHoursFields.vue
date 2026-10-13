<script setup>
import { ref, watch } from 'vue'
import { useFlowStore } from '../../stores/flowStore'
import { DAYS, TIMEZONES } from '../../utils/constants'
import { normalizeTimes } from '../../utils/validation'

const props = defineProps({
  node: { type: Object, required: true },
})

const store = useFlowStore()
const times = ref([])
const timezone = ref('UTC')
const errors = ref({})

const zoneOptions = ref([...TIMEZONES])

function sync() {
  times.value = normalizeTimes(props.node.data?.times).map((row) => ({ ...row }))
  timezone.value = props.node.data?.timezone || 'UTC'
  if (timezone.value && !zoneOptions.value.includes(timezone.value)) {
    zoneOptions.value = [timezone.value, ...TIMEZONES]
  }
}

watch(() => props.node.id, sync, { immediate: true })

watch(
  () => [props.node.data?.timezone, JSON.stringify(props.node.data?.times)],
  () => {
    if (document.activeElement?.closest('.hours')) return
    sync()
  },
)

function row(day) {
  return times.value.find((item) => item.day === day)
}

function commit() {
  errors.value = store.updateBusinessHours(props.node.id, {
    times: times.value,
    timezone: timezone.value,
  })
}
</script>

<template>
  <section class="section hours" aria-labelledby="hours-fields">
    <div class="section-head">
      <div>
        <h3 id="hours-fields">Weekly hours</h3>
        <p class="hint">A branch is taken from these days and times. Success and Failure stay on the canvas only.</p>
      </div>
    </div>

    <table class="hours-table">
      <thead>
        <tr>
          <th>Day</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="day in DAYS" :key="day.id">
          <td class="day">{{ day.label }}</td>
          <td>
            <div class="time-pair">
              <input
                type="time"
                :aria-label="`${day.label} start`"
                :value="row(day.id)?.startTime"
                @input="row(day.id).startTime = $event.target.value"
                @change="commit"
              />
              <span>to</span>
              <input
                type="time"
                :aria-label="`${day.label} end`"
                :value="row(day.id)?.endTime"
                @input="row(day.id).endTime = $event.target.value"
                @change="commit"
              />
            </div>
            <p v-if="errors[day.id]" class="row-error">{{ errors[day.id] }}</p>
          </td>
        </tr>
      </tbody>
    </table>

    <label class="field tz">
      <span>Time zone</span>
      <select v-model="timezone" aria-label="Time zone" @change="commit">
        <option v-for="zone in zoneOptions" :key="zone" :value="zone">{{ zone }}</option>
      </select>
      <small v-if="errors.timezone" class="error">{{ errors.timezone }}</small>
    </label>
  </section>
</template>
