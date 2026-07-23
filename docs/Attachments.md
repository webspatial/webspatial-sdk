# Attachments

## Overview

Attachments allow developers to render interactive 2D HTML/React content — buttons, labels, HUDs, info panels — as floating panels attached to 3D entities inside a `<Reality>` scene graph. The content shares the same React component tree and state as the host page: clicking a button inside a 3D attachment can `setState` in the parent, and vice versa.

The API uses two components with a deliberate separation of concerns:

- **`<AttachmentAsset>`** declares *what* to render (the React content template). Placed outside `<SceneGraph>`.
- **`<AttachmentEntity>`** declares *where* to render it (position, size, parent entity). Placed inside `<SceneGraph>`.

This enables a 1→N pattern: one content template can be rendered into multiple 3D positions simultaneously, mirroring the existing asset-vs-entity pattern used by models and materials.

## `<AttachmentAsset>`

Declares an attachment content template by name. When one or more `<AttachmentEntity>` components register containers for that name, `<AttachmentAsset>` uses `createPortal` to render its children into each container.

### Attributes

`name`

**Required.** A string identifier that links this content template to one or more `<AttachmentEntity>` instances. Must match the `attachment` prop on the corresponding entities.

`children`

The React content to render inside the attachment. This can be any valid React JSX — divs, buttons, styled components, stateful components, etc. The content shares the host page's React tree, so props, context, and state flow naturally.

### Usage Notes

- `<AttachmentAsset>` must be a direct child of `<Reality>`, placed **outside** `<SceneGraph>`.
- If no `<AttachmentEntity>` has registered for the given `name`, the asset renders nothing.
- Multiple `<AttachmentEntity>` components with the same `attachment` name will each receive a portal of the same children.
- Spatial components (`<SpatialDiv>`, `<Reality>`, `<Model>`) inside an `<AttachmentAsset>` will gracefully degrade to plain HTML with a console warning. Attachments are 2D surfaces only.

## `<AttachmentEntity>`

Creates a native attachment (a child WKWebView on visionOS) parented under a 3D entity, and registers its DOM container with the `AttachmentRegistry` so that `<AttachmentAsset>` can portal content into it.

### Attributes

`attachment`

**Required.** A string matching the `name` prop on the corresponding `<AttachmentAsset>`. This is how the entity knows which content template to display.

`position`

An optional `[x, y, z]` tuple specifying the attachment's local position relative to its parent entity, in meters. Defaults to `[0, 0, 0]`.

`size`

**Required.** An object `{ width: number, height: number }` specifying the attachment's frame dimensions in points. This controls the SwiftUI `.frame()` applied to the attachment's WKWebView on the native side.

### Usage Notes

- `<AttachmentEntity>` must be placed inside `<SceneGraph>`, as a descendant of an `<Entity>`. It inherits the parent entity's transform — when the entity moves, the attachment follows.
- The `attachment` prop can change at runtime. The component will migrate its registry mapping from the old name to the new name, so the portal tracks correctly.
- Position and size can change at runtime. Updates are sent to the native side via `UpdateAttachmentEntityCommand`.
- On unmount, the attachment is destroyed and its container is removed from the registry.

## Style Sync

Attachment webviews automatically inherit styles from the host page:

- **Global styles** — All `<link rel="stylesheet">`, `<style>` blocks, and other `<head>` children are cloned into the attachment's child window via `syncParentHeadToChild()`.
- **CSS class names** — `document.documentElement.className` is synced, so Tailwind utility classes work inside attachments.
- **HMR support** — A `MutationObserver` watches the host page's `<head>`. When Vite HMR injects new styles, the attachment picks them up automatically (debounced at 100ms).
- **Base URL** — A `<base href>` tag is injected so relative URLs resolve correctly inside the attachment webview.

Inline styles set directly on elements inside the attachment work as expected.

## Nesting Guards

The following components detect when they are rendered inside an `<AttachmentAsset>` and degrade gracefully:

| Component | Behavior Inside Attachment |
|-----------|---------------------------|
| `<Reality>` | Returns `null` with a console warning.  |
| `<SpatialDiv>` / `SpatializedContainer` | Renders as plain HTML (strips spatial props). Layout and Tailwind still work. |
| `<Model>` | Renders as a plain `<model>` tag without spatialization. |



## Technical Summary

|||
| --- | --- |
| Permitted content for `<AttachmentAsset>` | Any valid React JSX. Spatial components (`<Reality>`, `<SpatialDiv>`, `<Model>`) will degrade to plain HTML. |
| Permitted content for `<AttachmentEntity>` | None. Returns `null`. |
| Permitted parents for `<AttachmentAsset>` | Direct child of `<Reality>`, outside `<SceneGraph>`. |
| Permitted parents for `<AttachmentEntity>` | Any `<Entity>` descendant inside `<SceneGraph>`. |
| Rendering mechanism | `createPortal` from the host React tree into each attachment WKWebView's `document.body`. |
| Native backing | One `WKWebView` per `<AttachmentEntity>` instance, rendered as a RealityKit `ViewAttachmentEntity`. |

## Browser Compatibility

| Feature | visionOS |
| --- | --- |
| `<AttachmentAsset>` |  WebSpatial April |
| `<AttachmentEntity>` | WebSpatial April |

### Not Supported

| Feature | Status |
| --- | --- |
| Nested `<Reality>` inside attachments | Blocked — returns null with warning |
| Nested `<SpatialDiv>` inside attachments | Degrades to plain HTML |
| 3D content inside attachments | Not supported — 2D surfaces only |
| Billboard / camera-facing policy | Not in this PR |

## High-Level Architecture

The implementation touches four areas of the WebSpatial SDK.

1. **@webspatial/react-sdk**: `<AttachmentAsset>` and `<AttachmentEntity>` components, `AttachmentRegistry` for 1→N container management, `InsideAttachmentContext` for nesting guards, shared style sync utilities in `windowStyleSync.ts`.

2. **@webspatial/core-sdk**: `Attachment` class (extends `SpatialObject`), `SpatialSession.createAttachmentEntity()`, creation via `CreateAttachmentEntityCommand` (`WebSpatialProtocolCommand` using `window.open`), updates via `UpdateAttachmentEntityCommand` (JSB), destroy via the standard `DestroyCommand`.

3. **packages/visionOS (Native Swift)**: `AttachmentManager` stores `AttachmentInfo` structs keyed by ID. `SpatialScene` intercepts `webspatial://createAttachment` via the open window delegate, handles update/destroy commands, and cleans up on reload/destroy. `SpatializedDynamic3DView` renders attachments via `RealityView(..., attachments:)` and parents them under the correct `SpatialEntity`.

4. **apps/test-server**: Demo page at `/reality/attachments` with test cases for 1→N rendering, global CSS sync, animation (attachments following parent), show/hide toggling, and nesting guard validation.

### Why `window.open` Instead of JSB

Attachment creation uses `window.open("webspatial://createAttachment?...")` instead of the JSB message channel. This is because it needs to return a `WindowProxy` — a live reference to the child WKWebView's `window` object — which cannot be serialized through the JSB message channel. `window.open` returns the proxy synchronously.

### Creation Protocol vs. Update/Destroy Protocol

| Operation | Protocol | Reason |
|-----------|----------|--------|
| Create | `WebSpatialProtocolCommand` (`window.open`) | Must return `WindowProxy` synchronously |
| Update | `JSBCommand` (JSB message) | Only sends data (position, size) — no return value needed |
| Destroy | `DestroyCommand` (JSB message) | Standard spatial object destroy pipeline |

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