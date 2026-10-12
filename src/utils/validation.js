import { CREATABLE_TYPE_VALUES } from '@/constants/flow'
import { isTime, toMinutes } from '@/utils/time'

export const LIMITS = {
  title: 80,
  description: 280,
  message: 1000,
  comment: 1000,
  attachments: 6,
  attachmentBytes: 1_200_000,
}

export function validateTitle(value) {
  const text = String(value ?? '').trim()
  if (!text) return 'Title is required.'
  if (text.length > LIMITS.title) return `Title must be ${LIMITS.title} characters or fewer.`
  return ''
}

export function validateDescription(value) {
  const text = String(value ?? '').trim()
  if (!text) return 'Description is required.'
  if (text.length > LIMITS.description) {
    return `Description must be ${LIMITS.description} characters or fewer.`
  }
  return ''
}

export function validateNodeType(type) {
  if (!CREATABLE_TYPE_VALUES.includes(type)) return 'Choose a node type.'
  return ''
}

export function validateNodeDraft(draft) {
  const errors = {
    title: validateTitle(draft?.title),
    description: validateDescription(draft?.description),
    type: validateNodeType(draft?.type),
  }
  return {
    valid: !errors.title && !errors.description && !errors.type,
    errors,
  }
}

export function validateDetails(draft) {
  const errors = {
    title: validateTitle(draft?.title),
    description: validateDescription(draft?.description),
  }
  return {
    valid: !errors.title && !errors.description,
    errors,
  }
}

export function validateMessageText(value) {
  const text = String(value ?? '').trim()
  if (!text) return 'Message text cannot be empty.'
  if (text.length > LIMITS.message) return `Message text must be ${LIMITS.message} characters or fewer.`
  return ''
}

export function validateComment(value) {
  const text = String(value ?? '')
  if (!text) return ''
  if (!text.trim()) return 'Comment cannot be only spaces.'
  if (text.trim().length > LIMITS.comment) return `Comment must be ${LIMITS.comment} characters or fewer.`
  return ''
}

export function validateTimezone(value) {
  if (!String(value ?? '').trim()) return 'Choose a time zone.'
  return ''
}

export function validateSchedule(schedule) {
  const errors = {}
  ;(schedule || []).forEach((row) => {
    if (!row?.enabled) return
    if (!isTime(row.start) || !isTime(row.end)) {
      errors[row.day] = 'Choose an opening and closing time.'
      return
    }
    if (toMinutes(row.end) <= toMinutes(row.start)) {
      errors[row.day] = 'Closing time must be after opening time.'
    }
  })
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
