import { describe, expect, it } from 'vitest'
import { copyFirstDay, defaultSchedule, scheduleSummary } from '@/utils/schedule'

describe('schedule helpers', () => {
  it('builds a seven-day 09:00–17:00 week', () => {
    const schedule = defaultSchedule()
    expect(schedule).toHaveLength(7)
    expect(schedule.every((row) => row.enabled && row.start === '09:00' && row.end === '17:00')).toBe(true)
  })

  it('summarizes a uniform week and a closed week', () => {
    expect(scheduleSummary(defaultSchedule(), 'UTC')).toBe('Every day · 09:00–17:00')
    const closed = defaultSchedule().map((row) => ({ ...row, enabled: false }))
    expect(scheduleSummary(closed, 'UTC')).toBe('Closed all week · UTC')
  })

  it('copies Monday onto the rest of the week', () => {
    const schedule = defaultSchedule().map((row, index) => (
      index === 0 ? { ...row, start: '10:00', end: '16:00' } : row
    ))
    expect(copyFirstDay(schedule).every((row) => row.start === '10:00' && row.end === '16:00')).toBe(true)
  })
})
