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

Use **semver** for `shellVersion` (from **`WSAppShell/...`**). One row per **distinct** Shell version **row** you maintain in the matrix (add a row when the capability **surface** changes vs the previous version).

Canonical key names match [`review.md` section 3](review.md#review-3). **§2** below is the **full v1 `supports` column list** (copy-paste friendly).

---

## 2. Full `supports` column names (v1)

### 2.1 Row identifier

| Column | Notes |
|--------|--------|
| `shellVersion` | Semver from `WSAppShell/...`; `web` sheet may use `n/a` or empty. |

Use **one sheet (or section) per `runtime.type`** (`visionOS`, `picoOS`, `web`) so **`runtime.type`** does not need a column unless you prefer a single master table.

### 2.2 HTML — components (canonical keys only, 15 columns)

**Aliases** (`Box`, `World`, etc.) **share** the same boolean as `BoxEntity`, `SceneGraph` — **do not** add duplicate columns; normalization is implementation-side.

`Model`, `Reality`, `Entity`, `BoxEntity`, `SphereEntity`, `ConeEntity`, `CylinderEntity`, `PlaneEntity`, `SceneGraph`, `ModelAsset`, `ModelEntity`, `UnlitMaterial`, `Material`, `AttachmentAsset`, `AttachmentEntity`

### 2.3 CSS — three keys (v1)

`'-xr-background-material'`, `'-xr-back'`, `'-xr-depth'`

### 2.4 Spatial gestures — eight keys

`SpatialTapEvent`, `SpatialDragStartEvent`, `SpatialDragEvent`, `SpatialDragEndEvent`, `SpatialRotateEvent`, `SpatialRotateEndEvent`, `SpatialMagnifyEvent`, `SpatialMagnifyEndEvent`

### 2.5 JS — npm — two top-level keys

`initScene`, `useMetrics`

### 2.6 Not in this matrix (DOM)

**`xrClientDepth` / `xrOffsetBack`** are **not** `supports()` top-level keys ([`review.md` §3.5](review.md#review-3-5)). Track with **`in`** checks separately if needed.

### 2.7 Copy-paste: spreadsheet header row (tab-separated)

Paste into row 1 of a spreadsheet (28 capability columns + `Notes`):

```text
shellVersion	Model	Reality	Entity	BoxEntity	SphereEntity	ConeEntity	CylinderEntity	PlaneEntity	SceneGraph	ModelAsset	ModelEntity	UnlitMaterial	Material	AttachmentAsset	AttachmentEntity	'-xr-background-material'	'-xr-back'	'-xr-depth'	SpatialTapEvent	SpatialDragStartEvent	SpatialDragEvent	SpatialDragEndEvent	SpatialRotateEvent	SpatialRotateEndEvent	SpatialMagnifyEvent	SpatialMagnifyEndEvent	initScene	useMetrics	Notes
```

### 2.8 Optional — sub-token columns (same `shellVersion` rows)

Add only if product tracks sub-capabilities at matrix level ([`review.md` §3.4](review.md#review-3-4), [§3.6](review.md#review-3-6)).

**`initScene` sub-tokens (7):** `initScene:defaultSize`, `initScene:resizability`, `initScene:worldScaling`, `initScene:worldAlignment`, `initScene:baseplateVisibility`, `initScene:sceneType:window`, `initScene:sceneType:volume`

**`useMetrics` sub-tokens (2):** `useMetrics:worldScalingCompensation:scaled`, `useMetrics:worldScalingCompensation:unscaled`

**`Model` sub-tokens (examples — extend when defined):** `Model:source`, `Model:autoplay`

Copy-paste header row for optional sub-tokens only:

```text
shellVersion	initScene:defaultSize	initScene:resizability	initScene:worldScaling	initScene:worldAlignment	initScene:baseplateVisibility	initScene:sceneType:window	initScene:sceneType:volume	useMetrics:worldScalingCompensation:scaled	useMetrics:worldScalingCompensation:unscaled	Model:source	Model:autoplay	Notes
```

---

## 3. Example sheets (abbreviated rows — use §2 headers for real tables)

### A. `visionOS`

**`runtime.type`:** `visionOS`

| shellVersion | Notes |
|--------------|-------|
| *replace with real WSAppShell versions* | One row per version row you maintain. |

Fill **Y/N** against the **§2.7** header row in your spreadsheet (not duplicated here — table would be too wide for Markdown).

### B. `picoOS`

**`runtime.type`:** `picoOS`

| shellVersion | Notes |
|--------------|-------|
| *replace with real versions* | Same columns as §2.7. |

### C. `web`

**`runtime.type`:** `web`

Typically **one row**; Spatial-related keys **N** per [`review.md` §4.1](review.md#review-4-1).

| shellVersion | Notes |
|--------------|-------|
| n/a | Set **N** for Spatial-related `supports` keys (or leave empty until confirmed). |

---

## 4. Sub-capabilities (optional)

If you track **`supports('initScene', [...])`** or **`supports('Model', [...])`** at the matrix level, use **§2.8** columns on the same `shellVersion` rows, or a **separate sheet** with the same row keys and only sub-token columns.

---

## Handoff to SDK

1. Product/runtime signs off on **Y/N** for each cell you care about.  
2. Engineering encodes the agreed matrix into **`capability-table.ts`** (implementation task).  
3. Changelog notes which SDK release carries which table revision.
