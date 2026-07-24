# Runtime Capabilities

## Overview

Runtime capabilities let applications ask whether the current WebSpatial
runtime supports a feature before using it. Prefer capability checks over
hardcoded platform names or shell versions.

Use this API when a feature is optional, version-gated, or has a web fallback.

Release scope note: entity animation capability checks are intentionally omitted
from this release document because the required PicoOS DC runtime support is not
included in this DC release.

```tsx
import { WebSpatialRuntime } from '@webspatial/react-sdk'

if (WebSpatialRuntime.supports('Model', ['poster'])) {
  // Safe to use Model poster behavior in the current runtime.
}
```

## Type Reference

```ts
type RuntimeCapabilityName = string
type RuntimeCapabilityToken = string

type WebSpatialRuntime = {
  supports: (
    name: RuntimeCapabilityName,
    tokens?: RuntimeCapabilityToken[],
  ) => boolean
}

class WebSpatialRuntimeError extends Error {
  name: 'WebSpatialRuntimeError'
  capability: string
}
```

Use string capability names directly. The public API accepts unknown strings and
returns `false` for unsupported or unrecognized capabilities, so applications do
not need to import a key registry.

## API Details

### `WebSpatialRuntime.supports(name, tokens?)`

```ts
WebSpatialRuntime.supports(name: string, tokens?: string[]): boolean
```

Returns `true` when the current runtime supports a capability.

Rules:

- Unknown top-level capability names return `false`.
- Unknown sub-tokens return `false`.
- Multiple sub-tokens use AND semantics: every token must be supported.
- An empty token array behaves the same as omitting `tokens`.
- Plain web and SSR return `false` for spatial-dependent features.

### `WebSpatialRuntimeError`

Some APIs fail fast when the capability they require is unavailable. Those
failures use `WebSpatialRuntimeError`.

```tsx
import {
  WebSpatialRuntimeError,
  convertCoordinate,
} from '@webspatial/react-sdk'

try {
  await convertCoordinate({ x: 0, y: 0, z: 0 }, { from, to })
} catch (error) {
  if (error instanceof WebSpatialRuntimeError) {
    console.warn(error.capability)
  }
}
```

Capability checks are still the recommended path for optional UI. Error handling
is mainly for imperative code where the capability may disappear from the
control flow.

## Capability Keys

Top-level keys currently include:

| Group             | Keys                                                                                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Components        | `Model`, `Reality`, `Entity`, `BoxEntity`, `SphereEntity`, `ConeEntity`, `CylinderEntity`, `PlaneEntity`, `SceneGraph`, `ModelAsset`, `ModelEntity`, `Material`, `UnlitMaterial`, `AttachmentAsset`, `AttachmentEntity` |
| Component aliases | `Box`, `Sphere`, `Cone`, `Cylinder`, `Plane`, `World`                                                                                                                                                                   |
| CSS               | `-xr-background-material`, `-xr-back`, `-xr-depth`, `-xr-transform`                                                                                                                                                     |
| Events            | `SpatialTapEvent`, `SpatialDragStartEvent`, `SpatialDragEvent`, `SpatialDragEndEvent`, `SpatialRotateEvent`, `SpatialRotateEndEvent`, `SpatialMagnifyEvent`, `SpatialMagnifyEndEvent`                                   |
| JavaScript APIs   | `useMetrics`, `convertCoordinate`, `initScene`, `WindowScene`, `VolumeScene`                                                                                                                                            |
| DOM readbacks     | `xrClientDepth`, `xrOffsetBack`, `xrInnerDepth`, `xrOuterDepth`                                                                                                                                                         |

Supported sub-tokens:

| Capability           | Sub-tokens                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Model`              | `autoplay`, `loop`, `stagemode`, `poster`, `loading`, `source`, `ready`, `currentSrc`, `entityTransform`, `paused`, `duration`, `playbackRate`, `play`, `pause`, `currentTime` |
| `Material`           | `unlit`                                                                                                                                                                        |
| `WindowScene`        | `defaultSize`, `resizability`                                                                                                                                                  |
| `VolumeScene`        | `defaultSize`, `resizability`, `worldScaling`, `worldAlignment`, `baseplateVisibility`                                                                                         |
| `SpatialRotateEvent` | `constrainedToAxis`                                                                                                                                                            |

## Common Use Cases

### Gate Model features

```tsx
import { Model, WebSpatialRuntime } from '@webspatial/react-sdk'

export function ProductModel() {
  const canUsePoster = WebSpatialRuntime.supports('Model', ['poster'])
  const canLazyLoad = WebSpatialRuntime.supports('Model', ['loading'])

  return (
    <Model
      enable-xr
      src="/models/product.glb"
      poster={canUsePoster ? '/models/product-poster.png' : undefined}
      loading={canLazyLoad ? 'lazy' : 'eager'}
    />
  )
}
```

### Avoid platform version checks

Avoid:

```ts
const canUseCurrentTime = isPicoBeta20OrNewer || isVisionOS17OrNewer
```

Prefer:

```ts
const canUseCurrentTime = WebSpatialRuntime.supports('Model', ['currentTime'])
```

### Show optional controls

```tsx
import { WebSpatialRuntime } from '@webspatial/react-sdk'

export function PlaybackControls() {
  if (!WebSpatialRuntime.supports('Model', ['play', 'pause', 'currentTime'])) {
    return null
  }

  return <ModelTimeline />
}
```

### Handle unsupported imperative APIs

```tsx
import {
  WebSpatialRuntime,
  WebSpatialRuntimeError,
  convertCoordinate,
} from '@webspatial/react-sdk'

async function convertIfSupported(point, from, to) {
  if (!WebSpatialRuntime.supports('convertCoordinate')) {
    return null
  }

  try {
    return await convertCoordinate(point, { from, to })
  } catch (error) {
    if (error instanceof WebSpatialRuntimeError) {
      return null
    }
    throw error
  }
}
```

## Usage Notes

- Capability values are stable for the current page/session.
- `supports()` is synchronous and safe in SSR.
- `supports()` does not boot the spatial runtime and does not request the
  spatial implementation chunk.
- Use string keys directly or wrap them in application-level constants. The
  public API does not require importing key constants.
- For React rendering, prefer feature-gated UI over try/catch.
- For SSR request-time branching, use request information such as User-Agent.
  The client capability API is not a server request classifier.

## References

- `openspec/specs/runtime-capabilities/spec.md`
- `packages/react/src/webSpatialRuntime.ts`
