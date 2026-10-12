export const TIMEZONES = [
  'UTC',
  'Pacific/Honolulu',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

export function formatOffset(raw) {
  if (!raw || raw === 'GMT' || raw === 'UTC') return 'GMT+00:00'
  const match = String(raw).match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/)
  if (!match) return raw
  const [, sign, hours, minutes = '00'] = match
  return `GMT${sign}${hours.padStart(2, '0')}:${minutes}`
}

export function formatTimezoneLabel(zone, date = new Date()) {
  if (zone === 'UTC') return '(GMT+00:00) UTC'
  let offset = 'GMT+00:00'
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'longOffset',
    }).formatToParts(date)
    const name = parts.find((part) => part.type === 'timeZoneName')?.value
    offset = formatOffset(name)
  } catch {
    offset = 'GMT+00:00'
  }
  const city = String(zone).split('/').pop().replace(/_/g, ' ')
  return `(${offset}) ${city}`
}

export function getTimezoneOptions(selected, date = new Date()) {
  const zones = selected && !TIMEZONES.includes(selected) ? [selected, ...TIMEZONES] : TIMEZONES
  return zones.map((zone) => ({
    value: zone,
    label: formatTimezoneLabel(zone, date),
  }))
}
