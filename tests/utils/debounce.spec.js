import { afterEach, describe, expect, it, vi } from 'vitest'
import { debounce } from '@/utils/debounce'

afterEach(() => {
  vi.useRealTimers()
})

describe('debounce', () => {
  it('runs once after the wait and can be cancelled', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const wrapped = debounce(fn, 200)
    wrapped('a')
    wrapped('b')
    vi.advanceTimersByTime(199)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('b')

    wrapped()
    wrapped.cancel()
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
