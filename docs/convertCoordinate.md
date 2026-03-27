# convertCoordinate

Convert 3D coordinates between different spatial reference frames — entities, models, 2D frames (spatialized elements), and the window coordinate system.

## Overview

`convertCoordinate` is a utility function that transforms a 3D position from one coordinate space to another within a WebSpatial application. It enables developers to translate positions between entities (in local meters), models, 2D frames (spatialized DOM elements, in local pixels), and the window's global pixel coordinate system.

This is essential when you need to:

- Place one spatial object relative to another
- Convert an entity's local position into window-level pixel coordinates
- Map a window-level position into an entity's local coordinate space
- Convert coordinates between 2D spatialized elements and 3D entities
- Convert coordinates between two 2D spatialized elements
- Synchronize positions across different Reality volumes

Under the hood, the function resolves each reference to an internal scene ID and delegates to the native visionOS layer, which performs the actual coordinate math using RealityKit's `Entity.convert(position:to:)` and `RealityViewContent.convert(point:from:to:)` APIs, along with `SpatializedElement.convertToScene` / `convertFromScene` for 2D frame conversions.

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
| `SpatializedElementRef<any>` | A ref to a spatialized DOM element (2D frame). Coordinates are in **view-local pixels**. Internally resolved to its spatial element ID. |
| `EntityRef` | A ref to a Reality entity. Resolved via the `.entity.id` property. |
| `ModelRef` | A ref to a `<Model />` component instance. Resolved to its underlying entity. |

## Usage Notes

### Coordinate Units

- **Entity / Model local space**: positions are expressed in **meters**.
- **2D Frame (SpatializedElement) local space**: positions are expressed in **pixels** (view-local coordinates).
- **Window space**: positions are expressed in **pixels** (view global coordinates).

When converting from an entity to `window`, you receive pixel values. When converting from `window` to an entity, you provide pixel values and receive meters. When converting from a 2D frame to `window`, both are in pixels but the frame uses view-local coordinates while the window uses view-global coordinates.

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
| Entity | 2D Frame | Yes | Converts entity-local meters to 2D frame view-local pixels (via window as intermediate). |
| 2D Frame | Entity | Yes | Converts 2D frame view-local pixels to entity-local meters (via window as intermediate). |
| 2D Frame | Window | Yes | Converts 2D frame view-local pixels to window-global pixels. |
| Window | 2D Frame | Yes | Converts window-global pixels to 2D frame view-local pixels. |
| 2D Frame | 2D Frame | Yes | Converts between two 2D frame local coordinate spaces (via window as intermediate). |
| Model | Entity | Yes | Model refs are resolved to their underlying entity. |
| Entity | Model | Yes | Model refs are resolved to their underlying entity. |
| Model | Window | Yes | Equivalent to Entity-to-Window after ref resolution. |
| Window | Model | Yes | Equivalent to Window-to-Entity after ref resolution. |
| SpatializedElement | Entity | Yes | Element refs are resolved via their internal spatialized element ID. |

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

### 2D Frame to Entity

Convert a position from a 2D spatialized element's local pixel space to an entity's local meter space — useful when you need to move an entity to align with a DOM element.

```tsx
import { useRef, useState } from 'react'
import {
  convertCoordinate,
  BoxEntity,
  Reality,
  SceneGraph,
  UnlitMaterial,
} from '@webspatial/react-sdk'
import type { EntityRef, SpatializedElementRef } from '@webspatial/react-sdk'

function MoveEntityToDiv() {
  const entityRef = useRef<EntityRef>(null)
  const divRef = useRef<HTMLDivElement>(null)
  const [entityPos, setEntityPos] = useState({ x: 0, y: 0, z: 0 })

  const moveToDiv = async () => {
    const eRef = entityRef.current
    const dRef = divRef.current
    if (!eRef || !dRef) return

    // Get the center of the div in entity's local coordinate space
    const divCenter = {
      x: dRef.offsetWidth / 2,
      y: dRef.offsetHeight / 2,
      z: 0,
    }
    const divCenterInEntity = await convertCoordinate(divCenter, {
      from: dRef as any,
      to: eRef,
    })

    // Move entity to align with the div's center
    setEntityPos(prev => ({
      x: prev.x + divCenterInEntity.x,
      y: prev.y + divCenterInEntity.y,
      z: prev.z + divCenterInEntity.z,
    }))
  }

  return (
    <>
      <Reality style={{ width: '100%', height: '300px' }}>
        <UnlitMaterial id="mat" color="#ff0000" />
        <SceneGraph>
          <BoxEntity
            ref={entityRef}
            width={0.1}
            height={0.1}
            depth={0.1}
            materials={['mat']}
            position={entityPos}
          />
        </SceneGraph>
      </Reality>
      <div
        ref={divRef}
        enable-xr
        style={{
          width: '120px',
          height: '120px',
          backgroundColor: '#0000ff',
        }}
      >
        Target Div
      </div>
      <button onClick={moveToDiv}>Move Entity to Div</button>
    </>
  )
}
```

### 2D Frame to 2D Frame

Convert coordinates between two spatialized DOM elements — useful for aligning 2D spatial panels.

```tsx
import { useRef, useState } from 'react'
import { convertCoordinate } from '@webspatial/react-sdk'

function AlignSpatialDivs() {
  const divARef = useRef<HTMLDivElement>(null)
  const divBRef = useRef<HTMLDivElement>(null)
  const [aPosition, setAPosition] = useState({ x: 40, y: 40 })

  const moveAToB = async () => {
    const aEl = divARef.current
    const bEl = divBRef.current
    if (!aEl || !bEl) return

    // Get A's origin position in B's local coordinate space
    const aInB = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: aEl as any, to: bEl as any },
    )

    // Move A by the negative offset to align origins
    setAPosition(prev => ({
      x: prev.x - aInB.x,
      y: prev.y - aInB.y,
    }))
  }

  return (
    <div enable-xr style={{ position: 'relative', width: '100%', height: '400px' }}>
      <div
        ref={divARef}
        enable-xr
        style={{
          position: 'absolute',
          left: aPosition.x,
          top: aPosition.y,
          width: '120px',
          height: '80px',
          backgroundColor: '#ff0000',
        }}
      >
        Panel A
      </div>
      <div
        ref={divBRef}
        enable-xr
        style={{
          position: 'absolute',
          left: 240,
          top: 120,
          width: '120px',
          height: '80px',
          backgroundColor: '#0000ff',
        }}
      >
        Panel B
      </div>
      <button onClick={moveAToB}>Move A to B</button>
    </div>
  )
}
```

### 2D Frame to Window

Convert a 2D frame's local pixel position to window-global pixel coordinates.

```tsx
import { useRef, useState } from 'react'
import { convertCoordinate } from '@webspatial/react-sdk'

function FrameToWindowCoords() {
  const divRef = useRef<HTMLDivElement>(null)
  const [windowPos, setWindowPos] = useState({ x: 0, y: 0, z: 0 })

  const getWindowCoords = async () => {
    const el = divRef.current
    if (!el) return

    const pos = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: el as any, to: window as any },
    )
    setWindowPos(pos)
    console.log('Frame origin in window coords:', pos)
  }

  return (
    <div>
      <div
        ref={divRef}
        enable-xr
        style={{ width: '200px', height: '200px', backgroundColor: '#00ff00' }}
      >
        Spatial Panel
      </div>
      <button onClick={getWindowCoords}>Get Window Position</button>
      <p>Window coords: ({windowPos.x.toFixed(1)}, {windowPos.y.toFixed(1)})</p>
    </div>
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
| **Coordinate units (2D frame)** | Pixels (view-local) |
| **Coordinate units (window)** | Pixels (view global) |
| **Cross-Reality** | Supported (entity-to-entity across different Reality volumes) |
| **2D Frame conversion** | Supported (via `SpatializedElement.convertToScene` / `convertFromScene`) |
| **Native bridge** | `ConvertCoordinateCommand` via `SpatialScene.convertCoordinate()` |
| **Native APIs used** | `Entity.convert(position:to:)`, `RealityViewContent.convert(point:from:to:)`, `SpatializedElement.convertToScene`, `SpatializedElement.convertFromScene` |
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
                             └─ sends {position,         │   • 2d frame →
                                  fromId, toId}          │     localPx → globalPx
                                  to native              │
                                                         ├─ Step 2: Window → Target
                                                         │   • scene id → return as-is
                                                         │   • entity id →
                                                         │     global px → world → local
                                                         │   • 2d frame →
                                                         │     globalPx → localPx
                                                         │
                                                         └─ Returns Vec3 result
```

### Native Two-Step Conversion

**Step 1 — Convert to Window (view global, pixels):**
- If `from` is the **window** (scene ID), the position is already in view-global pixel space.
- If `from` is a **2D frame** (SpatializedElement), convert: view-local pixels → view-global pixels using `SpatializedElement.convertToScene`.
- If `from` is an **entity**, convert: entity-local → reality scene world → view-global pixels.

**Step 2 — Convert from Window to Target:**
- If `to` is the **window**, return the intermediate pixel coordinates directly.
- If `to` is a **2D frame** (SpatializedElement), convert: view-global pixels → view-local pixels using `SpatializedElement.convertFromScene`.
- If `to` is an **entity**, convert: view-global pixels → reality scene world → entity-local.

This two-step approach via the window coordinate system ensures cross-Reality conversions and cross-type conversions (entity ↔ 2D frame) work correctly, since all Reality volumes and 2D frames share the same window-global pixel space.

## References

- [`Vec3`](./Vec3.md) — 3D vector type used for positions
- [`<Reality>`](./Reality.md) — Reality volume component
- [`<Entity>`](./Entity.md) — Entity component and `EntityRef`
- [`<Model>`](./Model.md) — Model component and `ModelRef`
- [`SpatializedElementRef`](./SpatializedContainer.md) — Spatialized container ref type
- [RealityKit — Entity coordinate conversion](https://developer.apple.com/documentation/realitykit/entity/convert(position:from:))
- [RealityKit — RealityViewContent](https://developer.apple.com/documentation/realitykit/realityviewcontent)
