import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CreateNodeDialog from '@/components/nodes/CreateNodeDialog.vue'

describe('CreateNodeDialog', () => {
  it('shows validation messages and emits a trimmed node', async () => {
    const wrapper = mount(CreateNodeDialog, { props: { open: true } })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Title is required.')
    expect(wrapper.text()).toContain('Description is required.')
    expect(wrapper.text()).toContain('Choose a node type.')

    await wrapper.get('#node-title').setValue('  Follow up ')
    await wrapper.get('#node-description').setValue('  Check back tomorrow ')
    await wrapper.get('#node-type').setValue('addComment')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0]).toEqual({
      title: 'Follow up',
      description: 'Check back tomorrow',
      type: 'addComment',
    })
  })
})
