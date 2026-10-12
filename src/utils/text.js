export function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

export function truncate(value, max = 90) {
  const text = normalizeWhitespace(value)
  if (text.length <= max) return text
  return `${text.slice(0, Math.max(1, max - 1)).trimEnd()}…`
}
