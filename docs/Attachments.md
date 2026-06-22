# Attachments

## Overview

Attachments allow developers to render interactive 2D HTML/React content — buttons, labels, HUDs, info panels — as floating panels attached to 3D entities inside a `<Reality>` scene graph. The content shares the same React component tree and state as the host page: clicking a button inside a 3D attachment can `setState` in the parent, and vice versa.

The API uses two components with a deliberate separation of concerns:

- **`<AttachmentAsset>`** declares _what_ to render (the React content template). Placed outside `<SceneGraph>`.
- **`<AttachmentEntity>`** declares _where_ to render it (position, size, parent entity). Placed inside `<SceneGraph>`.

This enables a 1→N pattern: one content template can be rendered into multiple 3D positions simultaneously, mirroring the existing asset-vs-entity pattern used by models and materials.

## `<AttachmentAsset>`

Declares an attachment content template by id. When one or more `<AttachmentEntity>` components register containers for that asset id, `<AttachmentAsset>` uses `createPortal` to render its children into each container.

### Attributes

`id`

**Required.** A string identifier for this attachment asset, consistent with `<ModelAsset id>` and other resource declarations. `<AttachmentEntity attachment="...">` must match this id (same pattern as `<ModelEntity model="...">` referencing a model asset id).

`children`

The React content to render inside the attachment. This can be any valid React JSX — divs, buttons, styled components, stateful components, etc. The content shares the host page's React tree, so props, context, and state flow naturally.

### Usage Notes

- `<AttachmentAsset>` must be a direct child of `<Reality>`, placed **outside** `<SceneGraph>`.
- If no `<AttachmentEntity>` has registered for the given asset `id`, the asset renders nothing.
- Multiple `<AttachmentEntity>` components with the same `attachment` id will each receive a portal of the same children.
- Spatial components (`<SpatialDiv>`, `<Reality>`, `<Model>`) inside an `<AttachmentAsset>` will gracefully degrade to plain HTML with a console warning. Attachments are 2D surfaces only.

## `<AttachmentEntity>`

Creates a native attachment (a child WKWebView on visionOS) parented under a 3D entity, and registers its DOM container with the `AttachmentRegistry` so that `<AttachmentAsset>` can portal content into it.

`<AttachmentEntity>` is an **entity-like attachment surface, not a true `SpatialEntity` internally**. It supports the familiar transform props (`position`, `rotation`, `scale`) and `<Plane>`-style sizing (`width`/`height` in meters), but the underlying native entity is created and owned by SwiftUI's RealityView attachments mechanism. Because of that, it does **not** support components, materials, models, child entities, event bubbling, or `animateTransform`. The content remains 2D React/HTML.

### Attributes

`attachment`

**Required.** The `id` of the corresponding `<AttachmentAsset>`. Same pattern as the `model` prop on `<ModelEntity>` referencing a `<ModelAsset id>`.

`id`

Optional stable identity for this **placement** (registry/portal instance key), not the asset id. Must be unique across mounted `<AttachmentEntity>` instances and must not change for the lifetime of the component (a duplicate placement id logs a warning and falls back to a generated id). Defaults to an auto-generated id.

`position`

The attachment's local position relative to its parent entity, in meters, as a `Vec3` object `{ x, y, z }` — the same convention as `<Entity position>`. Defaults to `{ x: 0, y: 0, z: 0 }`.

`rotation`

The attachment's local rotation relative to its parent entity, as a `Vec3` of Euler angles in degrees — the same convention as `<Entity rotation>`. Defaults to no rotation.

`scale`

The attachment's local scale relative to its parent entity, as a `Vec3`. Defaults to `{ x: 1, y: 1, z: 1 }`. Scale multiplies the rendered surface on top of the `width`/`height`/`size` dimensions.

`width` / `height`

The attachment surface dimensions in **world-space meters**, working like `<Plane>`'s `width`/`height` from a developer-experience perspective. The native side converts meters to view points via the system's physical metrics, so meter sizing stays correct when the window is rescaled. Each axis takes precedence over the corresponding `size` axis when both are given.

`size`

A legacy object `{ width: number, height: number }` specifying the attachment's frame dimensions in **points** (the SwiftUI `.frame()` applied to the attachment's WKWebView). Still fully supported for backward compatibility. If neither `size` nor `width`/`height` is provided, the native default (100×100 points) is used and a warning is logged.

### Usage Notes

- `<AttachmentEntity>` must be placed inside `<SceneGraph>`, as a descendant of an `<Entity>`. It inherits the parent entity's transform — when the entity moves, the attachment follows.
- The `attachment` prop (asset id) can change at runtime. The component will migrate its registry mapping from the old id to the new one, so the portal tracks correctly.
- `position`, `rotation`, `scale`, `width`, `height` and `size` are all reactive — updates are sent to the native side via `UpdateAttachmentEntityCommand`.
- On unmount, the attachment is destroyed and its container is removed from the registry.

### Sizing Precedence

| Props given           | Resulting frame                                                              |
| --------------------- | ---------------------------------------------------------------------------- |
| `width`/`height` only | meters, converted natively to points                                         |
| `size` only           | points, as-is (legacy behavior)                                              |
| both                  | meters win per-axis (`width` over `size.width`, `height` over `size.height`) |
| neither               | native default of 100×100 points, with a console warning                     |

## Migration (breaking changes)

This release cleans up the attachment public API for consistency with other entity components.

### `<AttachmentAsset name>` → `<AttachmentAsset id>`

Attachment assets are now declared by `id`, matching `<ModelAsset id>` and other resource declarations:

```tsx
// Before
<AttachmentAsset name="hud-panel">...</AttachmentAsset>
<AttachmentEntity attachment="hud-panel" ... />

// After
<AttachmentAsset id="hud-panel">...</AttachmentAsset>
<AttachmentEntity attachment="hud-panel" ... />
```

The `<AttachmentEntity attachment="...">` prop is unchanged — it still references the asset id.

### Tuple `position` → `Vec3` object

`position`, `rotation`, and `scale` on `<AttachmentEntity>` (and on `SpatialSession.createAttachmentEntity()` / `Attachment.update()`) now accept `Vec3` objects only, consistent with `<Entity>`:

```tsx
// Before
<AttachmentEntity attachment="hud" position={[0, 0.12, 0]} size={{ width: 200, height: 100 }} />

// After
<AttachmentEntity
  attachment="hud"
  position={{ x: 0, y: 0.12, z: 0 }}
  size={{ width: 200, height: 100 }}
/>
```

Legacy point-based `size={{ width, height }}` remains supported. Meter-based `width` / `height` are preferred for new code.

## Style Sync

Attachment webviews automatically inherit styles from the host page:

- **Global styles** — All `<link rel="stylesheet">`, `<style>` blocks, and other `<head>` children are cloned into the attachment's child window via `syncParentHeadToChild()`.
- **CSS class names** — `document.documentElement.className` is synced, so Tailwind utility classes work inside attachments.
- **HMR support** — A `MutationObserver` watches the host page's `<head>`. When Vite HMR injects new styles, the attachment picks them up automatically (debounced at 100ms).
- **Base URL** — A `<base href>` tag is injected so relative URLs resolve correctly inside the attachment webview.

Inline styles set directly on elements inside the attachment work as expected.

## Nesting Guards

The following components detect when they are rendered inside an `<AttachmentAsset>` and degrade gracefully:

| Component                               | Behavior Inside Attachment                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `<Reality>`                             | Returns `null` with a console warning.                                        |
| `<SpatialDiv>` / `SpatializedContainer` | Renders as plain HTML (strips spatial props). Layout and Tailwind still work. |
| `<Model>`                               | Renders as a plain `<model>` tag without spatialization.                      |

## Technical Summary

|                                            |                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Permitted content for `<AttachmentAsset>`  | Any valid React JSX. Spatial components (`<Reality>`, `<SpatialDiv>`, `<Model>`) will degrade to plain HTML. |
| Permitted content for `<AttachmentEntity>` | None. Returns `null`.                                                                                        |
| Permitted parents for `<AttachmentAsset>`  | Direct child of `<Reality>`, outside `<SceneGraph>`.                                                         |
| Permitted parents for `<AttachmentEntity>` | Any `<Entity>` descendant inside `<SceneGraph>`.                                                             |
| Rendering mechanism                        | `createPortal` from the host React tree into each attachment WKWebView's `document.body`.                    |
| Native backing                             | One `WKWebView` per `<AttachmentEntity>` instance, rendered as a RealityKit `ViewAttachmentEntity`.          |

## Browser Compatibility

| Feature              | visionOS         |
| -------------------- | ---------------- |
| `<AttachmentAsset>`  | WebSpatial April |
| `<AttachmentEntity>` | WebSpatial April |

### Not Supported

| Feature                                  | Status                              |
| ---------------------------------------- | ----------------------------------- |
| Nested `<Reality>` inside attachments    | Blocked — returns null with warning |
| Nested `<SpatialDiv>` inside attachments | Degrades to plain HTML              |
| 3D content inside attachments            | Not supported — 2D surfaces only    |
| Billboard / camera-facing policy         | Not in this PR                      |

## High-Level Architecture

The implementation touches four areas of the WebSpatial SDK.

1. **@webspatial/react-sdk**: `<AttachmentAsset>` and `<AttachmentEntity>` components, `AttachmentRegistry` for 1→N container management, `InsideAttachmentContext` for nesting guards, shared style sync utilities in `windowStyleSync.ts`.

2. **@webspatial/core-sdk**: `Attachment` class (extends `SpatialObject`), `SpatialSession.createAttachmentEntity()`, creation via `CreateAttachmentEntityCommand` (`WebSpatialProtocolCommand` using `window.open`), updates via `UpdateAttachmentEntityCommand` (JSB), destroy via the standard `DestroyCommand`.

3. **packages/visionOS (Native Swift)**: `AttachmentManager` stores `AttachmentInfo` structs keyed by ID. `SpatialScene` intercepts `webspatial://createAttachment` via the open window delegate, handles update/destroy commands, and cleans up on reload/destroy. `SpatializedDynamic3DView` renders attachments via `RealityView(..., attachments:)` and parents them under the correct `SpatialEntity`.

4. **apps/test-server**: Demo page at `/reality/attachments` with test cases for 1→N rendering, global CSS sync, animation (attachments following parent), show/hide toggling, and nesting guard validation.

### Why `window.open` Instead of JSB

Attachment creation uses `window.open("webspatial://createAttachment?...")` instead of the JSB message channel. This is because it needs to return a `WindowProxy` — a live reference to the child WKWebView's `window` object — which cannot be serialized through the JSB message channel. `window.open` returns the proxy synchronously.

### Creation Protocol vs. Update/Destroy Protocol

| Operation | Protocol                                    | Reason                                                                       |
| --------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| Create    | `WebSpatialProtocolCommand` (`window.open`) | Must return `WindowProxy` synchronously                                      |
| Update    | `JSBCommand` (JSB message)                  | Only sends data (position, rotation, scale, sizing) — no return value needed |
| Destroy   | `DestroyCommand` (JSB message)              | Standard spatial object destroy pipeline                                     |

## Constraints

- Attachments are **2D UI surfaces only**. No nested `<Reality>`, no 3D APIs, no spatial effects inside attachments.
- Each `<AttachmentEntity>` creates one native WKWebView. Creating many attachments has a memory/performance cost.
- The `webspatial://` scheme is internal IPC. A navigation guard in `SpatialWebController.swift` prevents these URLs from leaking to `UIApplication.shared.open()`.

## Known Limitations

- **No error recovery on creation failure** — If native webview creation fails, the attachment silently doesn't appear. No retry mechanism.
- **No unit tests for AttachmentRegistry** — The registry has non-trivial edge cases (late subscribers, last-container removal) without dedicated test coverage.

## Follow-Up: WebView Lifecycle Redesign

The current implementation shares the `SpatialWebView` / `SpatialWebViewModel` / `SpatialWebController` pipeline between the main scene webview and attachment webviews. This pipeline was designed for a single eagerly-initialized webview, not dynamically-spawned child views. Defensive patches (`getController()` lazy re-creation, `makeUIView` fallback to bare WKWebView) mask a teardown race condition where `AttachmentManager.remove()` dispatches `destroy()` asynchronously while SwiftUI is still tearing down the outgoing view.

The recommended follow-up is to create a dedicated `AttachmentWebView: UIViewRepresentable` that accepts a fully-initialized WKWebView, doesn't rely on lazy initialization, and lets SwiftUI's own view lifecycle handle cleanup. This eliminates the race structurally and keeps the main webview pipeline strict.

## References

- [RealityKit ViewAttachments](https://developer.apple.com/documentation/realitykit/attachment)
- [React createPortal](https://react.dev/reference/react-dom/createPortal)
- [WebSpatial Architecture — Intro to WebSpatial](https://webspatial.dev)
