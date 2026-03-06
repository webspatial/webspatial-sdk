---
"@webspatial/core-sdk": minor
"@webspatial/react-sdk": minor
"@webspatial/platform-visionos": minor
---

Add attachments support across React, Core SDK, and visionOS runtime, plus navigation guard and demo.

- React API
  - New <AttachmentAsset name="..."> to declare attachment UI outside <SceneGraph>.
  - New <AttachmentEntity attachment="..." position size /> to place the declared UI in 3D under a parent entity.
  - Attachment content is rendered via createPortal so it shares React state with the main app.
- Core SDK
  - Attachment types and SpatialSession.createAttachmentEntity(...).
  - Create/update/destroy commands: webspatial://createAttachment, UpdateAttachmentEntity, DestroyCommand.
  - Attachment wrapper with getContainer(), update(), destroy().
- visionOS (AVP runtime)
  - Native AttachmentManager with a child WKWebView per attachment.
  - SpatialScene intercepts webspatial://createAttachment, handles update/destroy, and cleans up on reload/destroy.
  - SpatializedDynamic3DView renders attachments via RealityView(..., attachments:) and parents them under the correct SpatialEntity.
- Navigation fix
  - Prevent internal webspatial:// URLs from being forwarded to UIApplication.shared.open(...).
- Test page
  - /reality/attachments demo page: hide/show, animation (attachments follow parent), shared React state.
- Notes
  - Attachments are 2D UI surfaces only (no nested <Reality> / 3D APIs inside attachments).
  - No billboard/camera-facing policy in this PR.

