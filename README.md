# Flow chart canvas

A Vue 3 conversation-flow canvas. Nodes are loaded from a JSON payload, drawn with [Vue Flow](https://github.com/bcakmakoglu/vue-flow), and edited in a drawer whose URL contains the node id. Fetching and mutations go through [TanStack Query v5](https://tanstack.com/query/v5).

## Setup

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

The dev server prints a local URL. Open it and the seed flow appears: Trigger, Business Hours, Success and Failure branches, Welcome Message, Away Message, and Add Comment.

Other scripts:

```bash
npm test          # unit tests, one run
npm run test:watch
npm run build
npm run preview
```

## How data is stored

`public/payload.json` is the seed. TanStack Query loads it once (`staleTime: Infinity`). After the first edit, the node array is written to `localStorage` under `flow-payload`, and the next load uses that copy. Drag positions are stored separately under `flow-positions` because the payload has no coordinates.

To return to the seed, clear those two keys and reload:

```js
localStorage.removeItem("flow-payload");
localStorage.removeItem("flow-positions");
```

Design write-up: [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md). Library choices: [docs/TECH_STACK.md](docs/TECH_STACK.md).

## Design decisions

- The create form speaks the assignment names (`sendMessage`, `addComments`, `businessHours`). The saved nodes use the payload's names (`sendMessage`, `addComment`, `dateTime` + `businessHours` action). That keeps the seed file valid.
- Success and Failure are real nodes (`dateTimeConnector`) so the branches match the payload, and they are pills that cannot be opened or deleted.
- Pinia is the working copy the canvas reads. Query remains the fetch and mutation boundary: every committed edit runs a mutation that updates the query cache.
- New nodes hang under the selection. If Business Hours itself is selected, the new node hangs under Success so it does not become an unlabeled third branch.
- Description on the card is derived from the node until you type one. Clearing the field removes the override.
- Undo covers drag-stop and committed edits, including positions.

## Using the canvas

- Drag a card to move it. Scroll to zoom. Drag the background to pan.
- Click a card, or select it and press Enter, to open its drawer.
- **Create New Node** asks for a title, a description, and a type.
- The drawer edits the title and description. Send Message also edits text bubbles and image tiles. Add Comment edits one comment. Business Hours edits each weekday and the timezone.
- Delete removes the node and every node below it. The trigger cannot be deleted.

### Keyboard

| Key                            | Action                              |
| ------------------------------ | ----------------------------------- |
| Down / Up                      | Move the selection through the tree |
| Enter                          | Open the selected node              |
| Escape                         | Close the dialog or the drawer      |
| Backspace / Delete             | Delete the selected editable node   |
| Cmd/Ctrl+Z                     | Undo                                |
| Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y | Redo                                |

Shortcuts do not fire while a text field is focused, except Escape.

## Tests

Vitest covers the graph helpers, layout, validation, payload mapping, the Pinia store, and the create and drawer components. GitHub Actions runs `npm test` on push and pull request (`.github/workflows/test.yml`).
