# Runtime feature detection — design review (consolidated)

This document consolidates agreed technical decisions and fallback conventions for **WebSpatial runtime capability detection**. It is intended for engineering and product review. It supersedes ad hoc labels (e.g. internal “C1/C2” codes) with self-explanatory section titles.

<a id="review-contents"></a>

## Contents

- [1. Problem and principles](#review-1)
- [2. Public API surface](#review-2)
  - [2.1 `WebSpatialRuntime.supports(name, tokens?)`](#review-2-1)
  - [2.2 `WebSpatialRuntime.getRuntime()`](#review-2-2)
  - [2.3 SSR / no `window`](#review-2-3)
- [3. Capability table and key naming](#review-3)
  - [3.1 CSS (v1)](#review-3-1)
  - [3.2 HTML — components](#review-3-2)
  - [3.3 HTML — spatial gestures](#review-3-3)
  - [3.4 JS — npm](#review-3-4)
  - [3.5 DOM](#review-3-5)
  - [3.6 Evolving components (e.g. `Model`)](#review-3-6)
- [4. Resolution rules](#review-4)
  - [4.1 `web` runtime](#review-4-1)
  - [4.2 Shell newer than table](#review-4-2)
  - [4.3 Shell older than table minimum](#review-4-3)
  - [4.4 Unparseable `shellVersion`](#review-4-4)
- [5. Fallback conventions](#review-5)
  - [5.1 Sub-capabilities and who owns fallback](#review-5-1)
- [6. Maintenance of the capability table](#review-6)
  - [6.1 Where the matrix lives](#review-6-1)
- [7. Open items (product)](#review-7)
- [8. Review checklist](#review-8)

---

<a id="review-1"></a>

## 1. Problem and principles

- The same WebSpatial SDK runs on multiple **WebSpatial runtimes** (e.g. visionOS-class, PICO-class) and in **plain web** (`web`). Capabilities vary by **runtime type × Shell version**.
- **Source of truth for capabilities**: **Shell version** carried in **`WSAppShell/...`** in the user agent. The **`WebSpatial/x.y.z` token** indicates SDK compatibility with the shell; it does **not** define capability exposure.
- **Goals**: Expose **`supports()`** for feature checks and **`getRuntime()`** for environment identity; keep keys **documented**, **stable**, and aligned with a **versioned capability table** shipped in the SDK.

**Out of scope for this review**: `noRuntime.ts` (build-time tree-shaking stub); **Manifest API** capability detection.

---

<a id="review-2"></a>

## 2. Public API surface (target: `@webspatial/react-sdk`)

<a id="review-2-1"></a>

### 2.1 `WebSpatialRuntime.supports(name, tokens?)`

- **First argument `name`**: Must be a **documented** top-level key (HTML / CSS / npm). If `name` is **not** listed in the public contract → return **`false`** (do not throw).
- **Second argument `tokens`**: Optional. If provided, every token must be a **predefined sub-token** for that `name`. If **any** token is unknown → return **`false`** for the whole call.
- **Semantics of multiple sub-tokens**: **AND** — all listed sub-capabilities must be supported for the result to be `true`.
- **Empty second argument**: **`supports(name, [])`** is **equivalent** to **`supports(name)`** (only the top-level capability is checked; no sub-constraints).

<a id="review-2-2"></a>

### 2.2 `WebSpatialRuntime.getRuntime()`

Returns a **read-only** snapshot, for example:

| Field           | Type                               | Notes |
|----------------|-------------------------------------|-------|
| `type`         | `'visionOS' \| 'picoOS' \| 'web'`  | Current runtime family. |
| `shellVersion` | `string \| null`                   | Parsed from `WSAppShell/...`; **`null`** if not in a WebSpatial host, parsing fails, or not applicable. |

**No `getSdkVersion()`** in v1 — JS package versions come from **`package.json`** / release notes.

<a id="review-2-3"></a>

### 2.3 SSR / no `window`

APIs must **not throw** solely due to missing `window`; define conservative defaults (see §4.1).

---

<a id="review-3"></a>

## 3. Capability table and key naming

- **Table shape**: Per **`runtime.type`**, ordered rows by **Shell semver**; each row holds **boolean (or derived) flags** for each documented key. **Table keys match `supports` strings** (no extra mapping layer in v1).
- **Full-row snapshots per version** are recommended for v1 (simpler to query than diff-only rows).

<a id="review-3-1"></a>

### 3.1 CSS (v1)

`supports` keys use the **`-xr-` prefix** (single leading hyphen, distinct from HTML component names):

| `supports` key                 | Actual CSS variable              |
|--------------------------------|----------------------------------|
| `'-xr-background-material'`    | `--xr-background-material`       |
| `'-xr-back'`                   | `--xr-back`                      |
| `'-xr-depth'`                  | `--xr-depth`                     |

**Not in v1**: `--xr-z-index`, `--xr-transform-style`. **No** separate `supports` keys for `enable-xr` / `enable-xr-monitor` in v1.

<a id="review-3-2"></a>

### 3.2 HTML — components

PascalCase strings aligned with exports; **alias keys** are valid and **must** normalize to the same booleans (e.g. `Box` ↔ `BoxEntity`, `World` ↔ `SceneGraph`).

Includes: `Model`, `Reality`, `Entity`, `BoxEntity`/`Box`, `SphereEntity`/`Sphere`, `ConeEntity`/`Cone`, `CylinderEntity`/`Cylinder`, `PlaneEntity`/`Plane`, `SceneGraph`/`World`, `ModelAsset`, `ModelEntity`, `UnlitMaterial`, `Material`, `AttachmentAsset`, `AttachmentEntity`.

**Product**: Document semantics for **`Material` vs `UnlitMaterial`** (two independent keys).

<a id="review-3-3"></a>

### 3.3 HTML — spatial gestures (fine-grained)

Align with **`@webspatial/core-sdk`** event type names:

`SpatialTapEvent`, `SpatialDragStartEvent`, `SpatialDragEvent`, `SpatialDragEndEvent`, `SpatialRotateEvent`, `SpatialRotateEndEvent`, `SpatialMagnifyEvent`, `SpatialMagnifyEndEvent`.

**Do not** document capability probing via **`event.detail`** for app developers; use **`supports('Spatial…Event')`** only.

<a id="review-3-4"></a>

### 3.4 JS — npm (`supports` + predefined sub-tokens)

**`initScene`** — sub-tokens (examples): `defaultSize`, `resizability`, `worldScaling`, `worldAlignment`, `baseplateVisibility`, `sceneType:window`, `sceneType:volume` (AND semantics when multiple are passed).

**`useMetrics`** — sub-tokens: `worldScalingCompensation:scaled`, `worldScalingCompensation:unscaled` (AND when multiple are passed).

<a id="review-3-5"></a>

### 3.5 DOM (not `supports` top-level keys)

Use runtime checks such as **`'xrClientDepth' in ref.current`** / **`'xrOffsetBack' in ref.current`**. The React **`domProxy`** should implement a **`has` trap** for these properties so that **`in`** is consistent with **`get`** (implementation task).

**Excluded from v1 list**: `xrGetBoundingClientCube`.

<a id="review-3-6"></a>

### 3.6 Evolving component capabilities (e.g. `Model`)

HTML components are not limited to **top-level** checks. When a component gains optional features over time (e.g. **`<source>`**, **autoplay**), extend the same **`supports(name, tokens?)`** pattern used for **`initScene`** / **`useMetrics`**:

- **`supports('Model')`**: **Baseline** — the **`Model` line** is usable in this runtime (minimum agreed behavior).
- **`supports('Model', ['source'])`**, **`supports('Model', ['autoplay'])`**, etc.: **Predefined sub-tokens** (documented per release). Multiple tokens use **AND** semantics. **Unknown** sub-tokens → **`false`** for the whole call.

Prefer **sub-tokens under one `name`** over many new top-level keys (e.g. `ModelSource`, `ModelAutoplay`) to avoid key proliferation and keep mental model aligned with one component.

The **capability table** gains columns for these booleans per Shell row; **§4.2** applies until a new row ships with **`true`** for new sub-features.

---

<a id="review-4"></a>

## 4. Resolution rules (without internal codes)

<a id="review-4-1"></a>

### 4.1 `web` runtime (conservative)

When **`type === 'web'`**, **`supports`** for Spatial-related capabilities should default to **`false`** unless explicitly documented otherwise.

<a id="review-4-2"></a>

### 4.2 Shell version newer than the table (fallback row)

When **`shellVersion` is parsed** and **`type`** is `visionOS` or `picoOS`, but there is **no exact row** for that version:

- Select the row with the **greatest `rowVersion` such that `rowVersion <= shellVersion`** (semver compare). Use that row’s capabilities (**backward-compatible assumption**).

<a id="review-4-3"></a>

### 4.3 Shell version older than the table minimum

When **`shellVersion` is strictly below** the **minimum** version row in the table for that `type` → **`supports`** for Spatial-related capabilities → **`false`**.

<a id="review-4-4"></a>

### 4.4 Unparseable `shellVersion`

When **`shellVersion` cannot be parsed** (but the host is still treated as a WebSpatial runtime where applicable) → same as §4.3: **`supports`** → **`false`** for Spatial-related capabilities; **`getRuntime().shellVersion`** may be **`null`**.

---

<a id="review-5"></a>

## 5. Fallback conventions (application layer)

The SDK **detects**; **degradation UX** is primarily **app responsibility**. Default philosophy: **if not supported, do not rely on that capability** — **no silent replacement** unless product specifies otherwise.

| Area | Agreed default |
|------|----------------|
| **Model / Reality** | If not supported → **do not render** (app-controlled). |
| **Reality subtree** | If **`supports('Reality') === false`** → **do not render the whole Reality subtree**; **child** component keys are **not** checked separately in this product strategy (sub-keys remain for future / finer tables). |
| **Attachment** | **`AttachmentAsset` / `AttachmentEntity`**: **product-owned** fallback (hide / placeholder / copy / etc.). |
| **Gestures (8 events)** | **Strategy A**: If a given **`Spatial*Event`** is not supported → **do not bind** the corresponding handler; **no** automatic substitute (e.g. click) unless a **page-level** product decision adds it. |
| **CSS three keys** | If not supported → **do not set** the corresponding `--xr-*` variables; **no** promised visual substitute (plain 2D styling). |
| **`initScene` / `useMetrics`** | If not supported or AND sub-tokens fail → **do not call** or **omit** unsupported options; **no** fake config. |
| **DOM readbacks** | Do not bind critical layout to **`xrClientDepth` / `xrOffsetBack`** when unavailable; prefer **`supports`** for CSS keys to avoid contradicting “no spatial styling” while still reading proxy. |

<a id="review-5-1"></a>

### 5.1 Sub-capabilities and who owns fallback

**Not every sub-token needs a bespoke product fallback UX.** Use a simple tier:

- **Top-level `supports('Model') === false`**: Follow the **whole-component** rule (e.g. **do not render** — see table above).
- **Top-level `true`, but a sub-token `false`**: **Disable only that feature** — e.g. omit **`<source>`** / **autoplay** paths, use a single **`src`**, do not autoplay. Default is **silent** disabling of that feature (aligned with **Strategy A**), unless **product** requires copy or a special UX for that sub-feature (compliance, strong product promise, etc.).

**Not every application developer must design fallback for every sub-token.** Developers only need to **`supports`**-check **sub-features they actually use** in a user-visible way. **SDK / component maintainers** may **centralize** behavior once inside **`Model`** (e.g. strip unsupported props, warn in dev) so call sites do not duplicate logic.

**Documentation**: State a **default** — sub-token **`false`** → **do not enable that capability** — and maintain a **short exception list** only where product requires explicit UX or messaging.

---

<a id="review-6"></a>

## 6. Maintenance of the capability table

- **Authoritative matrix** of “Shell version → capabilities” is owned by **runtime / product**; the SDK **encodes** it in-repo and ships **with releases**.
- **Not every runtime release requires a new row**: if the capability surface is unchanged, **§4.2** may apply until a new row is added. If **new** capabilities must show as **`true`** on a new Shell immediately, **ship an SDK table update** in lockstep (or accept conservative **false** until then).

<a id="review-6-1"></a>

### 6.1 Where the matrix lives

- **Collaboration template (product / runtime):** [`capability-matrix.template.md`](./capability-matrix.template.md) — human-editable matrix for meetings; may be copied to a spreadsheet. Column names should match [`review.md` section 3](#review-3) (`supports` keys).
- **Runtime source (implementation):** `capability-table.ts` (or JSON imported by TS) under `@webspatial/core-sdk` — data that **`supports()`** reads; engineering **transcribes** from the agreed template each release unless codegen is added later.

---

<a id="review-7"></a>

## 7. Open items (product)

- **Material vs UnlitMaterial**: Public doc strings for what each **`supports`** key means.
- **External naming**: Whether marketing/docs avoid specific device/OS names.
- **Attachment**: Per-asset vs per-entity fallback UX.

---

<a id="review-8"></a>

## 8. Review checklist

- [ ] API: `supports()` + `getRuntime()` only (no `getSdkVersion` in v1).
- [ ] Unknown `name` / unknown sub-token → `false`; `supports(name, [])` ≡ `supports(name)`.
- [ ] Resolution: §4.1–§4.4.
- [ ] Key lists: CSS / HTML / gestures / npm / DOM notes.
- [ ] Fallback: §5 (including §5.1 sub-capabilities).
- [ ] Table maintenance: §6.
- [ ] Product open items: §7.
