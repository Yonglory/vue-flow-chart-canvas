import { describe, expect, it } from 'vitest'
import { truncate } from '@/utils/text'

describe('truncate', () => {
  it('collapses whitespace and leaves short text unchanged', () => {
    expect(truncate('  hello   there  ', 20)).toBe('hello there')
  })

  it('cuts long text on a character boundary', () => {
    expect(truncate('abcdefghijklmnopqrstuvwxyz', 10)).toBe('abcdefghi…')
  })
})
