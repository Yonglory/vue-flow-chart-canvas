# Tech stack

JavaScript and ES6 only. The app does not use TypeScript.

| Concern | Choice | Why |
| --- | --- | --- |
| UI | Vue 3, `<script setup>` | Assignment runtime. |
| Build | Vite | Assignment bundler. |
| Graph data, positions, selection, undo | Pinia | Assignment store. |
| Drawer URL | Vue Router 4 | The node id lives in `/nodes/:nodeId`. |
| Canvas | [Vue Flow](https://github.com/bcakmakoglu/vue-flow) | Assignment flowchart library. Packages: `@vue-flow/core`, `@vue-flow/background`, `@vue-flow/controls`, `@vue-flow/minimap`. |
| Fetch and mutation | [TanStack Query v5](https://tanstack.com/query/v5) | Assignment data layer. Vue adapter: `@tanstack/vue-query` v5. |
| Tests | Vitest, Vue Test Utils, jsdom | Component and logic tests. |
| CI | GitHub Actions | `npm test` on push and pull request. |

Vue Flow styles are imported globally, not scoped:

- `@vue-flow/core/dist/style.css`
- `@vue-flow/core/dist/theme-default.css`
- `@vue-flow/controls/dist/style.css`
- `@vue-flow/minimap/dist/style.css`

Node and edge presentation is custom. Example applications from the Vue Flow repository are not copied.

TanStack Query is constructed with this object and no other query defaults:

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

`gcTime` is the v5 name. The React package `@tanstack/react-query` is not installed. The mutation that writes `localStorage` sets `networkMode: 'always'` on that call so a browser offline flag cannot pause a local write. That does not change the query defaults above.

Visual styling is hand-written CSS. Fraunces and Outfit are loaded from Google Fonts. No component library is used.

There is no backend. The query function reads `public/payload.json`, then prefers the mutated copy in `localStorage`.
