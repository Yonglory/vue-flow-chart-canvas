import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NodeDrawer from '@/components/drawer/NodeDrawer.vue'

const node = {
  id: 'node-away',
  type: 'sendMessage',
  data: {
    title: 'Away Message',
    description: 'Sorry, we are currently away.',
    texts: ['Sorry, we are currently away.'],
    attachments: [],
  },
}

describe('NodeDrawer', () => {
  it('edits the title and asks before deleting', async () => {
    const wrapper = mount(NodeDrawer, { props: { node } })
    await wrapper.get('#drawer-title').setValue('Away note')
    expect(wrapper.emitted('update').at(-1)[0]).toEqual({ title: 'Away note' })

    await wrapper.get('#drawer-title').setValue('   ')
    expect(wrapper.text()).toContain('Title is required.')

    await wrapper.get('[data-testid="delete-node-button"]').trigger('click')
    await wrapper.get('[data-testid="confirm-delete-button"]').trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('shows the fields that belong to the node type', () => {
    const message = mount(NodeDrawer, { props: { node } })
    expect(message.get('[data-testid="send-message-fields"]').exists()).toBe(true)

    const comment = mount(NodeDrawer, {
      props: {
        node: {
          id: 'node-comment',
          type: 'addComment',
          data: { title: 'Add Comment #1', description: 'Internal', comment: 'User message during off hours' },
        },
      },
    })
    expect(comment.get('#comment-text').element.value).toBe('User message during off hours')

    const hours = mount(NodeDrawer, {
      props: {
        node: {
          id: 'node-hours',
          type: 'businessHours',
          data: {
            title: 'Business Hours',
            description: 'Business Hours - UTC',
            timezone: 'UTC',
            schedule: [
              { day: 'mon', label: 'Mon', enabled: true, start: '09:00', end: '17:00' },
            ],
          },
        },
      },
    })
    expect(hours.get('[data-testid="business-hours-fields"]').text()).toMatch(/success path/i)
  })
})
