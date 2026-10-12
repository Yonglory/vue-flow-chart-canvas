import { defineStore } from 'pinia'

let sequence = 0

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [],
  }),
  actions: {
    push(message, tone = 'info') {
      const id = ++sequence
      this.items = [...this.items, { id, message, tone }]
      window.setTimeout(() => this.dismiss(id), 3800)
      return id
    },
    dismiss(id) {
      this.items = this.items.filter((item) => item.id !== id)
    },
    info(message) {
      return this.push(message, 'info')
    },
    error(message) {
      return this.push(message, 'error')
    },
  },
})
