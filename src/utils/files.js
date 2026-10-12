import { LIMITS } from '@/utils/validation'

const IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|svg)$/i

export function isAllowedAttachment(file) {
  const type = file?.type || file?.mimeType || ''
  return type.startsWith('image/') || type === 'application/pdf'
}

export function validateAttachment(file, { existingCount = 0 } = {}) {
  const errors = []
  if (existingCount >= LIMITS.attachments) {
    errors.push(`You can attach up to ${LIMITS.attachments} files.`)
  }
  if (!file) {
    errors.push('Choose a file to upload.')
  } else {
    if (file.size > LIMITS.attachmentBytes) errors.push('Each file must be 1.2 MB or smaller.')
    if (!isAllowedAttachment(file)) errors.push('Upload an image or a PDF.')
  }
  return {
    valid: errors.length === 0,
    errors,
  }
}

export function isImageAttachment(file) {
  if (!file) return false
  if (String(file.mimeType || '').startsWith('image/')) return true
  if (String(file.dataUrl || '').startsWith('data:image/')) return true
  return IMAGE_EXTENSION.test(file.name || '')
}

export function formatBytes(size) {
  const value = Number(size) || 0
  if (value <= 0) return ''
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('The file could not be read.'))
    reader.readAsDataURL(file)
  })
}
