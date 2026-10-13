import { createId } from './ids'
import { DAYS } from './constants'

function textPayload(description) {
  const text = String(description ?? '').trim()
  return text ? [{ type: 'text', text }] : []
}

export function createNodesFromForm({ title, description, type }, parentId) {
  const name = String(title).trim()
  const descriptionValue = String(description ?? '').trim()
  const base = {
    name,
    ...(descriptionValue ? { description: descriptionValue } : {}),
  }

  if (type === 'sendMessage') {
    return [{
      ...base,
      id: createId(),
      parentId,
      type: 'sendMessage',
      data: { payload: textPayload(descriptionValue) },
    }]
  }

  if (type === 'addComments') {
    return [{
      ...base,
      id: createId(),
      parentId,
      type: 'addComment',
      data: { comment: descriptionValue },
    }]
  }

  if (type === 'businessHours') {
    const id = createId()
    const successId = createId()
    const failureId = createId()
    return [
      {
        ...base,
        id,
        parentId,
        type: 'dateTime',
        data: {
          times: DAYS.map((day) => ({ day: day.id, startTime: '09:00', endTime: '17:00' })),
          connectors: [successId, failureId],
          timezone: 'UTC',
          action: 'businessHours',
        },
      },
      {
        id: successId,
        parentId: id,
        name: 'Success',
        type: 'dateTimeConnector',
        data: { connectorType: 'success' },
      },
      {
        id: failureId,
        parentId: id,
        name: 'Failure',
        type: 'dateTimeConnector',
        data: { connectorType: 'failure' },
      },
    ]
  }

  return []
}
