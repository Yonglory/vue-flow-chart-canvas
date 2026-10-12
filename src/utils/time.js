const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export function isTime(value) {
  return TIME_PATTERN.test(String(value ?? ''))
}

export function toMinutes(value) {
  if (!isTime(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function padTime(value) {
  return String(value).padStart(2, '0')
}

export function toTimeModel(value) {
  const time = isTime(value) ? value : '09:00'
  const [hours, minutes] = time.split(':').map(Number)
  return { hours, minutes, seconds: 0 }
}

export function fromTimeModel(value) {
  if (!value) return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${padTime(value.getHours())}:${padTime(value.getMinutes())}`
  }
  if (typeof value === 'string') {
    const match = value.match(/(\d{1,2}):(\d{2})/)
    if (!match) return ''
    const hours = Number(match[1])
    const minutes = Number(match[2])
    if (hours > 23 || minutes > 59) return ''
    return `${padTime(hours)}:${padTime(minutes)}`
  }
  if (typeof value === 'object' && value.hours != null && value.minutes != null) {
    const hours = Number(value.hours)
    const minutes = Number(value.minutes)
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return ''
    if (hours > 23 || minutes > 59 || hours < 0 || minutes < 0) return ''
    return `${padTime(hours)}:${padTime(minutes)}`
  }
  return ''
}
