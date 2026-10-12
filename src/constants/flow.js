export const FLOW_QUERY_KEY = ['flow-payload']

export const STORAGE_KEY = 'flowline.payload.v1'

export const NODE_TYPES = {
  trigger: 'trigger',
  sendMessage: 'sendMessage',
  addComment: 'addComment',
  businessHours: 'businessHours',
  outcome: 'outcome',
}

export const CREATABLE_TYPES = [
  {
    value: NODE_TYPES.sendMessage,
    label: 'Send Message',
    hint: 'Send text and file attachments to the contact.',
  },
  {
    value: NODE_TYPES.addComment,
    label: 'Add Comments',
    hint: 'Leave an internal note for the team.',
  },
  {
    value: NODE_TYPES.businessHours,
    label: 'Business Hours',
    hint: 'Branch into success and failure paths from open hours.',
  },
]

export const CREATABLE_TYPE_VALUES = CREATABLE_TYPES.map((option) => option.value)

export const DAYS = [
  { day: 'mon', label: 'Mon' },
  { day: 'tue', label: 'Tue' },
  { day: 'wed', label: 'Wed' },
  { day: 'thu', label: 'Thu' },
  { day: 'fri', label: 'Fri' },
  { day: 'sat', label: 'Sat' },
  { day: 'sun', label: 'Sun' },
]

export const DEFAULT_OPEN = '09:00'
export const DEFAULT_CLOSE = '17:00'
