import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import OutcomeNode from '@/components/canvas/nodes/OutcomeNode.vue'
import WorkflowNode from '@/components/canvas/nodes/WorkflowNode.vue'

const stubs = { Handle: { template: '<span class="handle-stub" />' } }

describe('WorkflowNode', () => {
  it('shows an icon, title, truncated description, and attachment name', () => {
    const wrapper = mount(WorkflowNode, {
      props: {
        id: 'node-welcome',
        type: 'sendMessage',
        selected: true,
        data: {
          title: 'Welcome Message',
          description: 'Thanks for reaching out. A teammate will be with you shortly.',
          texts: ['Thanks for reaching out. A teammate will be with you shortly.'],
          attachments: [{ id: 'file-1', name: '0f642f52e639febd6ba5a27453cc8345.png' }],
        },
      },
      global: { stubs },
    })

    expect(wrapper.text()).toContain('Welcome Message')
    expect(wrapper.get('.node-description').attributes('title')).toMatch(/teammate/)
    expect(wrapper.get('.node-description').classes()).toContain('node-description')
    expect(wrapper.text()).toContain('0f642f52e639febd6ba5a27453cc8345.png')
    expect(wrapper.classes()).toContain('is-selected')
    expect(wrapper.findAll('.handle-stub')).toHaveLength(2)
  })

  it('gives a trigger one outgoing handle and business hours two branch handles', () => {
    const trigger = mount(WorkflowNode, {
      props: {
        id: 'node-trigger',
        type: 'trigger',
        data: { title: 'Trigger', description: 'Conversation Opened' },
      },
      global: { stubs },
    })
    const hours = mount(WorkflowNode, {
      props: {
        id: 'node-hours',
        type: 'businessHours',
        data: { title: 'Business Hours', description: 'Business Hours - UTC', schedule: [], timezone: 'UTC' },
      },
      global: { stubs },
    })
    expect(trigger.findAll('.handle-stub')).toHaveLength(1)
    expect(hours.findAll('.handle-stub')).toHaveLength(3)
    expect(hours.classes()).toContain('is-hours')
  })
})

describe('OutcomeNode', () => {
  it('is marked display-only', () => {
    const wrapper = mount(OutcomeNode, {
      props: {
        id: 'node-hours-success',
        data: { title: 'Success', outcome: 'success' },
      },
      global: { stubs },
    })
    expect(wrapper.attributes('title')).toMatch(/display-only/i)
    expect(wrapper.classes()).toContain('is-success')
  })
})
