# convertCoordinate

Convert 3D coordinates between different spatial reference frames — entities, models, and the window coordinate system.

## Overview

`convertCoordinate` is a utility function that transforms a 3D position from one coordinate space to another within a WebSpatial application. It enables developers to translate positions between entities (in local meters), models, and the window's global pixel coordinate system.

This is essential when you need to:

- Place one spatial object relative to another
- Convert an entity's local position into window-level pixel coordinates
- Map a window-level position into an entity's local coordinate space
- Synchronize positions across different Reality volumes

Under the hood, the function resolves each reference to an internal scene ID and delegates to the native visionOS layer, which performs the actual coordinate math using RealityKit's `Entity.convert(position:to:)` and `RealityViewContent.convert(point:from:to:)` APIs.

## Try it

```jsx
import { convertCoordinate } from '@webspatial/react-sdk'

function PlaceMarker({ targetEntityRef, markerEntityRef }) {
  const handlePlace = async () => {
    // Convert the origin of targetEntity into markerEntity's local space
    const localPos = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: targetEntityRef, to: markerEntityRef },
    )
    console.log('Position in marker local space:', localPos)
  }

  return <button onClick={handlePlace}>Place Marker</button>
}
```

## API

### Function Signature

```ts
function convertCoordinate(
  position: Vec3,
  options: {
    from: CoordinateConvertible
    to: CoordinateConvertible
  },
): Promise<Vec3>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `position` | `Vec3` | Yes | The 3D position to convert, expressed in the `from` coordinate space. |
| `options` | `object` | Yes | An object specifying the source and destination reference frames. |
| `options.from` | `CoordinateConvertible` | Yes | The source coordinate space. |
| `options.to` | `CoordinateConvertible` | Yes | The target coordinate space. |

### Return Value

| Type | Description |
|------|-------------|
| `Promise<Vec3>` | A promise that resolves to the converted position in the `to` coordinate space. If the conversion cannot be performed (e.g., unresolved IDs or missing spatial scene), the original `position` is returned unchanged as a safe fallback. |

## Types

### `Vec3`

```ts
interface Vec3 {
  x: number
  y: number
  z: number
}
```

### `CoordinateConvertible`

A union type representing any valid coordinate reference frame.

```ts
type CoordinateConvertible =
  | Window
  | SpatializedElementRef<any>
  | EntityRef
  | ModelRef
```

| Variant | Description |
|---------|-------------|
| `Window` | The browser `window` object. Represents the window's global coordinate space in pixels. |
| `SpatializedElementRef<any>` | A ref to a spatialized DOM element. Internally resolved to its spatial entity ID. |
| `EntityRef` | A ref to a Reality entity. Resolved via the `.entity.id` property. |
| `ModelRef` | A ref to a `<Model />` component instance. Resolved to its underlying entity. |

## Usage Notes

### Coordinate Units

- **Entity / Model local space**: positions are expressed in **meters**.
- **Window space**: positions are expressed in **pixels** (view global coordinates).

When converting from an entity to `window`, you receive pixel values. When converting from `window` to an entity, you provide pixel values and receive meters.

### Fallback Behavior

`convertCoordinate` is designed to be safe by default. If any of the following conditions are true, the function returns the original `position` unchanged instead of throwing:

- The `from` or `to` reference cannot be resolved to a valid scene ID.
- The spatial scene is not yet available (session not initialized).
- The native conversion call fails or throws internally.

This means you can call `convertCoordinate` early in a component lifecycle without wrapping it in try/catch, though you should be aware that the result may be unconverted.

### Async Nature

The function is asynchronous because the actual coordinate transformation is performed on the native (visionOS) side via a bridge command (`ConvertCoordinateCommand`). Always `await` the result.

### Supported Conversions

| From | To | Supported | Notes |
|------|----|-----------|-------|
| Entity | Entity | Yes | Works within the same Reality volume and across different Reality volumes. |
| Entity | Window | Yes | Converts entity-local meters to window-global pixels. |
| Window | Entity | Yes | Converts window-global pixels to entity-local meters. |
| Model | Entity | No | Model refs are resolved to their underlying entity. |
| Entity | Model | No | Model refs are resolved to their underlying entity. |
| Model | Window | No | Equivalent to Entity-to-Window after ref resolution. |
| Window | Model | No | Equivalent to Window-to-Entity after ref resolution. |
| SpatializedElement | Entity | No | Element refs are resolved via their internal spatialized element ID. |
| 2D Frame | Any | **No** | 2D frame-based coordinate conversion is not yet supported. |

### Reference Resolution

Internally, each `CoordinateConvertible` target is resolved to a string ID via the `resolveId` helper:

1. **`window`** — resolved to the spatial scene's own ID (the root scene coordinate space).
2. **`EntityRef`** — resolved via `entityRef.entity.id`.
3. **`SpatializedElementRef` / `ModelRef`** — resolved by traversing `__spatializedElement`, `__innerSpatializedElement`, or falling back to the `SpatialID` DOM attribute.

If resolution returns `null`, the conversion is skipped and the original position is returned.

## Examples

### Entity to Window

Convert an entity's local origin into window pixel coordinates — useful for overlaying 2D UI on top of a 3D object.

```tsx
import { useRef, useState } from 'react'
import { convertCoordinate } from '@webspatial/react-sdk'
import type { EntityRef } from '@webspatial/react-sdk'

function EntityOverlay() {
  const entityRef = useRef<EntityRef>(null)
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0, z: 0 })

  const updateOverlay = async () => {
    if (!entityRef.current) return
    const windowPos = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: entityRef.current, to: window },
    )
    setScreenPos(windowPos)
  }

  return (
    <>
      <Reality>
        <Entity ref={entityRef} position={{ x: 0, y: 1.5, z: -2 }}>
          <Model src="/assets/marker.usdz" />
        </Entity>
      </Reality>
      <button onClick={updateOverlay}>Sync Overlay</button>
      <div style={{
        position: 'absolute',
        left: `${screenPos.x}px`,
        top: `${screenPos.y}px`,
      }}>
        Label
      </div>
    </>
  )
}
```

### Window to Entity

Convert a window-level pixel position into an entity's local coordinate space.

```tsx
import { useRef } from 'react'
import { convertCoordinate } from '@webspatial/react-sdk'
import type { EntityRef } from '@webspatial/react-sdk'

function PlaceAtScreenCenter({ children }) {
  const containerRef = useRef<EntityRef>(null)

  const placeAtCenter = async () => {
    if (!containerRef.current) return
    const centerPixel = { x: 960, y: 540, z: 0 }
    const localPos = await convertCoordinate(centerPixel, {
      from: window,
      to: containerRef.current,
    })
    console.log('Local position in entity space (meters):', localPos)
  }

  return (
    <Reality>
      <Entity ref={containerRef}>
        {children}
      </Entity>
    </Reality>
  )
}
```

### Entity to Entity (Cross-Reality)

Transfer a position from one entity to another, even across different Reality volumes.

```tsx
import { useRef } from 'react'
import { convertCoordinate } from '@webspatial/react-sdk'
import type { EntityRef } from '@webspatial/react-sdk'

function CrossRealitySync() {
  const sourceRef = useRef<EntityRef>(null)
  const targetRef = useRef<EntityRef>(null)

  const syncPosition = async () => {
    if (!sourceRef.current || !targetRef.current) return
    const converted = await convertCoordinate(
      { x: 0.5, y: 0.5, z: 0 },
      { from: sourceRef.current, to: targetRef.current },
    )
    console.log('Position in target entity space:', converted)
  }

  return (
    <>
      <Reality>
        <Entity ref={sourceRef} position={{ x: 0, y: 1, z: -1 }}>
          <Model src="/assets/source.usdz" />
        </Entity>
      </Reality>
      <Reality>
        <Entity ref={targetRef} position={{ x: 1, y: 1, z: -2 }}>
          <Model src="/assets/target.usdz" />
        </Entity>
      </Reality>
      <button onClick={syncPosition}>Sync</button>
    </>
  )
}
```

### Using with Model Refs

```tsx
import { useRef } from 'react'
import { convertCoordinate } from '@webspatial/react-sdk'
import type { ModelRef } from '@webspatial/react-sdk'

function ModelDistanceCheck() {
  const modelA = useRef<ModelRef>(null)
  const modelB = useRef<ModelRef>(null)

  const checkDistance = async () => {
    if (!modelA.current || !modelB.current) return
    const relativePos = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: modelB.current, to: modelA.current },
    )
    const distance = Math.sqrt(
      relativePos.x ** 2 + relativePos.y ** 2 + relativePos.z ** 2,
    )
    console.log(`Distance: ${distance.toFixed(3)} meters`)
  }

  return (
    <Reality>
      <Entity>
        <Model ref={modelA} src="/assets/a.usdz" />
      </Entity>
      <Entity position={{ x: 2, y: 0, z: 0 }}>
        <Model ref={modelB} src="/assets/b.usdz" />
      </Entity>
      <button onClick={checkDistance}>Measure</button>
    </Reality>
  )
}
```

## Technical Summary

| Aspect | Details |
|--------|---------|
| **Import** | `import { convertCoordinate } from '@webspatial/react-sdk'` |
| **Return type** | `Promise<Vec3>` |
| **Async** | Yes — requires `await` |
| **Fallback** | Returns original `position` on failure or unresolvable refs |
| **Coordinate units (entity)** | Meters |
| **Coordinate units (window)** | Pixels (view global) |
| **Cross-Reality** | Supported (entity-to-entity across different Reality volumes) |
| **2D Frame conversion** | Not supported |
| **Native bridge** | `ConvertCoordinateCommand` via `SpatialScene.convertCoordinate()` |
| **Native APIs used** | `Entity.convert(position:to:)`, `RealityViewContent.convert(point:from:to:)` |
| **Error handling** | Silent — catches all errors and returns original position |

## Browser Compatibility

| Platform | Support Status | Notes |
|----------|---------------|-------|
| visionOS (Safari) | ✅ Supported | Full support via RealityKit native bridge. |
| Android XR | TBD / Planned | Pending platform availability and native bridge implementation. |
| Desktop browsers | N/A | No spatial coordinate system available. Returns original position. |
| iOS Safari | N/A | No volumetric spatial support. |

## Architecture

The coordinate conversion pipeline spans three layers:

```
React Layer                Core SDK Layer             Native (visionOS) Layer
─────────────              ──────────────             ───────────────────────

convertCoordinate()   →    SpatialScene               Swift Implementation
  │                        .convertCoordinate()          │
  ├─ resolveId(from)  →      │                           ├─ Step 1: → Window coords
  ├─ resolveId(to)    →      ├─ ConvertCoordinate        │   • scene id → already global
  │                          │   Command                 │   • entity id →
  └─ await result     ←      │                           │     local → world → global px
                             └─ sends {position,         │
                                  fromId, toId}          ├─ Step 2: Window → Target
                                  to native              │   • scene id → return as-is
                                                         │   • entity id →
                                                         │     global px → world → local
                                                         │
                                                         └─ Returns Vec3 result
```

### Native Two-Step Conversion

**Step 1 — Convert to Window (view global, pixels):**
- If `from` is the **window** (scene ID), the position is already in view-global pixel space.
- If `from` is an **entity**, convert: entity-local → reality scene world → view-global pixels.

**Step 2 — Convert from Window to Target:**
- If `to` is the **window**, return the intermediate pixel coordinates directly.
- If `to` is an **entity**, convert: view-global pixels → reality scene world → entity-local.

This two-step approach via the window coordinate system ensures cross-Reality conversions work correctly, since all Reality volumes share the same window-global pixel space.

## References

- [`Vec3`](./Vec3.md) — 3D vector type used for positions
- [`<Reality>`](./Reality.md) — Reality volume component
- [`<Entity>`](./Entity.md) — Entity component and `EntityRef`
- [`<Model>`](./Model.md) — Model component and `ModelRef`
- [`SpatializedElementRef`](./SpatializedContainer.md) — Spatialized container ref type
- [RealityKit — Entity coordinate conversion](https://developer.apple.com/documentation/realitykit/entity/convert(position:from:))
- [RealityKit — RealityViewContent](https://developer.apple.com/documentation/realitykit/realityviewcontent)
