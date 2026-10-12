# Flowline

Flowline is a workflow canvas for creating, connecting, and editing conversation steps. The seeded graph matches the sample mockup: a conversation-opened trigger, a business-hours branch, a welcome message, an away message, and an internal comment.

The original brief linked a `payload.json` that was not included with this repository. `public/payload.json` is reconstructed from that mockup so the canvas opens on the same flow.

## Stack

- JavaScript (ES6) and Vue 3
- Vite
- Pinia for the working graph
- Vue Router for the canvas and the node drawer
- Vue Flow for the draggable canvas
- TanStack Query for loading and saving the payload

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (http://localhost:5173).

```bash
npm test
npm run build
npm run preview
```

## What you can do

- Drag any step, including the success and failure branches.
- Pull a circle handle to connect two steps. The canvas refuses self-links, links into the trigger, links into a branch, links out of the business-hours step itself, duplicates, and loops.
- Press Delete to remove a selected connection. The two edges from a business-hours step to its branches stay in place.
- **Create New Node** asks for a title, description, and type: Send Message (`sendMessage`), Add Comments (`addComment`), or Business Hours (`businessHours`).
- A business-hours step also adds Success and Failure nodes. Those nodes are visible only. Clicking them does not open a drawer, and a direct URL such as `/nodes/node-hours-success` returns to the canvas.
- Click a step to open its drawer. Click it again, press Escape, or click the canvas to close it. The address becomes `/nodes/<id>` and can be reopened directly.
- Title and description are editable, with required values and length limits. Changes save on their own.
- Send Message shows each text in its own field and shows attachments as tiles. New images and PDFs can be uploaded, and each text or file can be removed.
- Add Comments shows the comment in a field that can be updated or removed.
- Business Hours lists Monday–Sunday with a date-time picker for the open and close times, a time zone, and a way to clear a day. Closing time has to be after opening time.
- **Reset** reloads `public/payload.json` and drops the copy saved in this browser.

## Architecture

```text
Vue components
  Flow canvas, create dialog, details drawer
        │
        ▼
Pinia flow store
  normalized nodes and edges, the graph the UI edits
        │
        ▼
TanStack Query
  fetchPayload / savePayload / resetPayload
        │
        ▼
public/payload.json  +  localStorage (flowline.payload.v1)
```

Query owns network-style reads and writes. The store owns the graph the canvas and the drawer share, so a title change updates the card without waiting on a refetch. Pure graph, validation, schedule, and file helpers live in `src/utils` and are covered by unit tests.

The query client is configured in `src/plugins/queryClientConfig.js`:

```js
queryClientConfig: {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      networkMode: 'always',
      staleTime: Infinity,
      gcTime: 60 * 60 * 1000,
    },
  },
}
```

`staleTime: Infinity` keeps the loaded payload from being refetched in the background. Mutations use `networkMode: 'always'` as well, so a save still runs when the browser reports itself offline. There is no remote API: the first load reads `public/payload.json`, and later loads read the local copy written by mutations.

Vue Flow is controlled (`apply-default` is off). Position changes are applied locally while a node is dragged and written to the store only when the drag ends, so the payload is not rewritten on every pointer move. Node measurements are kept on the same object when the graph membership has not changed, which keeps the viewport steady while a drawer field updates.

The canvas route and the `/nodes/:nodeId` route render the same page component. Opening a drawer changes the URL and slides the panel in without remounting the graph.

## Data model

A payload is `{ nodes, edges }`.

| Type | Role |
| --- | --- |
| `trigger` | Entry step. Editable, not offered in the create list. |
| `sendMessage` | `texts[]` and `attachments[]` (`name`, `mimeType`, `size`, `url` or `dataUrl`). |
| `addComment` | `comment` string. An empty string means the comment was removed. |
| `businessHours` | `timezone` and a seven-day `schedule` of `{ day, label, enabled, start, end }`. |
| `outcome` | `success` or `failure`, linked by `parentId`. `accessible` is always false. |

Edges store `source`, `target`, handle ids, and `data.locked`. Presentation (smooth-step path, stroke) is applied when the edge is handed to Vue Flow and is not stored in the payload.

## Design choices

- The canvas follows the mockup: dotted surface, white cards, coral connectors, an orange business-hours border, and success/failure pills.
- The drawer pushes the canvas on a wide screen and overlays it on a narrow one. The width transition is disabled when the user prefers reduced motion.
- Validation is explicit: empty titles and descriptions, unknown types, empty message rows, whitespace-only comments, closing times that are not after opening, file type, file size (1.2 MB), and a six-file cap.
- Uploaded files are stored as data URLs so a refresh keeps the preview. The seed attachment is a static PNG served from `public/attachments`.
- Success and failure are real nodes, not only edge labels, because the brief asks for nodes that stay on the canvas and cannot be opened.

## Tests

Vitest and Vue Test Utils cover:

- payload normalization and the seeded workflow
- connection rules, branch creation, and cascade delete
- Pinia create, update, move, connect, and delete
- the query client defaults
- fetch, local save, reset, and a full storage quota
- router URLs
- node cards, the create dialog, the drawer, message text, attachments, comments, and business hours

## Project layout

```text
public/payload.json          seeded workflow
src/api/flowApi.js           load, save, reset
src/components/canvas        Vue Flow surface and node views
src/components/drawer        details drawer and type-specific fields
src/components/nodes         create dialog
src/composables/useFlowSync.js
src/plugins/queryClientConfig.js
src/stores                   graph and toasts
src/utils                    validation, graph, schedule, files, time
src/views/FlowPage.vue       header, canvas, drawer, routing
tests                        unit tests
```
