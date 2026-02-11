# Test Server (SPA) — Adding and Migrating Tests

This SPA hosts all test pages under `apps/test-server/src`. There are two ways to add tests:

## React Test Page
- Create your component under `apps/test-server/src/<your-test>/index.tsx`.
- Import and add a route in `apps/test-server/index.tsx`:
  - `import MyTest from './src/<your-test>/index'`
  - `<Route path="/my-test" element={<MyTest />} />`
- Optionally add a link in `apps/test-server/src/components/Sidebar.tsx`.

## Legacy HTML Test Page
- Place your HTML in `apps/test-server/src/<your-test>/index.html`.
- Build script copies `src/**/*.html` to `dist` keeping relative paths intact.
- Add a route using the iframe wrapper in `apps/test-server/index.tsx`:
  - `<Route path="/my-test" element={<IframePage src="/<your-test>/index.html" />} />`
- Add a link in `apps/test-server/src/components/Sidebar.tsx` if desired.

Notes:
- No CSS/HTML injection is performed; your page renders with its own styles.
- If your HTML references `/dist/src/...`, the build script rewrites it to `/src/...` so files resolve when served from `dist`.

## Verify Locally
- Start dev server: `npm run testServer` at repo root.
- Typecheck: `npm run test` at repo root (includes workspace tests + `apps/test-server`).
- Production build: `cd apps/test-server && npm run build`.

## Event Types
- Import event types from the SDK packages to match handlers:
  - React: `@webspatial/react-sdk`
  - Core: `@webspatial/core-sdk`

Examples:
- Drag: `ModelSpatialDragEvent`, `SpatialDragEvent`
- Rotate: `ModelSpatialRotateEvent`, `SpatialRotateEvent`

## Common Pitfalls
- Lazy imports must wrap `import()` calls. Prefer static imports for simplicity.
- Custom XR tags like `model` are expected; browsers warn but functionality remains intact.
