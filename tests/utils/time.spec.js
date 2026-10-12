import { describe, expect, it } from 'vitest'
import { fromTimeModel, isTime, toMinutes, toTimeModel } from '@/utils/time'
import { formatTimezoneLabel } from '@/utils/timezones'

describe('time conversion', () => {
  it('round-trips a 24-hour time through the picker model', () => {
    expect(isTime('09:00')).toBe(true)
    expect(isTime('24:00')).toBe(false)
    expect(toMinutes('17:30')).toBe(17 * 60 + 30)
    expect(fromTimeModel(toTimeModel('09:05'))).toBe('09:05')
    expect(fromTimeModel({ hours: 7, minutes: 5 })).toBe('07:05')
    expect(fromTimeModel('9:00')).toBe('09:00')
  })

  it('labels UTC with an explicit zero offset', () => {
    expect(formatTimezoneLabel('UTC')).toBe('(GMT+00:00) UTC')
    expect(formatTimezoneLabel('Asia/Kuala_Lumpur', new Date('2026-10-12T00:00:00Z'))).toContain('Kuala Lumpur')
  })
})
