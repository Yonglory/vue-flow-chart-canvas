import { config } from '@vue/test-utils'

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false },
  })
}

config.global.stubs = {
  Teleport: { template: '<div><slot /></div>' },
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
