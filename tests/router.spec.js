import { describe, expect, it } from 'vitest'
import router from '@/router'

describe('router', () => {
  it('opens the canvas and a node drawer from the URL', () => {
    expect(router.resolve('/').name).toBe('canvas')
    const node = router.resolve('/nodes/node-welcome')
    expect(node.name).toBe('node')
    expect(node.params.nodeId).toBe('node-welcome')
  })
})
