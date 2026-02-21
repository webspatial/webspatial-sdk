# Test Server

This app hosts test pages under `apps/test-server/src`.

## Adding a Test Page

1. **Create Component:** Create `src/<test-name>/index.tsx` exporting your component.
2. **Register Route:** In `index.tsx`, import your component and add `<Route path="/<test-name>" element={<YourNewTest />} />`.
3. **Add Sidebar Link:** In `src/components/Sidebar.tsx`, add `{ path: '/<test-name>', label: 'Your Test' }` to the `routes` array.

## Running

- `npm run testServer` (root): Start dev server.
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

- Importing **Event Types**: use `@webspatial/react-sdk` or `@webspatial/core-sdk`.
- Browsers warn about custom XR tags; this is expected.
