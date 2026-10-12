import { describe, expect, it } from 'vitest'
import { formatBytes, isImageAttachment, validateAttachment } from '@/utils/files'

describe('attachment validation', () => {
  it('accepts an image and rejects text files, oversized files, and a full list', () => {
    const image = { name: 'photo.png', type: 'image/png', size: 1000 }
    expect(validateAttachment(image, { existingCount: 0 }).valid).toBe(true)
    expect(validateAttachment({ name: 'notes.txt', type: 'text/plain', size: 20 }).errors[0]).toMatch(/image or a PDF/i)
    expect(validateAttachment({ name: 'big.pdf', type: 'application/pdf', size: 2_000_000 }).errors[0]).toMatch(/1\.2 MB/)
    expect(validateAttachment(image, { existingCount: 6 }).errors[0]).toMatch(/6/)
  })

  it('detects image previews and formats sizes', () => {
    expect(isImageAttachment({ name: 'a.png', mimeType: 'image/png' })).toBe(true)
    expect(isImageAttachment({ name: 'a.pdf', mimeType: 'application/pdf' })).toBe(false)
    expect(formatBytes(2048)).toBe('2 KB')
  })
})
