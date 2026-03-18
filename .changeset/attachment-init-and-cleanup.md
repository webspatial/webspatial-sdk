---
"@webspatial/core-sdk": minor
"@webspatial/react-sdk": minor
"@webspatial/platform-visionos": minor
---

Attachment init flow and lifecycle cleanup.

- **Core**
  - Split attachment creation into `CreateAttachmentEntityCommand` (window/engine) and `InitializeAttachmentCommand` (send id, parent, position, size over JSB so native initializes after window exists).
  - `createAttachmentEntity()` now runs both; native receives full options via init command.
- **React**
  - `AttachmentEntity`: inline head-style sync via `MutationObserver` on `document.head`; direct cleanup on unmount (no StrictMode-only logic).
  - `useEntity`: forwards all entity event handlers (tap, drag, rotate, magnify) to `useEntityEvent`.
  - `useSpatializedElement`: ref-based cleanup so elements are destroyed correctly on unmount.
  - Removed React 18 StrictMode–specific deferred cleanup from Reality, useEntity, AttachmentEntity, useSpatializedElement.
- **visionOS**
  - Attachment manager and JSB handling updated for init command and consolidated window creation.
