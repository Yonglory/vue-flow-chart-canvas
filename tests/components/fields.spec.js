import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import BusinessHoursFields from '@/components/drawer/BusinessHoursFields.vue'
import CommentFields from '@/components/drawer/CommentFields.vue'
import SendMessageFields from '@/components/drawer/SendMessageFields.vue'
import { defaultSchedule } from '@/utils/schedule'

describe('SendMessageFields', () => {
  it('updates text, removes it, and rejects a text file', async () => {
    const wrapper = mount(SendMessageFields, {
      props: { texts: ['Hello there'], attachments: [] },
    })
    const input = wrapper.get('#message-text-0')
    await input.setValue('Hello again')
    expect(wrapper.emitted('change').at(-1)[0]).toEqual({ texts: ['Hello again'] })

    await wrapper.get('[aria-label="Remove message text 1"]').trigger('click')
    expect(wrapper.emitted('change').at(-1)[0]).toEqual({ texts: [] })

    const fileInput = wrapper.get('[data-testid="attachment-input"]')
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })
    Object.defineProperty(fileInput.element, 'files', { value: [file], configurable: true })
    await fileInput.trigger('change')
    expect(wrapper.text()).toMatch(/image or a PDF/i)
  })

  it('adds an image attachment', async () => {
    const wrapper = mount(SendMessageFields, {
      props: { texts: [], attachments: [] },
    })
    const fileInput = wrapper.get('[data-testid="attachment-input"]')
    const file = new File(['image'], 'badge.png', { type: 'image/png' })
    Object.defineProperty(fileInput.element, 'files', { value: [file], configurable: true })
    await fileInput.trigger('change')
    await flushPromises()
    await vi.waitFor(() => {
      expect(wrapper.emitted('change')?.at(-1)?.[0].attachments?.[0]?.name).toBe('badge.png')
    })
    expect(wrapper.emitted('change').at(-1)[0].attachments[0].dataUrl).toMatch(/^data:image\/png/)
  })
})

describe('CommentFields', () => {
  it('updates and removes a comment', async () => {
    const wrapper = mount(CommentFields, { props: { comment: 'Keep this' } })
    await wrapper.get('#comment-text').setValue('Updated note')
    expect(wrapper.emitted('change').at(-1)[0]).toEqual({ comment: 'Updated note' })
    await wrapper.get('[data-testid="remove-comment"]').trigger('click')
    expect(wrapper.emitted('change').at(-1)[0]).toEqual({ comment: '' })
  })
})

describe('BusinessHoursFields', () => {
  function mountHours() {
    return mount(BusinessHoursFields, {
      props: { timezone: 'UTC', schedule: defaultSchedule() },
      global: {
        stubs: {
          TimeField: {
            props: ['modelValue', 'inputId', 'label'],
            emits: ['update:modelValue'],
            template: '<input class="time-stub" :id="inputId" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          },
        },
      },
    })
  }

  it('rejects a close that is not after the open and copies Monday', async () => {
    const wrapper = mountHours()
    expect(wrapper.findAll('.hours-row')).toHaveLength(7)

    await wrapper.get('#mon-end').setValue('08:00')
    expect(wrapper.text()).toMatch(/Closing time must be after/)
    expect(wrapper.emitted('change')).toBeFalsy()

    await wrapper.get('#mon-start').setValue('10:00')
    await wrapper.get('#mon-end').setValue('16:00')
    await wrapper.get('[data-testid="copy-monday"]').trigger('click')
    const saved = wrapper.emitted('change').at(-1)[0]
    expect(saved.schedule.every((row) => row.start === '10:00' && row.end === '16:00')).toBe(true)
    expect(saved.timezone).toBe('UTC')
  })
})
