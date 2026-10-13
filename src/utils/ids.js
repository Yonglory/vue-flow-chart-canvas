const ALPHABET = '0123456789abcdef'

export function createId() {
  const bytes = new Uint8Array(3)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
    return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * 16)]).join('')
}
