# Capability matrix (template)

**Purpose:** Human-editable matrix for **runtime / product** to agree which **`supports()`** keys are **true** or **false** for each **`runtime.type` x Shell version** row. Copy this table into a spreadsheet if easier; keep column names aligned with [`review.md`](./review.md) section 3.

**Not the runtime source of truth:** After agreement, engineering **transcribes** values into **`capability-table.ts`** (or JSON imported by TS) under `@webspatial/core-sdk` when implementing `supports()` — see [`review.md`](./review.md#review-6-1) section 6.1.

---

## Legend

| Cell | Meaning |
|------|---------|
| **Y** | Supported (`supports` returns `true` for that key at this row). |
| **N** | Not supported (`false`). |
| *(empty)* | To be decided. |

Use **semver** for `shellVersion` (prefer `WSAppShell/...`; pico may temporarily expose `PicoWebApp/...` during migration). One row per **distinct** Shell version **row** you maintain in the matrix (add a row when the capability **surface** changes vs the previous version).

Canonical key names match [`review.md` section 3](review.md#review-3). **§2** below is the **full v1 `supports` column list** (copy-paste friendly).

---

## 2. Full `supports` column names (v1)

### 2.1 Row identifier

| Column | Notes |
|--------|--------|
| `shellVersion` | Semver from UA shell token; for non-WebSpatial runtime rows use `n/a` if you keep a note row. |

Use one sheet/section per runtime: `visionos`, `picoos`. Non-WebSpatial runtime (`type = null`) is typically documented as conservative false behavior, not as a normal capability matrix sheet.

### 2.2 HTML — components (canonical keys only, 15 columns)

**Aliases** (`Box`, `World`, etc.) **share** the same boolean as `BoxEntity`, `SceneGraph` — **do not** add duplicate columns; normalization is implementation-side.

`Model`, `Reality`, `Entity`, `BoxEntity`, `SphereEntity`, `ConeEntity`, `CylinderEntity`, `PlaneEntity`, `SceneGraph`, `ModelAsset`, `ModelEntity`, `UnlitMaterial`, `Material`, `AttachmentAsset`, `AttachmentEntity`

### 2.3 CSS — four keys

`'-xr-background-material'`, `'-xr-back'`, `'-xr-depth'`, `'-xr-transform'`

### 2.4 Spatial gestures — eight keys

`SpatialTapEvent`, `SpatialDragStartEvent`, `SpatialDragEvent`, `SpatialDragEndEvent`, `SpatialRotateEvent`, `SpatialRotateEndEvent`, `SpatialMagnifyEvent`, `SpatialMagnifyEndEvent`

### 2.5 JS / Scene / Utility — top-level keys

`useMetrics`, `convertCoordinate`, `initScene`, `WindowScene`, `VolumeScene`

### 2.6 DOM depth keys (in supports)

`xrClientDepth`, `xrOffsetBack`, `xrInnerDepth`, `xrOuterDepth`

When one of these is `N`, corresponding runtime read should be `undefined`.

### 2.7 Copy-paste: spreadsheet header row (tab-separated)

Paste into row 1 of a spreadsheet:

```text
shellVersion	Model	Reality	Entity	BoxEntity	SphereEntity	ConeEntity	CylinderEntity	PlaneEntity	SceneGraph	ModelAsset	ModelEntity	UnlitMaterial	Material	AttachmentAsset	AttachmentEntity	'-xr-background-material'	'-xr-back'	'-xr-depth'	'-xr-transform'	SpatialTapEvent	SpatialDragStartEvent	SpatialDragEvent	SpatialDragEndEvent	SpatialRotateEvent	SpatialRotateEndEvent	SpatialMagnifyEvent	SpatialMagnifyEndEvent	useMetrics	convertCoordinate	initScene	WindowScene	VolumeScene	xrClientDepth	xrOffsetBack	xrInnerDepth	xrOuterDepth	Notes
```

**CSV starters (open in Excel / Sheets):** [`capability-matrix/visionos-main.csv`](./capability-matrix/visionos-main.csv), [`capability-matrix/picoos-main.csv`](./capability-matrix/picoos-main.csv) — see [`capability-matrix/README.md`](./capability-matrix/README.md).

### 2.8 Optional — sub-token columns (same `shellVersion` rows)

Add only if product tracks sub-capabilities at matrix level ([`review.md` §3.4](review.md#review-3-4), [§3.6](review.md#review-3-6)).

**Scene sub-tokens:** `WindowScene:defaultSize`, `WindowScene:resizability`, `VolumeScene:defaultSize`, `VolumeScene:resizability`, `VolumeScene:worldScaling`, `VolumeScene:worldAlignment`, `VolumeScene:baseplateVisibility`

**`Material` sub-tokens:** `Material:unlit`

**`Model` sub-tokens (current baseline):** `Model:autoplay`, `Model:loop`, `Model:stagemode`, `Model:poster`, `Model:loading`, `Model:source`, `Model:ready`, `Model:currentSrc`, `Model:entityTransform`, `Model:paused`, `Model:duration`, `Model:playbackRate`, `Model:play`, `Model:pause`, `Model:currentTime`

**Event sub-tokens:** `SpatialRotateEvent:constrainedToAxis`

Copy-paste header row for optional sub-tokens only:

```text
shellVersion	WindowScene:defaultSize	WindowScene:resizability	VolumeScene:defaultSize	VolumeScene:resizability	VolumeScene:worldScaling	VolumeScene:worldAlignment	VolumeScene:baseplateVisibility	Material:unlit	Model:autoplay	Model:loop	Model:stagemode	Model:poster	Model:loading	Model:source	Model:ready	Model:currentSrc	Model:entityTransform	Model:paused	Model:duration	Model:playbackRate	Model:play	Model:pause	Model:currentTime	SpatialRotateEvent:constrainedToAxis	Notes
```

**CSV starters:** [`capability-matrix/visionos-subtokens.csv`](./capability-matrix/visionos-subtokens.csv), [`capability-matrix/picoos-subtokens.csv`](./capability-matrix/picoos-subtokens.csv).

---

## 3. Example sheets (abbreviated rows — use §2 headers for real tables)

### A. `visionos`

**`runtime.type`:** `visionos`

| shellVersion | Notes |
|--------------|-------|
| *replace with real WSAppShell versions* | One row per version row you maintain. |

Fill **Y/N** against the **§2.7** header row in your spreadsheet (not duplicated here — table would be too wide for Markdown).

### B. `picoos`

**`runtime.type`:** `picoos`

| shellVersion | Notes |
|--------------|-------|
| *replace with real versions* | Same columns as §2.7. |

### C. non-WebSpatial runtime (`type = null`)

Conservative behavior is documented in [`review.md` §4.1](review.md#review-4-1): spatial-related keys resolve to `N`.

| shellVersion | Notes |
|--------------|-------|
| n/a | Optional note row; not required as normal matrix sheet. |

---

## 4. Sub-capabilities (optional)

If you track sub-capabilities at matrix level, use **§2.8** columns on the same `shellVersion` rows, or a separate sheet with the same row keys and only sub-token columns.

---

## Handoff to SDK

1. Product/runtime signs off on **Y/N** for each cell you care about.  
2. Engineering encodes the agreed matrix into **`capability-table.ts`** (implementation task).  
3. Changelog notes which SDK release carries which table revision.
