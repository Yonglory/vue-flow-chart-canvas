import { DAYS, LIMITS, TIMEZONES } from './constants'

export function validateTitle(title) {
  const value = String(title ?? '').trim()
  if (!value) return 'Title is required.'
  if (value.length > LIMITS.title) return `Title must be ${LIMITS.title} characters or fewer.`
  return ''
}

export function validateDescription(description) {
  if (description == null || description === '') return ''
  if (String(description).length > LIMITS.description) {
    return `Description must be ${LIMITS.description} characters or fewer.`
  }
  return ''
}

export function validateComment(comment) {
  if (comment == null) return ''
  if (String(comment).length > LIMITS.comment) {
    return `Comment must be ${LIMITS.comment} characters or fewer.`
  }
  return ''
}

export function validateMessageText(text) {
  const value = String(text ?? '').trim()
  if (!value) return 'Message text cannot be empty. Remove it instead.'
  if (value.length > LIMITS.message) return `Message must be ${LIMITS.message} characters or fewer.`
  return ''
}

export function validateCreate({ title, description, type }) {
  const errors = {}
  const titleError = validateTitle(title)
  const descriptionError = validateDescription(description)
  if (titleError) errors.title = titleError
  if (descriptionError) errors.description = descriptionError
  if (!['sendMessage', 'addComments', 'businessHours'].includes(type)) {
    errors.type = 'Choose a node type.'
  }
  return errors
}

export function isEndAfterStart(start, end) {
  if (!start || !end) return false
  return end > start
}

export function validateHours(times, timezone) {
  const errors = {}
  if (!TIMEZONES.includes(timezone)) errors.timezone = 'Choose a timezone.'
  for (const day of DAYS) {
    const row = (times || []).find((item) => item.day === day.id)
    if (!row?.startTime || !row?.endTime) {
      errors[day.id] = 'Start and end are required.'
      continue
    }
    if (!isEndAfterStart(row.startTime, row.endTime)) {
      errors[day.id] = 'End time must be after the start time.'
    }
  }
  return errors
}

export function validateAttachment(file) {
  if (!file) return 'Choose an image.'
  if (!String(file.type || '').startsWith('image/')) return 'Upload an image file.'
  if (file.size > LIMITS.attachmentBytes) return 'Image must be 2 MB or smaller.'
  return ''
}

export function normalizeTimes(times) {
  return DAYS.map((day) => {
    const found = (times || []).find((item) => item.day === day.id)
    return {
      day: day.id,
      startTime: found?.startTime || '09:00',
      endTime: found?.endTime || '17:00',
    }
  })
}
