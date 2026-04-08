# Runtime feature detection — design review (consolidated)

This document consolidates agreed technical decisions and fallback conventions for **WebSpatial runtime capability detection**.

<a id="review-contents"></a>

## Contents

- [1. Problem and principles](#review-1)
- [2. Public API surface](#review-2)
  - [2.1 `WebSpatialRuntime.supports(name, tokens?)`](#review-2-1)
  - [2.2 Internal runtime snapshot (`getRuntime`)](#review-2-2)
  - [2.3 SSR / no `window`](#review-2-3)
- [3. Capability keys](#review-3)
  - [3.1 CSS](#review-3-1)
  - [3.2 HTML components](#review-3-2)
  - [3.3 Spatial gesture events](#review-3-3)
  - [3.4 JS API / scene / utility](#review-3-4)
  - [3.5 DOM depth keys](#review-3-5)
  - [3.6 `Model` sub-capabilities](#review-3-6)
- [4. Resolution rules](#review-4)
  - [4.1 Non-WebSpatial runtime (`type === null`)](#review-4-1)
  - [4.2 Shell newer than table](#review-4-2)
  - [4.3 Shell older than table minimum](#review-4-3)
  - [4.4 Unparseable shell version](#review-4-4)
  - [4.5 UA parsing notes](#review-4-5)
- [5. Fallback conventions](#review-5)
  - [5.1 `Model` special-case fallback](#review-5-1)
- [6. Capability table maintenance](#review-6)
  - [6.1 Where matrix lives](#review-6-1)
  - [6.2 Future direction: runtime-provided capability manifest](#review-6-2)
- [7. Review checklist](#review-7)

---

<a id="review-1"></a>

## 1. Problem and principles

- SDK runs on multiple runtime families; capabilities differ by runtime and version.
- Public contract is `supports(name, tokens?)` for app checks.
- Runtime identity is still needed internally, but does not need to be part of app API.
- Unknown capability names/tokens must be safe: return `false`, never throw.

---

<a id="review-2"></a>

## 2. Public API surface

<a id="review-2-1"></a>

### 2.1 `WebSpatialRuntime.supports(name, tokens?)`

- `name` must be a documented top-level key.
- Optional `tokens` must be documented for that `name`.
- Unknown `name` or token returns `false`.
- Multiple tokens use **AND** semantics.
- `supports(name, [])` is equivalent to `supports(name)`.

<a id="review-2-2"></a>

### 2.2 Internal runtime snapshot (`getRuntime`)

`getRuntime()` is **internal-only** and not part of the external app-facing contract.

Internal snapshot shape:

| Field | Type | Notes |
|---|---|---|
| `type` | `'visionos' \| 'picoos' \| null` | `null` means not running in WebSpatial runtime. |
| `shellVersion` | `string \| null` | Parsed from UA tokens (see §4.5). |

<a id="review-2-3"></a>

### 2.3 SSR / no `window`

Capability checks must not throw solely because `window` is unavailable; use conservative `false`.

---

<a id="review-3"></a>

## 3. Capability keys

<a id="review-3-1"></a>

### 3.1 CSS

Top-level CSS keys:

- `'-xr-background-material'`
- `'-xr-back'`
- `'-xr-depth'`
- `'-xr-transform'` (maps to transform-style capability; conservative `false` outside reliable runtime detection)

<a id="review-3-2"></a>

### 3.2 HTML components

Canonical top-level component keys:

`Model`, `Reality`, `Entity`, `BoxEntity`, `SphereEntity`, `ConeEntity`, `CylinderEntity`, `PlaneEntity`, `SceneGraph`, `ModelAsset`, `ModelEntity`, `UnlitMaterial`, `Material`, `AttachmentAsset`, `AttachmentEntity`

Alias keys (must normalize to same boolean):

- `Box` ↔ `BoxEntity`
- `Sphere` ↔ `SphereEntity`
- `Plane` ↔ `PlaneEntity`
- `Cone` ↔ `ConeEntity`
- `Cylinder` ↔ `CylinderEntity`
- `World` ↔ `SceneGraph`

`Material` and `UnlitMaterial` are **independent keys** (not aliases); **both are exposed** as top-level `supports` names.
Additional `Material` sub-token: `supports('Material', ['unlit'])`.

<a id="review-3-3"></a>

### 3.3 Spatial gesture events

Top-level event keys:

`SpatialTapEvent`, `SpatialDragStartEvent`, `SpatialDragEvent`, `SpatialDragEndEvent`, `SpatialRotateEvent`, `SpatialRotateEndEvent`, `SpatialMagnifyEvent`, `SpatialMagnifyEndEvent`

Additional event sub-token:

- `supports('SpatialRotateEvent', ['constrainedToAxis'])`

<a id="review-3-4"></a>

### 3.4 JS API / scene / utility

Top-level keys:

- `useMetrics`
- `convertCoordinate`
- `WindowScene`
- `VolumeScene`

Scene sub-tokens:

- `WindowScene`: `defaultSize`, `resizability`
- `VolumeScene`: `defaultSize`, `resizability`, `worldScaling`, `worldAlignment`, `baseplateVisibility`

`initScene` remains a JS API but does not use sub-token capability checks in this change.

<a id="review-3-5"></a>

### 3.5 DOM depth keys

DOM depth fields are part of `supports` checks:

- `xrClientDepth`
- `xrOffsetBack`
- `xrInnerDepth`
- `xrOuterDepth`

Contract: when a DOM depth key is unsupported, corresponding runtime read must be `undefined` (for example, `window.xrInnerDepth === undefined` when `supports('xrInnerDepth') === false`).

<a id="review-3-6"></a>

### 3.6 `Model` sub-capabilities

Top-level meaning:

- `supports('Model')` means Pop mode capability is available in current WebSpatial runtime.
- Outside WebSpatial runtime (`type === null`), `supports('Model')` is `false`.

Model HTML sub-tokens (current baseline):

- `autoplay` => true
- `loop` => true
- `stagemode` => false
- `poster` => false
- `loading` => false
- `source` => false

Model JS API sub-tokens (current baseline):

- true: `ready`, `currentSrc`, `entityTransform`, `paused`, `duration`, `playbackRate`, `play`, `pause`
- false: `currentTime`

If parent `supports('Model')` is `false`, all model sub-token checks must be `false`.

---

<a id="review-4"></a>

## 4. Resolution rules

<a id="review-4-1"></a>

### 4.1 Non-WebSpatial runtime (`type === null`)

When `type === null`, spatial capabilities are conservatively `false`.

<a id="review-4-2"></a>

### 4.2 Shell newer than table

When `type` is `visionos`/`picoos`, shell is parseable, and no exact row exists, use the greatest table row `<= shellVersion`.

<a id="review-4-3"></a>

### 4.3 Shell older than table minimum

When shell is below table minimum for a runtime type, return conservative `false`.

<a id="review-4-4"></a>

### 4.4 Unparseable shell version

If runtime is detected but shell version cannot be parsed, return conservative `false` for spatial keys.

<a id="review-4-5"></a>

### 4.5 UA parsing notes

- Target shell token format: `WSAppShell/<version>`.
- visionOS already uses `WSAppShell/<version>`.
- Pico is transitioning from legacy `PicoWebApp/<version>` to `WSAppShell/<version>`.
- During migration, parser should prefer `WSAppShell/<version>`, then fallback to `PicoWebApp/<version>`.
- `WebSpatial/<version>` is runtime/webspatial version metadata, not shell version.

---

<a id="review-5"></a>

## 5. Fallback conventions

General rule: unsupported capability means no hidden emulation.

- For unsupported HTML components (for example `Reality`, `Material`, `ModelAsset`, `AttachmentAsset`, `AttachmentEntity`): do not render node, and do not execute runtime side effects.
- For unsupported `useMetrics` and `convertCoordinate`: calling API throws `WebSpatialRuntimeError`.
- For unsupported model JS sub-APIs: member must not exist on simulated element (`in` false, read returns `undefined`), no noop placeholder.

<a id="review-5-1"></a>

### 5.1 `Model` special-case fallback

`Model` is the explicit exception:

- If `supports('Model') === false`, fallback renders native `<model>` and forwards props.
- Sub-capability checks still follow parent/child constraint (parent false => child false).

---

<a id="review-6"></a>

## 6. Capability table maintenance

<a id="review-6-1"></a>

### 6.1 Where matrix lives

- Collaboration template: [`capability-matrix.template.md`](./capability-matrix.template.md)
- Runtime source (implementation): `capability-table.ts` (or JSON imported by TS) under core SDK

<a id="review-6-2"></a>

### 6.2 Future direction: runtime-provided capability manifest

Current v1 still uses shell-version table fallback rules (§4.2-§4.4). Future direction is runtime-provided capability manifest (for example runtime-injected capabilities + compatibility metadata), so capability checks become feature-level and less fragile under runtime breaking changes.

---

<a id="review-7"></a>

## 7. Review checklist

- [ ] External API is `supports(name, tokens?)`; `getRuntime` stays internal.
- [ ] Runtime type uses `'visionos' | 'picoos' | null`.
- [ ] Key/token lists in §3 are reflected in matrix template.
- [ ] Resolution + UA parsing rules in §4 are implemented.
- [ ] Fallback rules (including Model exception; Attachment and other non-Model components do not render when unsupported) are documented.
- [ ] `Material` and `UnlitMaterial` are both top-level `supports` keys (independent; both exposed).
