# Spatial Content Ready

## Overview

`onSpatialContentReady` is a lifecycle callback for a 2D spatial element:
a normal JSX element such as `<div>` that is marked with `enable-xr`.

Use it for libraries such as Three.js, canvas renderers, chart renderers, or
other code that must attach DOM outside normal React rendering.

```tsx
<div
  enable-xr
  onSpatialContentReady={({ host }) => {
    const canvas = document.createElement('canvas')
    host.appendChild(canvas)

    return () => {
      canvas.remove()
    }
  }}
/>
```

## Terminology

**SpatialDiv** means a 2D HTML element that becomes spatial because it has the
`enable-xr` marker. In most app code this is just a normal intrinsic element:

```tsx
<div enable-xr />
```

The name "SpatialDiv" is shorthand for "a spatialized 2D `div`". The same
lifecycle applies to other supported 2D intrinsic elements when they use the
`enable-xr` marker.

**Host** means the concrete DOM element that the SDK gives to your callback.
It is the safe mount target for imperative code. If you use Three.js, canvas, or
a chart library, append or mount that library under `host`.

```tsx
onSpatialContentReady={({ host }) => {
  host.appendChild(canvas)
}}
```

In a WebSpatial runtime, this host belongs to the visible spatial content. In
plain web fallback, there is no spatial content host, so this callback does not
fire.

## Type Reference

```ts
type SpatialContentReadyContext = {
  host: HTMLElement
}

type SpatialContentReadyCallback = (
  ctx: SpatialContentReadyContext,
) => void | (() => void)

type SpatialContentReadyProps = {
  onSpatialContentReady?: SpatialContentReadyCallback
}
```

`onSpatialContentReady` is a prop for 2D elements marked with `enable-xr`.

## API Details

`host` is the connected DOM element for the visible 2D spatial content.
Application code may append imperative renderer DOM under this element.
When the callback runs, `host.isConnected` is guaranteed to be `true`;
`isConnected` is the standard DOM property on `Node`.

The callback can return a cleanup function. The cleanup runs before the next
ready callback for the same container and when the container unmounts or is
replaced.

## Where It Is Supported

`onSpatialContentReady` is supported on 2D spatial elements, typically a `<div>`
marked with `enable-xr`.

```tsx
<div enable-xr onSpatialContentReady={handleReady} />
```

It is not a public API for `Model`, `Reality`, or other non-2D portal
components.

## When It Fires

The callback fires when all of the following are true:

- A real spatialized 2D element exists.
- The portal DOM is available.
- The callback host has committed and `host.isConnected === true`.

The callback runs in layout-effect timing after DOM mutations and before the
browser paints. It is edge-triggered:

- It fires on a `not ready -> ready` transition.
- It does not fire again for ordinary re-renders while the same host remains
  ready.
- If the host is replaced, the previous cleanup runs and a new ready callback
  may fire for the new host.

## When It Does Not Fire

`onSpatialContentReady` does not fire when no real spatial portal host exists.

That includes:

- Plain web fallback.
- SSR.
- Before `bootSpatial()` has produced a spatial host.

The prop is also stripped from the DOM attribute space, so it is not emitted as
an `onSpatialContentReady` HTML attribute.

Use your own `ref` and React effect for plain-web imperative rendering.

## Common Use Cases

### Mount Three.js into a SpatialDiv

```tsx
import { useCallback } from 'react'

export function ThreePanel() {
  const handleReady = useCallback(({ host }) => {
    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    host.appendChild(canvas)

    const renderer = createThreeRenderer(canvas)
    renderer.start()

    return () => {
      renderer.dispose()
      canvas.remove()
    }
  }, [])

  return (
    <div
      enable-xr
      className="three-panel"
      onSpatialContentReady={handleReady}
    />
  )
}
```

### Support both spatial and plain web

Use `onSpatialContentReady` for the spatial portal and a normal ref for the
plain-web fallback.

```tsx
import { useEffect, useRef } from 'react'
import { useSpatialReady } from '@webspatial/react-sdk'

export function ChartPanel() {
  const flatHostRef = useRef<HTMLDivElement | null>(null)
  const spatialReady = useSpatialReady()

  useEffect(() => {
    if (spatialReady) return
    const host = flatHostRef.current
    if (!host) return

    const chart = mountChart(host)
    return () => chart.dispose()
  }, [spatialReady])

  return (
    <div
      ref={flatHostRef}
      enable-xr
      onSpatialContentReady={({ host }) => {
        const chart = mountChart(host)
        return () => chart.dispose()
      }}
    />
  )
}
```

## Do and Do Not

Do attach imperative renderers to `ctx.host`:

```tsx
<div
  enable-xr
  onSpatialContentReady={({ host }) => {
    const renderer = mountRenderer(host)
    return () => renderer.dispose()
  }}
/>
```

Do not rely on a child DOM ref inside a SpatialDiv as the spatial portal mount
target:

```tsx
function FragilePanel() {
  const childRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Fragile: this may refer to host-page fallback DOM instead of the visible
    // spatial portal host.
    if (childRef.current) {
      mountRenderer(childRef.current)
    }
  }, [])

  return (
    <div enable-xr>
      <div ref={childRef} />
    </div>
  )
}
```

## Nested SpatialDivs

Nested SpatialDivs initialize independently. Do not rely on parent and child
ready callback ordering. Each callback should attach only to its own `ctx.host`.

```tsx
<div enable-xr onSpatialContentReady={mountOuter}>
  <div enable-xr onSpatialContentReady={mountInner} />
</div>
```

## Usage Notes

- The callback is not invoked during render.
- The callback receives a connected host.
- A provided SpatialDiv ref is non-null when the callback runs, but the
  recommended imperative mount target is still `ctx.host`.
- Cleanup should be idempotent.
- Ordinary re-renders do not re-fire the callback while the host remains ready.
- Plain web fallback requires a normal `ref` and effect.

## References

- `openspec/changes/archive/2026-06-30-spatialdiv-content-ready-lifecycle/specs/spatialdiv-content-host-lifecycle/spec.md`
- `packages/react/src/spatialized-container/types.ts`
- `packages/react/src/spatialized-container/hooks/useSpatialContentReady.ts`
- `apps/test-server/src/pages/spatial-content-ready-three/index.tsx`
