# System design

The canvas is a conversation flow. The source of truth is an array of nodes linked by `parentId`. Vue Flow only renders that tree. TanStack Query v5 loads and writes the array. Pinia holds the working copy, drag positions, selection, and undo history. Vue Router opens a details drawer when the URL contains a node id.

## Payload

`public/payload.json` is an array. `-1` is the root parent. Ids are mixed: the trigger id is the number `1`, and every other seed id is a 6-character hex string. New ids follow the hex form. Stored ids are never coerced.

| `type` | Meaning | Editable drawer |
| --- | --- | --- |
| `trigger` | Root. `data.type` of `conversationOpened` reads as "Conversation Opened". `data.oncePerContact` is display-only. | Title and description. Cannot be deleted. |
| `dateTime` with `data.action: "businessHours"` | Weekly schedule. `data.times[]` is `{ day, startTime, endTime }`. `data.timezone`. `data.connectors` lists the success and failure node ids. | Schedule and timezone. |
| `dateTimeConnector` | Branch pill. `data.connectorType` is `success` or `failure`. | None. Display only. |
| `sendMessage` | `data.payload[]` items are `{ type: "text", text }` or `{ type: "attachment", attachment }`. | Texts and attachment tiles. |
| `addComment` | `data.comment` string. | One comment field. |

The create form uses the assignment values, then maps them into the payload:

- `sendMessage` → `type: "sendMessage"`
- `addComments` → `type: "addComment"`
- `businessHours` → `type: "dateTime"` plus `action: "businessHours"`, Mon–Sun `09:00`–`17:00`, timezone `UTC`, and two child `dateTimeConnector` nodes

`name` is the title. `description` is optional. When it is missing, the canvas derives a line:

- trigger → "Conversation Opened"
- send message → joined text items, otherwise the attachment file name
- add comment → `data.comment`
- business hours → `Business Hours - {timezone}`

Clearing the description removes the override and the derived line returns.

Seed tree:

```
Trigger (1)
  Business Hours (d09c08)
    Success (161f52)
      Welcome Message (b0653a)
    Failure (28c4b9)
      Away Message (b6a0c1)
        Add Comment #1 (e879e4)
```

## State ownership

```
payload.json → TanStack Query cache → Pinia → Vue Flow + drawer
```

- Query key `['flow-payload']`. `queryFn` returns the `localStorage` key `flow-payload` when it holds an array, otherwise `fetch('/payload.json')`.
- `useMutation` writes that array back to `localStorage` and `setQueryData`. There is no remote API.
- Pinia hydrates once from the query result. Later query writes do not reset the store, so an in-flight edit is not overwritten.
- Drag positions live in Pinia and `localStorage` key `flow-positions`. They are not part of the payload, because the file has no coordinates.
- The first visit lays the tree out. Later nodes are placed under their parent without moving nodes the user has already dragged.

A mutation snapshot is `{ nodes, positions }`, capped at 50. Undo and redo restore both. Moves and field edits each push one entry (drag-stop, not drag-frame; field commit on blur or on a valid time change).

## Routing

| URL | Result |
| --- | --- |
| `/` | Canvas. Drawer closed. |
| `/nodes/:nodeId` | Canvas plus the details drawer for that id. |

Clicking an editable node pushes `/nodes/:nodeId`. Closing the drawer returns to `/`. A `dateTimeConnector` click does not navigate. A direct visit to a connector id, or to an unknown id, replaces the route with `/`.

## Canvas

`<VueFlow>` is the only graph surface. Custom nodes:

- `trigger`, `sendMessage`, `addComment`, `businessHours` — card with icon, title, truncated description
- `connector` — pill, not selectable

Edges are derived from `parentId`. They use the smooth-step path. Success branches are coral, failure branches are teal, and the trunk into Business Hours is neutral. Handles exist so edges anchor; users cannot draw new connections. Parentage is chosen when a node is created.

Parent rules:

- No selection → the trigger
- Business Hours selected → the success connector, so a new card does not become a third unlabeled branch
- Anything else selected → that node

Deleting a node removes its subtree. The trigger and connector pills cannot be deleted. Deleting Business Hours removes both branches.

## Drawer and validation

The drawer slides in over about 280ms. Title is required, at most 80 characters. Description is at most 280 characters. Comment is at most 500 characters and may be empty (that is the removed state). A message text item cannot be blank; removal deletes the item. At least one text or attachment should remain, and the drawer says so when the list is empty. Images only, at most 2 MB, stored as a data URL. Each business-hours row needs an end time strictly after the start. Time values are `HH:mm`.

## Keyboard

- Arrow Down / Up walk the tree depth-first, including connector pills
- Enter opens the drawer when the selection can be opened
- Escape closes the create dialog, otherwise the drawer
- Backspace or Delete removes the selected editable node when focus is not in a field
- Cmd/Ctrl+Z undoes, Cmd/Ctrl+Shift+Z and Cmd/Ctrl+Y redo

Shortcuts are ignored while an input, textarea, or select is focused, except Escape.
