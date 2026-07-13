# React SDK Distribution

## Overview

`@webspatial/react-sdk` is the public React SDK entry for web-first apps, SSR,
RSC, and mixed 2D plus spatial experiences.

It exports public facades for components such as `Model`, `Reality`, and
entities. In plain web and SSR, those facades render documented fallbacks. In a
WebSpatial runtime, call `bootSpatial()` or use `<SpatialBoot>` to load the real
spatial implementation.

```tsx
import { Model, SpatialBoot } from '@webspatial/react-sdk'

export function App() {
  return (
    <SpatialBoot>
      <Model enable-xr src="/models/robot.glb" />
    </SpatialBoot>
  )
}
```

## Type Reference

```ts
import type { ReactNode } from 'react'

type SpatialBootProps = {
  children: ReactNode
  onReady?: () => void
  onError?: (error: WebSpatialBootError) => void
}

function bootSpatial(): Promise<void>

function isSpatialReady(): boolean

function useSpatialReady(): boolean

function onSpatialLoadError(
  callback: (error: WebSpatialBootError) => void,
): () => void

class WebSpatialBootError extends Error {
  name: 'WebSpatialBootError'
  cause: unknown
  attempt: number
}
```

## API Details

### `<SpatialBoot>`

```ts
type SpatialBootProps = {
  children: React.ReactNode
  onReady?: () => void
  onError?: (error: WebSpatialBootError) => void
}
```

`SpatialBoot` calls `bootSpatial()` after mount and renders `children` only
after boot succeeds. While boot is pending, it renders `null`. If boot fails,
it calls `onError` and keeps `children` unmounted.

There is no public `fallback` prop. Render loading or error UI outside
`SpatialBoot` when needed.

```tsx
import { SpatialBoot, WebSpatialBootError } from '@webspatial/react-sdk'

export function SpatialSection() {
  return (
    <SpatialBoot
      onReady={() => console.log('WebSpatial ready')}
      onError={(error: WebSpatialBootError) => {
        console.error('WebSpatial failed to boot', error.cause)
      }}
    >
      <SpatialExperience />
    </SpatialBoot>
  )
}
```

### `bootSpatial()`

```ts
function bootSpatial(): Promise<void>
```

Loads the spatial implementation in a WebSpatial runtime.

Behavior:

- Plain web: resolves immediately and does not request the spatial chunk.
- SSR: resolves without throwing and does not request the spatial chunk.
- WebSpatial runtime: dynamically imports the spatial implementation.
- Concurrent calls share the same in-flight load attempt.
- Successful loads are cached for the page lifetime.
- Failed loads reject with `WebSpatialBootError`.
- Calling again after a failure starts a new load attempt.

### `isSpatialReady()`

```ts
function isSpatialReady(): boolean
```

Returns `true` only after the spatial implementation has loaded successfully in
the current page.

### `useSpatialReady()`

```ts
function useSpatialReady(): boolean
```

React hook that re-renders when spatial readiness changes. It returns `false`
during SSR and in plain web.

```tsx
import { Model, useSpatialReady } from '@webspatial/react-sdk'

export function ReadyGatedModel() {
  const ready = useSpatialReady()
  if (!ready) return null
  return <Model enable-xr src="/models/drone.glb" />
}
```

### `onSpatialLoadError()`

```ts
function onSpatialLoadError(
  callback: (error: WebSpatialBootError) => void,
): () => void
```

Registers a listener for spatial chunk load failures. The returned function
unsubscribes the listener.

```ts
import { onSpatialLoadError } from '@webspatial/react-sdk'

const unsubscribe = onSpatialLoadError(error => {
  reportError(error)
})

unsubscribe()
```

### `WebSpatialBootError`

`WebSpatialBootError` is the error type used when boot fails.

Important fields:

- `name === 'WebSpatialBootError'`
- `cause`: the original dynamic import error
- `attempt`: the 1-based load attempt number

## Common Use Cases

### Recommended React integration

```tsx
import { SpatialBoot } from '@webspatial/react-sdk'

export function AppRoot() {
  return (
    <AppShell>
      <SpatialBoot>
        <SpatialRoutes />
      </SpatialBoot>
    </AppShell>
  )
}
```

### Advanced CSR manual boot

Most React apps should use `<SpatialBoot>` and let it call `bootSpatial()`.
Client-rendered apps that want full manual control can await `bootSpatial()`
before the first render, then render the spatial app directly.

Do not use this as the default SSR recipe. If boot fails, catch the
`WebSpatialBootError` and render an application fallback.

```tsx
import ReactDOM from 'react-dom/client'
import { bootSpatial } from '@webspatial/react-sdk'
import { App } from './App'
import { FallbackApp } from './FallbackApp'

const root = ReactDOM.createRoot(document.getElementById('root')!)

try {
  await bootSpatial()
  root.render(<App />)
} catch (error) {
  root.render(<FallbackApp error={error} />)
}
```

### Next.js client boundary

Use the default entry inside a client component.

```tsx
'use client'

import { SpatialBoot, Model } from '@webspatial/react-sdk'

export function SpatialProductView() {
  return (
    <SpatialBoot>
      <Model enable-xr src="/models/product.glb" />
    </SpatialBoot>
  )
}
```

### Error UI outside `SpatialBoot`

Because `SpatialBoot` renders `null` before success, keep loading and error UI
outside it.

```tsx
import { useState } from 'react'
import { SpatialBoot, type WebSpatialBootError } from '@webspatial/react-sdk'

export function SpatialPanel() {
  const [error, setError] = useState<WebSpatialBootError | null>(null)

  if (error) return <FallbackPanel />

  return (
    <>
      <LoadingShell />
      <SpatialBoot onError={setError}>
        <SpatialExperience />
      </SpatialBoot>
    </>
  )
}
```

## Migration

Replace legacy import roots:

```tsx
// Before
import { Model } from '@webspatial/react-sdk/web'
import { Reality } from '@webspatial/react-sdk/default'

// After
import { Model, Reality } from '@webspatial/react-sdk'
```

Remove `SSRProvider` wrappers:

```tsx
// Before
<SSRProvider>
  <Model enable-xr src="/models/robot.glb" />
</SSRProvider>

// After
<SpatialBoot>
  <Model enable-xr src="/models/robot.glb" />
</SpatialBoot>
```

Replace removed internal container imports with JSX markers:

```tsx
// Before
import { Spatialized2DElementContainer } from '@webspatial/react-sdk'

// After
export function Card() {
  return <div enable-xr>...</div>
}
```

## Usage Notes

- Prefer named imports. Namespace imports may reduce tree-shaking quality.
- `SpatialBoot` has no `fallback` prop.
- Plain web users do not request the spatial chunk when using the default
  entry.
- `useMetrics()` returns a stable placeholder until a component remounts after
  boot. Mount components that require real metrics after `SpatialBoot`.
- Request-time server branching is outside this API. Use request information
  such as User-Agent for server routing decisions.

## References

- `openspec/specs/spatial-lazy-load/spec.md`
- `docs/migration/lazy-load-spatial-runtime.md`
- `packages/react/src/runtime/SpatialBoot.tsx`
- `packages/react/src/runtime/boot.ts`
