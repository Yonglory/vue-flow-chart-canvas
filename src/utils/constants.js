export const DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
]

export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Yangon',
  'Australia/Sydney',
]

export const CREATE_TYPES = [
  { value: 'sendMessage', label: 'Send Message' },
  { value: 'addComments', label: 'Add Comments' },
  { value: 'businessHours', label: 'Business Hours' },
]

export const FLOW_QUERY_KEY = ['flow-payload']
export const PAYLOAD_STORAGE_KEY = 'flow-payload'
export const POSITION_STORAGE_KEY = 'flow-positions'

export const LIMITS = {
  title: 80,
  description: 280,
  comment: 500,
  message: 1000,
  attachmentBytes: 2 * 1024 * 1024,
}
