import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import CreateNodeDialog from '../src/components/create/CreateNodeDialog.vue'
import BusinessHoursFields from '../src/components/drawer/BusinessHoursFields.vue'
import NodeDrawer from '../src/components/drawer/NodeDrawer.vue'
import SendMessageFields from '../src/components/drawer/SendMessageFields.vue'
import { useFlowStore } from '../src/stores/flowStore'
import { findNode } from '../src/utils/graph'

function loadPayload() {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'public/payload.json'), 'utf8'))
}

function setupStore() {
  localStorage.clear()
  setActivePinia(createPinia())
  const store = useFlowStore()
  store.hydrate(loadPayload())
  return store
}

describe('CreateNodeDialog', () => {
  it('requires a title and emits a valid form', async () => {
    const wrapper = mount(CreateNodeDialog)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Title is required.')

    await wrapper.get('input[name="title"]').setValue('Away note')
    await wrapper.get('textarea[name="description"]').setValue('We are out')
    await wrapper.get('select[name="type"]').setValue('sendMessage')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('create')[0][0]).toEqual({
      title: 'Away note',
      description: 'We are out',
      type: 'sendMessage',
    })
  })
})

describe('drawer', () => {
  beforeEach(() => {
    setupStore()
  })

  it('opens message details and refuses connector-style delete on the trigger', async () => {
    const store = useFlowStore()
    const trigger = mount(NodeDrawer, { props: { node: findNode(store.nodes, 1) } })
    expect(trigger.text()).toContain('Conversation Opened')
    expect(trigger.find('button.danger').exists()).toBe(false)

    const welcome = findNode(store.nodes, 'b0653a')
    const drawer = mount(NodeDrawer, { props: { node: welcome } })
    expect(drawer.text()).toContain('Welcome Message')
    expect(drawer.text()).toContain('354.jpg')
    await drawer.get('button.danger').trigger('click')
    expect(drawer.text()).toContain('everything below it')
  })

  it('updates message text and removes an attachment from the store', async () => {
    const store = useFlowStore()
    const wrapper = mount(SendMessageFields, {
      props: { node: findNode(store.nodes, 'b0653a') },
    })
    const input = wrapper.get('textarea[data-text-index="b0653a-0"]')
    await input.setValue('Hello from the desk')
    await input.trigger('blur')
    expect(findNode(store.nodes, 'b0653a').data.payload[0].text).toBe('Hello from the desk')

    await input.setValue('   ')
    await input.trigger('blur')
    expect(wrapper.text()).toContain('cannot be empty')
    expect(findNode(store.nodes, 'b0653a').data.payload[0].text).toBe('Hello from the desk')

    const removeButtons = wrapper.findAll('button').filter((button) => button.text() === 'Remove')
    await removeButtons[1].trigger('click')
    expect(findNode(store.nodes, 'b0653a').data.payload).toHaveLength(1)
  })

  it('blocks a business-hours end time that is not after the start', async () => {
    const store = useFlowStore()
    const wrapper = mount(BusinessHoursFields, {
      props: { node: findNode(store.nodes, 'd09c08') },
    })
    const end = wrapper.get('input[aria-label="Mon end"]')
    await end.setValue('08:00')
    expect(wrapper.text()).toContain('End time must be after')
    expect(findNode(store.nodes, 'd09c08').data.times[0].endTime).toBe('17:00')
  })
})
