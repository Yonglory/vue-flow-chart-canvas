import { DAYS, DEFAULT_CLOSE, DEFAULT_OPEN } from '@/constants/flow'
import { isTime } from '@/utils/time'

export function defaultSchedule() {
  return DAYS.map((day) => ({
    day: day.day,
    label: day.label,
    enabled: true,
    start: DEFAULT_OPEN,
    end: DEFAULT_CLOSE,
  }))
}

export function normalizeSchedule(schedule) {
  const byDay = new Map((schedule || []).map((row) => [row?.day, row]))
  return DAYS.map((day) => {
    const row = byDay.get(day.day)
    const start = isTime(row?.start) ? row.start : DEFAULT_OPEN
    const end = isTime(row?.end) ? row.end : DEFAULT_CLOSE
    return {
      day: day.day,
      label: day.label,
      enabled: row ? Boolean(row.enabled) : true,
      start,
      end,
    }
  })
}

export function scheduleSummary(schedule, timezone = 'UTC') {
  const rows = normalizeSchedule(schedule)
  const open = rows.filter((row) => row.enabled)
  if (!open.length) return `Closed all week · ${timezone}`
  const sameHours = open.every((row) => row.start === open[0].start && row.end === open[0].end)
  const days = open.length === 7 ? 'Every day' : open.map((row) => row.label).join(', ')
  const hours = sameHours ? `${open[0].start}–${open[0].end}` : 'Custom hours'
  return `${days} · ${hours}`
}

export function copyFirstDay(schedule) {
  const rows = normalizeSchedule(schedule)
  const source = rows[0]
  return rows.map((row, index) => {
    if (index === 0) return row
    return {
      ...row,
      enabled: source.enabled,
      start: source.start,
      end: source.end,
    }
  })
}
