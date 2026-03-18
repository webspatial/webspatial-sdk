# Technical PRD: Dynamic 3D API — Material Properties, Geometry Modification & Model Entity Updates

## Overview

This document specifies the technical design for making 3D scene properties dynamically updatable at runtime through React props in the WebSpatial SDK. Currently, materials, geometries, and model entities are static after creation — changing React props after mount has no effect on the native rendering.

### Motivation

Real-world spatial applications need runtime configurability:

- **Car configurators** (Tesla/BMW): Users select body colors, wheel styles, interior materials in real time on a 3D model
- **Furniture apps** (IKEA Place): Users swap tabletop materials (wood/glass), adjust chair positions, add/remove accessories
- **Product viewers**: Dynamic highlighting, variant switching, interactive geometry resizing

### Scope

| Feature                       | Description                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Dynamic Material Properties   | `<UnlitMaterial>` props (`color`, `transparent`, `opacity`) update at runtime                   |
| Dynamic Geometry Modification | Primitive entity props (`width`, `height`, `depth`, `cornerRadius`, `radius`) update at runtime |
| Model Entity Updates          | `<ModelEntity>` supports model swapping and material override at runtime                        |

**Out of scope:** Complex entity tree operations (add/remove/move nodes) — React's declarative rendering already handles this via conditional rendering and the existing `ParentContext` hierarchy.

---

## Feature 1: Dynamic Material Properties

### Problem

`<UnlitMaterial>` creates its native material resource on mount but ignores prop changes afterward. The `useEffect` in `UnlitMaterial.tsx` only depends on `[ctx]`, so changing `color`, `transparent`, or `opacity` has no effect.

### Solution

Add a `useEffect` that watches material props and calls the existing `SpatialUnlitMaterial.updateProperties()` method on the core SDK, which sends an `UpdateUnlitMaterialProperties` JSB command to the native runtime.

### API Design

```tsx
import { useState } from 'react'
import {
  Reality,
  SceneGraph,
  BoxEntity,
  UnlitMaterial,
} from '@webspatial/react-sdk'

export function DynamicMaterialExample() {
  const [variant, setVariant] = useState<'default' | 'warning' | 'muted'>(
    'default',
  )

  const presets = {
    default: { color: '#4a90e2', transparent: false, opacity: 1 },
    warning: { color: '#ff4d4f', transparent: true, opacity: 0.9 },
    muted: { color: '#888888', transparent: true, opacity: 0.4 },
  } as const

  const mat = presets[variant]

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setVariant('default')}>Default</button>
        <button onClick={() => setVariant('warning')}>Warning</button>
        <button onClick={() => setVariant('muted')}>Muted</button>
      </div>

      <Reality style={{ width: '100%', height: 260 }}>
        {/* Dynamic material: color / transparent / opacity change at runtime */}
        <UnlitMaterial
          id="highlight"
          color={mat.color}
          transparent={mat.transparent}
          opacity={mat.opacity}
        />
        <SceneGraph>
          <BoxEntity
            width={0.4}
            height={0.25}
            depth={0.02}
            cornerRadius={0.04}
            materials={['highlight']}
            position={{ x: 0, y: 0, z: 0.5 }}
          />
        </SceneGraph>
      </Reality>
    </div>
  )
}
```

### Architecture

```
React prop change (color/opacity/transparent)
  → useEffect detects change
  → SpatialUnlitMaterial.updateProperties()    [core-sdk, already exists]
  → UpdateUnlitMaterialProperties JSB command  [core-sdk, already exists]
  → Native handler receives command            [NEW: visionOS handler]
  → SpatialUnlitMaterial.updateProperties()    [NEW: native method]
  → RealityKit UnlitMaterial rebuilt + re-applied to entity
```

### Changes Required

| Layer    | File                    | Change                                                     |
| -------- | ----------------------- | ---------------------------------------------------------- |
| React    | `UnlitMaterial.tsx`     | Add `useEffect` watching `color`, `transparent`, `opacity` |
| Core SDK | —                       | No changes (already has `updateProperties()`)              |
| visionOS | `JSBCommand.swift`      | Add `UpdateUnlitMaterialProperties` struct                 |
| visionOS | `SpatialMaterial.swift` | Add `updateProperties()` to `SpatialUnlitMaterial`         |
| visionOS | `SpatialScene.swift`    | Register handler                                           |

### Constraints

- No texture changes in this phase
- Partial updates supported (e.g., change only `color` without affecting `opacity`)
- Material updates are applied to all entities referencing that material

---

## Feature 2: Dynamic Geometry Shape Modification

### Problem

Primitive entities (`BoxEntity`, `SphereEntity`, etc.) create their geometry and model component on mount only. The `GeometryEntity` component has no mechanism to detect or respond to geometry prop changes.

### Solution

When geometry props change, **destroy the old model component** and **create a new one** with updated geometry dimensions. The entity itself is preserved, maintaining its position in the scene graph, transform, and event listeners.

### API Design

```tsx
import { useState } from 'react'
import {
  Reality,
  SceneGraph,
  BoxEntity,
  UnlitMaterial,
} from '@webspatial/react-sdk'

export function BoxGeometryExample() {
  const [box, setBox] = useState({
    width: 0.2,
    height: 0.2,
    depth: 0.1,
    cornerRadius: 0.02,
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <label>
          Width: {box.width.toFixed(2)}
          <input
            type="range"
            min="0.05"
            max="0.4"
            step="0.01"
            value={box.width}
            onChange={e => setBox({ ...box, width: Number(e.target.value) })}
          />
        </label>
        {/* Similar controls for height, depth, cornerRadius */}
      </div>

      <Reality style={{ width: '100%', height: 300 }}>
        <UnlitMaterial id="panel" color="#4a90e2" />
        <SceneGraph>
          <BoxEntity
            width={box.width} // triggers geometry rebuild
            height={box.height} // triggers geometry rebuild
            depth={box.depth} // triggers geometry rebuild
            cornerRadius={box.cornerRadius} // triggers geometry rebuild
            materials={['panel']}
            position={{ x: 0, y: 0, z: 0.5 }}
          />
        </SceneGraph>
      </Reality>
    </div>
  )
}
```

### Architecture

```
React prop change (width/height/depth/cornerRadius)
  → useEffect detects change via shallow comparison
  → Destroy old SpatialComponent (removes from entity)
  → Create new SpatialGeometry with updated options
  → Resolve materials from ResourceRegistry
  → Create new ModelComponent (geometry + materials)
  → addComponent() to existing entity
  → Entity preserved (transform, events, hierarchy intact)
```

### Changes Required

| Layer    | File                 | Change                                    |
| -------- | -------------------- | ----------------------------------------- |
| React    | `GeometryEntity.tsx` | Add geometry/material rebuild `useEffect` |
| React    | `equal.ts`           | Add `shallowEqualObject()` utility        |
| Core SDK | `JSBCommand.ts`      | Add `RemoveComponentFromEntityCommand`    |
| Core SDK | `SpatialEntity.ts`   | Add `removeComponent()` method            |
| visionOS | `JSBCommand.swift`   | Add `RemoveComponentFromEntity` struct    |
| visionOS | `SpatialScene.swift` | Register handler                          |

### Constraints

- Geometry rebuild is a heavier operation than material update (creates new native resources)
- All primitive entities inherit this behavior through `GeometryEntity`
- The `materials` prop on geometry entities is also reactive

---

## Feature 3: Model Entity — Dynamic Model Swapping + Material Override

### Problem

`<ModelEntity>` loads a model asset once on mount. Changing the `model` prop has no effect. There is also no way to override materials on a loaded model.

### Solution

**Model swapping:** Add a `recreateKeys` mechanism to `useEntity` that triggers entity destruction and recreation when specified props change.

**Material override:** Add a `materials` prop to `ModelEntity` and a new `SetMaterialsOnEntity` JSB command that walks the model's entity hierarchy and replaces materials on all `ModelComponent` instances.

### API Design

```tsx
import { useState } from 'react'
import {
  Reality,
  SceneGraph,
  Entity,
  ModelAsset,
  ModelEntity,
  UnlitMaterial,
} from '@webspatial/react-sdk'

function CarConfigurator() {
  const [wheelModel, setWheelModel] = useState('sport_wheel')
  const [bodyColor, setBodyColor] = useState('red')

  return (
    <Reality>
      <ModelAsset id="chassis" src="car_chassis.usdz" />
      <ModelAsset id="sport_wheel" src="sport_wheel.usdz" />
      <ModelAsset id="classic_wheel" src="classic_wheel.usdz" />
      <UnlitMaterial id="redPaint" color={bodyColor} />

      <SceneGraph>
        <Entity name="car" position={{ x: 0, y: 0, z: 0.5 }}>
          {/* Material override on model entity */}
          <ModelEntity model="chassis" materials={['redPaint']} />

          {/* Model swapping via prop change */}
          <ModelEntity model={wheelModel} position={{ x: 0.5, y: 0, z: 0.5 }} />
        </Entity>
      </SceneGraph>

      <button
        onClick={() =>
          setWheelModel(
            wheelModel === 'sport_wheel' ? 'classic_wheel' : 'sport_wheel',
          )
        }
      >
        Toggle Wheels
      </button>
      <button
        onClick={() => setBodyColor(bodyColor === 'red' ? 'blue' : 'red')}
      >
        Toggle Color
      </button>
    </Reality>
  )
}
```

### Architecture — Model Swapping

```
React prop change (model)
  → useEntity recreateKeys includes model
  → useEffect cleanup: destroy old entity
  → useEffect init: create new entity with new model asset
  → New entity added to parent/reality
```

### Architecture — Material Override

```
React prop change (materials)
  → useEffect resolves material IDs from ResourceRegistry
  → SpatialModelEntity.setMaterials()              [NEW: core-sdk]
  → SetMaterialsOnEntity JSB command               [NEW: core-sdk]
  → Native handler receives command                 [NEW: visionOS]
  → Walk model entity tree, replace ModelComponent materials
```

### Changes Required

| Layer    | File                       | Change                                    |
| -------- | -------------------------- | ----------------------------------------- |
| React    | `ModelEntity.tsx`          | Add `materials` prop, pass `recreateKeys` |
| React    | `useEntity.tsx`            | Add `recreateKeys` parameter              |
| Core SDK | `JSBCommand.ts`            | Add `SetMaterialsOnEntityCommand`         |
| Core SDK | `SpatialModelEntity.ts`    | Add `setMaterials()` method               |
| visionOS | `JSBCommand.swift`         | Add `SetMaterialsOnEntity` struct         |
| visionOS | `SpatialModelEntity.swift` | Add `setMaterials()` method               |
| visionOS | `SpatialScene.swift`       | Register handler                          |

### Constraints

- Model swapping destroys and recreates the native entity (position/events reset)
- Material override applies to ALL `ModelComponent` instances in the model's hierarchy
- Per-mesh material targeting is not supported in this phase

---

## Summary of All Native Commands

| Command                         | Direction   | Purpose                                    |
| ------------------------------- | ----------- | ------------------------------------------ |
| `UpdateUnlitMaterialProperties` | JS → Native | Update material color/opacity/transparency |
| `RemoveComponentFromEntity`     | JS → Native | Remove a component from an entity          |
| `SetMaterialsOnEntity`          | JS → Native | Override materials on a model entity       |

---

## Testing Strategy

1. **Unit tests**: Verify React components detect prop changes and call core-sdk methods
2. **Integration tests**: Verify JSB commands are sent with correct parameters
3. **Manual testing**: Create test app with interactive controls for all three features
4. **Regression**: Ensure existing static creation flows still work
