const memory = new Map()

const storage = {
  getItem(key) {
    return memory.has(key) ? memory.get(key) : null
  },
  setItem(key, value) {
    memory.set(String(key), String(value))
  },
  removeItem(key) {
    memory.delete(String(key))
  },
  clear() {
    memory.clear()
  },
  key(index) {
    return [...memory.keys()][index] ?? null
  },
  get length() {
    return memory.size
  },
}

if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.clear !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  })
}
