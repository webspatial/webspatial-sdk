# Test Server

This app hosts test pages under `apps/test-server/src`.

## React SDK entry (lazy-load default)

`esbuild.mjs` and `tsconfig.json` resolve `@webspatial/react-sdk` to
`packages/react/src/index.ts` (lazy-load default entry). The root app is
wrapped in `<SpatialBoot>` so `bootSpatial()` runs before spatial UI mounts
in WebSpatial runtimes; in plain browsers boot resolves immediately and
facades keep their documented fallbacks.

`@webspatial/react-sdk/spatial` is aliased for the bridge's dynamic import.
`@webspatial/react-sdk/eager` remains available for pages that explicitly
import the eager entry.

For a **consumer-shaped Vite** bundle (built `dist/`, no monorepo `src/`
alias), use `apps/spatial-vite-min` instead.

## Adding a Test Page

1. **Create Component:** Create `src/<test-name>/index.tsx` exporting your component.
2. **Register Route:** In `index.tsx`, import your component and add `<Route path="/<test-name>" element={<YourNewTest />} />`.
3. **Add Sidebar Link:** In `src/components/Sidebar.tsx`, add `{ path: '/<test-name>', label: 'Your Test' }` to the `routes` array.

## Running

- `npm run testServer` (root): Start dev server (open in AVP / WebSpatial shell for spatial behavior).
- `npm run dev:web` (in this package): Plain-browser mode (lazy fallbacks only).
- `npm run test` (root): Typecheck.
- `cd apps/test-server && npm run build`: Build for production.

## Log Helper

Use the `LogViewer` component to display on-screen logs (useful for VR/mobile debugging).

```tsx
import { useLog, LogViewer } from '../components/LogViewer'

export default function MyTest() {
  const { logs, logLine, clearLogs } = useLog()

  return (
    <div className="flex gap-4 p-10 h-screen">
      <div className="flex-1">
        <button
          onClick={() => logLine('Hello', { x: 1 })}
          className="btn"
        >
          Log Something
        </button>
      </div>
      <div className="w-1/3">
        <LogViewer logs={logs} onClear={clearLogs} />
      </div>
    </div>
  )
}
```

## Tips

- Import spatial primitives from `@webspatial/react-sdk` (facades + lazy boot).
- Import `@webspatial/react-sdk/eager` only when testing the eager entry explicitly.
- Event types: `@webspatial/react-sdk` or `@webspatial/core-sdk`.
- Browsers warn about custom XR tags; this is expected.
- Avoid `useEffect([], [])` that attaches DOM listeners to `ref.current` on
  `Model` / spatial hosts before boot completes; re-bind when `useSpatialReady()`
  becomes true or gate the subtree with `<SpatialBoot>` (default here).
