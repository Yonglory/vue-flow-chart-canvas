import { STORAGE_KEY } from '@/constants/flow'
import { normalizePayload } from '@/utils/flow'

function readCache() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

async function readSeed() {
  const response = await fetch('/payload.json', { cache: 'no-store' })
  if (!response.ok) throw new Error('The workflow payload could not be loaded.')
  return response.json()
}

export async function fetchPayload() {
  const cached = readCache()
  if (cached) return normalizePayload(cached)
  return normalizePayload(await readSeed())
}

export async function savePayload(payload) {
  const normalized = normalizePayload(payload)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  } catch (error) {
    const full = error?.name === 'QuotaExceededError'
    throw new Error(full
      ? 'Storage is full. Remove an attachment and try again.'
      : 'The workflow could not be saved.')
  }
  return normalized
}

export async function resetPayload() {
  localStorage.removeItem(STORAGE_KEY)
  return normalizePayload(await readSeed())
}
