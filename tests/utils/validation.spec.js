import { describe, expect, it } from 'vitest'
import {
  validateComment,
  validateDetails,
  validateMessageText,
  validateNodeDraft,
  validateSchedule,
  validateTitle,
} from '@/utils/validation'

describe('node draft validation', () => {
  it('requires a title, description, and known type', () => {
    const result = validateNodeDraft({ title: ' ', description: '', type: 'trigger' })
    expect(result.valid).toBe(false)
    expect(result.errors.title).toMatch(/required/i)
    expect(result.errors.description).toMatch(/required/i)
    expect(result.errors.type).toMatch(/type/i)
  })

  it('accepts the three creatable types', () => {
    expect(validateNodeDraft({
      title: 'Welcome',
      description: 'Says hello',
      type: 'sendMessage',
    }).valid).toBe(true)
  })

  it('rejects an oversized title', () => {
    expect(validateTitle('a'.repeat(81))).toMatch(/80/)
  })
})

describe('message and comment validation', () => {
  it('rejects empty message text and blank comments', () => {
    expect(validateMessageText('   ')).toMatch(/empty/i)
    expect(validateComment('   ')).toMatch(/spaces/i)
    expect(validateComment('')).toBe('')
  })
})

describe('details validation', () => {
  it('checks title and description without a type', () => {
    expect(validateDetails({ title: 'Hours', description: 'UTC' }).valid).toBe(true)
  })
})

describe('schedule validation', () => {
  it('requires the close to be after the open', () => {
    const result = validateSchedule([
      { day: 'mon', enabled: true, start: '17:00', end: '09:00' },
      { day: 'tue', enabled: false, start: '17:00', end: '09:00' },
    ])
    expect(result.valid).toBe(false)
    expect(result.errors.mon).toMatch(/after/i)
    expect(result.errors.tue).toBeUndefined()
  })
})
