export function attachmentName(url) {
  if (!url) return 'Attachment'
  const path = String(url).split('?')[0]
  const name = path.split('/').pop()
  if (!name) return 'Attachment'
  try {
    return decodeURIComponent(name)
  } catch {
    return name
  }
}

export function nodeTitle(node) {
  if (!node) return ''
  if (node.name) return node.name
  if (node.type === 'trigger') return 'Trigger'
  if (node.type === 'dateTimeConnector') {
    return node.data?.connectorType === 'failure' ? 'Failure' : 'Success'
  }
  return 'Untitled'
}

export function nodeDescription(node) {
  if (!node) return ''
  if (typeof node.description === 'string' && node.description.trim()) return node.description
  if (node.type === 'trigger') {
    return node.data?.type === 'conversationOpened' ? 'Conversation Opened' : (node.data?.type || '')
  }
  if (node.type === 'sendMessage') {
    const items = node.data?.payload || []
    const text = items.filter((item) => item.type === 'text' && item.text).map((item) => item.text).join(' ')
    if (text.trim()) return text
    const attachment = items.find((item) => item.type === 'attachment' && item.attachment)
    return attachment ? attachmentName(attachment.attachment) : ''
  }
  if (node.type === 'addComment') return node.data?.comment || ''
  if (node.type === 'dateTime') return `Business Hours - ${node.data?.timezone || 'UTC'}`
  if (node.type === 'dateTimeConnector') return node.data?.connectorType || ''
  return ''
}

export function firstAttachment(node) {
  return (node?.data?.payload || []).find((item) => item.type === 'attachment' && item.attachment)?.attachment || ''
}

export function typeLabel(node) {
  if (!node) return ''
  if (node.type === 'trigger') return 'Trigger'
  if (node.type === 'sendMessage') return 'Send Message'
  if (node.type === 'addComment') return 'Add Comments'
  if (node.type === 'dateTime') return 'Business Hours'
  if (node.type === 'dateTimeConnector') {
    return node.data?.connectorType === 'failure' ? 'Failure' : 'Success'
  }
  return node.type
}
